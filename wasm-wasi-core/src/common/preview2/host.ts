/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import wasi from '@vscode/wasi';
import * as wcm from '@vscode/wasm-component-model';

const paramSizes: Map<wcm.FunctionType<any>, number> = new Map();
function paramSize(signature: wcm.FunctionType<any>): number {
	let size = paramSizes.get(signature);
	if (size === undefined) {
		size = 0;
		for (const [, type] of signature.params) {
			for (const flatType of type.flatTypes) {
				size += wcm.WasmTypeKind.byteLength(flatType);
			}
		}
		paramSizes.set(signature, size);
	}
	return size;
}
function heapSize(signature: wcm.FunctionType<any>, params: (number | bigint)[]): number {
	let size = 0;
	let index = 0;
	for (const [, type] of signature.params) {
		switch (type.kind) {
			case wcm.ComponentModelTypeKind.string:
				size += type.size;
				break;
			default:
				index += type.flatTypes.length;
				break;
		}
	}
	return size;
}
function transferSize(signature: wcm.FunctionType<any>, params: (number | bigint)[], context: wcm.Context): { param: number; heap: number } {
	let param: number = 0;
	let heap: number = 0;
	let index = 0;
	for (const [, type] of signature.params) {
		switch (type.kind) {
			case wcm.ComponentModelTypeKind.string:
				param += type.size;

			default:
				index = type.flatTypes.length;
				param += type.size;
				break;
		}
	}
	return { param, heap };
}

class Memory implements wcm.Memory {

	private readonly clazz: SharedArrayBufferConstructor | ArrayBufferConstructor;
	public buffer: SharedArrayBuffer | ArrayBuffer;
	public raw: Uint8Array;
	public view: DataView;

	private index: number;

	constructor(initialSize: number = 65536, clazz: SharedArrayBufferConstructor | ArrayBufferConstructor = SharedArrayBuffer) {
		this.clazz = clazz;
		this.buffer = new clazz(initialSize);
		this.raw = new Uint8Array(this.buffer);
		this.view = new DataView(this.buffer);
		this.index = 0;
	}

	public alloc(alignment: wcm.Alignment, size: number): wcm.ptr {
		this.index = Math.ceil(this.index / alignment) * alignment;
		if (this.index + size > this.buffer.byteLength) {
			const newBuffer = new SharedArrayBuffer(this.buffer.byteLength * 2);
			new Uint8Array(newBuffer).set(this.raw);
			this.buffer = newBuffer;
			this.raw = new Uint8Array(this.buffer);
			this.view = new DataView(this.buffer);
		}
		const ptr = this.index;
		this.index += size;
		return ptr;
	}

	public realloc(ptr: wcm.ptr, oldSize: number, align: wcm.Alignment, newSize: number): wcm.ptr {
		if (newSize <= oldSize) {
			return ptr;
		}
		const newPtr = this.alloc(align, newSize);
		this.raw.copyWithin(newPtr, ptr, ptr + oldSize);
		return newPtr;
	}
}


class TransferVisitor implements wcm.ComponentModelTypeVisitor {

	private readonly signature: wcm.FunctionType<any>;
	private readonly params: (number | bigint)[];
	private readonly paramMemory: Memory;
	private readonly heapMemory: Memory;
	private readonly context: wcm.Context;

	private index: number;

	constructor(signature: wcm.FunctionType<any>, params: (number | bigint)[], paramMemory: Memory, heapMemory: Memory, context: wcm.Context) {
		this.signature = signature;
		this.paramMemory = paramMemory;
		this.heapMemory = heapMemory;
		this.context = context;
		this.index = 0;
		const flatTypes = this.signature.paramFlatTypes;
		if (flatTypes.length > wcm.FunctionType.MAX_FLAT_PARAMS) {
			const ptr = params[0] as number;
			this.params = [];
			this.signature.paramTupleType.loadFlat(this.params, this.context.memory, ptr, this.context.options);
		} else {
			this.params = params;
		}

	}

	public visitU8(): void {
		this.storeNumber(this.asNumber(this.params[this.index++]));
	}

	public visitU16(): void {
		this.storeNumber(this.asNumber(this.params[this.index++]));
	}

	public visitU32(): void {
		this.storeNumber(this.asNumber(this.params[this.index++]));
	}

	public visitU64(): void {
		this.storeBigInt(this.asBigInt(this.params[this.index++]));
	}

	public visitS8(): void {
		this.storeNumber(this.asNumber(this.params[this.index++]));
	}

	public visitS16(): void {
		this.storeNumber(this.asNumber(this.params[this.index++]));
	}

	public visitS32(): void {
		this.storeNumber(this.asNumber(this.params[this.index++]));
	}

	public visitS64?(): void {
		this.storeBigInt(this.asBigInt(this.params[this.index++]));
	}

	public visitFloat32(): void {
		this.storeFloat32(this.asNumber(this.params[this.index++]));
	}

	public visitFloat64(): void {
		this.storeFloat64(this.asNumber(this.params[this.index++]));
	}

	public visitBool(): void {
		this.storeNumber(this.asNumber(this.params[this.index++]));
	}

	public visitString(): void {
		const options = this.context.options;
		const wasmPtr = this.asNumber(this.params[this.index++]);
		const codeUnits = this.asNumber(this.params[this.index++]);
		const bytes = wcm.wstring.byteLength(codeUnits, options);
		const ptr = this.heapMemory.alloc(wcm.wstring.dataAlignment(options), bytes);
		this.heapMemory.raw.set(this.context.memory.raw.subarray(wasmPtr, wasmPtr + bytes), ptr);
		this.storeNumber(ptr);
		this.storeNumber(codeUnits);
	}

	public visitBorrow(): void {
		this.storeNumber(this.asNumber(this.params[this.index++]));
	}

	public visitOwn(): void {
		this.storeNumber(this.asNumber(this.params[this.index++]));
	}

	public visitResource(): void {
		this.storeNumber(this.asNumber(this.params[this.index++]));
	}

	public visitEnum(): void {
		this.storeNumber(this.asNumber(this.params[this.index++]));
	}

	public visitFlags(type: wcm.FlagsType<any>): void {
		if (type.type === wcm.u8 || type.type === wcm.u16 || type.type === wcm.u32) {
			this.storeNumber(this.asNumber(this.params[this.index++]));
		} else if (type.type instanceof wcm.TupleType) {
			for (const field of type.type.fields) {
				wcm.ComponentModelTypeVisitor.visit(field.type, this);
			}
		}
	}

	visitList(type: wcm.ListType<any>): boolean {
		const wasmPtr = this.asNumber(this.params[this.index++]);
		const length = this.asNumber(this.params[this.index++]);
		const bytes = length * type.elementType.size;
		const ptr = this.heapMemory.alloc(type.elementType.alignment, bytes);
		this.heapMemory.raw.set(this.context.memory.raw.subarray(wasmPtr, wasmPtr + bytes), ptr);
		this.storeNumber(ptr);
		this.storeNumber(length);
		return false;
	}

	private storeNumber(value: number) {
		this.paramMemory.view.setInt32(this.paramMemory.alloc(wcm.Alignment.word, 4), value);
	}

	private storeFloat32(value: number) {
		this.paramMemory.view.setFloat32(this.paramMemory.alloc(wcm.Alignment.word, 4), value);
	}

	private storeFloat64(value: number) {
		this.paramMemory.view.setFloat64(this.paramMemory.alloc(wcm.Alignment.word, 4), value);
	}

	private storeBigInt(value: bigint) {
		this.paramMemory.view.setBigInt64(this.paramMemory.alloc(wcm.Alignment.doubleWord, 8), value);
	}

	public run(): void {
		this.index = 0;
		wcm.ComponentModelTypeVisitor.visit(this.signature.paramTupleType, this);
	}

	private asNumber(param: number | bigint): number {
		if (typeof param !== 'number') {
			throw new Error('Expected number');
		}
		return param;
	}

	private asBigInt(param: number | bigint): bigint {
		if (typeof param !== 'bigint') {
			throw new Error('Expected bigint');
		}
		return param;
	}
}

class ParamOnlyTransfer {

	private readonly signature: wcm.FunctionType<any>;
	private readonly params: (number | bigint)[];
	private readonly paramMemory: Memory;
	private readonly context: wcm.Context;

	constructor(signature: wcm.FunctionType<any>, params: (number | bigint)[], paramMemory: Memory, context: wcm.Context) {
		this.signature = signature;
		this.paramMemory = paramMemory;
		this.context = context;
		const flatTypes = this.signature.paramFlatTypes;
		if (flatTypes.length > wcm.FunctionType.MAX_FLAT_PARAMS) {
			const ptr = params[0] as number;
			this.params = [];
			this.signature.paramTupleType.loadFlat(this.params, this.context.memory, ptr, this.context.options);
		} else {
			this.params = params;
		}
	}

	public run(): void {
		const flatTypes = this.signature.paramFlatTypes;
		let params: (number | bigint)[] = [];
		if (flatTypes.length > wcm.FunctionType.MAX_FLAT_PARAMS) {
			const ptr = this.params[0] as number;
			this.signature.paramTupleType.loadFlat(params, this.context.memory, ptr, this.context.options);
		} else {
			params = this.params;
		}
		for (const [index, param] of params.entries()) {
			const flatType = flatTypes[index];
			switch (flatType) {
				case wcm.WasmTypeKind.i32:
					this.paramMemory.view.setInt32(this.paramMemory.alloc(wcm.Alignment.word, 4), param as number);
					break;
				case wcm.WasmTypeKind.f32:
					this.paramMemory.view.setFloat32(this.paramMemory.alloc(wcm.Alignment.word, 4), param as number);
					break;
				case wcm.WasmTypeKind.f64:
					this.paramMemory.view.setFloat64(this.paramMemory.alloc(wcm.Alignment.word, 4), param as number);
					break;
				case wcm.WasmTypeKind.i64:
					this.paramMemory.view.setBigInt64(this.paramMemory.alloc(wcm.Alignment.doubleWord, 8), param as bigint);
					break;
			}
		}
	}
}

function storeParams(signature: wcm.FunctionType<any>, params: (number | bigint)[], memory: wcm.Memory): void {



	for (const param of params) {
		if (typeof param === 'number') {
			memory.view.setUint32(memory.alloc(4, 4), param, true);
		} else {
			memory.view.setBigUint64(memory.alloc(4, 8), param, true);
		}
	}
}

export namespace WasiHost {
	export function create(): void {

	}
}
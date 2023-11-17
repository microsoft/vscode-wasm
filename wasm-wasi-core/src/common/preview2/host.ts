/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import wasi from '@vscode/wasi';
import { Options, Memory, Alignment, ptr, ComponentModelTypeVisitor, FunctionType, Context, wstring, FlagsType, u8, u16, u32, TupleType, ListType, WasmTypeKind } from '@vscode/wasm-component-model';

export { Options };

class LinearMemory implements Memory {

	public _buffer: SharedArrayBuffer;
	public _raw: Uint8Array;
	public _view: DataView;

	private index: number;

	constructor(initialSize: number = 65536) {
		this._buffer = new SharedArrayBuffer(initialSize);
		this._raw = new Uint8Array(this._buffer);
		this._view = new DataView(this._buffer);
		this.index = 0;
	}

	public get buffer(): SharedArrayBuffer {
		return this._buffer;
	}

	public get view(): DataView {
		return this._view;
	}

	public get raw(): Uint8Array {
		return this._raw;
	}

	public alloc(alignment: Alignment, size: number): ptr {
		this.index = Math.ceil(this.index / alignment) * alignment;
		if (this.index + size > this._buffer.byteLength) {
			const newBuffer = new SharedArrayBuffer(this._buffer.byteLength * 2);
			new Uint8Array(newBuffer).set(this._raw);
			this._buffer = newBuffer;
			this._raw = new Uint8Array(this._buffer);
			this._view = new DataView(this._buffer);
		}
		const ptr = this.index;
		this.index += size;
		return ptr;
	}

	public realloc(ptr: ptr, oldSize: number, align: Alignment, newSize: number): ptr {
		if (newSize <= oldSize) {
			return ptr;
		}
		const newPtr = this.alloc(align, newSize);
		this._raw.copyWithin(newPtr, ptr, ptr + oldSize);
		return newPtr;
	}
}

class ReadonlyMemory implements Memory {

	public readonly buffer: ArrayBuffer;

	private _raw: Uint8Array | undefined;
	private _view: DataView | undefined;

	constructor(buffer: ArrayBuffer) {
		this.buffer = buffer;
	}

	public get raw(): Uint8Array {
		if (!this._raw) {
			this._raw = new Uint8Array(this.buffer);
		}
		return this._raw;
	}

	public get view(): DataView {
		if (!this._view) {
			this._view = new DataView(this.buffer);
		}
		return this._view;
	}

	public alloc(): ptr {
		throw new Error('Memory is readonly');
	}

	public realloc(): ptr {
		throw new Error('Memory is readonly');
	}
}

class ParamAndHeapTransfer implements ComponentModelTypeVisitor {

	private readonly signature: FunctionType<any>;
	private readonly params: (number | bigint)[];
	private readonly paramMemory: LinearMemory;
	private readonly heapMemory: LinearMemory;
	private readonly context: Context;

	private index: number;

	constructor(signature: FunctionType<any>, params: (number | bigint)[], paramMemory: LinearMemory, heapMemory: LinearMemory, context: Context) {
		this.signature = signature;
		this.paramMemory = paramMemory;
		this.heapMemory = heapMemory;
		this.context = context;
		this.index = 0;
		const flatTypes = this.signature.paramFlatTypes;
		if (flatTypes.length > FunctionType.MAX_FLAT_PARAMS) {
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
		const bytes = wstring.byteLength(codeUnits, options);
		const ptr = this.heapMemory.alloc(wstring.dataAlignment(options), bytes);
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

	public visitFlags(type: FlagsType<any>): void {
		if (type.type === u8 || type.type === u16 || type.type === u32) {
			this.storeNumber(this.asNumber(this.params[this.index++]));
		} else if (type.type instanceof TupleType) {
			for (const field of type.type.fields) {
				ComponentModelTypeVisitor.visit(field.type, this);
			}
		}
	}

	visitList(type: ListType<any>): boolean {
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
		this.paramMemory.view.setInt32(this.paramMemory.alloc(Alignment.word, 4), value);
	}

	private storeFloat32(value: number) {
		this.paramMemory.view.setFloat32(this.paramMemory.alloc(Alignment.word, 4), value);
	}

	private storeFloat64(value: number) {
		this.paramMemory.view.setFloat64(this.paramMemory.alloc(Alignment.word, 4), value);
	}

	private storeBigInt(value: bigint) {
		this.paramMemory.view.setBigInt64(this.paramMemory.alloc(Alignment.doubleWord, 8), value);
	}

	public run(): void {
		this.index = 0;
		ComponentModelTypeVisitor.visit(this.signature.paramTupleType, this);
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

	private readonly signature: FunctionType<any>;
	private readonly params: (number | bigint)[];
	private readonly paramMemory: LinearMemory;
	private readonly context: Context;

	constructor(signature: FunctionType<any>, params: (number | bigint)[], paramMemory: LinearMemory, context: Context) {
		this.signature = signature;
		this.paramMemory = paramMemory;
		this.context = context;
		const flatTypes = this.signature.paramFlatTypes;
		if (flatTypes.length > FunctionType.MAX_FLAT_PARAMS) {
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
		if (flatTypes.length > FunctionType.MAX_FLAT_PARAMS) {
			const ptr = this.params[0] as number;
			this.signature.paramTupleType.loadFlat(params, this.context.memory, ptr, this.context.options);
		} else {
			params = this.params;
		}
		for (const [index, param] of params.entries()) {
			const flatType = flatTypes[index];
			switch (flatType) {
				case WasmTypeKind.i32:
					this.paramMemory.view.setInt32(this.paramMemory.alloc(Alignment.word, 4), param as number);
					break;
				case WasmTypeKind.f32:
					this.paramMemory.view.setFloat32(this.paramMemory.alloc(Alignment.word, 4), param as number);
					break;
				case WasmTypeKind.f64:
					this.paramMemory.view.setFloat64(this.paramMemory.alloc(Alignment.word, 4), param as number);
					break;
				case WasmTypeKind.i64:
					this.paramMemory.view.setBigInt64(this.paramMemory.alloc(Alignment.doubleWord, 8), param as bigint);
					break;
			}
		}
	}
}

export class HostConnection {

	constructor() {
	}

	public call(signature: FunctionType<any>, params: (number | bigint)[], context: Context): (number | bigint)[] {
		const paramMemory = new LinearMemory();
		let memories: [SharedArrayBuffer, SharedArrayBuffer];
		if (context.memory.buffer instanceof SharedArrayBuffer) {
			const transfer = new ParamOnlyTransfer(signature, params, paramMemory, context);
			transfer.run();
			memories = [paramMemory.buffer, context.memory.buffer];
		} else {
			const heapMemory = new LinearMemory();
			const transfer = new ParamAndHeapTransfer(signature, params, paramMemory, heapMemory, context);
			transfer.run();
			memories = [paramMemory.buffer, heapMemory.buffer];
		}
		memories = memories;
		return[];
	}
}

declare namespace WebAssembly {

	interface Global {
		value: any;
		valueOf(): any;
	}
	interface Table {
		readonly length: number;
		get(index: number): any;
		grow(delta: number, value?: any): number;
		set(index: number, value?: any): void;
	}
	interface Memory {
		readonly buffer: ArrayBuffer;
		grow(delta: number): number;
	}
	type ExportValue = Function | Global | Memory | Table;

	interface Instance {
		readonly exports: Record<string, ExportValue>;
	}

	var Instance: {
    	prototype: Instance;
    	new(): Instance;
	};
}

export interface WasiHost extends wasi._.WasmInterface {
	initialize: (instOrMemory: WebAssembly.Instance | WebAssembly.Memory) => void;
	memory: () => ArrayBuffer;
}

export namespace WasiHost {
	export function create(connection: HostConnection, options: Options): WasiHost {

		let $instance: WebAssembly.Instance | undefined;
		let $memory: WebAssembly.Memory | undefined;

		function memory(): ReadonlyMemory {
			if ($memory !== undefined) {
				return new ReadonlyMemory($memory.buffer);
			}
			if ($instance === undefined || $instance.exports.memory === undefined) {
				throw new Error(`WASI layer is not initialized. Missing WebAssembly instance or memory module.`);
			}
			return new ReadonlyMemory(($instance.exports.memory as WebAssembly.Memory).buffer);
		}

		const result = Object.create(null);
		result.initialize = (instOrMemory: WebAssembly.Instance | WebAssembly.Memory): void => {
			if (instOrMemory instanceof WebAssembly.Instance) {
				$instance = instOrMemory;
				$memory = undefined;
			} else {
				$instance = undefined;
				$memory = instOrMemory;
			}
		};

		for (const pkg of wasi._.packages.values()) {
			for (const iface of pkg.interfaces.values()) {
				const wasm = Object.create(null);
				for (const func of iface.functions.values()) {
					wasm[func.witName] = (...params: (number | bigint)[]) => {
						connection.call(func, params, { memory: memory(), options });
					};
				}
				result[iface.id] = wasm;
			}
		}
		return result;
	}
}
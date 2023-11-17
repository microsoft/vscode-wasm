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

	public alloc(alignment: wcm.alignment, size: number): wcm.ptr {
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

	public realloc(ptr: wcm.ptr, oldSize: number, align: wcm.alignment, newSize: number): wcm.ptr {
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
		this.params = params;
		this.paramMemory = paramMemory;
		this.heapMemory = heapMemory;
		this.context = context;
		this.index = 0;
	}

	visitString(type: typeof wcm.wstring): void {
		const data: number = this.asNumber(this.params[this.index++]);
		const ptr = this.heapMemory.alloc(1, type.size);
		this.heapMemory.raw.set(type.bytes, ptr);
	}

	public run(): void {
		this.index = 0;
		for (const [index, type] of this.paramTypes.entries()) {
			wcm.ComponentModelTypeVisitor.visit(type, this);
		}

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

	constructor(signature: wcm.FunctionType<any>, params: (number | bigint)[], paramMemory: Memory) {
		this.signature = signature;
		this.params = params;
		this.paramMemory = paramMemory;
	}

	public run(): void {
		const flatTypes = this.signature.paramFlatTypes;
		if (flatTypes.length > wcm.FunctionType.MAX_FLAT_PARAMS) {
		}
		if (flatTypes.length !== this.params.length) {
			throw new Error('Invalid number of params');
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
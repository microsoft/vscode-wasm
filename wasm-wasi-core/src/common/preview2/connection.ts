/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/// <reference path="../../../typings/webAssemblyCommon.d.ts" />

import { Alignment, ComponentModelTypeVisitor, FlagsType, FunctionType, ListType, TupleType, WasmContext, f32, f64, i32, i64, ptr, u16, u32, u8, wstring } from '@vscode/wasm-component-model';
import { FixedLinearMemory, LinearMemory, Memory } from './memory';

type Header = {
	lock: u32;
	method: [ptr /* data */, u32 /* length */];
	params: [ptr /* data */, u32 /* bytes */];
	return: [ptr /* data */, u32 /* bytes */];
};

export namespace Header {
	const lock_index = 0;
	export const lock_size = 4;
	const iface_index = lock_index + lock_size;
	export const iface_size = 8;
	const func_index = iface_index + iface_size;
	export const func_size = 8;
	const params_index = func_index + func_size;
	export const params_size = 8;
	const return_index = params_index + params_size;
	export const return_size = 8;

	export const size = lock_size + iface_size + func_index + params_size + return_size;

	export function getLock(view: DataView): u32 {
		return view.getUint32(lock_index);
	}

	export function setLock(view: DataView, lock: u32): void {
		view.setUint32(lock_index, lock);
	}

	export function getIface(view: DataView): [u32, u32] {
		return [view.getUint32(iface_index), view.getUint32(iface_index + 4)];
	}

	export function setIface(view: DataView, data: ptr, length: u32): void {
		view.setUint32(iface_index, data);
		view.setUint32(iface_index + 4, length);
	}

	export function getFunc(view: DataView): [u32, u32] {
		return [view.getUint32(func_index), view.getUint32(func_index + 4)];
	}

	export function setFunc(view: DataView, data: ptr, length: u32): void {
		view.setUint32(func_index, data);
		view.setUint32(func_index + 4, length);
	}

	export function getParams(view: DataView): [u32, u32] {
		return [view.getUint32(params_index), view.getUint32(params_index + 4)];
	}

	export function setParams(view: DataView, data: ptr, length: u32): void {
		view.setUint32(params_index, data);
		view.setUint32(params_index + 4, length);
	}

	export function getReturn(view: DataView): [u32, u32] {
		return [view.getUint32(return_index), view.getUint32(return_index + 4)];
	}

	export function setReturn(view: DataView, data: ptr, length: u32): void {
		view.setUint32(return_index, data);
		view.setUint32(return_index + 4, length);
	}
}

export class ParamTransfer {

	private readonly signature: FunctionType<any>;
	private readonly params: (number | bigint)[];
	private readonly paramMemory: LinearMemory;
	private readonly context: WasmContext;

	constructor(signature: FunctionType<any>, params: (number | bigint)[], paramMemory: LinearMemory, context: WasmContext) {
		this.signature = signature;
		this.paramMemory = paramMemory;
		this.params = params;
		this.context = context;
	}

	public run(): void {
		let flatTypes = this.signature.paramTupleType.flatTypes;
		let params: (number | bigint)[] = [];
		if (flatTypes.length > FunctionType.MAX_FLAT_PARAMS) {
			const ptr = this.params[0] as number;
			const alignment = this.signature.paramTupleType.alignment;
			const size = this.signature.paramTupleType.size;
			const dest_ptr = this.paramMemory.alloc(alignment, size);
			this.paramMemory.raw.set(this.context.getMemory().raw.subarray(ptr, ptr + size), dest_ptr);
			params = this.params.slice(0);
			params[0] = dest_ptr;
		} else {
			params = this.params.slice(0);
		}
		if (this.signature.returnType !== undefined && this.signature.returnType.flatTypes.length > FunctionType.MAX_FLAT_RESULTS) {
			// We currently only support 'lower' mode for results > MAX_FLAT_RESULTS.
			if (params.length !== flatTypes.length + 1) {
				throw new Error(`Invalid number of parameters. Received ${params.length} but expected ${flatTypes.length + 1}`);
			}
			const alignment = this.signature.returnType.alignment;
			const size = this.signature.returnType.size;
			const dest_ptr = this.paramMemory.alloc(alignment, size);
			params[params.length - 1] = dest_ptr;
			flatTypes = flatTypes.concat(this.signature.returnType.flatTypes);
		}
		for (const [index, param] of params.entries()) {
			const flatType = flatTypes[index];
			switch (flatType) {
				case i32:
					this.paramMemory.view.setInt32(this.paramMemory.alloc(Alignment.word, 4), param as number);
					break;
				case f32:
					this.paramMemory.view.setFloat32(this.paramMemory.alloc(Alignment.word, 4), param as number);
					break;
				case f64:
					this.paramMemory.view.setFloat64(this.paramMemory.alloc(Alignment.doubleWord, 8), param as number);
					break;
				case i64:
					this.paramMemory.view.setBigInt64(this.paramMemory.alloc(Alignment.doubleWord, 8), param as bigint);
					break;
			}
		}
	}
}

export class ParamAndDataTransfer implements ComponentModelTypeVisitor {

	private readonly signature: FunctionType<any>;
	private readonly params: (number | bigint)[];
	private readonly paramMemory: LinearMemory;
	private readonly dataMemory: LinearMemory;
	private readonly context: WasmContext;

	private index: number;

	constructor(signature: FunctionType<any>, params: (number | bigint)[], paramMemory: LinearMemory, dataMemory: LinearMemory, context: WasmContext) {
		this.signature = signature;
		this.paramMemory = paramMemory;
		this.dataMemory = dataMemory;
		this.context = context;
		this.index = 0;
		const flatTypes = this.signature.paramTupleType.flatTypes;
		if (flatTypes.length > FunctionType.MAX_FLAT_PARAMS) {
			// const ptr = params[0] as number;
			this.params = [];
			// this.signature.paramTupleType.loadFlat(this.params, this.context.memory, ptr, this.context.options);
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
		const [alignment, bytes] = wstring.getAlignmentAndByteLength(codeUnits, options);
		const ptr = this.dataMemory.alloc(alignment, bytes);
		this.dataMemory.raw.set(this.context.getMemory().raw.subarray(wasmPtr, wasmPtr + bytes), ptr);
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
		const ptr = this.dataMemory.alloc(type.elementType.alignment, bytes);
		this.dataMemory.raw.set(this.context.getMemory().raw.subarray(wasmPtr, wasmPtr + bytes), ptr);
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

export class ParamRestore {

	private readonly signature: FunctionType<any>;
	private readonly paramMemory: FixedLinearMemory;

	constructor(signature: FunctionType<any>, paramMemory: FixedLinearMemory) {
		this.signature = signature;
		this.paramMemory = paramMemory;
	}

	public run(): (number | bigint)[] {
		const params: (number | bigint)[] = [];
		const view = this.paramMemory.view;
		let [ptr, ] = Header.getParams(this.paramMemory.view);
		const flatTypes = this.signature.paramTupleType.flatTypes;
		if (flatTypes.length > FunctionType.MAX_FLAT_PARAMS) {
			ptr = Memory.align(ptr, Alignment.word);
			params.push(view.getInt32(ptr));
		} else {
			for (const flatType of flatTypes) {
				switch (flatType) {
					case i32:
						ptr = Memory.align(ptr, Alignment.word);
						params.push(view.getInt32(ptr));
						ptr += 4;
						break;
					case f32:
						ptr = Memory.align(ptr, Alignment.word);
						params.push(view.getFloat32(ptr));
						ptr += 4;
						break;
					case f64:
						ptr = Memory.align(ptr, Alignment.doubleWord);
						view.getFloat64(ptr);
						ptr += 8;
						break;
					case i64:
						ptr = Memory.align(ptr, Alignment.doubleWord);
						view.getBigInt64(ptr);
						ptr += 8;
						break;
				}
			}
		}
		if (this.signature.returnType !== undefined && this.signature.returnType.flatTypes.length > FunctionType.MAX_FLAT_RESULTS) {
			ptr = Memory.align(ptr, Alignment.word);
			params.push(view.getInt32(ptr));
			ptr += 4;
		}
		return params;
	}
}
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/// <reference path="../../../typings/webAssemblyCommon.d.ts" />

import { FunctionType, ptr, u32 } from '@vscode/wasm-component-model';
import { LinearMemory } from './memory';

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

export class ParamOnlyRestore {

	private readonly signature: FunctionType<any>;
	private readonly params: (number | bigint)[];
	private readonly paramMemory: LinearMemory;

	constructor(signature: FunctionType<any>, params: (number | bigint)[], paramMemory: LinearMemory) {
		this.signature = signature;
		this.paramMemory = paramMemory;
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
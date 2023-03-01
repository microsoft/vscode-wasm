/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ptr, u32, u8 } from './baseTypes';
import { Iovec, iovec_array } from './wasi';

export enum ParamKind {
	ptr = 1,
	number = 2,
	bigint = 3,
}

export type NumberParam = {
	kind: ParamKind.number;
	size: number;
	set: (view: DataView, offset: number, value: number) => void;
	get: (view: DataView, offset: number) => number;
};

export type BigintParam = {
	kind: ParamKind.bigint;
	size: number;
	set: (view: DataView, offset: number, value: bigint) => void;
	get: (view: DataView, offset: number) => bigint;
};

export enum DataKind {
	param = 1,
	result = 2,
	both = 3
}

export type PtrParam = {
	kind: ParamKind.ptr;
	size: 4;
	set: (view: DataView, offset: number, value: number) => void;
	get: (view: DataView, offset: number) => number;
};


export type Param = PtrParam | NumberParam | BigintParam;

export const u8_size = 1 as const;
export const U8Param: NumberParam = { kind: ParamKind.number, size: u8_size, set: (view, offset, value) => view.setUint8(offset, value), get: (view, offset) => view.getUint8(offset) };
export const u16_size = 2 as const;
export const U16Param: NumberParam = { kind: ParamKind.number, size: u16_size, set: (view, offset, value) => view.setUint16(offset, value, true), get: (view, offset) => view.getUint16(offset, true) };
export const u32_size = 4 as const;
export const U32Param: NumberParam = { kind: ParamKind.number, size: u32_size, set: (view, offset, value) => view.setUint32(offset, value, true), get: (view, offset) => view.getUint32(offset, true) };
export const u64_size = 8 as const;
export const U64Param: BigintParam = { kind: ParamKind.bigint, size: u64_size, set: (view, offset, value) => view.setBigUint64(offset, value, true), get: (view, offset) => view.getBigUint64(offset, true) };
export const s64_size = 8 as const;
export const S64Param: BigintParam = { kind: ParamKind.bigint, size: s64_size, set: (view, offset, value) => view.setBigInt64(offset, value, true), get: (view, offset) => view.getBigInt64(offset, true) };
export const ptr_size = 4 as const;
export const PtrParam: PtrParam = { kind: ParamKind.ptr, size: ptr_size, set: (view, offset, value) => view.setUint32(offset, value, true), get: (view, offset) => view.getUint32(offset, true) };

export type FunctionSignature = {
	readonly name: string;
	readonly params: Param[];
	readonly paramSize: number;
	readonly resultSize?: number;
};

export namespace FunctionSignature {

	export function assertResultSize(signature: WasiFunction): asserts signature is Required<WasiFunction> {
		if (signature.resultSize === undefined) {
			throw new Error(`Function signature ${signature.name} has no result size`);
		}
	}

	export function getParamSize(params: Param[]): number {
		if (params.length === 0) {
			return 0;
		}
		let result = params[0].size;
		for (let i = 1; i < params.length; i++) {
			result+= params[i].size;
		}
		return result;
	}

	export function getResultSize(params: Param[]): number {
		if (params.length === 0) {
			return 0;
		}
		let result = 0;
		for (let i = 0; i < params.length; i++) {
			const param = params[i];
			if (param.kind === ParamKind.ptr) {
				if (param.dataSize === -1) {
					throw new Error(`Cant't compute result size for ptr referencing a location of unknown size`);
				}
				result+= param.dataSize;
			}
		}
		return result;
	}
}

export namespace _Signatures {
	const signatures: WasiFunction[] = [];
	const name2Index: Map<string, number> = new Map();
	const index2Name: Map<number, string> = new Map();

	export function signatureAt(index: number): WasiFunction {
		if (index >= signatures.length) {
			throw new Error('Should never happen');
		}
		return signatures[index];
	}

	export function get(name: string): WasiFunction {
		const index = name2Index.get(name);
		if (index === undefined) {
			throw new Error('Should never happen');
		}
		return signatures[index];
	}

	export function getIndex(name: string): number {
		const result = name2Index.get(name);
		if (result === undefined) {
			throw new Error('Should never happen');
		}
		return result;
	}

	export function getName(index: number): string {
		const result = index2Name.get(index);
		if (result === undefined) {
			throw new Error('Should never happen');
		}
		return result;
	}

	export function add(signature: WasiFunction): void {
		const index = signatures.length;
		signatures.push(signature);
		name2Index.set(signature.name, index);
		index2Name.set(index, signature.name);
	}
}
export type Signatures = {
	add(signature: WasiFunction): void;
	signatureAt(index: number): WasiFunction;
	get(name: string): WasiFunction;
	getIndex(name: string): number;
	getName(index: number): string;
};
export const Signatures: Signatures = _Signatures;

export type WasiFunctionSignature = {
	params: Param[];
	memorySize: number;
};

export namespace WasiFunctionSignature {
	export function getMemorySize(params: Param[]): number {
		let result: number = 0;
		for (const param of params) {
			result += param.size;
		}
		return result;
	}
}

export type ReverseTransfer = {
	readonly from: ptr;
	readonly to: ptr;
	readonly size: number;
};

export type MemoryTransfer = {
	readonly memorySize: number;
	copy: (wasmMemory: ArrayBuffer, from: ptr, transferMemory: SharedArrayBuffer, to: ptr) => ReverseTransfer[];
};

export enum MemoryTransferDirection {
	param = 1,
	result = 2,
	both = 3
}

export namespace MemoryTransducer {

	export const U32Result: MemoryTransfer = {
		memorySize: u32_size,
		copy: (_wasmMemory, from, _transferMemory, to) => {
			// We have a result pointer so we only need instructions to copy the
			// result back into the wasm memory
			return [{ from: to, to: from, size: u32_size }];
		}
	};

	export const U64Result: MemoryTransfer = {
		memorySize: u64_size,
		copy: (_wasmMemory, from, _transferMemory, to) => {
			// We have a result pointer so we only need instructions to copy the
			// result back into the wasm memory
			return [{ from: to, to: from, size: u64_size }];
		}
	};

	export function createByteTransfer(size: number, direction: MemoryTransferDirection): MemoryTransfer {
		return {
			memorySize: size,
			copy: (wasmMemory, from, transferMemory, to) => {
				if (direction === MemoryTransferDirection.param || direction === MemoryTransferDirection.both) {
					new Uint8Array(transferMemory, to, size).set(new Uint8Array(wasmMemory, from, size));
				}
				return direction === MemoryTransferDirection.param ? [] : [ { from: to, to: from , size } ];
			}
		};
	}

	export function createPathTransfer(path: ptr<u8[]>, path_len: u32): MemoryTransfer {
		return {
			memorySize: path_len,
			copy: (wasmMemory, from, transferMemory, to) => {
				if (from !== path) {
					throw new Error(`Path transfer needs to be used as an instance object`);
				}
				new Uint8Array(transferMemory, to, path_len).set(new Uint8Array(wasmMemory, from, path_len));
				return [];
			}
		};
	}

	export function getMemorySize(transfers: MemoryTransfer[]): number {
		let result: number = 0;
		for (const transfer of transfers) {
			result += transfer.memorySize;
		}
		return result;
	}
}

export type MemoryTransducers = {
	readonly size: number;
	transfers: MemoryTransfer[];
};

export type WasiFunction = {
	readonly name: string;
	readonly signature: WasiFunctionSignature;
	memory: (...params: (number & bigint)[]) => MemoryTransducers;
};

namespace _WasiFunctions {
	const callbacks: WasiFunction[] = [];
	const name2Index: Map<string, number> = new Map();
	const index2Name: Map<number, string> = new Map();

	export function functionAt(index: number): WasiFunction {
		if (index >= callbacks.length) {
			throw new Error('Should never happen');
		}
		return callbacks[index];
	}

	export function get(name: string): WasiFunction {
		const index = name2Index.get(name);
		if (index === undefined) {
			throw new Error('Should never happen');
		}
		return callbacks[index];
	}

	export function getIndex(name: string): number {
		const result = name2Index.get(name);
		if (result === undefined) {
			throw new Error('Should never happen');
		}
		return result;
	}

	export function getName(index: number): string {
		const result = index2Name.get(index);
		if (result === undefined) {
			throw new Error('Should never happen');
		}
		return result;
	}

	export function add(wasiFunction: WasiFunction): void {
		const index = callbacks.length;
		callbacks.push(wasiFunction);
		name2Index.set(wasiFunction.name, index);
		index2Name.set(index, wasiFunction.name);
	}
}

export type WasiFunctions = {
	add(wasiFunction: WasiFunction): void;
	functionAt(index: number): WasiFunction;
	get(name: string): WasiFunction;
	getIndex(name: string): number;
	getName(index: number): string;
};
export const WasiFunctions: WasiFunctions = _WasiFunctions;


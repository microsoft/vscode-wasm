/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ptr, u32, u8 } from './baseTypes';

export enum ParamKind {
	ptr = 1,
	number = 2,
	bigint = 3,
}

export type NumberParam = {
	kind: ParamKind.number;
	size: number;
	write: (view: DataView, offset: number, value: number) => void;
	read: (view: DataView, offset: number) => number;
};

export type BigintParam = {
	kind: ParamKind.bigint;
	size: number;
	write: (view: DataView, offset: number, value: bigint) => void;
	read: (view: DataView, offset: number) => bigint;
};

export enum DataKind {
	param = 1,
	result = 2,
	both = 3
}

export type PtrParam = {
	kind: ParamKind.ptr;
	size: 4;
	write: (view: DataView, offset: number, value: number) => void;
	read: (view: DataView, offset: number) => number;
};


export type Param = PtrParam | NumberParam | BigintParam;

const ptr_size = 4 as const;
const PtrParam: PtrParam = { kind: ParamKind.ptr, size: ptr_size, write: (view, offset, value) => view.setUint32(offset, value, true), read: (view, offset) => view.getUint32(offset, true) };

export type WasiFunctionSignature = {
	params: Param[];
	memorySize: number;
};

export namespace WasiFunctionSignature {
	export function create(params: Param[]): WasiFunctionSignature {
		return {
			params,
			memorySize: getMemorySize(params)
		};
	}
	function getMemorySize(params: Param[]): number {
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


export type MemoryTransfers = {
	items: MemoryTransfer[];
	readonly size: number;
};

export namespace MemoryTransfers {
	export function create(items: MemoryTransfer[]): MemoryTransfers {
		return {
			items,
			size: getMemorySize(items)
		};
	}

	function getMemorySize(transfers: MemoryTransfer[]): number {
		let result: number = 0;
		for (const transfer of transfers) {
			result += transfer.memorySize;
		}
		return result;
	}
}

export namespace MemoryTransfer {
	export const Null: MemoryTransfers = {
		items: [],
		size: 0
	};
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

}

export type WasiFunction = {
	readonly name: string;
	readonly signature: WasiFunctionSignature;
	transfers?: (memory: DataView, ...params: (number & bigint)[]) => MemoryTransfers;
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

export namespace U8 {
	export const size = 1 as const;
	export const $ptr = PtrParam;
	export const $param: NumberParam = { kind: ParamKind.number, size, write: (view, offset, value) => view.setUint8(offset, value), read: (view, offset) => view.getUint8(offset) };

}

export const Byte = U8;

export namespace Bytes {
	export const $ptr = PtrParam;
	export function createTransfer(length: number, direction: MemoryTransferDirection): MemoryTransfer {
		return {
			memorySize: length,
			copy: (wasmMemory, from, transferMemory, to) => {
				if (direction === MemoryTransferDirection.param || direction === MemoryTransferDirection.both) {
					new Uint8Array(transferMemory, to, size).set(new Uint8Array(wasmMemory, from, size));
				}
				return direction === MemoryTransferDirection.param ? [] : [ { from: to, to: from , size } ];
			}
		};
	}
}

export namespace U16 {
	export const size = 2 as const;
	export const $ptr = PtrParam;
	export const $param: NumberParam = { kind: ParamKind.number, size, write: (view, offset, value) => view.setUint16(offset, value, true), read: (view, offset) => view.getUint16(offset, true) };
}

export namespace U32 {
	export const size = 4 as const;
	export const $ptr = PtrParam;
	export const $param: NumberParam = { kind: ParamKind.number, size, write: (view, offset, value) => view.setUint32(offset, value, true), read: (view, offset) => view.getUint32(offset, true) };
	export const $transfer: MemoryTransfer = {
		memorySize: size,
		copy: (_wasmMemory, from, _transferMemory, to) => {
			// We have a result pointer so we only need instructions to copy the
			// result back into the wasm memory
			return [{ from: to, to: from, size: size }];
		}
	};
}

export const Size = U32;

export namespace U64 {
	export const size = 8 as const;
	export const $ptr = PtrParam;
	export const $param: BigintParam = { kind: ParamKind.bigint, size, write: (view, offset, value) => view.setBigUint64(offset, value, true), read: (view, offset) => view.getBigUint64(offset, true) };
	export const $transfer: MemoryTransfer = {
		memorySize: size,
		copy: (_wasmMemory, from, _transferMemory, to) => {
			// We have a result pointer so we only need instructions to copy the
			// result back into the wasm memory
			return [{ from: to, to: from, size: size }];
		}
	};
}

export namespace S64 {
	export const size = 8 as const;
	export const $ptr = PtrParam;
	export const $param: BigintParam = { kind: ParamKind.bigint, size, write: (view, offset, value) => view.setBigInt64(offset, value, true), read: (view, offset) => view.getBigInt64(offset, true) };
}

export namespace Ptr {
	export const size = 4 as const;
	export const $ptr = PtrParam;
	export const $param: NumberParam = { kind: ParamKind.number, size, write: (view, offset, value) => view.setUint32(offset, value, true), read: (view, offset) => view.getUint32(offset, true) };

	export function createTransfer(length: number, direction: MemoryTransferDirection): MemoryTransfer {
		return {
			memorySize: length * size,
			copy: (wasmMemory, from, transferMemory, to) => {
				if (direction === MemoryTransferDirection.param || direction === MemoryTransferDirection.both) {
					new Uint8Array(transferMemory, to, size).set(new Uint8Array(wasmMemory, from, size));
				}
				return direction === MemoryTransferDirection.param ? [] : [ { from: to, to: from , size } ];
			}
		};
	}
}
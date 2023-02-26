/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export enum ParamType {
	ptr = 1,
	number = 2,
	bigint = 3,
}

export const ptr_size = 4 as const;
export type PtrParam = {
	kind: ParamType.ptr;
	size: 4;
	dataSize: number;
	setter: (view: DataView, offset: number, value: number) => void;
	getter: (view: DataView, offset: number) => number;
};

export namespace PtrParam {
	function setter(view: DataView, offset: number, value: number) { view.setUint32(offset, value, true); }
	function getter(view: DataView, offset: number): number { return view.getUint32(offset, true); }
	export function create(dataSize: number): PtrParam {
		return { kind: ParamType.ptr, size: ptr_size, dataSize, setter, getter };
	}
	export const Unknown: PtrParam = { kind: ParamType.ptr, size: ptr_size, dataSize: -1, setter, getter };
}

export type NumberParam = {
	kind: ParamType.number;
	size: number;
	setter: (view: DataView, offset: number, value: number) => void;
	getter: (view: DataView, offset: number) => number;
};

export type BigintParam = {
	kind: ParamType.bigint;
	size: number;
	setter: (view: DataView, offset: number, value: bigint) => void;
	getter: (view: DataView, offset: number) => bigint;
};
export type Param = PtrParam | NumberParam | BigintParam;

export const u8_size = 1 as const;
export const U8Param: NumberParam = { kind: ParamType.number, size: u8_size, setter: (view, offset, value) => view.setUint8(offset, value), getter: (view, offset) => view.getUint8(offset) };
export const u16_size = 2 as const;
export const U16Param: NumberParam = { kind: ParamType.number, size: u16_size, setter: (view, offset, value) => view.setUint16(offset, value, true), getter: (view, offset) => view.getUint16(offset, true) };
export const u32_size = 4 as const;
export const U32Param: NumberParam = { kind: ParamType.number, size: u32_size, setter: (view, offset, value) => view.setUint32(offset, value, true), getter: (view, offset) => view.getUint32(offset, true) };
export const u64_size = 8 as const;
export const U64Param: BigintParam = { kind: ParamType.bigint, size: u64_size, setter: (view, offset, value) => view.setBigUint64(offset, value, true), getter: (view, offset) => view.getBigUint64(offset, true) };
export const s64_size = 8 as const;
export const S64Param: BigintParam = { kind: ParamType.bigint, size: s64_size, setter: (view, offset, value) => view.setBigInt64(offset, value, true), getter: (view, offset) => view.getBigInt64(offset, true) };

export const PtrParamUnknown: PtrParam = PtrParam.Unknown;
export const PtrParamU32: PtrParam = PtrParam.create(u32_size);
export const PtrParamU64: PtrParam = PtrParam.create(u64_size);

export type FunctionSignature = {
	readonly name: string;
	readonly params: Param[];
	readonly paramSize: number;
	readonly resultSize?: number;
};

export namespace FunctionSignature {

	export function assertResultSize(signature: FunctionSignature): asserts signature is Required<FunctionSignature> {
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
			if (param.kind === ParamType.ptr) {
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
	const signatures: FunctionSignature[] = [];
	const name2Index: Map<string, number> = new Map();
	const index2Name: Map<number, string> = new Map();

	export function signatureAt(index: number): FunctionSignature {
		if (index >= signatures.length) {
			throw new Error('Should never happen');
		}
		return signatures[index];
	}

	export function get(name: string): FunctionSignature {
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

	export function add(signature: FunctionSignature): void {
		const index = signatures.length;
		signatures.push(signature);
		name2Index.set(signature.name, index);
		index2Name.set(index, signature.name);
	}
}
export type Signatures = {
	add(signature: FunctionSignature): void;
	signatureAt(index: number): FunctionSignature;
	get(name: string): FunctionSignature;
	getIndex(name: string): number;
	getName(index: number): string;
};
export const Signatures: Signatures = _Signatures;

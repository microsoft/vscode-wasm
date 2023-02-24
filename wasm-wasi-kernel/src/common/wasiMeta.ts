/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export enum ParamType {
	ptr = 1,
	number = 2,
	bigint = 3,
}

export type PtrParam = {
	kind: ParamType.ptr;
	size: 4;
	dataSize: number;
	setter: (view: DataView, offset: number, value: number) => void;
	getter: (view: DataView, offset: number) => number;
};

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

export const U8Param: NumberParam = { kind: ParamType.number, size: 1, setter: (view, offset, value) => view.setUint8(offset, value), getter: (view, offset) => view.getUint8(offset) };
export const U16Param: NumberParam = { kind: ParamType.number, size: 2, setter: (view, offset, value) => view.setUint16(offset, value, true), getter: (view, offset) => view.getUint16(offset, true) };
export const U32Param: NumberParam = { kind: ParamType.number, size: 4, setter: (view, offset, value) => view.setUint32(offset, value, true), getter: (view, offset) => view.getUint32(offset, true) };
export const U64Param: BigintParam = { kind: ParamType.bigint, size: 8, setter: (view, offset, value) => view.setBigUint64(offset, value, true), getter: (view, offset) => view.getBigUint64(offset, true) };
export const S64Param: BigintParam = { kind: ParamType.bigint, size: 8, setter: (view, offset, value) => view.setBigInt64(offset, value, true), getter: (view, offset) => view.getBigInt64(offset, true) };

export const PtrParamUnknown: PtrParam = { kind: ParamType.ptr, size: 4, dataSize: -1, setter: (view, offset, value) => view.setUint32(offset, value, true), getter: (view, offset) => view.getUint32(offset, true) };
export const PtrParamU32: PtrParam = { kind: ParamType.ptr, size: 4, dataSize: 4, setter: (view, offset, value) => view.setUint32(offset, value, true), getter: (view, offset) => view.getUint32(offset, true) };
export const PtrParamU64: PtrParam = { kind: ParamType.ptr, size: 4, dataSize: 8, setter: (view, offset, value) => view.setUint32(offset, value, true), getter: (view, offset) => view.getUint32(offset, true) };

export type FunctionSignature = {
	readonly name: string;
	readonly params: Param[];
	readonly paramSize: number;
	readonly resultSize?: number;
};

export namespace FunctionSignature {

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

	export function getResultSize(params: Param[]): number | undefined {
		if (params.length === 0) {
			return 0;
		}
		let result = 0;
		for (let i = 0; i < params.length; i++) {
			const param = params[i];
			if (param.kind === ParamType.ptr) {
				if (param.dataSize === -1) {
					return undefined;
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

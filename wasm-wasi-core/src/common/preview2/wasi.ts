/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RAL from '../ral';

const utf8Decoder = RAL().TextDecoder.create('utf-8');
const utf8Encoder = RAL().TextEncoder.create('utf-8');

export interface Memory {
	readonly buffer: ArrayBuffer;
	readonly raw: Uint8Array;
	readonly view: DataView;
	alloc: (align: size, size: size) => ptr;
	realloc: (ptr: ptr, oldSize: size, align: size, newSize: size) => ptr;
}

export type encodings = 'utf-8' | 'utf-16' | 'latin1+utf-16';
export interface Options {
	encoding: encodings;
}

export type alignment = 1 | 2 | 4 | 8;
function align(ptr: ptr, alignment: alignment): ptr {
	return Math.ceil(ptr / alignment) * alignment;
}

export interface Meta<W, J, F extends s32 | s64 | float32 | float64> {
	readonly size: number;
	readonly alignment: alignment;
	flatten: (memory: Memory, value: W, result: F[]) => void;
	load: (memory: Memory, ptr: ptr<W>, options: Options) => J;
	loadFlattened: (memory: Memory, value: F | F[], options: Options) => J;
	alloc: (memory: Memory) => ptr<W>;
	store: (memory: Memory, ptr: ptr<W>, value: J, options: Options) => void;
}

export interface MetaNumber<T> extends Meta<T, T, s32> {
	readonly lowValue: T;
	readonly highValue: T;
}

export interface MetaBigint<T> extends Meta<T, T, s64> {
	readonly lowValue: T;
	readonly highValue: T;
}

export type bool = number;
export const bool: Meta<bool, boolean, s32> = {
	size: 1,
	alignment: 1,
	flatten(_memory, value: bool, result): void {
		result.push(value);
	},
	load(memory, ptr: ptr<bool>): boolean {
		return memory.view.getUint8(ptr) !== 0;
	},
	loadFlattened(_memory, value): boolean {
		if (Array.isArray(value) || value < 0) {
			throw new Error(`Invalid bool value ${value}`);
		}
		return value !== 0;
	},
	alloc(memory): ptr<bool> {
		return memory.alloc(bool.size, bool.alignment);
	},
	store(memory, ptr: ptr<bool>, value: boolean): void {
		memory.view.setUint8(ptr, value ? 1 : 0);
	}
};

export type u8 = number;
export const u8:MetaNumber<u8> = {
	size: 1,
	alignment: 1,

	lowValue: 0,
	highValue: 255,

	flatten(_memory, value: u8, result): void {
		result.push(value);
	},
	load(memory, ptr: ptr<u8>): u8 {
		return memory.view.getUint8(ptr);
	},
	loadFlattened(_memory, value): u8 {
		if (Array.isArray(value) || value < u8.lowValue || value > u8.highValue) {
			throw new Error(`Invalid u8 value ${value}`);
		}
		return value;
	},
	alloc(memory): ptr<u8> {
		return memory.alloc(u8.size, u8.alignment);
	},
	store(memory, ptr: ptr<u8>, value: u8): void {
		memory.view.setUint8(ptr, value);
	}
};

export type u16 = number;
export const u16: MetaNumber<u16> = {
	size: 2,
	alignment: 2,

	lowValue: 0,
	highValue: 65535,

	flatten(_memory, value: u16, result): void {
		result.push(value);
	},
	load(memory: Memory, ptr: ptr): u16 {
		return memory.view.getUint16(ptr, true);
	},
	loadFlattened(_memory, value): u16 {
		if (Array.isArray(value) || value < u16.lowValue || value > u16.highValue) {
			throw new Error(`Invalid u16 value ${value}`);
		}
		return value;
	},
	alloc(memory: Memory): ptr<u16> {
		return memory.alloc(u16.size, u16.alignment);
	},
	store(memory, ptr: ptr<u16>, value: u16): void {
		memory.view.setUint16(ptr, value, true);
	}
};

export type u32 = number;
export const u32: MetaNumber<u32> = {
	size: 4,
	alignment: 4,

	lowValue: 0,
	highValue: 4294967295, // 2 ^ 32 - 1

	flatten(_memory, value: u32, result): void {
		if (value > s32.highValue) {
			throw new Error(`Can't flatten u32 ${value} to s32`);
		}
		result.push(value);
	},
	load(memory: Memory, ptr: ptr): u32 {
		return memory.view.getUint32(ptr, true);
	},
	loadFlattened(_memory, value): u32 {
		if (Array.isArray(value) || value < u32.lowValue) {
			throw new Error(`Invalid u32 value ${value}`);
		}
		return value;
	},
	alloc(memory: Memory): ptr<u32> {
		return memory.alloc(u32.size, u32.alignment);
	},
	store(memory: Memory, ptr: ptr<u32>, value: u32): void {
		memory.view.setUint32(ptr, value, true);
	}
};

export type u64 = bigint;
export const u64: MetaBigint<u64> = {
	size: 8,
	alignment: 8,

	lowValue: 0n,
	highValue: 18446744073709551615n, // 2 ^ 64 - 1

	flatten(_memory, value: u64, result): void {
		if (value > s64.highValue) {
			throw new Error(`Can't flatten u64 ${value} to s64`);
		}
		result.push(value);
	},
	load(memory: Memory, ptr: ptr): u64 {
		return memory.view.getBigUint64(ptr, true);
	},
	loadFlattened(_memory, value): u64 {
		if (Array.isArray(value) || value < u64.lowValue) {
			throw new Error(`Invalid u64 value ${value}`);
		}
		return value;
	},
	alloc(memory: Memory): ptr<u64> {
		return memory.alloc(u64.size, u64.alignment);
	},
	store(memory: Memory, ptr: ptr<u64>, value: u64): void {
		memory.view.setBigUint64(ptr, value, true);
	}
};

export type s8 = number;
export const s8: MetaNumber<u8> = {
	size: 1,
	alignment: 1,

	lowValue: -128, // -2 ^ 7
	highValue: 127, // 2 ^ 7 - 1

	flatten(_memory, value: s8): s32 {
		return value;
	},
	load(memory: Memory, ptr: ptr): s8 {
		return memory.view.getInt8(ptr);
	},
	loadFlattened(_memory, value): s8 {
		if (Array.isArray(value) || value < s8.lowValue || value > s8.highValue) {
			throw new Error(`Invalid s8 value ${value}`);
		}
		return value;
	},
	alloc(memory: Memory): ptr<s8> {
		return memory.alloc(s8.size, s8.alignment);
	},
	store(memory: Memory, ptr: ptr<s8>, value: s8): void {
		memory.view.setInt8(ptr, value);
	}
};

export type s16 = number;
export const s16: MetaNumber<s16> = {
	size: 2,
	alignment: 2,

	lowValue: -32768, // -2 ^ 15
	highValue: 32767, // 2 ^ 15 - 1

	flatten(_memory, value: s16): s32 {
		return value;
	},
	load(memory: Memory, ptr: ptr): s16 {
		return memory.view.getInt16(ptr, true);
	},
	loadFlattened(_memory, value): s16 {
		if (Array.isArray(value) || value < s16.lowValue || value > s16.highValue) {
			throw new Error(`Invalid s16 value ${value}`);
		}
		return value;
	},
	alloc(memory: Memory): ptr<s16> {
		return memory.alloc(s16.size, s16.alignment);
	},
	store(memory: Memory, ptr: ptr<s16>, value: s16): void {
		memory.view.setInt16(ptr, value, true);
	}
};

export type s32 = number;
export const s32: MetaNumber<s32> = {
	size: 4,
	alignment: 4,

	lowValue: -2147483648, // -2 ^ 31
	highValue: 2147483647, // 2 ^ 31 - 1

	flatten(_memory, value: s32): s32 {
		return value;
	},
	load(memory: Memory, ptr: ptr): s32 {
		return memory.view.getInt32(ptr, true);
	},
	loadFlattened(_memory, value): s32 {
		return value as s32;
	},
	alloc(memory: Memory): ptr<s32> {
		return memory.alloc(s32.size, s32.alignment);
	},
	store(memory, ptr: ptr<s32>, value: s32): void {
		memory.view.setInt32(ptr, value, true);
	}
};

export type s64 = bigint;
export const s64: MetaBigint<s64> = {
	size: 8,
	alignment: 8,

	lowValue: -9223372036854775808n, // -2 ^ 63
	highValue: 9223372036854775807n, // 2 ^ 63 - 1

	flatten(_memory, value: s64): s64 {
		return value;
	},
	load(memory: Memory, ptr: ptr<s64>): s64 {
		return memory.view.getBigInt64(ptr, true);
	},
	loadFlattened(_memory, value): s64 {
		return value as s64;
	},
	alloc(memory: Memory): ptr<s64> {
		return memory.alloc(s64.size, s64.alignment);
	},
	store(memory: Memory, ptr: ptr<s64>, value: s64): void {
		memory.view.setBigInt64(ptr, value, true);
	},
};

export type float32 = number;
export const float32 = {
	size: 4,
	alignment: 4,

	lowValue: -3.4028234663852886e+38,
	highValue: 3.4028234663852886e+38,
};

export type float64 = number;
export const float64 = {
	size: 8,
	alignment: 8,

	lowValue: -1 * Number.MAX_VALUE,
	highValue: Number.MAX_VALUE
};

export type byte = u8;
export const byte: Meta<byte, byte, s32> = {
	size: u8.size,
	alignment: u8.alignment,

	flatten: u8.flatten,
	load: u8.load,
	loadFlattened: u8.loadFlattened,
	alloc: u8.alloc,
	store: u8.store
};

export type size = u32;
export const size: Meta<size, size, s32> = {
	size: u32.size,
	alignment: u32.alignment,

	flatten: u32.flatten,
	load: u32.load,
	loadFlattened: u32.loadFlattened,
	alloc: u32.alloc,
	store: u32.store
};

export type ptr<_type = u8> = u32;
export const ptr: Meta<ptr, ptr, s32> = {
	size: u32.size,
	alignment: u32.alignment,

	flatten: u32.flatten,
	load: u32.load,
	loadFlattened: u32.loadFlattened,
	alloc: u32.alloc,
	store: u32.store
};

export interface char {

}

export interface wstring {
	data: ptr;
	codeUnits: u32;
}

namespace $wstring {
	export const offsets = {
		data: 0,
		codeUnits: 4
	};
}

export const wstring: Meta<ptr<wstring>, string, s32> = {
	size: 8,
	alignment:  4,

	flatten(memory, ptr): [ptr, u32] {
		const view = memory.view;
		const offsets = $wstring.offsets;
		const dataPtr: ptr =  view.getUint32(ptr + offsets.data);
		const codeUnits: u32 = view.getUint32(ptr + offsets.codeUnits);
		return [dataPtr, codeUnits];
	},

	load(memory: Memory, ptr: ptr<wstring>, options: Options): string {
		return wstring.loadFlattened(memory, wstring.flatten(memory, ptr), options);
	},

	loadFlattened(memory, values, options: Options): string {
		const encoding = options.encoding;
		if (encoding === 'latin1+utf-16') {
			throw new Error('latin1+utf-16 encoding not yet supported');
		}
		if (!Array.isArray(values) || values.length !== 2) {
			throw new Error('Invalid flatten values');
		}
		const [data, codeUnits] = values;
		if (encoding === 'utf-8') {
			const byteLength = codeUnits;
			return utf8Decoder.decode(new Uint8Array(memory.buffer, data, byteLength));
		} else if (encoding === 'utf-16') {
			return String.fromCharCode(...(new Uint16Array(memory.buffer, data, codeUnits)));
		} else {
			throw new Error('Unsupported encoding');
		}
	},

	alloc(memory: Memory): ptr<wstring> {
		return memory.alloc(wstring.size, wstring.alignment);
	},

	store(memory: Memory, ptr: ptr<wstring>, str: string, options: Options): void {
		const { encoding } = options;
		const offsets = $wstring.offsets;
		if (encoding === 'latin1+utf-16') {
			throw new Error('latin1+utf-16 encoding not yet supported');
		}
		if (encoding === 'utf-8') {
			const data = utf8Encoder.encode(str);
			const dataPtr = memory.alloc(u8.alignment, data.length);
			memory.raw.set(data, dataPtr);
			const view = memory.view;
			view.setUint32(ptr + offsets.data, dataPtr, true);
			view.setUint32(ptr + offsets.codeUnits, data.length, true);
		} else if (encoding === 'utf-16') {
			const dataPtr = memory.alloc(u8.alignment, str.length * 2);
			const data = new Uint16Array(memory.buffer, dataPtr, str.length);
			for (let i = 0; i < str.length; i++) {
				data[i] = str.charCodeAt(i);
			}
			const view = memory.view;
			view.setUint32(ptr + offsets.data, dataPtr, true);
			view.setUint32(ptr + offsets.codeUnits, data.length, true);
		} else {
			throw new Error('Unsupported encoding');
		}
	},
};

interface MetaInfo<T> {
	readonly size: number;
	readonly alignment: alignment;
	store(memory: Memory, ptr: ptr<T>, value: T, options: Options): void;
}

interface RecordField<T = u8 | u16> extends MetaInfo<T> {
	readonly name: string;
	readonly offset: number;
}

namespace RecordField {
	export function create<T>(name: string, offset: number, meta: Omit<RecordField<T>, 'name' | 'offset'>): RecordField<T> {
		return {
			name,
			offset,
			...meta
		};
	}
}

export namespace record {
	export function alignment(fields: RecordField[]): alignment {
		let result: alignment = 1;
		for (const field of fields) {
			result = Math.max(result, field.alignment) as alignment;
		}
		return result;
	}
	export function size(fields: RecordField[]): size {
		let result: ptr = 0;
		for (const field of fields) {
			align(result, field.alignment);
			result += field.size;
		}
		return result;
	}
	export function store(memory: Memory, ptr: ptr, record: { [key:string]: any }, fields: RecordField[], options: Options): void {
		for (const field of fields) {
			const value = record[field.name];
			field.store(memory, ptr + field.offset, value, options);
		}
	}
}

interface TestRecord {
	a: u8;
	b: u32;
	c: u8;
}

namespace TestRecord {
	const fields: RecordField[] = [];
	const meta: [string, MetaInfo<any>][] = [['a', u8], ['b', u32], ['c', u8], ['d', wstring]];
	let offset = 0;
	for (const item of meta) {
		const [name, meta] = item;
		offset = align(offset, meta.alignment);
		fields.push(RecordField.create(name, offset, meta));
		offset += meta.size;
	}

	export const alignment = record.alignment(fields);
	export const size = record.size(fields);

	export function alloc(memory: Memory): ptr<TestRecord> {
		return memory.alloc(alignment, size);
	}

	export function store(memory: Memory, ptr: ptr<TestRecord>, value: TestRecord, options: Options): void {
		record.store(memory, ptr, value, fields, options);
	}
}
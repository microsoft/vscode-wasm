/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RAL from '../ral';

// We need to move this to a more generic place
import { BigInts } from '../converter';
import { Errno, WasiError } from '../wasi';

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

export type i32 = number;
export type i64 = bigint;
export type f32 = number;
export type f64 = number;
export type wasmType = i32 | i64 | f32 | f64;
export type wasmTypeName = 'i32' | 'i64' | 'f32' | 'f64';

namespace WasmTypes {

	const $32 = new DataView(new ArrayBuffer(4));
	const $64 = new DataView(new ArrayBuffer(8));

	export function reinterpret_i32_as_f32(i32: number): f32 {
		$32.setInt32(0, i32, true);
		return $32.getFloat32(0, true);
	}

	export function reinterpret_f32_as_i32(f32: f32): i32 {
		$32.setFloat32(0, f32, true);
		return $32.getInt32(0, true);
	}

	export function convert_i64_to_i32(i64: i64): i32 {
		return BigInts.asNumber(i64);
	}

	export function convert_i32_to_i64(i32: i32): i64 {
		return BigInt(i32);
	}

	export function reinterpret_i64_as_f32(i64: i64): f32 {
		const i32 = convert_i64_to_i32(i64);
		return reinterpret_i32_as_f32(i32);
	}

	export function reinterpret_f32_as_i64(f32: f32): i64 {
		const i32 = reinterpret_f32_as_i32(f32);
		return convert_i32_to_i64(i32);
	}

	export function reinterpret_i64_as_f64(i64: i64): f64 {
		$64.setBigInt64(0, i64, true);
		return $64.getFloat64(0, true);
	}

	export function reinterpret_f64_as_i64(f64: f64): i64 {
		$64.setFloat64(0, f64, true);
		return $64.getBigInt64(0, true);
	}
}

export type FlatValuesIter = Iterator<wasmType, wasmType>;

class CoerceValueIter implements Iterator<wasmType, wasmType> {

	private index: number;

	constructor(private readonly values: FlatValuesIter, private haveFlatTypes: readonly wasmTypeName[], private wantFlatTypes: readonly wasmTypeName[]) {
		if (haveFlatTypes.length !== wantFlatTypes.length) {
			throw new WasiError(Errno.inval);
		}
		this.index = 0;
	}

	next(): IteratorResult<wasmType, wasmType> {
		const value = this.values.next();
		if (value.done) {
			return value;
		}
		const haveType = this.haveFlatTypes[this.index];
		const wantType = this.wantFlatTypes[this.index++];

		if (haveType === 'i32' && wantType === 'f32') {
			return { done: false, value: WasmTypes.reinterpret_i32_as_f32(value.value as i32) };
		} else if (haveType === 'i64' && wantType === 'i32') {
			return { done: false, value: WasmTypes.convert_i64_to_i32(value.value as i64) };
		} else if (haveType === 'i64' && wantType === 'f32') {
			return { done: false, value: WasmTypes.reinterpret_i64_as_f32(value.value as i64) };
		} else if (haveType === 'i64' && wantType === 'f64') {
			return { done: false, value: WasmTypes.reinterpret_i64_as_f64(value.value as i64) };
		} else {
			return value;
		}
	}
}

export interface ComponentModelType<J> {
	readonly size: number;
	readonly alignment: alignment;
	readonly flatTypes: ReadonlyArray<wasmTypeName>;
	load(memory: Memory, ptr: ptr, options: Options): J;
	liftFlat(memory: Memory, values: Iterator<wasmType, wasmType>, options: Options): J;
	alloc(memory: Memory): ptr;
	store(memory: Memory, ptr: ptr, value: J, options: Options): void;
	lowerFlat(result: wasmType[], memory: Memory, value: J, options: Options): void;
}
export type GenericComponentModelType = ComponentModelType<any>;

export type bool = number;
export const bool: ComponentModelType<boolean> = {
	size: 1,
	alignment: 1,
	flatTypes: ['i32'],
	load(memory, ptr: ptr<u8>): boolean {
		return memory.view.getUint8(ptr) !== 0;
	},
	liftFlat(_memory, values): boolean {
		const value = values.next().value;
		if (value < 0) {
			throw new Error(`Invalid bool value ${value}`);
		}
		return value !== 0;
	},
	alloc(memory): ptr<u8> {
		return memory.alloc(bool.size, bool.alignment);
	},
	store(memory, ptr: ptr<u8>, value: boolean): void {
		memory.view.setUint8(ptr, value ? 1 : 0);
	},
	lowerFlat(result, _memory, value: boolean): void {
		result.push(value ? 1 : 0);
	}
};

export type u8 = number;
namespace $u8 {
	export const size = 1;
	export const alignment: alignment = 1;
	export const flatTypes: readonly wasmTypeName[] = ['i32'];

	export const LOW_VALUE = 0;
	export const HIGH_VALUE = 255;

	export function load(memory: Memory, ptr: ptr<u8>): u8 {
		return memory.view.getUint8(ptr);
	}

	export function liftFlat(_memory: Memory, values: FlatValuesIter): u8 {
		const value = values.next().value;
		if (value < LOW_VALUE || value > HIGH_VALUE || !Number.isInteger(value)) {
			throw new Error(`Invalid u8 value ${value}`);
		}
		return value as u8;
	}

	export function alloc(memory: Memory): ptr<u8> {
		return memory.alloc(size, alignment);
	}

	export function store(memory: Memory, ptr: ptr<u8>, value: u8): void {
		memory.view.setUint8(ptr, value);
	}

	export function lowerFlat(result: wasmType[], _memory: Memory, value: u8): void {
		if (value < LOW_VALUE || value > HIGH_VALUE || !Number.isInteger(value)) {
			throw new Error(`Invalid u8 value ${value}`);
		}
		result.push(value);
	}
}
export const u8:ComponentModelType<number> = $u8;

export type u16 = number;
namespace $u16 {
	export const size = 2;
	export const alignment: alignment = 2;
	export const flatTypes: readonly wasmTypeName[] = ['i32'];

	export const LOW_VALUE = 0;
	export const HIGH_VALUE = 65535;

	export function load(memory: Memory, ptr: ptr): u16 {
		return memory.view.getUint16(ptr, true);
	}

	export function liftFlat(_memory: Memory, values:FlatValuesIter): u16 {
		const value = values.next().value;
		if (value < LOW_VALUE || value > HIGH_VALUE || !Number.isInteger(value)) {
			throw new Error(`Invalid u16 value ${value}`);
		}
		return value as u16;
	}

	export function alloc(memory: Memory): ptr<u16> {
		return memory.alloc(size, alignment);
	}

	export function store(memory: Memory, ptr: ptr<u16>, value: u16): void {
		memory.view.setUint16(ptr, value, true);
	}

	export function lowerFlat(result: wasmType[], _memory: Memory, value: number): void {
		if (value < LOW_VALUE || value > HIGH_VALUE || !Number.isInteger(value)) {
			throw new Error(`Invalid u16 value ${value}`);
		}
		result.push(value);
	}
}
export const u16: ComponentModelType<number> = $u16;

export type u32 = number;
namespace $u32 {
	export const size = 4;
	export const alignment: alignment = 4;
	export const flatTypes: readonly wasmTypeName[] = ['i32'];

	export const LOW_VALUE = 0;
	export const HIGH_VALUE = 4294967295; // 2 ^ 32 - 1

	export function load(memory: Memory, ptr: ptr): u32 {
		return memory.view.getUint32(ptr, true);
	}

	export function liftFlat(_memory: Memory, values: FlatValuesIter): u32 {
		const value = values.next().value;
		if (value < LOW_VALUE || value > HIGH_VALUE || !Number.isInteger(value)) {
			throw new Error(`Invalid u32 value ${value}`);
		}
		return value as u32;
	}

	export function alloc(memory: Memory): ptr<u32> {
		return memory.alloc(size, alignment);
	}

	export function store(memory: Memory, ptr: ptr<u32>, value: u32): void {
		memory.view.setUint32(ptr, value, true);
	}

	export function lowerFlat(result: wasmType[], _memory: Memory, value: number): void {
		if (value < LOW_VALUE || value > HIGH_VALUE || !Number.isInteger(value)) {
			throw new Error(`Invalid u32 value ${value}`);
		}
		result.push(value);
	}
}
export const u32: ComponentModelType<number> = $u32;

export type u64 = bigint;
namespace $u64 {
	export const size = 8;
	export const alignment: alignment = 8;
	export const flatTypes: readonly wasmTypeName[] = ['i64'];

	export const LOW_VALUE = 0n;
	export const HIGH_VALUE = 18446744073709551615n; // 2 ^ 64 - 1

	export function load(memory: Memory, ptr: ptr): u64 {
		return memory.view.getBigUint64(ptr, true);
	}

	export function liftFlat(_memory: Memory, values: FlatValuesIter): u64 {
		const value = values.next().value;
		if (value < LOW_VALUE) {
			throw new Error(`Invalid u64 value ${value}`);
		}
		return value as u64;
	}

	export function alloc(memory: Memory): ptr<u64> {
		return memory.alloc(size, alignment);
	}

	export function store(memory: Memory, ptr: ptr<u64>, value: u64): void {
		memory.view.setBigUint64(ptr, value, true);
	}

	export function lowerFlat(result: wasmType[], _memory: Memory, value: bigint): void {
		if (value < LOW_VALUE) {
			throw new Error(`Invalid u64 value ${value}`);
		}
		result.push(value);
	}
}
export const u64: ComponentModelType<bigint> = $u64;

export type s8 = number;
namespace $s8 {
	export const size = 1;
	export const alignment: alignment = 1;
	export const flatTypes: readonly wasmTypeName[] = ['i32'];

	const LOW_VALUE = -128;
	const HIGH_VALUE = 127;

	export function load(memory: Memory, ptr: ptr): s8 {
		return memory.view.getInt8(ptr);
	}

	export function liftFlat(_memory: Memory, values: FlatValuesIter): s8 {
		const value = values.next().value;
		// All int values in the component model are transferred as unsigned
		// values. So for signed values we need to convert them back. First
		// we check if the value is in range of the corresponding unsigned
		// value and the convert it to a signed value.
		if (value < $u8.LOW_VALUE || value > $u8.HIGH_VALUE || !Number.isInteger(value)) {
			throw new Error(`Invalid u8 value ${value}`);
		}
		if (value <= HIGH_VALUE) {
			return value as s8;
		} else {
			return (value as u8) - 256;
		}
	}

	export function alloc(memory: Memory): ptr<s8> {
		return memory.alloc(size, alignment);
	}

	export function store(memory: Memory, ptr: ptr<s8>, value: s8): void {
		memory.view.setInt8(ptr, value);
	}

	export function lowerFlat(result: wasmType[], _memory: Memory, value: number): void {
		if (value < LOW_VALUE || value > HIGH_VALUE || !Number.isInteger(value)) {
			throw new Error(`Invalid s8 value ${value}`);
		}
		result.push((value < 0) ? (value + 256) : value);
	}
}
export const s8: ComponentModelType<number> = $s8;

export type s16 = number;
namespace $s16 {
	export const size = 2;
	export const alignment: alignment = 2;
	export const flatTypes: readonly wasmTypeName[] = ['i32'];

	const LOW_VALUE = -32768; // -2 ^ 15
	const HIGH_VALUE = 32767; // 2 ^ 15 - 1

	export function load(memory: Memory, ptr: ptr): s16 {
		return memory.view.getInt16(ptr, true);
	}

	export function liftFlat(_memory: Memory, values: FlatValuesIter): s16 {
		const value = values.next().value;
		if (value < $u16.LOW_VALUE || value > $u16.HIGH_VALUE || !Number.isInteger(value)) {
			throw new Error(`Invalid s16 value ${value}`);
		}
		return (value <= HIGH_VALUE) ? value as s16 : (value as u16) - 65536;
	}

	export function alloc(memory: Memory): ptr<s16> {
		return memory.alloc(size, alignment);
	}

	export function store(memory: Memory, ptr: ptr<s16>, value: s16): void {
		memory.view.setInt16(ptr, value, true);
	}

	export function lowerFlat(result: wasmType[], _memory: Memory, value: number): void {
		if (value < LOW_VALUE || value > HIGH_VALUE || !Number.isInteger(value)) {
			throw new Error(`Invalid s16 value ${value}`);
		}
		result.push((value < 0) ? (value + 65536) : value);
	}
}
export const s16: ComponentModelType<number> = $s16;

export type s32 = number;
namespace $s32 {
	export const size = 4;
	export const alignment: alignment = 4;
	export const flatTypes: readonly wasmTypeName[] = ['i32'];

	const LOW_VALUE = -2147483648; // -2 ^ 31
	const HIGH_VALUE = 2147483647; // 2 ^ 31 - 1

	export function load(memory: Memory, ptr: ptr): s32 {
		return memory.view.getInt32(ptr, true);
	}

	export function liftFlat(_memory: Memory, values: FlatValuesIter): s32 {
		const value = values.next().value;
		if (value < $u32.LOW_VALUE || value > $u32.HIGH_VALUE || !Number.isInteger(value)) {
			throw new Error(`Invalid s32 value ${value}`);
		}
		return (value <= HIGH_VALUE) ? value as s32 : (value as u32) - 4294967296;
	}

	export function alloc(memory: Memory): ptr<s32> {
		return memory.alloc(size, alignment);
	}

	export function store(memory: Memory, ptr: ptr<s32>, value: s32): void {
		memory.view.setInt32(ptr, value, true);
	}

	export function lowerFlat(result: wasmType[], _memory: Memory, value: number): void {
		if (value < LOW_VALUE || value > HIGH_VALUE || !Number.isInteger(value)) {
			throw new Error(`Invalid s32 value ${value}`);
		}
		result.push((value < 0) ? (value + 4294967296) : value);
	}
}
export const s32: ComponentModelType<number> = $s32;

export type s64 = bigint;
namespace $s64 {
	export const size = 8;
	export const alignment: alignment = 8;
	export const flatTypes: readonly wasmTypeName[] = ['i64'];

	const LOW_VALUE = -9223372036854775808n; // -2 ^ 63
	const HIGH_VALUE = 9223372036854775807n; // 2 ^ 63 - 1

	export function load(memory: Memory, ptr: ptr<s64>): s64 {
		return memory.view.getBigInt64(ptr, true);
	}

	export function liftFlat(_memory: Memory, values: FlatValuesIter): s64 {
		const value = values.next().value;
		if (value < $u64.LOW_VALUE) {
			throw new Error(`Invalid s64 value ${value}`);
		}
		return (value <= HIGH_VALUE) ? value as s64 : (value as u64) - 18446744073709551616n;
	}

	export function alloc(memory: Memory): ptr<s64> {
		return memory.alloc(size, alignment);
	}

	export function store(memory: Memory, ptr: ptr<s64>, value: s64): void {
		memory.view.setBigInt64(ptr, value, true);
	}

	export function lowerFlat(result: wasmType[], _memory: Memory, value: bigint): void {
		if (value < LOW_VALUE || value > HIGH_VALUE) {
			throw new Error(`Invalid s64 value ${value}`);
		}
		result.push((value < 0) ? (value + 18446744073709551616n) : value);
	}
}
export const s64: ComponentModelType<bigint> = $s64;

export type float32 = number;
namespace $float32 {
	export const size = 4;
	export const alignment:alignment = 4;
	export const flatTypes: readonly wasmTypeName[] = ['f32'];

	const LOW_VALUE = -3.4028234663852886e+38;
	const HIGH_VALUE = 3.4028234663852886e+38;
	const NAN = 0x7fc00000;

	export function load(memory: Memory, ptr: ptr): float32 {
		return memory.view.getFloat32(ptr, true);
	}

	export function liftFlat(_memory: Memory, values: FlatValuesIter): float32 {
		const value = values.next().value;
		if (value < LOW_VALUE || value > HIGH_VALUE) {
			throw new Error(`Invalid float32 value ${value}`);
		}
		return value === NAN ? Number.NaN : value as float32;
	}

	export function alloc(memory: Memory): ptr<float32> {
		return memory.alloc(size, alignment);
	}

	export function store(memory: Memory, ptr: ptr<float32>, value: float32): void {
		memory.view.setFloat32(ptr, value, true);
	}

	export function lowerFlat(result: wasmType[], _memory: Memory, value: number): void {
		if (value < LOW_VALUE || value > HIGH_VALUE) {
			throw new Error(`Invalid float32 value ${value}`);
		}
		result.push(Number.isNaN(value) ? NAN : value);
	}
}
export const float32: ComponentModelType<number> = $float32;

export type float64 = number;
namespace $float64 {
	export const size = 8;
	export const alignment: alignment = 8;
	export const flatTypes: readonly wasmTypeName[] = ['f64'];

	const LOW_VALUE = -1 * Number.MAX_VALUE;
	const HIGH_VALUE = Number.MAX_VALUE;
	const NAN = 0x7ff8000000000000;

	export function load(memory: Memory, ptr: ptr): float64 {
		return memory.view.getFloat64(ptr, true);
	}

	export function liftFlat(_memory: Memory, values: FlatValuesIter): float64 {
		const value = values.next().value;
		if (value < LOW_VALUE || value > HIGH_VALUE) {
			throw new Error(`Invalid float64 value ${value}`);
		}
		return value === NAN ? Number.NaN : value as float64;
	}

	export function alloc(memory: Memory): ptr<float64> {
		return memory.alloc(size, alignment);
	}

	export function store(memory: Memory, ptr: ptr<float64>, value: float64): void {
		memory.view.setFloat64(ptr, value, true);
	}

	export function lowerFlat(result: wasmType[], _memory: Memory, value: number): void {
		if (value < LOW_VALUE || value > HIGH_VALUE) {
			throw new Error(`Invalid float64 value ${value}`);
		}
		result.push(Number.isNaN(value) ? NAN : value);
	}
}
export const float64: ComponentModelType<number> = $float64;

export type byte = u8;
export const byte: ComponentModelType<byte> = {
	size: u8.size,
	alignment: u8.alignment,
	flatTypes: u8.flatTypes,

	load: u8.load,
	liftFlat: u8.liftFlat,
	alloc: u8.alloc,
	store: u8.store,
	lowerFlat: u8.lowerFlat
};

export type size = u32;
export const size: ComponentModelType<size> = {
	size: u32.size,
	alignment: u32.alignment,
	flatTypes: u32.flatTypes,

	load: u32.load,
	liftFlat: u32.liftFlat,
	alloc: u32.alloc,
	store: u32.store,
	lowerFlat: u32.lowerFlat
};

export type ptr<_type = ArrayBuffer> = u32;
export const ptr: ComponentModelType<ptr> = {
	size: u32.size,
	alignment: u32.alignment,
	flatTypes: u32.flatTypes,

	load: u32.load,
	liftFlat: u32.liftFlat,
	alloc: u32.alloc,
	store: u32.store,
	lowerFlat: u32.lowerFlat
};



export interface char {

}

namespace $wstring {

	const offsets = {
		data: 0,
		codeUnits: 4
	};

	export const size = 8;
	export const alignment: alignment = 4;
	export const flatTypes: readonly wasmTypeName[] = ['i32', 'i32'];

	export function load(memory: Memory, ptr: ptr, options: Options): string {
		const view = memory.view;
		const dataPtr: ptr =  view.getUint32(ptr + offsets.data);
		const codeUnits: u32 = view.getUint32(ptr + offsets.codeUnits);
		return loadFromRange(memory, dataPtr, codeUnits, options);
	}

	export function liftFlat(memory: Memory, values: FlatValuesIter, options: Options): string {
		const dataPtr: ptr = values.next().value as ptr;
		const codeUnits: u32 = values.next().value as u32;
		return loadFromRange(memory, dataPtr, codeUnits, options);
	}

	export function alloc(memory: Memory): ptr {
		return memory.alloc(size, alignment);
	}

	export function store(memory: Memory, ptr: ptr, str: string, options: Options): void {
		const [ data, codeUnits ] = storeIntoRange(memory, str, options);
		const view = memory.view;
		view.setUint32(ptr + offsets.data, data, true);
		view.setUint32(ptr + offsets.codeUnits, codeUnits, true);
	}

	export function lowerFlat(result: wasmType[], memory: Memory, str: string, options: Options): void {
		result.push(...storeIntoRange(memory, str, options));
	}

	function loadFromRange(memory: Memory, data: ptr, codeUnits: u32, options: Options): string {
		const encoding = options.encoding;
		if (encoding === 'latin1+utf-16') {
			throw new Error('latin1+utf-16 encoding not yet supported');
		}
		if (encoding === 'utf-8') {
			const byteLength = codeUnits;
			return utf8Decoder.decode(new Uint8Array(memory.buffer, data, byteLength));
		} else if (encoding === 'utf-16') {
			return String.fromCharCode(...(new Uint16Array(memory.buffer, data, codeUnits)));
		} else {
			throw new Error('Unsupported encoding');
		}
	}

	function storeIntoRange(memory: Memory, str: string, options: Options): [ptr, u32] {
		const { encoding } = options;
		if (encoding === 'latin1+utf-16') {
			throw new Error('latin1+utf-16 encoding not yet supported');
		}
		if (encoding === 'utf-8') {
			const data = utf8Encoder.encode(str);
			const dataPtr = memory.alloc(u8.alignment, data.length);
			memory.raw.set(data, dataPtr);
			return [dataPtr, data.length];
		} else if (encoding === 'utf-16') {
			const dataPtr = memory.alloc(u8.alignment, str.length * 2);
			const data = new Uint16Array(memory.buffer, dataPtr, str.length);
			for (let i = 0; i < str.length; i++) {
				data[i] = str.charCodeAt(i);
			}
			return [dataPtr, data.length];
		} else {
			throw new Error('Unsupported encoding');
		}
	}
}
export const wstring: ComponentModelType<string> = $wstring;

interface typedField {
	readonly type: GenericComponentModelType;
}

namespace typedFields {
	export function size(fields: typedField[]): size {
		let result: ptr = 0;
		for (const field of fields) {
			align(result, field.type.alignment);
			result += field.type.size;
		}
		return result;
	}

	export function alignment(fields: typedField[]): alignment {
		let result: alignment = 1;
		for (const field of fields) {
			result = Math.max(result, field.type.alignment) as alignment;
		}
		return result;
	}

	export function flatTypes(fields: typedField[]): readonly wasmTypeName[] {
		const result: wasmTypeName[] = [];
		for (const field of fields) {
			result.push(...field.type.flatTypes);
		}
		return result;
	}
}

export interface recordField extends typedField {
	readonly name: string;
	readonly offset: number;
}

export namespace recordField {
	export function create(name: string, offset: number, type: GenericComponentModelType): recordField {
		return { name, offset, type };
	}
}

export interface JRecord {
	[key: string]: any;
}
export namespace record {

	export const size: (fields: recordField[]) => size = typedFields.size;

	export const alignment: (fields: recordField[]) => alignment = typedFields.alignment;

	export const flatTypes: (fields: recordField[]) => readonly wasmTypeName[] = typedFields.flatTypes;

	export function load(memory: Memory, ptr: ptr, options: Options, fields: recordField[]): JRecord {
		const result: JRecord = Object.create(null);
		for (const field of fields) {
			const value = field.type.load(memory, ptr + field.offset, options);
			result[field.name] = value;
		}
		return result;
	}

	export function liftFlat(memory: Memory, values: FlatValuesIter, options: Options, fields: recordField[]): JRecord {
		const result: JRecord = Object.create(null);
		for (const field of fields) {
			const value = field.type.liftFlat(memory, values, options);
			result[field.name] = value;
		}
		return result;
	}

	export function store(memory: Memory, ptr: ptr, record: JRecord, options: Options, fields: recordField[]): void {
		for (const field of fields) {
			const value = record[field.name];
			field.type.store(memory, ptr + field.offset, value, options);
		}
	}

	export function lowerFlat(result: wasmType[], memory: Memory, record: JRecord, options: Options, fields: recordField[]): void {
		for (const field of fields) {
			const value = record[field.name];
			field.type.lowerFlat(result, memory, value, options);
		}
	}
}

export type JTuple = JType[];
export interface tupleField extends typedField {
	readonly offset: number;
}
export namespace tupleField {
	export function create(offset: number, type: GenericComponentModelType): tupleField {
		return { offset, type };
	}
}

export namespace tuple {
	export const size: (fields: tupleField[]) => size = typedFields.size;

	export const alignment: (fields: tupleField[]) => alignment = typedFields.alignment;

	export const flatTypes: (fields: tupleField[]) => readonly wasmTypeName[] = typedFields.flatTypes;

	export function load(memory: Memory, ptr: ptr, options: Options, fields: tupleField[]): JTuple {
		const result: JTuple = [];
		for (const field of fields) {
			const value = field.type.load(memory, ptr + field.offset, options);
			result.push(value);
		}
		return result;
	}

	export function liftFlat(memory: Memory, values: FlatValuesIter, options: Options, fields: tupleField[]): JTuple {
		const result: JTuple = [];
		for (const field of fields) {
			const value = field.type.liftFlat(memory, values, options);
			result.push(value);
		}
		return result;
	}

	export function store(memory: Memory, ptr: ptr, tuple: JTuple, options: Options, fields: tupleField[]): void {
		for (let i = 0; i < fields.length; i++) {
			const field = fields[i];
			const value = tuple[i];
			field.type.store(memory, ptr + field.offset, value, options);
		}
	}

	export function lowerFlat(result: wasmType[], memory: Memory, tuple: JTuple, options: Options, fields: tupleField[]): void {
		for (let i = 0; i < fields.length; i++) {
			const field = fields[i];
			const value = tuple[i];
			field.type.lowerFlat(result, memory, value, options);
		}
	}
}

export interface JFlags {
	_flags: u32[];
}

export namespace flags {
	export function size(fields: number): size {
		if (fields === 0) {
			return 0;
		} else if (fields <= 8) {
			return 1;
		} else if (fields <= 16) {
			return 2;
		} else {
			return 4 * num32Flags(fields);
		}
	}

	export function alignment(fields: number): alignment {
		if (fields <= 8) {
			return 1;
		} else if (fields <= 16) {
			return 2;
		} else {
			return 4;
		}
	}

	export function flatTypes(fields: number): 'i32'[] {
		return new Array(num32Flags(fields)).fill('i32');
	}

	export function load(memory: Memory, ptr: ptr<u32[]>, fields: number): u32[] {
		const numFlags = num32Flags(fields);
		const result: u32[] = new Array(numFlags);
		for (let i = 0; i < numFlags; i++) {
			result[i] = memory.view.getUint32(ptr, true);
			ptr += u32.size;
		}
		return result;
	}

	export function liftFlat(_memory: Memory, values: FlatValuesIter, fields: number): u32[] {
		const numFlags = num32Flags(fields);
		const result: u32[] = new Array(numFlags);
		for (let i = 0; i < numFlags; i++) {
			result[i] = values.next().value as u32;
		}
		return result;
	}

	export function store(memory: Memory, ptr: ptr<u32[]>, flags: u32[]): void {
		for (const flag of flags) {
			memory.view.setUint32(ptr, flag, true);
			ptr += u32.size;
		}
	}

	export function lowerFlat(result: wasmType[], _memory: Memory, flags: u32[]): void {
		for (const flag of flags) {
			result.push(flag);
		}
	}

	function num32Flags(fields: number): number {
		return Math.ceil(fields / 32);
	}
}

interface baseCase {
	readonly type: GenericComponentModelType | undefined;
	readonly wantFlatTypes: wasmTypeName[] | undefined;
}

namespace baseVariant {

	export function size(discriminantType: GenericComponentModelType, cases: baseCase[]): size {
		let result = discriminantType.size;
		result = align(result, maxCaseAlignment(cases));
		return result + maxCaseSize(cases);
	}

	export function alignment(discriminantType: GenericComponentModelType, cases: baseCase[]): alignment {
		return Math.max(discriminantType.alignment, maxCaseAlignment(cases)) as alignment;
	}

	export function flatTypes(discriminantType: GenericComponentModelType, cases: variantCase[]): readonly wasmTypeName[] {
		const flat: wasmTypeName[] = [];
		for (const c of cases) {
			if (c.type === undefined) {
				continue;
			}
			const flatTypes = c.type.flatTypes;
			for (let i = 0; i < flatTypes.length; i++) {
				const want = flatTypes[i];
				if (i < flat.length) {
					const use = joinFlatType(flat[i], want);
					flat[i] = use;
					c.wantFlatTypes!.push(want);
				} else {
					flat.push(want);
					c.wantFlatTypes!.push(want);
				}
			}
		}
		return [...discriminantType.flatTypes, ...flat];
	}

	export function discriminantType(cases: number): GenericComponentModelType {
		switch (Math.ceil(Math.log2(cases) / 8)) {
			case 0: return u8;
			case 1: return u8;
			case 2: return u16;
			case 3: return u32;
		}
		throw new WasiError(Errno.inval);
	}

	export function maxCaseAlignment(cases: baseCase[]): alignment {
		let result: alignment = 1;
		for (const c of cases) {
			if (c.type !== undefined) {
				result = Math.max(result, c.type.alignment) as alignment;
			}
		}
		return result;
	}

	function maxCaseSize(cases: baseCase[]): size {
		let result = 0;
		for (const c of cases) {
			if (c.type !== undefined) {
				result = Math.max(result, c.type.size);
			}
		}
		return result;
	}

	function joinFlatType(a: wasmTypeName, b:wasmTypeName) : wasmTypeName {
		if (a === b) {
			return a;
		}
		if ((a === 'i32' && b === 'f32') || (a === 'f32' && b === 'i32')) {
			return 'i32';
		}
		return 'i64';
	}
}

export interface variantCase extends baseCase {
	readonly name: string;
	readonly index: number;
}

export namespace variantCase {
	export function create(name: string, index: number, type: GenericComponentModelType | undefined): variantCase {
		return { name, index, type, wantFlatTypes: type !== undefined ? [] : undefined };
	}
}

export interface JCase {
	readonly _index: number;
	readonly case: string;
	value?: JType;
}

export namespace variant {
	export const size: (discriminantType: GenericComponentModelType, cases: variantCase[]) =>  size = baseVariant.size;

	export const alignment: (discriminantType: GenericComponentModelType, cases: variantCase[]) => alignment = baseVariant.alignment;

	export const flatTypes: (discriminantType: GenericComponentModelType, cases: variantCase[]) => readonly wasmTypeName[] = baseVariant.flatTypes;

	export function load(memory: Memory, ptr: ptr, options: Options, discriminantType: GenericComponentModelType, maxCaseAlignment: alignment, cases: variantCase[]): JCase {
		const caseIndex = discriminantType.load(memory, ptr, options);
		ptr += discriminantType.size;
		const caseVariant = cases[caseIndex];
		if (caseVariant.type === undefined) {
			return { case: caseVariant.name, _index: caseIndex };
		} else {
			ptr = align(ptr, maxCaseAlignment);
			const value = caseVariant.type.load(memory, ptr, options);
			return { case: caseVariant.name, _index: caseIndex, value };
		}
	}

	export function liftFlat(memory: Memory, values: FlatValuesIter, options: Options, discriminantType: GenericComponentModelType, flatTypes: readonly wasmTypeName[], cases: variantCase[]): JCase {
		const caseIndex = discriminantType.liftFlat(memory, values, options);
		const caseVariant = cases[caseIndex];
		if (caseVariant.type === undefined) {
			return { case: caseVariant.name, _index: caseIndex };
		} else {
			// The first flat type is the discriminant type. So skip it.
			const iter = new CoerceValueIter(values, flatTypes.slice(1), caseVariant.wantFlatTypes!);
			const value = caseVariant.type.liftFlat(memory, iter, options);
			return { case: caseVariant.name, _index: caseIndex, value };
		}
	}

	export function store(memory: Memory, ptr: ptr, value: JCase, options: Options, discriminantType: GenericComponentModelType, maxCaseAlignment: alignment, c: variantCase): void {
		discriminantType.store(memory, ptr, value._index, options);
		ptr += discriminantType.size;
		if (c.type !== undefined && value.value !== undefined) {
			ptr = align(ptr, maxCaseAlignment);
			c.type.store(memory, ptr, value.value, options);
		}
	}

	export function lowerFlat(result: wasmType[], memory: Memory, value: JCase, options: Options, discriminantType: GenericComponentModelType, flatTypes: readonly wasmTypeName[], c: variantCase): void {
		discriminantType.lowerFlat(result, memory, value._index, options);
		if (c.type !== undefined && value.value !== undefined) {
			const payload: wasmType[] = [];
			c.type.lowerFlat(payload, memory, value.value, options);
			// First one is the discriminant type. So skip it.
			const wantTypes = flatTypes.slice(1);
			const haveTypes = c.wantFlatTypes!;
			if (wantTypes.length !== haveTypes.length || payload.length !== haveTypes.length) {
				throw new WasiError(Errno.inval);
			}
			for (let i = 0; i < wantTypes.length; i++) {
				const have: wasmTypeName = haveTypes[i];
				const want: wasmTypeName = wantTypes[i];
				if (have === 'f32' && want === 'i32') {
					payload[i] = WasmTypes.reinterpret_f32_as_i32(payload[i] as number);
				} else if (have === 'i32' && want === 'i64') {
					payload[i] = WasmTypes.convert_i32_to_i64(payload[i] as number);
				} else if (have === 'f32' && want === 'i64') {
					payload[i] = WasmTypes.reinterpret_f32_as_i64(payload[i] as number);
				} else if (have === 'f64' && want === 'i64') {
					payload[i] = WasmTypes.reinterpret_f64_as_i64(payload[i] as number);
				}
			}
			result.push(...payload);
		}
	}

	export const discriminantType: (cases: number) => GenericComponentModelType = baseVariant.discriminantType;

	export const maxCaseAlignment: (cases: variantCase[]) => alignment = baseVariant.maxCaseAlignment;
}

export type JEnum = number;

export type JType = number | bigint | string | boolean | JRecord | JCase | JFlags | JCase | JTuple | JEnum;

interface TestRecord extends JRecord {
	a: u8;
	b: u32;
	c: u8;
	d: string;
}

namespace $TestRecordType {

	const fields: recordField[] = [];
	let offset = 0;
	for (const item of [['a', u8], ['b', u32], ['c', u8], ['d', wstring]] as [string, GenericComponentModelType][]) {
		const [name, type] = item;
		offset = align(offset, type.alignment);
		fields.push(recordField.create(name, offset, type));
		offset += type.size;
	}

	export const alignment = record.alignment(fields);
	export const size = record.size(fields);
	export const flatTypes = record.flatTypes(fields);

	export function load(memory: Memory, ptr: ptr, options: Options): TestRecord {
		return record.load(memory, ptr, options, fields) as TestRecord;
	}

	export function liftFlat(memory: Memory, values: FlatValuesIter, options: Options): TestRecord {
		return record.liftFlat(memory, values, options, fields) as TestRecord;
	}

	export function alloc(memory: Memory): ptr {
		return memory.alloc(alignment, size);
	}

	export function store(memory: Memory, ptr: ptr, value: TestRecord, options: Options): void {
		record.store(memory, ptr, value, options, fields);
	}

	export function lowerFlat(result: wasmType[], memory: Memory, value: TestRecord, options: Options): void {
		record.lowerFlat(result, memory, value, options, fields);
	}
}
export const TestRecordType: ComponentModelType<TestRecord> = $TestRecordType;

export type TestTuple = [u8, string];

namespace $TestTupleType {
	const fields: tupleField[] = [];
	let offset = 0;
	for (const type of [u8, wstring]) {
		offset = align(offset, type.alignment);
		fields.push(tupleField.create(offset, type));
		offset += type.size;
	}
	export const alignment = tuple.alignment(fields);
	export const size = tuple.size(fields);
	export const flatTypes = tuple.flatTypes(fields);

	export function load(memory: Memory, ptr: ptr, options: Options): TestTuple {
		return tuple.load(memory, ptr, options, fields) as TestTuple;
	}

	export function liftFlat(memory: Memory, values: FlatValuesIter, options: Options): TestTuple {
		return tuple.liftFlat(memory, values, options, fields) as TestTuple;
	}

	export function alloc(memory: Memory): ptr {
		return memory.alloc(alignment, size);
	}

	export function store(memory: Memory, ptr: ptr, value: TestTuple, options: Options): void {
		tuple.store(memory, ptr, value, options, fields);
	}

	export function lowerFlat(result: wasmType[], memory: Memory, value: TestTuple, options: Options): void {
		tuple.lowerFlat(result, memory, value, options, fields);
	}
}
export const TestTupleType: ComponentModelType<TestTuple> = $TestTupleType;


export interface TestFlags extends JFlags {
	a: boolean;
	b: boolean;
	c: boolean;
}

namespace $TestFlagsType {
	const _flags: number = 10;

	export const alignment = flags.alignment(_flags);
	export const size = flags.size(_flags);
	export const flatTypes = flags.flatTypes(_flags);

	export function load(memory: Memory, ptr: ptr): TestFlags {
		return create(flags.load(memory, ptr, _flags));
	}

	export function liftFlat(memory: Memory, values: FlatValuesIter): TestFlags {
		return create(flags.liftFlat(memory, values, _flags));
	}

	export function alloc(memory: Memory): ptr {
		return memory.alloc(alignment, size);
	}

	export function store(memory: Memory, ptr: ptr, value: TestFlags): void {
		flags.store(memory, ptr, value._flags);
	}

	export function lowerFlat(result: wasmType[], memory: Memory, value: TestFlags): void {
		flags.lowerFlat(result, memory, value._flags);
	}

	function create(flags: u32[]): TestFlags {
		return {
			_flags: flags,
			get a(): boolean { return  (flags[0] & 1) !== 0; },
			get b(): boolean { return (flags[0] & 2) !== 0; },
			get c(): boolean { return (flags[0] & 4) !== 0; }
		};
	}
}
export const TestFlagsType: ComponentModelType<TestFlags> = $TestFlagsType;

export type TestVariant = { readonly case: 'a'; value: u8 } | { readonly case: 'b'; value: u32 } | { readonly case: 'c'; value: string };

namespace $TestVariantType {
	const cases: variantCase[] = [];
	let index = 0;
	for (const item of [['a', u8], ['b', u32], ['c'], ['d', wstring]] as [string, GenericComponentModelType | undefined][]) {
		const [name, type] = item;
		cases.push(variantCase.create(name, index++, type));
	}

	const discriminantType = variant.discriminantType(cases.length);
	const maxCaseAlignment = variant.maxCaseAlignment(cases);

	export const alignment = variant.alignment(discriminantType, cases);
	export const size = variant.size(discriminantType, cases);
	export const flatTypes = variant.flatTypes(discriminantType, cases);


	export function load(memory: Memory, ptr: ptr, options: Options): TestVariant {
		return variant.load(memory, ptr, options, discriminantType, maxCaseAlignment, cases) as TestVariant;
	}
	export function liftFlat(memory: Memory, values: FlatValuesIter, options: Options): TestVariant {
		return variant.liftFlat(memory, values, options, discriminantType, flatTypes, cases) as TestVariant;
	}
	export function alloc(memory: Memory): ptr {
		return memory.alloc(alignment, size);
	}
	export function store(memory: Memory, ptr: ptr, value: TestVariant, options: Options): void {
		variant.store(memory, ptr, value as JCase, options, discriminantType, maxCaseAlignment, cases[(value as JCase)._index]);
	}
	export function lowerFlat(result: wasmType[], memory: Memory, value: TestVariant, options: Options): void {
		variant.lowerFlat(result, memory, value as JCase, options, discriminantType, flatTypes, cases[(value as JCase)._index]);
	}
}
export const TestVariantType: ComponentModelType<TestVariant> = $TestVariantType;

export enum TestEnum {
	a = 0,
	b = 1,
	c = 2
}
export const TestEnumType: ComponentModelType<TestEnum> = $TestEnumType;

namespace $TestEnumType {

	const discriminantType = u8;

	export const alignment = discriminantType.alignment;
	export const size = discriminantType.size;
	export const flatTypes = discriminantType.flatTypes;

	export function load(memory: Memory, ptr: ptr, options: Options): TestEnum {
		return assertRange(discriminantType.load(memory, ptr, options)) as TestEnum;
	}
	export function liftFlat(memory: Memory, values: FlatValuesIter, options: Options): TestEnum {
		return assertRange(discriminantType.liftFlat(memory, values, options)) as TestEnum;
	}
	export function alloc(memory: Memory): ptr {
		return memory.alloc(alignment, size);
	}
	export function store(memory: Memory, ptr: ptr, value: TestEnum, options: Options): void {
		discriminantType.store(memory, ptr, value as number, options);
	}
	export function lowerFlat(result: wasmType[], memory: Memory, value: TestEnum, options: Options): void {
		discriminantType.lowerFlat(result, memory, value as number, options);
	}

	function assertRange(value: number): number {
		if (value < TestEnum.a || value > TestEnum.c) {
			throw new WasiError(Errno.inval);
		}
		return value;
	}
}
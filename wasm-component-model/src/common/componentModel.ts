/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RAL from './ral';

export class ComponentModelError extends Error {
	constructor(message: string) {
		super(message);
	}
}

namespace BigInts {
	const MAX_VALUE_AS_BIGINT = BigInt(Number.MAX_VALUE);
	export function asNumber(value: bigint): number {
		if (value > MAX_VALUE_AS_BIGINT) {
			throw new ComponentModelError('Value too big for number');
		}
		return Number(value);
	}
	export function max(...args: bigint[]): bigint {
		return args.reduce((m, e) => e > m ? e : m);
	}

	export function min(...args: bigint[]): bigint {
		return args.reduce((m, e) => e < m ? e : m);
	}
}

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
			throw new ComponentModelError('Invalid coercion');
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
	// Loads an object directly from the memory buffer
	load(memory: Memory, ptr: ptr, options: Options): J;
	// Loads an object from a flattened signature
	liftFlat(memory: Memory, values: FlatValuesIter, options: Options): J;
	// Allocates a new object in the memory buffer
	alloc(memory: Memory): ptr;
	// Stores an object directly into the memory buffer
	store(memory: Memory, ptr: ptr, value: J, options: Options): void;
	// Stores an object into a flattened signature
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

namespace $wchar {
	export const size = 4;
	export const alignment: alignment = 4;
	export const flatTypes: readonly wasmTypeName[] = ['i32'];

	export function load(memory: Memory, ptr: ptr, options: Options): string {
		return fromCodePoint(u32.load(memory, ptr, options));
	}

	export function liftFlat(memory: Memory, values: FlatValuesIter, options: Options): string {
		return fromCodePoint(u32.liftFlat(memory, values, options));
	}

	export function alloc(memory: Memory): ptr {
		return u32.alloc(memory);
	}

	export function store(memory: Memory, ptr: ptr, value: string, options: Options): void {
		u32.store(memory, ptr, asCodePoint(value), options);
	}

	export function lowerFlat(result: wasmType[], memory: Memory, value: string, options: Options): void {
		u32.lowerFlat(result, memory, asCodePoint(value), options);
	}

	function fromCodePoint(code: u32): string {
		if (code >= 0x110000 || (0xD800 <= code && code <= 0xDFFF)) {
			throw new ComponentModelError('Invalid code point');
		}
		return String.fromCodePoint(code);
	}

	function asCodePoint(str: string): u32 {
		if (str.length !== 1) {
			throw new ComponentModelError('String length must be 1');
		}
		const code = str.codePointAt(0)!;
		if (!(code <= 0xD7FF || (0xD800 <= code && code <= 0x10FFFF))) {
			throw new ComponentModelError('Invalid code point');
		}
		return code;
	}
}
export const wchar: ComponentModelType<string> = $wchar;

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

export class ListType<T> implements ComponentModelType<T[]> {

	private static readonly offsets = {
		data: 0,
		length: 4
	};

	private elementType: ComponentModelType<T>;

	public readonly size: size;
	public readonly alignment: alignment;
	public readonly flatTypes: readonly wasmTypeName[];

	constructor(elementType: ComponentModelType<T>) {
		this.elementType = elementType;
		this.size = 8;
		this.alignment = 4;
		this.flatTypes = ['i32', 'i32'];
	}

	public load(memory: Memory, ptr: ptr, options: Options): T[] {
		const view = memory.view;
		const offsets = ListType.offsets;
		const dataPtr: ptr =  view.getUint32(ptr + offsets.data);
		const codeUnits: u32 = view.getUint32(ptr + offsets.length);
		return this.loadFromRange(memory, dataPtr, codeUnits, options);
	}

	public liftFlat(memory: Memory, values: FlatValuesIter, options: Options): T[] {
		const dataPtr: ptr = values.next().value as ptr;
		const length: u32 = values.next().value as u32;
		return this.loadFromRange(memory, dataPtr, length, options);
	}

	public alloc(memory: Memory): ptr {
		return memory.alloc(this.size, this.alignment);
	}

	public store(memory: Memory, ptr: ptr, values: T[], options: Options): void {
		const [ data, length ] = this.storeIntoRange(memory, values, options);
		const view = memory.view;
		const offsets = ListType.offsets;
		view.setUint32(ptr + offsets.data, data, true);
		view.setUint32(ptr + offsets.length, length, true);
	}

	public lowerFlat(result: wasmType[], memory: Memory, values: T[], options: Options): void {
		result.push(...this.storeIntoRange(memory, values, options));
	}

	private loadFromRange(memory: Memory, data: ptr, length: u32, options: Options): T[] {
		const result: T[] = [];
		let offset = 0;
		for (let i = 0; i < length; i++) {
			result.push(this.elementType.load(memory, data + offset, options));
			offset += this.elementType.size;
		}
		return result;
	}

	private storeIntoRange(memory: Memory, values: T[], options: Options): [ptr, u32] {
		const bytes = this.elementType.size * values.length;
		const ptr = memory.alloc(this.elementType.alignment, bytes);
		let indexPtr = ptr;
		for (const item of values) {
			this.elementType.store(memory, indexPtr, item, options);
			indexPtr += this.elementType.size;
		}
		return [ptr, values.length];
	}
}

interface TypedField {
	readonly type: GenericComponentModelType;
	readonly offset: number;
}

export interface JRecord {
	[key: string]: JType;
}

export type JTuple = JType[];

abstract class BaseRecordType<T extends JRecord | JTuple, F extends TypedField> implements ComponentModelType<T> {

	private fields: F[];

	public readonly size: size;
	public readonly alignment: alignment;
	public readonly flatTypes: readonly wasmTypeName[];

	constructor(fields: F[]) {
		this.fields = fields;

		this.size = BaseRecordType.size(fields);
		this.alignment = BaseRecordType.alignment(fields);
		this.flatTypes = BaseRecordType.flatTypes(fields);
	}

	public load(memory: Memory, ptr: ptr, options: Options): T {
		const result: JType[] = [];
		for (const field of this.fields) {
			const value = field.type.load(memory, ptr + field.offset, options);
			result.push(value);
		}
		return this.create(this.fields, result);
	}


	public liftFlat(memory: Memory, values: FlatValuesIter, options: Options): T {
		const result: JType[] = [];
		for (const field of this.fields) {
			result.push(field.type.liftFlat(memory, values, options));
		}
		return this.create(this.fields, result);
	}

	public alloc(memory: Memory): ptr {
		return memory.alloc(this.size, this.alignment);
	}

	public store(memory: Memory, ptr: ptr, record: T, options: Options): void {
		const values = this.elements(record, this.fields);
		for (let i = 0; i < this.fields.length; i++) {
			const field = this.fields[i];
			const value = values[i];
			field.type.store(memory, ptr + field.offset, value, options);
		}
	}

	public lowerFlat(result: wasmType[], memory: Memory, record: T, options: Options): void {
		const values = this.elements(record, this.fields);
		for (let i = 0; i < this.fields.length; i++) {
			const field = this.fields[i];
			const value = values[i];
			field.type.lowerFlat(result, memory, value, options);
		}
	}

	protected abstract create(fields: F[], values: JType[]): T;
	protected abstract elements(record: T, fields: F[]): JType[];

	private static size(fields: TypedField[]): size {
		let result: ptr = 0;
		for (const field of fields) {
			align(result, field.type.alignment);
			result += field.type.size;
		}
		return result;
	}

	private static alignment(fields: TypedField[]): alignment {
		let result: alignment = 1;
		for (const field of fields) {
			result = Math.max(result, field.type.alignment) as alignment;
		}
		return result;
	}

	private static flatTypes(fields: TypedField[]): readonly wasmTypeName[] {
		const result: wasmTypeName[] = [];
		for (const field of fields) {
			result.push(...field.type.flatTypes);
		}
		return result;
	}
}

interface RecordField extends TypedField {
	readonly name: string;
	readonly offset: number;
}

namespace RecordField {
	export function create(name: string, offset: number, type: GenericComponentModelType): RecordField {
		return { name, offset, type };
	}
}

export class RecordType<T extends JRecord> extends BaseRecordType<T, RecordField> {

	constructor(fields: [string, GenericComponentModelType][]) {
		let offset = 0;
		const recordFields: RecordField[] = [];
		for (const [name, type] of fields) {
			offset = align(offset, type.alignment);
			recordFields.push(RecordField.create(name, offset, type));
			offset += type.size;
		}
		super(recordFields);
	}

	protected create(fields: RecordField[], values: JType[]): T {
		const result: JRecord = {};
		for (let i = 0; i < fields.length; i++) {
			const field = fields[i];
			const value = values[i];
			result[field.name] = value;
		}
		return result as T;
	}

	protected elements(record: T, fields: RecordField[]): JType[] {
		const result: JType[] = [];
		for (const field of fields) {
			result.push(record[field.name]);
		}
		return result;
	}
}

interface TupleField extends TypedField {
	readonly offset: number;
}
namespace TupleField {
	export function create(offset: number, type: GenericComponentModelType): TupleField {
		return { offset, type };
	}
}

export class TupleType<T extends JTuple> extends BaseRecordType<T, TupleField> {

	constructor(fields: GenericComponentModelType[]) {
		let offset = 0;
		const tupleFields: TupleField[] = [];
		for (const type of fields) {
			offset = align(offset, type.alignment);
			tupleFields.push(TupleField.create(offset, type));
			offset += type.size;
		}
		super(tupleFields);
	}

	protected create(_fields: TupleField[], values: JType[]): T {
		return values as JTuple as T;
	}

	protected elements(record: T, _fields: TupleField[]): JType[] {
		return record;
	}
}

export interface JFlags {
	[key: string]: boolean;
}

interface FlagField {
	readonly name: string;
	readonly index: number;
	readonly mask: u32;
}

export namespace FlagField {
	export function create(name: string, index: number, mask: u32): FlagField {
		return { name, index, mask };
	}
}

enum FlagsStorageType {
	Empty,
	Single,
	Array
}

interface SingleFlags {
	readonly _bits: u8 | u16 | u32;
}

interface ArrayFlags {
	readonly _bits: u32[];
}

export class FlagsType<T extends JFlags> implements ComponentModelType<T> {

	private readonly fields: FlagField[];
	private readonly num32Flags: number;
	private type: [FlagsStorageType, typeof u8 | typeof u16 | typeof u32 | undefined];

	public readonly size: size;
	public readonly alignment: alignment;
	public readonly flatTypes: readonly wasmTypeName[];

	constructor(fields: string[]) {
		this.fields = [];
		for (let i = 0; i < fields.length; i++) {
			this.fields.push(FlagField.create(fields[i], i >>> 5, 1 << (i & 31)));
		}

		const nr = fields.length;
		const size = this.size = FlagsType.size(nr);
		this.type = FlagsType.getType(size);
		this.num32Flags = FlagsType.num32Flags(nr);
		this.alignment = FlagsType.alignment(nr);
		this.flatTypes = FlagsType.flatTypes(nr);
	}

	public create(): T {
		switch (this.type[0]) {
			case FlagsStorageType.Empty:
				return Object.create(null) as T;
			case FlagsStorageType.Single:
				return this.createSingle(0) as T;
			case FlagsStorageType.Array:
				return this.createArray(new Array(this.num32Flags)) as T;
		}
	}

	public load(memory: Memory, ptr: ptr<u8 | u16 | u32 | u32[]>, options: Options): T {
		switch (this.type[0]) {
			case FlagsStorageType.Empty:
				return Object.create(null) as T;
			case FlagsStorageType.Single:
				return this.createSingle(this.type[1]!.load(memory, ptr, options)) as T;
			case FlagsStorageType.Array:
				const bits: u32[] = new Array(this.num32Flags);
				const type = this.type[1]!;
				for (let i = 0; i < this.num32Flags; i++) {
					bits[i] = type.load(memory, ptr, options);
					ptr += type.size;
				}
				return this.createArray(bits) as T;
		}
	}

	public liftFlat(_memory: Memory, values: FlatValuesIter, options: Options): T {
		switch (this.type[0]) {
			case FlagsStorageType.Empty:
				return Object.create(null) as T;
			case FlagsStorageType.Single:
				return this.createSingle(this.type[1]!.liftFlat(_memory, values, options)) as T;
			case FlagsStorageType.Array:
				const bits: i32[] = new Array(this.num32Flags);
				const type = this.type[1]!;
				for (let i = 0; i < this.num32Flags; i++) {
					bits[i] = type.liftFlat(_memory, values, options);
				}
				return this.createArray(bits) as T;
		}
	}

	public alloc(memory: Memory): ptr<u8 | u16 | u32 | u32[]> {
		return memory.alloc(this.size, this.alignment);
	}

	public store(memory: Memory, ptr: ptr<u8 | u16 | u32 | u32[]>, flags: JFlags, options: Options): void {
		switch (this.type[0]) {
			case FlagsStorageType.Empty:
				return;
			case FlagsStorageType.Single:
				this.type[1]!.store(memory, ptr, (flags as unknown as SingleFlags)._bits, options);
				break;
			case FlagsStorageType.Array:
				const type = this.type[1]!;
				for (const flag of (flags as unknown as ArrayFlags)._bits) {
					type.store(memory, ptr, flag, options);
					ptr += type.size;
				}
				break;
		}
	}

	public lowerFlat(result: wasmType[], _memory: Memory, flags: JFlags, options: Options): void {
		switch (this.type[0]) {
			case FlagsStorageType.Empty:
				return;
			case FlagsStorageType.Single:
				this.type[1]!.lowerFlat(result, _memory, (flags as unknown as SingleFlags)._bits, options);
				break;
			case FlagsStorageType.Array:
				const type = this.type[1]!;
				for (const flag of (flags as unknown as ArrayFlags)._bits) {
					type.lowerFlat(result, _memory, flag, options);
				}
				break;
		}
	}

	private createSingle(bits: number): JFlags {
		const result: SingleFlags = { _bits: bits };
		const props = Object.create(null);
		for (const field of this.fields) {
			props[field.name] = {
				get: () => (bits & field.mask) !== 0,
				set: (newVal: boolean) => {
					if (newVal) {
						bits |= field.mask;
					} else {
						bits &= ~field.mask;
					}
				}
			};
		}
		return Object.defineProperties(result as object, props) as JFlags;
	}

	private createArray(bits: u32[]): JFlags {
		const result: ArrayFlags = { _bits: bits };
		const props = Object.create(null);
		for (const field of this.fields) {
			props[field.name] = {
				get: () => (bits[field.index] & field.mask) !== 0,
				set: (newVal: boolean) => {
					if (newVal) {
						bits[field.index] |= field.mask;
					} else {
						bits[field.index] &= ~field.mask;
					}
				}
			};
		}
		return Object.defineProperties(result as object, props) as JFlags;
	}

	private static size(fields: number): size {
		if (fields === 0) {
			return 0;
		} else if (fields <= 8) {
			return 1;
		} else if (fields <= 16) {
			return 2;
		} else {
			return 4 * this.num32Flags(fields);
		}
	}

	private static alignment(fields: number): alignment {
		if (fields <= 8) {
			return 1;
		} else if (fields <= 16) {
			return 2;
		} else {
			return 4;
		}
	}

	private static flatTypes(fields: number): 'i32'[] {
		return new Array(this.num32Flags(fields)).fill('i32');
	}

	private static getType(size: number): [FlagsStorageType, GenericComponentModelType | undefined] {
		switch (size) {
			case 0: return [FlagsStorageType.Empty, undefined];
			case 1: return [FlagsStorageType.Single, u8];
			case 2: return [FlagsStorageType.Single, u16];
			case 4: return [FlagsStorageType.Single, u32];
			default: return [FlagsStorageType.Array, u32];
		}
	}

	private static num32Flags(fields: number): number {
		return Math.ceil(fields / 32);
	}
}

interface VariantCase {
	readonly index: u32;
	readonly type: GenericComponentModelType | undefined;
	readonly wantFlatTypes: wasmTypeName[] | undefined;
}

namespace VariantCase {
	export function create(index: number, type: GenericComponentModelType | undefined): VariantCase {
		return { index, type, wantFlatTypes: type !== undefined ? [] : undefined };
	}
}

export interface JVariantCase {
	readonly case: u32;
	readonly value?: JType | undefined;
}

export class VariantType<T extends JVariantCase, I, V> implements ComponentModelType<T> {

	private readonly cases: VariantCase[];
	private readonly ctor: (caseIndex: I, value: V) => T;
	private readonly discriminantType: GenericComponentModelType;
	private readonly maxCaseAlignment: alignment;

	public readonly size: size;
	public readonly alignment: alignment;
	public readonly flatTypes: readonly wasmTypeName[];

	constructor(variants: (GenericComponentModelType | undefined)[], ctor: (caseIndex: I, value: V) => T) {
		const cases: VariantCase[] = [];
		for (let i = 0; i < variants.length; i++) {
			const type = variants[i];
			cases.push(VariantCase.create(i, type));
		}
		this.cases = cases;
		this.ctor = ctor;

		this.discriminantType = VariantType.discriminantType(cases.length);
		this.maxCaseAlignment = VariantType.maxCaseAlignment(cases);
		this.size = VariantType.size(this.discriminantType, cases);
		this.alignment = VariantType.alignment(this.discriminantType, cases);
		this.flatTypes = VariantType.flatTypes(this.discriminantType, cases);
	}

	public load(memory: Memory, ptr: ptr, options: Options): T {
		const caseIndex = this.discriminantType.load(memory, ptr, options);
		ptr += this.discriminantType.size;
		const caseVariant = this.cases[caseIndex];
		if (caseVariant.type === undefined) {
			return this.ctor(caseIndex, undefined as any);
		} else {
			ptr = align(ptr, this.maxCaseAlignment);
			const value = caseVariant.type.load(memory, ptr, options);
			return this.ctor(caseIndex, value);
		}
	}

	public liftFlat(memory: Memory, values: FlatValuesIter, options: Options): T {
		const caseIndex = this.discriminantType.liftFlat(memory, values, options);
		const caseVariant = this.cases[caseIndex];
		if (caseVariant.type === undefined) {
			return this.ctor(caseIndex, undefined as any);
		} else {
			// The first flat type is the discriminant type. So skip it.
			const iter = new CoerceValueIter(values, this.flatTypes.slice(1), caseVariant.wantFlatTypes!);
			const value = caseVariant.type.liftFlat(memory, iter, options);
			return this.ctor(caseIndex, value);
		}
	}

	public alloc(memory: Memory): ptr {
		return memory.alloc(this.alignment, this.size);
	}

	public store(memory: Memory, ptr: ptr, value: T, options: Options): void {
		this.discriminantType.store(memory, ptr, value.case, options);
		ptr += this.discriminantType.size;
		const c = this.cases[value.case];
		if (c.type !== undefined && value !== undefined) {
			ptr = align(ptr, this.maxCaseAlignment);
			c.type.store(memory, ptr, value, options);
		}
	}

	public lowerFlat(result: wasmType[], memory: Memory, value: T, options: Options): void {
		this.discriminantType.lowerFlat(result, memory, value.case, options);
		const c = this.cases[value.case];
		if (c.type !== undefined && value !== undefined) {
			const payload: wasmType[] = [];
			c.type.lowerFlat(payload, memory, value, options);
			// First one is the discriminant type. So skip it.
			const wantTypes = this.flatTypes.slice(1);
			const haveTypes = c.wantFlatTypes!;
			if (wantTypes.length !== haveTypes.length || payload.length !== haveTypes.length) {
				throw new ComponentModelError('Mismatched flat types');
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

	private static size(discriminantType: GenericComponentModelType, cases: VariantCase[]): size {
		let result = discriminantType.size;
		result = align(result, this.maxCaseAlignment(cases));
		return result + this.maxCaseSize(cases);
	}

	private static alignment(discriminantType: GenericComponentModelType, cases: VariantCase[]): alignment {
		return Math.max(discriminantType.alignment, this.maxCaseAlignment(cases)) as alignment;
	}

	private static flatTypes(discriminantType: GenericComponentModelType, cases: VariantCase[]): readonly wasmTypeName[] {
		const flat: wasmTypeName[] = [];
		for (const c of cases) {
			if (c.type === undefined) {
				continue;
			}
			const flatTypes = c.type.flatTypes;
			for (let i = 0; i < flatTypes.length; i++) {
				const want = flatTypes[i];
				if (i < flat.length) {
					const use = this.joinFlatType(flat[i], want);
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

	private static discriminantType(cases: number): GenericComponentModelType {
		switch (Math.ceil(Math.log2(cases) / 8)) {
			case 0: return u8;
			case 1: return u8;
			case 2: return u16;
			case 3: return u32;
		}
		throw new ComponentModelError(`Too many cases: ${cases}`);
	}

	private static maxCaseAlignment(cases: VariantCase[]): alignment {
		let result: alignment = 1;
		for (const c of cases) {
			if (c.type !== undefined) {
				result = Math.max(result, c.type.alignment) as alignment;
			}
		}
		return result;
	}

	private static maxCaseSize(cases: VariantCase[]): size {
		let result = 0;
		for (const c of cases) {
			if (c.type !== undefined) {
				result = Math.max(result, c.type.size);
			}
		}
		return result;
	}

	private static joinFlatType(a: wasmTypeName, b:wasmTypeName) : wasmTypeName {
		if (a === b) {
			return a;
		}
		if ((a === 'i32' && b === 'f32') || (a === 'f32' && b === 'i32')) {
			return 'i32';
		}
		return 'i64';
	}
}

export type JEnum = number;

export class Enumeration<T extends JEnum> implements ComponentModelType<T> {

	private readonly discriminantType: ComponentModelType<u8> | ComponentModelType<u16> | ComponentModelType<u32>;

	private readonly cases: number;
	public readonly size: size;
	public readonly alignment: alignment;
	public readonly flatTypes: readonly wasmTypeName[];

	constructor(cases: number) {
		this.cases = cases;
		this.discriminantType = Enumeration.discriminantType(cases);
		this.size = this.discriminantType.size;
		this.alignment = this.discriminantType.alignment;
		this.flatTypes = this.discriminantType.flatTypes;
	}

	public load(memory: Memory, ptr: ptr, options: Options): T {
		return this.assertRange(this.discriminantType.load(memory, ptr, options)) as T;
	}
	public liftFlat(memory: Memory, values: FlatValuesIter, options: Options): T {
		return this.assertRange(this.discriminantType.liftFlat(memory, values, options)) as T;
	}
	public alloc(memory: Memory): ptr {
		return memory.alloc(this.alignment, this.size);
	}
	public store(memory: Memory, ptr: ptr, value: T, options: Options): void {
		this.discriminantType.store(memory, ptr, value, options);
	}
	public lowerFlat(result: wasmType[], memory: Memory, value: T, options: Options): void {
		this. discriminantType.lowerFlat(result, memory, value, options);
	}

	private assertRange(value: number): number {
		if (value < 0 || value > this.cases) {
			throw new ComponentModelError('Enumeration value out of range');
		}
		return value;
	}

	private static discriminantType(cases: number): ComponentModelType<u8> | ComponentModelType<u16> | ComponentModelType<u32> {
		switch (Math.ceil(Math.log2(cases) / 8)) {
			case 0: return u8;
			case 1: return u8;
			case 2: return u16;
			case 3: return u32;
		}
		throw new ComponentModelError(`Too many cases: ${cases}`);
	}
}


export namespace Option {
	export const none = 0 as const;
	export const some = 1 as const;

	export type _ct = typeof none | typeof some;
	export type _vt<T extends JType> = undefined | T;

	type _common<T extends JType> = Omit<OptionImpl<T>, 'case' | 'value'>;

	export type none<T extends JType> = { readonly case: typeof none } & _common<T>;
	export type some<T extends JType> = { readonly case: typeof some; readonly value: T } & _common<T>;

	export function _ctor<T extends JType>(c: _ct, v: _vt<T>): Option<T> {
		return new OptionImpl(c, v) as Option<T>;
	}

	export function _none<T extends JType>(): none<T> {
		return new OptionImpl<T>(none, undefined) as none<T>;
	}

	export function _some<T extends JType>(value: T): some<T> {
		return new OptionImpl<T>(some, value ) as some<T>;
	}

	class OptionImpl<T extends JType> {
		private readonly _case: _ct;
		private readonly _value?: _vt<T>;

		constructor(c: typeof Option.none | typeof Option.some, value: undefined | T) {
			this._case = c;
			this._value = value;
		}

		get case():  typeof Option.none | typeof Option.some {
			return this._case;
		}

		get value(): undefined | T {
			return this._value;
		}

		public none(): this is none<T> {
			return this._case === Option.none;
		}

		public some(): this is some<T> {
			return this._case === Option.some;
		}

	}
}
export type Option<T extends JType> = Option.none<T> | Option.some<T>;

export namespace Result {
	export const ok = 0 as const;
	export const error = 1 as const;

	export type _ct = typeof ok | typeof error;
	export type _vt<O extends JType , E extends JType> = O | E;

	type _common<O extends JType , E extends JType> = Omit<ResultImpl<O, E>, 'case' | 'value'>;

	export type ok<O extends JType , E extends JType> = { readonly case: typeof ok; readonly value: O } & _common<O, E>;
	export type error<O extends JType , E extends JType> = { readonly case: typeof error; readonly value: E } & _common<O, E>;

	export function _ctor<O extends JType , E extends JType>(c: _ct, v: _vt<O, E>): Result<O, E> {
		return new ResultImpl<O, E>(c, v) as Result<O, E>;
	}

	export function _ok<O extends JType , E extends JType>(value: O): ok<O, E> {
		return new ResultImpl<O, E>(ok, value) as ok<O, E>;
	}

	export function _error<O extends JType , E extends JType>(value: E): error<O, E> {
		return new ResultImpl<O, E>(error, value ) as error<O, E>;
	}

	export class ResultImpl<O extends JType , E extends JType> implements JVariantCase {

		private readonly _case: _ct;
		private readonly _value: _vt<O, E>;

		constructor(c: _ct, value: _vt<O, E>) {
			this._case = c;
			this._value = value;
		}

		get case(): _ct {
			return this._case;
		}

		get value(): _vt<O, E> {
			return this._value;
		}

		public ok(): this is ok<O, E> {
			return this._case === ok;
		}

		public error(): this is error<O, E> {
			return this._case === error;
		}
	}
}
export type Result<O extends JType , E extends JType> = Result.ok<O, E> | Result.error<O, E>;

export type JType = number | bigint | string | boolean | JRecord | JVariantCase | JFlags | JTuple | JEnum | Option<any> | Result<any, any>;

export interface FunctionParameter {
	name: string;
	type: JType;
}

export class FunctionSignature {

	public readonly name: string;
	public readonly params: FunctionParameter[];
	public readonly returnValue: JType | undefined;

	constructor(name: string, params: FunctionParameter[], returnValue?: JType) {
		this.name = name;
		this.params = params;
		this.returnValue = returnValue;
	}
}
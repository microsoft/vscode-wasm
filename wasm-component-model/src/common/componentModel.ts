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

type ModuleFunction = (self: borrow<any>, ...args: any[]) => any;
type RemoveFirstArg<F extends ModuleFunction> = F extends (self: borrow<any>, ...args: infer A) => infer R ? (...args: A) => R : never;
export type Module2Interface<T> = {
	[F in keyof T as Exclude<F, 'constructor'>]: T[F] extends ModuleFunction ? RemoveFirstArg<T[F]> : never;
};

export class Handle {

	public readonly value: number;

	constructor(value: number) {
		this.value = value;
	}
}

export class ResourceManager<T extends JInterface = JInterface> {

	public readonly key: string;

	private readonly h2r: Map<ResourceHandle, T | undefined>;
	private readonly r2h: Map<T, ResourceHandle>;
	private handleCounter: ResourceHandle;

	constructor(key: string) {
		this.key = key;
		this.h2r = new Map();
		this.r2h = new Map();
		this.handleCounter = 1;
	}

	public register(value: T): ResourceHandle {
		if (value.__handle !== undefined) {
			return value.__handle;
		}
		const handle = this.handleCounter++;
		this.h2r.set(handle, value);
		this.r2h.set(value, handle);
		value.__handle = handle;
		return handle;
	}

	public getResource(resource: ResourceHandle): T {
		const value = this.h2r.get(resource);
		if (value === undefined) {
			throw new ComponentModelError(`Unknown resource handle ${resource}`);
		}
		return value;
	}

	public getHandle(value: T): ResourceHandle {
		const handle = this.r2h.get(value);
		if (handle === undefined) {
			throw new ComponentModelError(`Unknown resource ${JSON.stringify(value, undefined, 0)}`);
		}
		return handle;
	}

	public managesHandle(resource: ResourceHandle): boolean {
		return this.h2r.has(resource);
	}

	public managesResource(value: T): boolean {
		return this.r2h.has(value);
	}

	public unregister(resource: ResourceHandle): void {
		this.h2r.delete(resource);
	}

	public reserve(): ResourceHandle {
		const result = this.handleCounter++;
		this.h2r.set(result, undefined);
		return result;
	}

	public use(resource: ResourceHandle, value: T): void {
		if (!this.h2r.has(resource)) {
			throw new ComponentModelError(`Resource handle ${resource} is not reserved`);
		}
		if (this.h2r.get(resource) !== undefined) {
			throw new ComponentModelError(`Resource handle ${resource} is already in use`);
		}
		this.h2r.set(resource, value);
	}
}

export class ResourceManagers {
	private readonly managers: Map<string, ResourceManager<any>>;

	constructor() {
		this.managers = new Map();
	}

	public get(key: string): ResourceManager<any> {
		let manager = this.managers.get(key);
		if (manager === undefined) {
			manager = new ResourceManager(key);
			this.managers.set(key, manager);
		}
		return manager;
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
	alloc: (align: Alignment, size: size) => size;
	realloc: (ptr: ptr, oldSize: size, align: Alignment, newSize: size) => size;
}

export type encodings = 'utf-8' | 'utf-16' | 'latin1+utf-16';
export interface Options {
	encoding: encodings;
	keepOption?: boolean;
}

export enum Alignment {
	byte = 1,
	halfWord = 2,
	word = 4,
	doubleWord = 8
}
function align(ptr: ptr, alignment: Alignment): size {
	return Math.ceil(ptr / alignment) * alignment;
}

export type i32 = number;
export type i64 = bigint;
export type f32 = number;
export type f64 = number;
export type wasmType = i32 | i64 | f32 | f64;
export enum WasmTypeKind {
	i32 = 'i32',
	i64 = 'i64',
	f32 = 'f32',
	f64 = 'f64'
}
export namespace WasmTypeKind {
	export function byteLength(type: WasmTypeKind): number {
		switch (type) {
			case WasmTypeKind.i32:
			case WasmTypeKind.f32:
				return 4;
			case WasmTypeKind.i64:
			case WasmTypeKind.f64:
				return 8;
			default:
				throw new ComponentModelError(`Unknown type ${type}`);
		}
	}
}

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

	constructor(private readonly values: FlatValuesIter, private haveFlatTypes: readonly WasmTypeKind[], private wantFlatTypes: readonly WasmTypeKind[]) {
		if (haveFlatTypes.length < wantFlatTypes.length) {
			throw new ComponentModelError(`Invalid coercion: have ${haveFlatTypes.length} values, want ${wantFlatTypes.length} values`);
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

export enum ComponentModelTypeKind {
	bool = 'bool',
	u8 = 'u8',
	u16 = 'u16',
	u32 = 'u32',
	u64 = 'u64',
	s8 = 's8',
	s16 = 's16',
	s32 = 's32',
	s64 = 's64',
	float32 = 'float32',
	float64 = 'float64',
	char = 'char',
	string = 'string',
	list = 'list',
	record = 'record',
	tuple = 'tuple',
	variant = 'variant',
	enum = 'enum',
	flags = 'flags',
	option = 'option',
	result = 'result',
	resource = 'resource',
	resourceHandle = 'resourceHandle',
	borrow = 'borrow',
	own = 'own'
}

export interface ComponentModelContext {
	readonly options: Options;
	readonly managers: ResourceManagers;
}

export interface ComponentModelType<J> {
	readonly kind : ComponentModelTypeKind;
	readonly size: number;
	readonly alignment: Alignment;
	readonly flatTypes: ReadonlyArray<WasmTypeKind>;
	// Loads an object directly from the memory buffer
	load(memory: Memory, ptr: ptr, context: ComponentModelContext): J;
	// Loads an object from a flattened signature
	liftFlat(memory: Memory, values: FlatValuesIter, context: ComponentModelContext): J;
	// Allocates a new object in the memory buffer
	alloc(memory: Memory): ptr;
	// Stores an object directly into the memory buffer
	store(memory: Memory, ptr: ptr, value: J, context: ComponentModelContext): void;
	// Stores an object into a flattened signature
	lowerFlat(result: wasmType[], memory: Memory, value: J, context: ComponentModelContext): void;
	// copy a list of flattened param values from one memory to another
	copy(dest: Memory, dest_ptr: ptr<u8>, src: Memory, src_ptr: ptr<u8>, context: ComponentModelContext): void;
}
export type GenericComponentModelType = ComponentModelType<any>;

export type bool = number;
export const bool: ComponentModelType<boolean> = {
	kind: ComponentModelTypeKind.bool,
	size: 1,
	alignment: 1,
	flatTypes: [WasmTypeKind.i32],
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
		return memory.alloc(bool.alignment, bool.size);
	},
	store(memory, ptr: ptr<u8>, value: boolean): void {
		memory.view.setUint8(ptr, value ? 1 : 0);
	},
	lowerFlat(result, _memory, value: boolean): void {
		result.push(value ? 1 : 0);
	},
	copy(dest: Memory, dest_ptr: ptr<u8>, src: Memory, src_ptr: ptr<u8>): void {
		dest.raw.set(src.raw.subarray(src_ptr, src_ptr + bool.size), dest_ptr);
	}
};

export type u8 = number;
namespace $u8 {
	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.u8;
	export const size = 1;
	export const alignment: Alignment = Alignment.byte;
	export const flatTypes: readonly WasmTypeKind[] = [WasmTypeKind.i32];

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
		return memory.alloc(alignment, size);
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

	export function copy(dest: Memory, dest_ptr: ptr<u8>, src: Memory, src_ptr: ptr<u8>): void {
		dest.raw.set(src.raw.subarray(src_ptr, src_ptr + $u8.size), dest_ptr);
	}
}
export const u8:ComponentModelType<number> = $u8;

export type u16 = number;
namespace $u16 {
	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.u16;
	export const size = 2;
	export const alignment: Alignment = Alignment.halfWord;
	export const flatTypes: readonly WasmTypeKind[] = [WasmTypeKind.i32];

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
		return memory.alloc(alignment, size);
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

	export function copy(dest: Memory, dest_ptr: ptr<u8>, src: Memory, src_ptr: ptr<u8>): void {
		dest.raw.set(src.raw.subarray(src_ptr, src_ptr + $u16.size), dest_ptr);
	}
}
export const u16: ComponentModelType<number> = $u16;

export type u32 = number;
namespace $u32 {
	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.u32;
	export const size = 4;
	export const alignment: Alignment = Alignment.word;
	export const flatTypes: readonly WasmTypeKind[] = [WasmTypeKind.i32];

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
		return memory.alloc(alignment, size);
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

	export function copy(dest: Memory, dest_ptr: ptr<u8>, src: Memory, src_ptr: ptr<u8>): void {
		dest.raw.set(src.raw.subarray(src_ptr, src_ptr + $u32.size), dest_ptr);
	}
}
export const u32: ComponentModelType<number> = $u32;

export type u64 = bigint;
namespace $u64 {
	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.u64;
	export const size = 8;
	export const alignment: Alignment = Alignment.doubleWord;
	export const flatTypes: readonly WasmTypeKind[] = [WasmTypeKind.i64];

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
		return memory.alloc(alignment, size);
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

	export function copy(dest: Memory, dest_ptr: ptr<u8>, src: Memory, src_ptr: ptr<u8>): void {
		dest.raw.set(src.raw.subarray(src_ptr, src_ptr + $u64.size), dest_ptr);
	}
}
export const u64: ComponentModelType<bigint> = $u64;

export type s8 = number;
namespace $s8 {
	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.s8;
	export const size = 1;
	export const alignment: Alignment = Alignment.byte;
	export const flatTypes: readonly WasmTypeKind[] = [WasmTypeKind.i32];

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
		return memory.alloc(alignment, size);
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

	export function copy(dest: Memory, dest_ptr: ptr<u8>, src: Memory, src_ptr: ptr<u8>): void {
		dest.raw.set(src.raw.subarray(src_ptr, src_ptr + $s8.size), dest_ptr);
	}
}
export const s8: ComponentModelType<number> = $s8;

export type s16 = number;
namespace $s16 {
	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.s16;
	export const size = 2;
	export const alignment: Alignment = Alignment.halfWord;
	export const flatTypes: readonly WasmTypeKind[] = [WasmTypeKind.i32];

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
		return memory.alloc(alignment, size);
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

	export function copy(dest: Memory, dest_ptr: ptr<u8>, src: Memory, src_ptr: ptr<u8>): void {
		dest.raw.set(src.raw.subarray(src_ptr, src_ptr + $s16.size), dest_ptr);
	}
}
export const s16: ComponentModelType<number> = $s16;

export type s32 = number;
namespace $s32 {
	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.s32;
	export const size = 4;
	export const alignment: Alignment = Alignment.word;
	export const flatTypes: readonly WasmTypeKind[] = [WasmTypeKind.i32];

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
		return memory.alloc(alignment, size);
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

	export function copy(dest: Memory, dest_ptr: ptr<u8>, src: Memory, src_ptr: ptr<u8>): void {
		dest.raw.set(src.raw.subarray(src_ptr, src_ptr + $s32.size), dest_ptr);
	}
}
export const s32: ComponentModelType<number> = $s32;

export type s64 = bigint;
namespace $s64 {
	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.s64;
	export const size = 8;
	export const alignment: Alignment = Alignment.doubleWord;
	export const flatTypes: readonly WasmTypeKind[] = [WasmTypeKind.i64];

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
		return memory.alloc(alignment, size);
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

	export function copy(dest: Memory, dest_ptr: ptr<u8>, src: Memory, src_ptr: ptr<u8>): void {
		dest.raw.set(src.raw.subarray(src_ptr, src_ptr + $s64.size), dest_ptr);
	}
}
export const s64: ComponentModelType<bigint> = $s64;

export type float32 = number;
namespace $float32 {
	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.float32;
	export const size = 4;
	export const alignment:Alignment = Alignment.word;
	export const flatTypes: readonly WasmTypeKind[] = [WasmTypeKind.f32];

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
		return memory.alloc(alignment, size);
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

	export function copy(dest: Memory, dest_ptr: ptr<u8>, src: Memory, src_ptr: ptr<u8>): void {
		dest.raw.set(src.raw.subarray(src_ptr, src_ptr + $float32.size), dest_ptr);
	}
}
export const float32: ComponentModelType<number> = $float32;

export type float64 = number;
namespace $float64 {
	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.float64;
	export const size = 8;
	export const alignment: Alignment = Alignment.doubleWord;
	export const flatTypes: readonly WasmTypeKind[] = [WasmTypeKind.f64];

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
		return memory.alloc(alignment, size);
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

	export function copy(dest: Memory, dest_ptr: ptr<u8>, src: Memory, src_ptr: ptr<u8>): void {
		dest.raw.set(src.raw.subarray(src_ptr, src_ptr + $float64.size), dest_ptr);
	}
}
export const float64: ComponentModelType<number> = $float64;

export type byte = u8;
export const byte: ComponentModelType<byte> = {
	kind: u8.kind,
	size: u8.size,
	alignment: u8.alignment,
	flatTypes: u8.flatTypes,

	load: u8.load,
	liftFlat: u8.liftFlat,
	alloc: u8.alloc,
	store: u8.store,
	lowerFlat: u8.lowerFlat,
	copy: u8.copy
};

export type size = u32;
export const size: ComponentModelType<size> = {
	kind: u32.kind,
	size: u32.size,
	alignment: u32.alignment,
	flatTypes: u32.flatTypes,

	load: u32.load,
	liftFlat: u32.liftFlat,
	alloc: u32.alloc,
	store: u32.store,
	lowerFlat: u32.lowerFlat,
	copy: u32.copy
};

export type ptr<_type = ArrayBuffer> = u32;
export const ptr: ComponentModelType<size> = {
	kind: u32.kind,
	size: u32.size,
	alignment: u32.alignment,
	flatTypes: u32.flatTypes,

	load: u32.load,
	liftFlat: u32.liftFlat,
	alloc: u32.alloc,
	store: u32.store,
	lowerFlat: u32.lowerFlat,
	copy: u32.copy
};
namespace $wchar {
	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.char;
	export const size = 4;
	export const alignment: Alignment = Alignment.word;
	export const flatTypes: readonly WasmTypeKind[] = [WasmTypeKind.i32];

	export function load(memory: Memory, ptr: ptr, context: ComponentModelContext): string {
		return fromCodePoint(u32.load(memory, ptr, context));
	}

	export function liftFlat(memory: Memory, values: FlatValuesIter, context: ComponentModelContext): string {
		return fromCodePoint(u32.liftFlat(memory, values, context));
	}

	export function alloc(memory: Memory): ptr {
		return u32.alloc(memory);
	}

	export function store(memory: Memory, ptr: ptr, value: string, context: ComponentModelContext): void {
		u32.store(memory, ptr, asCodePoint(value), context);
	}

	export function lowerFlat(result: wasmType[], memory: Memory, value: string, context: ComponentModelContext): void {
		u32.lowerFlat(result, memory, asCodePoint(value), context);
	}

	export function copy(dest: Memory, dest_ptr: ptr<u8>, src: Memory, src_ptr: ptr<u8>): void {
		dest.raw.set(src.raw.subarray(src_ptr, src_ptr + $wchar.size), dest_ptr);
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

	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.string;
	export const size = 8;
	export const alignment: Alignment = Alignment.word;
	export const flatTypes: readonly WasmTypeKind[] = [WasmTypeKind.i32, WasmTypeKind.i32];

	export function load(memory: Memory, ptr: ptr, context: ComponentModelContext): string {
		const view = memory.view;
		const dataPtr: ptr =  view.getUint32(ptr + offsets.data);
		const codeUnits: u32 = view.getUint32(ptr + offsets.codeUnits);
		return loadFromRange(memory, dataPtr, codeUnits, context.options);
	}

	export function liftFlat(memory: Memory, values: FlatValuesIter, context: ComponentModelContext): string {
		const dataPtr: ptr = values.next().value as size;
		const codeUnits: u32 = values.next().value as u32;
		return loadFromRange(memory, dataPtr, codeUnits, context.options);
	}

	export function alloc(memory: Memory): ptr {
		return memory.alloc(alignment, size);
	}

	export function store(memory: Memory, ptr: ptr, str: string, context: ComponentModelContext): void {
		const [ data, codeUnits ] = storeIntoRange(memory, str, context.options);
		const view = memory.view;
		view.setUint32(ptr + offsets.data, data, true);
		view.setUint32(ptr + offsets.codeUnits, codeUnits, true);
	}

	export function lowerFlat(result: wasmType[], memory: Memory, str: string, context: ComponentModelContext): void {
		result.push(...storeIntoRange(memory, str, context.options));
	}

	export function loadFlat(result: wasmType[], memory: Memory, ptr: ptr): void {
		result.push(memory.view.getUint32(ptr + offsets.data, true));
		result.push(memory.view.getUint32(ptr + offsets.codeUnits, true));
	}

	export function copy(dest: Memory, dest_ptr: ptr<u8>, src: Memory, src_ptr: ptr<u8>, context: ComponentModelContext): void {
		const data = src.view.getUint32(src_ptr + offsets.data, true);
		const codeUnits = src.view.getUint32(src_ptr + offsets.codeUnits, true);
		const [alignment, byteLength] = getAlignmentAndByteLength(codeUnits, context.options);
		const destData = dest.alloc(alignment, byteLength);
		dest.raw.set(src.raw.subarray(data, data + byteLength), destData);
		dest.view.setUint32(dest_ptr + offsets.data, destData, true);
		dest.view.setUint32(dest_ptr + offsets.codeUnits, codeUnits, true);
	}

	export function getAlignmentAndByteLength(codeUnits: u32, options: Options): [Alignment, number] {
		const encoding = options.encoding;
		if (encoding === 'latin1+utf-16') {
			throw new Error('latin1+utf-16 encoding not yet supported');
		}
		if (encoding === 'utf-8') {
			return [u8.alignment, codeUnits];
		} else if (encoding === 'utf-16') {
			return [u16.alignment, codeUnits * 2];
		} else {
			throw new Error('Unsupported encoding');
		}
	}

	function loadFromRange(memory: Memory, data: size, codeUnits: u32, options: Options): string {
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

	function storeIntoRange(memory: Memory, str: string, options: Options): [size, u32] {
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
			const dataPtr = memory.alloc(u16.alignment, str.length * 2);
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
export const wstring: ComponentModelType<string> & { getAlignmentAndByteLength: typeof $wstring.getAlignmentAndByteLength } = $wstring;

export type JArray = JType[];
export class ListType<T> implements ComponentModelType<T[]> {

	private static readonly offsets = {
		data: 0,
		length: 4
	};

	public readonly elementType: ComponentModelType<T>;

	public readonly kind: ComponentModelTypeKind;
	public readonly size: size;
	public readonly alignment: Alignment;
	public readonly flatTypes: readonly WasmTypeKind[];

	constructor(elementType: ComponentModelType<T>) {
		this.elementType = elementType;
		this.kind = ComponentModelTypeKind.list;
		this.size = 8;
		this.alignment = 4;
		this.flatTypes = [WasmTypeKind.i32, WasmTypeKind.i32];
	}

	public load(memory: Memory, ptr: ptr, context: ComponentModelContext): T[] {
		const view = memory.view;
		const offsets = ListType.offsets;
		const dataPtr: ptr =  view.getUint32(ptr + offsets.data);
		const codeUnits: u32 = view.getUint32(ptr + offsets.length);
		return this.loadFromRange(memory, dataPtr, codeUnits, context);
	}

	public liftFlat(memory: Memory, values: FlatValuesIter, context: ComponentModelContext): T[] {
		const dataPtr: ptr = values.next().value as size;
		const length: u32 = values.next().value as u32;
		return this.loadFromRange(memory, dataPtr, length, context);
	}

	public alloc(memory: Memory): ptr {
		return memory.alloc(this.alignment, this.size);
	}

	public store(memory: Memory, ptr: ptr, values: T[], context: ComponentModelContext): void {
		const [ data, length ] = this.storeIntoRange(memory, values, context);
		const view = memory.view;
		const offsets = ListType.offsets;
		view.setUint32(ptr + offsets.data, data, true);
		view.setUint32(ptr + offsets.length, length, true);
	}

	public lowerFlat(result: wasmType[], memory: Memory, values: T[], context: ComponentModelContext): void {
		result.push(...this.storeIntoRange(memory, values, context));
	}

	public loadFlat(result: wasmType[], memory: Memory, ptr: ptr): void {
		const offsets = ListType.offsets;
		result.push(memory.view.getUint32(ptr + offsets.data, true));
		result.push(memory.view.getUint32(ptr + offsets.length, true));
	}

	public copy(dest: Memory, dest_ptr: ptr<u8>, src: Memory, src_ptr: ptr<u8>): void {
		const offsets = ListType.offsets;
		const data = src.view.getUint32(src_ptr + offsets.data, true);
		const length = src.view.getUint32(src_ptr + offsets.length, true);
		const byteLength = length * this.elementType.size;
		const destData = dest.alloc(this.alignment, byteLength);
		dest.raw.set(src.raw.subarray(data, data + byteLength), destData);
		dest.view.setUint32(dest_ptr + offsets.data, destData, true);
		dest.view.setUint32(dest_ptr + offsets.length, length, true);
	}

	private loadFromRange(memory: Memory, data: size, length: u32, context: ComponentModelContext): T[] {
		const result: T[] = [];
		let offset = 0;
		for (let i = 0; i < length; i++) {
			result.push(this.elementType.load(memory, data + offset, context));
			offset += this.elementType.size;
		}
		return result;
	}

	private storeIntoRange(memory: Memory, values: T[], context: ComponentModelContext): [size, u32] {
		const bytes = this.elementType.size * values.length;
		const ptr = memory.alloc(this.elementType.alignment, bytes);
		let indexPtr = ptr;
		for (const item of values) {
			this.elementType.store(memory, indexPtr, item, context);
			indexPtr += this.elementType.size;
		}
		return [ptr, values.length];
	}
}

abstract class TypeArrayType<T> implements ComponentModelType<T> {

	private static readonly offsets = {
		data: 0,
		length: 4
	};

	public readonly kind: ComponentModelTypeKind;
	public readonly size: size;
	public readonly alignment: Alignment;
	public readonly flatTypes: readonly WasmTypeKind[];

	constructor() {
		this.kind = ComponentModelTypeKind.list;
		this.size = 8;
		this.alignment = 4;
		this.flatTypes = [WasmTypeKind.i32, WasmTypeKind.i32];
	}

	public load(memory: Memory, ptr: ptr, context: ComponentModelContext): T {
		const view = memory.view;
		const offsets = TypeArrayType.offsets;
		const dataPtr: ptr =  view.getUint32(ptr + offsets.data);
		const length: u32 = view.getUint32(ptr + offsets.length);
		return this.loadFromRange(memory, dataPtr, length, context.options);
	}

	public liftFlat(memory: Memory, values: FlatValuesIter, context: ComponentModelContext): T {
		const dataPtr: ptr = values.next().value as size;
		const length: u32 = values.next().value as u32;
		return this.loadFromRange(memory, dataPtr, length, context.options);
	}

	public alloc(memory: Memory): ptr {
		return memory.alloc(this.alignment, this.size);
	}

	public store(memory: Memory, ptr: ptr, value: T, context: ComponentModelContext): void {
		const [ data, length ] = this.storeIntoRange(memory, value, context.options);
		const view = memory.view;
		const offsets = TypeArrayType.offsets;
		view.setUint32(ptr + offsets.data, data, true);
		view.setUint32(ptr + offsets.length, length, true);
	}

	public lowerFlat(result: wasmType[], memory: Memory, value: T, context: ComponentModelContext): void {
		result.push(...this.storeIntoRange(memory, value, context.options));
	}

	public loadFlat(result: wasmType[], memory: Memory, ptr: ptr): void {
		const offsets = TypeArrayType.offsets;
		result.push(memory.view.getUint32(ptr + offsets.data, true));
		result.push(memory.view.getUint32(ptr + offsets.length, true));
	}

	public copy(dest: Memory, dest_ptr: ptr<u8>, src: Memory, src_ptr: ptr<u8>): void {
		const offsets = TypeArrayType.offsets;
		const data = src.view.getUint32(src_ptr + offsets.data, true);
		const length = src.view.getUint32(src_ptr + offsets.length, true);
		const destData = this.copyArray(dest, src, data, length);
		dest.view.setUint32(dest_ptr + offsets.data, destData, true);
		dest.view.setUint32(dest_ptr + offsets.length, length, true);
	}

	protected abstract loadFromRange(memory: Memory, data: ptr, length: u32, options: Options): T;
	protected abstract storeIntoRange(memory: Memory, value: T, options: Options): [ptr, u32];
	protected abstract copyArray(dest: Memory, src: Memory, src_ptr: ptr<u8>, length: u32): ptr;

}

export class Int8ArrayType extends TypeArrayType<Int8Array> {
	protected loadFromRange(memory: Memory, data: ptr, length: u32): Int8Array {
		return new Int8Array(memory.buffer, data, length);
	}
	protected storeIntoRange(memory: Memory, value: Int8Array): [ptr, u32] {
		const ptr = memory.alloc(s8.alignment, value.byteLength);
		const target = new Int8Array(memory.buffer, ptr, value.length);
		target.set(value);
		return [ptr, target.length];
	}
	protected copyArray(dest: Memory, src: Memory, src_ptr: ptr<u8>, length: u32): ptr {
		const dest_ptr = dest.alloc(s8.alignment, length * Int8Array.BYTES_PER_ELEMENT);
		dest.raw.set(src.raw.subarray(src_ptr, src_ptr + length), dest_ptr);
		return dest_ptr;
	}
}

export class Int16ArrayType extends TypeArrayType<Int16Array> {
	protected loadFromRange(memory: Memory, data: size, length: u32): Int16Array {
		return new Int16Array(memory.buffer, data, length);
	}
	protected storeIntoRange(memory: Memory, value: Int16Array): [size, u32] {
		const ptr = memory.alloc(s16.alignment, value.byteLength);
		const target = new Int16Array(memory.buffer, ptr, value.length);
		target.set(value);
		return [ptr, target.length];
	}
	protected copyArray(dest: Memory, src: Memory, src_ptr: number, length: number): number {
		const dest_ptr = dest.alloc(s16.alignment, length * Int16Array.BYTES_PER_ELEMENT);
		dest.raw.set(src.raw.subarray(src_ptr, src_ptr + length), dest_ptr);
		return dest_ptr;
	}
}

export class Int32ArrayType extends TypeArrayType<Int32Array> {
	protected loadFromRange(memory: Memory, data: size, length: u32): Int32Array {
		return new Int32Array(memory.buffer, data, length);
	}
	protected storeIntoRange(memory: Memory, value: Int32Array): [size, u32] {
		const ptr = memory.alloc(s32.alignment, value.byteLength);
		const target = new Int32Array(memory.buffer, ptr, value.length);
		target.set(value);
		return [ptr, target.length];
	}
	protected copyArray(dest: Memory, src: Memory, src_ptr: number, length: number): number {
		const dest_ptr = dest.alloc(s32.alignment, length * Int32Array.BYTES_PER_ELEMENT);
		dest.raw.set(src.raw.subarray(src_ptr, src_ptr + length), dest_ptr);
		return dest_ptr;
	}
}

export class BigInt64ArrayType extends TypeArrayType<BigInt64Array> {
	protected loadFromRange(memory: Memory, data: size, length: u32): BigInt64Array {
		return new BigInt64Array(memory.buffer, data, length);
	}
	protected storeIntoRange(memory: Memory, value: BigInt64Array): [size, u32] {
		const ptr = memory.alloc(s64.alignment, value.byteLength);
		const target = new BigInt64Array(memory.buffer, ptr, value.length);
		target.set(value);
		return [ptr, target.length];
	}
	protected copyArray(dest: Memory, src: Memory, src_ptr: number, length: number): number {
		const dest_ptr = dest.alloc(s64.alignment, length * BigInt64Array.BYTES_PER_ELEMENT);
		dest.raw.set(src.raw.subarray(src_ptr, src_ptr + length), dest_ptr);
		return dest_ptr;
	}
}

export class Uint8ArrayType extends TypeArrayType<Uint8Array> {
	protected loadFromRange(memory: Memory, data: size, length: u32): Uint8Array {
		return new Uint8Array(memory.buffer, data, length);
	}
	protected storeIntoRange(memory: Memory, value: Uint8Array): [size, u32] {
		const ptr = memory.alloc(u8.alignment, value.byteLength);
		const target = new Uint8Array(memory.buffer, ptr, value.length);
		target.set(value);
		return [ptr, target.length];
	}
	protected copyArray(dest: Memory, src: Memory, src_ptr: number, length: number): number {
		const dest_ptr = dest.alloc(u8.alignment, length * Uint8Array.BYTES_PER_ELEMENT);
		dest.raw.set(src.raw.subarray(src_ptr, src_ptr + length), dest_ptr);
		return dest_ptr;
	}
}

export class Uint16ArrayType extends TypeArrayType<Uint16Array> {
	protected loadFromRange(memory: Memory, data: size, length: u32): Uint16Array {
		return new Uint16Array(memory.buffer, data, length);
	}
	protected storeIntoRange(memory: Memory, value: Uint16Array): [size, u32] {
		const ptr = memory.alloc(u16.alignment, value.byteLength);
		const target = new Uint16Array(memory.buffer, ptr, value.length);
		target.set(value);
		return [ptr, target.length];
	}
	protected copyArray(dest: Memory, src: Memory, src_ptr: number, length: number): number {
		const dest_ptr = dest.alloc(u16.alignment, length * Uint16Array.BYTES_PER_ELEMENT);
		dest.raw.set(src.raw.subarray(src_ptr, src_ptr + length), dest_ptr);
		return dest_ptr;
	}
}

export class Uint32ArrayType extends TypeArrayType<Uint32Array> {
	protected loadFromRange(memory: Memory, data: size, length: u32): Uint32Array {
		return new Uint32Array(memory.buffer, data, length);
	}
	protected storeIntoRange(memory: Memory, value: Uint32Array): [size, u32] {
		const ptr = memory.alloc(u32.alignment, value.byteLength);
		const target = new Uint32Array(memory.buffer, ptr, value.length);
		target.set(value);
		return [ptr, target.length];
	}
	protected copyArray(dest: Memory, src: Memory, src_ptr: number, length: number): number {
		const dest_ptr = dest.alloc(u32.alignment, length * Uint32Array.BYTES_PER_ELEMENT);
		dest.raw.set(src.raw.subarray(src_ptr, src_ptr + length), dest_ptr);
		return dest_ptr;
	}
}

export class BigUint64ArrayType extends TypeArrayType<BigUint64Array> {
	protected loadFromRange(memory: Memory, data: size, length: u32): BigUint64Array {
		return new BigUint64Array(memory.buffer, data, length);
	}
	protected storeIntoRange(memory: Memory, value: BigUint64Array): [size, u32] {
		const ptr = memory.alloc(u64.alignment, value.byteLength);
		const target = new BigUint64Array(memory.buffer, ptr, value.length);
		target.set(value);
		return [ptr, target.length];
	}
	protected copyArray(dest: Memory, src: Memory, src_ptr: number, length: number): number {
		const dest_ptr = dest.alloc(u64.alignment, length * BigUint64Array.BYTES_PER_ELEMENT);
		dest.raw.set(src.raw.subarray(src_ptr, src_ptr + length), dest_ptr);
		return dest_ptr;
	}
}

export class Float32ArrayType extends TypeArrayType<Float32Array> {
	protected loadFromRange(memory: Memory, data: size, length: u32): Float32Array {
		return new Float32Array(memory.buffer, data, length);
	}
	protected storeIntoRange(memory: Memory, value: Float32Array): [size, u32] {
		const ptr = memory.alloc(float32.alignment, value.byteLength);
		const target = new Float32Array(memory.buffer, ptr, value.length);
		target.set(value);
		return [ptr, target.length];
	}
	protected copyArray(dest: Memory, src: Memory, src_ptr: number, length: number): number {
		const dest_ptr = dest.alloc(float32.alignment, length * Float32Array.BYTES_PER_ELEMENT);
		dest.raw.set(src.raw.subarray(src_ptr, src_ptr + length), dest_ptr);
		return dest_ptr;
	}
}

export class Float64ArrayType extends TypeArrayType<Float64Array> {
	protected loadFromRange(memory: Memory, data: size, length: u32): Float64Array {
		return new Float64Array(memory.buffer, data, length);
	}
	protected storeIntoRange(memory: Memory, value: Float64Array): [size, u32] {
		const ptr = memory.alloc(float32.alignment, value.byteLength);
		const target = new Float64Array(memory.buffer, ptr, value.length);
		target.set(value);
		return [ptr, target.length];
	}
	protected copyArray(dest: Memory, src: Memory, src_ptr: number, length: number): number {
		const dest_ptr = dest.alloc(float64.alignment, length * Float64Array.BYTES_PER_ELEMENT);
		dest.raw.set(src.raw.subarray(src_ptr, src_ptr + length), dest_ptr);
		return dest_ptr;
	}
}

interface TypedField {
	readonly type: GenericComponentModelType;
}

interface JRecord {
	[key: string]: JType | undefined;
}

type JTuple = JType[];

abstract class BaseRecordType<T extends JRecord | JTuple, F extends TypedField> implements ComponentModelType<T> {

	public fields: F[];

	public kind: ComponentModelTypeKind;
	public readonly size: size;
	public readonly alignment: Alignment;
	public readonly flatTypes: readonly WasmTypeKind[];

	constructor(fields: F[], kind: ComponentModelTypeKind.record | ComponentModelTypeKind.tuple) {
		this.fields = fields;

		this.kind = kind;
		this.alignment = BaseRecordType.alignment(fields);
		this.size = BaseRecordType.size(fields, this.alignment);
		this.flatTypes = BaseRecordType.flatTypes(fields);
	}

	public load(memory: Memory, ptr: ptr, context: ComponentModelContext): T {
		const result: JType[] = [];
		for (const field of this.fields) {
			ptr = align(ptr, field.type.alignment);
			result.push(field.type.load(memory, ptr, context));
			ptr += field.type.size;
		}
		return this.create(this.fields, result);
	}


	public liftFlat(memory: Memory, values: FlatValuesIter, context: ComponentModelContext): T {
		const result: JType[] = [];
		for (const field of this.fields) {
			result.push(field.type.liftFlat(memory, values, context));
		}
		return this.create(this.fields, result);
	}

	public alloc(memory: Memory): ptr {
		return memory.alloc(this.alignment, this.size);
	}

	public store(memory: Memory, ptr: ptr, record: T, context: ComponentModelContext): void {
		const values = this.elements(record, this.fields);
		for (let i = 0; i < this.fields.length; i++) {
			const field = this.fields[i];
			const value = values[i];
			ptr = align(ptr, field.type.alignment);
			field.type.store(memory, ptr, value, context);
			ptr += field.type.size;
		}
	}

	public lowerFlat(result: wasmType[], memory: Memory, record: T, context: ComponentModelContext): void {
		const values = this.elements(record, this.fields);
		for (let i = 0; i < this.fields.length; i++) {
			const field = this.fields[i];
			const value = values[i];
			field.type.lowerFlat(result, memory, value, context);
		}
	}

	public copy(dest: Memory, dest_ptr: number, src: Memory, src_ptr: number, context: ComponentModelContext): void {
		for (const field of this.fields) {
			dest_ptr = align(dest_ptr, field.type.alignment);
			src_ptr = align(src_ptr, field.type.alignment);
			field.type.copy(dest, dest_ptr, src, src_ptr, context);
			dest_ptr += field.type.size;
			src_ptr += field.type.size;
		}
	}

	protected abstract create(fields: F[], values: JType[]): T;
	protected abstract elements(record: T, fields: F[]): JType[];

	private static size(fields: TypedField[], recordAlignment: Alignment): size {
		let result: size = 0;
		for (const field of fields) {
			result = align(result, field.type.alignment);
			result += field.type.size;
		}
		return align(result, recordAlignment);
	}

	private static alignment(fields: TypedField[]): Alignment {
		let result: Alignment = 1;
		for (const field of fields) {
			result = Math.max(result, field.type.alignment) as Alignment;
		}
		return result;
	}

	private static flatTypes(fields: TypedField[]): readonly WasmTypeKind[] {
		const result: WasmTypeKind[] = [];
		for (const field of fields) {
			result.push(...field.type.flatTypes);
		}
		return result;
	}
}

interface RecordField extends TypedField {
	readonly name: string;
}

namespace RecordField {
	export function create(name: string, type: GenericComponentModelType): RecordField {
		return { name, type };
	}
}

export class RecordType<T extends JRecord> extends BaseRecordType<T, RecordField> {

	constructor(fields: [string, GenericComponentModelType][]) {
		const recordFields: RecordField[] = [];
		for (const [name, type] of fields) {
			recordFields.push(RecordField.create(name, type));
		}
		super(recordFields, ComponentModelTypeKind.record);
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
			const value = record[field.name];
			result.push(value);
		}
		return result;
	}
}

interface TupleField extends TypedField {
}
namespace TupleField {
	export function create(type: GenericComponentModelType): TupleField {
		return { type };
	}
}

export class TupleType<T extends JTuple> extends BaseRecordType<T, TupleField> {

	constructor(fields: GenericComponentModelType[]) {
		const tupleFields: TupleField[] = [];
		for (const type of fields) {
			tupleFields.push(TupleField.create(type));
		}
		super(tupleFields, ComponentModelTypeKind.tuple);
	}

	protected create(_fields: TupleField[], values: JType[]): T {
		return values as JTuple as T;
	}

	protected elements(record: T, _fields: TupleField[]): JType[] {
		return record;
	}
}

export class FlagsType<_T> implements ComponentModelType<u32 | bigint> {

	public readonly type: GenericComponentModelType | undefined;
	private readonly arraySize: number;

	public readonly kind: ComponentModelTypeKind;
	public readonly size: size;
	public readonly alignment: Alignment;
	public readonly flatTypes: readonly WasmTypeKind[];

	constructor(numberOfFlags: number) {
		this.kind = ComponentModelTypeKind.flags;
		this.size = FlagsType.size(numberOfFlags);
		this.alignment = FlagsType.alignment(numberOfFlags);
		this.flatTypes = FlagsType.flatTypes(numberOfFlags);
		this.type = FlagsType.getType(numberOfFlags);
		this.arraySize = FlagsType.num32Flags(numberOfFlags);
	}

	public load(memory: Memory, ptr: ptr<u8 | u16 | u32 | u32[]>, context: ComponentModelContext): u32 | bigint {
		return this.type === undefined ? 0 : this.loadFrom(this.type.load(memory, ptr, context));
	}

	public liftFlat(_memory: Memory, values: FlatValuesIter, context: ComponentModelContext): u32 | bigint {
		return this.type === undefined ? 0 : this.loadFrom(this.type.liftFlat(_memory, values, context));
	}

	private loadFrom(value: u32 | u32[]): u32 | bigint {
		if (typeof value === 'number') {
			return value;
		} else {
			let result = 0n;
			for (let f = 0, i = value.length - 1; f < value.length; f++, i--) {
				const bits = value[i];
				result = result | (BigInt(bits) << BigInt(f * 32));
			}
			return result;
		}
	}

	public alloc(memory: Memory): ptr<u8 | u16 | u32 | u32[]> {
		return memory.alloc(this.alignment, this.size);
	}

	public store(memory: Memory, ptr: ptr<u8 | u16 | u32 | u32[]>, flags: u32 | bigint, context: ComponentModelContext): void {
		if (this.type !== undefined) {
			this.type.store(memory, ptr, this.storeInto(flags), context);
		}
	}

	public lowerFlat(result: wasmType[], _memory: Memory, flags: u32 | bigint, context: ComponentModelContext): void {
		if (this.type !== undefined) {
			this.type.lowerFlat(result, _memory, this.storeInto(flags), context);
		}
	}

	public copy(dest: Memory, dest_ptr: number, src: Memory, src_ptr: number, context: ComponentModelContext): void {
		if (this.type !== undefined) {
			this.type.copy(dest, dest_ptr, src, src_ptr, context);
		}
	}

	private storeInto(value: number | bigint): u32 | u32[] {
		if (typeof value === 'number') {
			return value;
		} else {
			const result: u32[] = new Array(this.arraySize).fill(0);
			for (let f = 0, i = result.length - 1; f < result.length; f++, i--) {
				const bits = Number((value >> BigInt(f * 32)) & BigInt(0xffffffff));
				result[i] = bits;
			}
			return result;
		}
	}

	private static size(numberOfFlags: number): size {
		if (numberOfFlags === 0) {
			return 0;
		} else if (numberOfFlags <= 8) {
			return 1;
		} else if (numberOfFlags <= 16) {
			return 2;
		} else {
			return 4 * this.num32Flags(numberOfFlags);
		}
	}

	private static alignment(numberOfFlags: number): Alignment {
		if (numberOfFlags <= 8) {
			return 1;
		} else if (numberOfFlags <= 16) {
			return 2;
		} else {
			return 4;
		}
	}

	private static getType(numberOfFlags: number): GenericComponentModelType | undefined {
		if (numberOfFlags === 0) {
			return undefined;
		} else if (numberOfFlags <= 8) {
			return u8;
		} else if (numberOfFlags <= 16) {
			return u16;
		} else if (numberOfFlags <= 32) {
			return u32;
		} else {
			return new TupleType(new Array(this.num32Flags(numberOfFlags)).fill(u32));
		}
	}

	private static flatTypes(numberOfFlags: number): WasmTypeKind.i32[] {
		return new Array(this.num32Flags(numberOfFlags)).fill(WasmTypeKind.i32);
	}

	private static num32Flags(numberOfFlags: number): number {
		return Math.ceil(numberOfFlags / 32);
	}
}

interface VariantCase {
	readonly index: u32;
	readonly tag: string;
	readonly type: GenericComponentModelType | undefined;
	readonly wantFlatTypes: WasmTypeKind[] | undefined;
}

namespace VariantCase {
	export function create(index: number, tag: string, type: GenericComponentModelType | undefined): VariantCase {
		return { index, tag, type, wantFlatTypes: type !== undefined ? [] : undefined };
	}
}

export interface JVariantCase {
	readonly tag: string;
	readonly value?: JType | undefined | void;
}

export class VariantType<T extends JVariantCase, I, V> implements ComponentModelType<T> {

	public readonly cases: VariantCase[];
	private readonly case2Index: Map<string, u32>;
	private readonly ctor: (caseIndex: I, value: V) => T;
	private readonly discriminantType: typeof u8 | typeof u16 | typeof u32;
	private readonly maxCaseAlignment: Alignment;

	public readonly kind: ComponentModelTypeKind;
	public readonly size: size;
	public readonly alignment: Alignment;
	public readonly flatTypes: readonly WasmTypeKind[];

	constructor(variants: [string, (GenericComponentModelType | undefined)][], ctor: (caseIndex: I, value: V) => T, kind: ComponentModelTypeKind.variant | ComponentModelTypeKind.result = ComponentModelTypeKind.variant) {
		const cases: VariantCase[] = [];
		this.case2Index = new Map();
		for (let i = 0; i < variants.length; i++) {
			const type = variants[i][1];
			const name = variants[i][0];
			this.case2Index.set(name, i);
			cases.push(VariantCase.create(i, name, type));
		}
		this.cases = cases;
		this.ctor = ctor;

		this.discriminantType = VariantType.discriminantType(cases.length);
		this.maxCaseAlignment = VariantType.maxCaseAlignment(cases);
		this.kind = kind;
		this.size = VariantType.size(this.discriminantType, cases);
		this.alignment = VariantType.alignment(this.discriminantType, cases);
		this.flatTypes = VariantType.flatTypes(this.discriminantType, cases);
	}

	public load(memory: Memory, ptr: ptr, context: ComponentModelContext): T {
		const caseIndex = this.discriminantType.load(memory, ptr, context);
		const caseVariant = this.cases[caseIndex];
		if (caseVariant.type === undefined) {
			return this.ctor(caseVariant.tag as I, undefined as any);
		} else {
			ptr += this.discriminantType.size;
			ptr = align(ptr, this.maxCaseAlignment);
			const value = caseVariant.type.load(memory, ptr, context);
			return this.ctor(caseVariant.tag as I, value);
		}
	}

	public liftFlat(memory: Memory, values: FlatValuesIter, context: ComponentModelContext): T {
		// First one is the discriminant type. So skip it.
		let valuesToReadOver = this.flatTypes.length - 1;
		const caseIndex = this.discriminantType.liftFlat(memory, values, context);
		const caseVariant = this.cases[caseIndex];
		let result: T;
		if (caseVariant.type === undefined) {
			result = this.ctor(caseVariant.tag as I, undefined as any);
		} else {
			// The first flat type is the discriminant type. So skip it.
			const wantFlatTypes = caseVariant.wantFlatTypes!;
			const iter = new CoerceValueIter(values, this.flatTypes.slice(1), wantFlatTypes);
			const value = caseVariant.type.liftFlat(memory, iter, context);
			result = this.ctor(caseVariant.tag as I, value);
			valuesToReadOver = valuesToReadOver - wantFlatTypes.length;
		}
		for (let i = 0; i < valuesToReadOver; i++) {
			values.next();
		}
		return result;
	}

	public alloc(memory: Memory): ptr {
		return memory.alloc(this.alignment, this.size);
	}

	public store(memory: Memory, ptr: ptr, variantValue: T, context: ComponentModelContext): void {
		const index = this.case2Index.get(variantValue.tag);
		if (index === undefined) {
			throw new ComponentModelError(`Variant case ${variantValue.tag} not found`);
		}
		this.discriminantType.store(memory, ptr, index, context);
		ptr += this.discriminantType.size;
		const c = this.cases[index];
		if (c.type !== undefined && variantValue.value !== undefined) {
			ptr = align(ptr, this.maxCaseAlignment);
			c.type.store(memory, ptr, variantValue.value, context);
		}
	}

	public lowerFlat(result: wasmType[], memory: Memory, variantValue: T, context: ComponentModelContext): void {
		const flatTypes = this.flatTypes;
		const index = this.case2Index.get(variantValue.tag);
		if (index === undefined) {
			throw new ComponentModelError(`Variant case ${variantValue.tag} not found`);
		}
		this.discriminantType.lowerFlat(result, memory, index, context);
		const c = this.cases[index];
		// First one is the discriminant type. So skip it.
		let valuesToFill = this.flatTypes.length - 1;
		if (c.type !== undefined && variantValue.value !== undefined) {
			const payload: wasmType[] = [];
			c.type.lowerFlat(payload, memory, variantValue.value, context);
			// First one is the discriminant type. So skip it.
			const wantTypes = flatTypes.slice(1);
			const haveTypes = c.wantFlatTypes!;
			if (payload.length !== haveTypes.length) {
				throw new ComponentModelError('Mismatched flat types');
			}
			for (let i = 0; i < wantTypes.length; i++) {
				const have: WasmTypeKind = haveTypes[i];
				const want: WasmTypeKind = wantTypes[i];
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
			valuesToFill = valuesToFill - payload.length;
			result.push(...payload);
		}
		for(let i = flatTypes.length - valuesToFill; i < flatTypes.length; i++) {
			const type = flatTypes[i];
			if (type === 'i64') {
				result.push(0n);
			} else {
				result.push(0);
			}
		}
	}

	public copy(dest: Memory, dest_ptr: number, src: Memory, src_ptr: number, context: ComponentModelContext): void {
		this.discriminantType.copy(dest, dest_ptr, src, src_ptr, context);
		const caseIndex = this.discriminantType.load(src, src_ptr, context);
		const caseVariant = this.cases[caseIndex];
		if (caseVariant.type === undefined) {
			return;
		}
		src_ptr += this.discriminantType.size;
		src_ptr = align(src_ptr, this.maxCaseAlignment);
		dest_ptr += this.discriminantType.size;
		dest_ptr = align(dest_ptr, this.maxCaseAlignment);
		caseVariant.type.copy(dest, dest_ptr, src, src_ptr, context);
	}

	private static size(discriminantType: GenericComponentModelType, cases: VariantCase[]): size {
		let result = discriminantType.size;
		result = align(result, this.maxCaseAlignment(cases));
		return result + this.maxCaseSize(cases);
	}

	private static alignment(discriminantType: GenericComponentModelType, cases: VariantCase[]): Alignment {
		return Math.max(discriminantType.alignment, this.maxCaseAlignment(cases)) as Alignment;
	}

	private static flatTypes(discriminantType: GenericComponentModelType, cases: VariantCase[]): readonly WasmTypeKind[] {
		const flat: WasmTypeKind[] = [];
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

	private static discriminantType(cases: number): typeof u8 | typeof u16 | typeof u32 {
		switch (Math.ceil(Math.log2(cases) / 8)) {
			case 0: return u8;
			case 1: return u8;
			case 2: return u16;
			case 3: return u32;
		}
		throw new ComponentModelError(`Too many cases: ${cases}`);
	}

	private static maxCaseAlignment(cases: VariantCase[]): Alignment {
		let result: Alignment = 1;
		for (const c of cases) {
			if (c.type !== undefined) {
				result = Math.max(result, c.type.alignment) as Alignment;
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

	private static joinFlatType(a: WasmTypeKind, b:WasmTypeKind) : WasmTypeKind {
		if (a === b) {
			return a;
		}
		if ((a === WasmTypeKind.i32 && b === WasmTypeKind.f32) || (a === WasmTypeKind.f32 && b === WasmTypeKind.i32)) {
			return WasmTypeKind.i32;
		}
		return WasmTypeKind.i64;
	}
}

export type JEnum = string;

export class EnumType<T extends JEnum> implements ComponentModelType<T> {

	private readonly discriminantType: ComponentModelType<u8> | ComponentModelType<u16> | ComponentModelType<u32>;
	private readonly cases: string[];
	private readonly case2index: Map<string, number>;

	public readonly kind: ComponentModelTypeKind;
	public readonly size: size;
	public readonly alignment: Alignment;
	public readonly flatTypes: readonly WasmTypeKind[];

	constructor(cases: string[]) {
		this.discriminantType = EnumType.discriminantType(cases.length);
		this.cases = cases;
		this.case2index = new Map();
		for (let i = 0; i < cases.length; i++) {
			const c = cases[i];
			this.case2index.set(c, i);
		}
		this.kind = ComponentModelTypeKind.enum;
		this.size = this.discriminantType.size;
		this.alignment = this.discriminantType.alignment;
		this.flatTypes = this.discriminantType.flatTypes;
	}

	public load(memory: Memory, ptr: ptr, context: ComponentModelContext): T {
		const index = this.assertRange(this.discriminantType.load(memory, ptr, context));
		return this.cases[index] as T;
	}

	public liftFlat(memory: Memory, values: FlatValuesIter, context: ComponentModelContext): T {
		const index = this.assertRange(this.discriminantType.liftFlat(memory, values, context));
		return this.cases[index] as T;
	}

	public alloc(memory: Memory): ptr {
		return memory.alloc(this.alignment, this.size);
	}

	public store(memory: Memory, ptr: ptr, value: T, context: ComponentModelContext): void {
		const index = this.case2index.get(value);
		if (index === undefined) {
			throw new ComponentModelError('Enumeration value not found');
		}
		this.discriminantType.store(memory, ptr, index, context);
	}

	public lowerFlat(result: wasmType[], memory: Memory, value: T, context: ComponentModelContext): void {
		const index = this.case2index.get(value);
		if (index === undefined) {
			throw new ComponentModelError('Enumeration value not found');
		}
		this.discriminantType.lowerFlat(result, memory, index, context);
	}

	public copy(dest: Memory, dest_ptr: number, src: Memory, src_ptr: number, context: ComponentModelContext): void {
		this.discriminantType.copy(dest, dest_ptr, src, src_ptr, context);
	}

	private assertRange(value: number): number {
		if (value < 0 || value > this.cases.length) {
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


export namespace option {
	export const none = 'none' as const;
	export type None<T extends JType> = { readonly tag: typeof none } & _common<T>;
	export function None<T extends JType>(): None<T> {
		return new OptionImpl<T>(none, undefined) as None<T>;
	}

	export const some = 'some' as const;
	export type Some<T extends JType> = { readonly tag: typeof some; readonly value: T } & _common<T>;
	export function Some<T extends JType>(value: T): Some<T> {
		return new OptionImpl<T>(some, value ) as Some<T>;
	}

	export type _tt = typeof none | typeof some;
	export type _vt<T extends JType> = undefined | T;

	type _common<T extends JType> = Omit<OptionImpl<T>, 'case' | 'value'>;


	export function _ctor<T extends JType>(c: _tt, v: _vt<T>): option<T> {
		return new OptionImpl(c, v) as option<T>;
	}

	export function isOption<T extends JType>(value: T | option<T>): value is option<T> {
		return value instanceof OptionImpl;
	}

	class OptionImpl<T extends JType> {
		private readonly _tag: _tt;
		private readonly _value?: _vt<T>;

		constructor(tag: typeof option.none | typeof option.some, value: undefined | T) {
			this._tag = tag;
			this._value = value;
		}

		get tag():  typeof option.none | typeof option.some {
			return this._tag;
		}

		get value(): undefined | T {
			return this._value;
		}

		public isNone(): this is None<T> {
			return this._tag === option.none;
		}

		public isSome(): this is Some<T> {
			return this._tag === option.some;
		}

	}
}
export type option<T extends JType> = option.None<T> | option.Some<T>;
export class OptionType<T extends JType> implements ComponentModelType<T | option<T> | undefined> {

	public readonly valueType: GenericComponentModelType;

	public readonly kind: ComponentModelTypeKind;
	public readonly size: size;
	public readonly alignment: Alignment;
	public readonly flatTypes: readonly WasmTypeKind[];


	constructor(valueType: GenericComponentModelType) {
		this.valueType = valueType;
		this.kind = ComponentModelTypeKind.option;
		this.size = this.computeSize();
		this.alignment = this.computeAlignment();
		this.flatTypes = this.computeFlatTypes();
	}

	public load(memory: Memory, ptr: ptr, context: ComponentModelContext): T | option<T> | undefined {
		const caseIndex = u8.load(memory, ptr, context);
		if (caseIndex === 0) { // index 0 is none
			return context.options.keepOption ? option._ctor<T>(option.none, undefined) : undefined;
		} else {
			ptr += u8.size;
			ptr = align(ptr, this.alignment);
			const value = this.valueType.load(memory, ptr, context);
			return context.options.keepOption ? option._ctor(option.some, value) : value;
		}
	}

	public liftFlat(memory: Memory, values: FlatValuesIter, context: ComponentModelContext): T | option<T> | undefined {
		// First one is the discriminant type. So skip it.
		const caseIndex = u8.liftFlat(memory, values, context);
		if (caseIndex === 0) { // Index 0 is none
			// Read over the value params
			for (let i = 0; i < this.valueType.flatTypes.length; i++) {
				values.next();
			}
			return context.options.keepOption ? option._ctor<T>(option.none, undefined) : undefined;
		} else {
			const value = this.valueType.liftFlat(memory, values, context);
			return context.options.keepOption ? option._ctor(option.some, value) : value;
		}
	}

	public alloc(memory: Memory): ptr {
		return memory.alloc(this.alignment, this.size);
	}

	public store(memory: Memory, ptr: ptr, value: T | option<T> | undefined, context: ComponentModelContext): void {
		const optValue = this.asOptionValue(value, context.options);
		const index = optValue.tag === option.none ? 0 : 1;
		u8.store(memory, ptr, index, context);
		ptr += u8.size;
		if (optValue.tag === option.some) {
			ptr = align(ptr, this.valueType.alignment);
			this.valueType.store(memory, ptr, optValue.value, context);
		}
	}

	public lowerFlat(result: wasmType[], memory: Memory, value: T | option<T> | undefined, context: ComponentModelContext): void {
		const optValue = this.asOptionValue(value, context.options);
		const index = optValue.tag === option.none ? 0 : 1;
		u8.lowerFlat(result, memory, index, context);
		if (optValue.tag === option.none) {
			for (const type of this.valueType.flatTypes) {
				if (type === 'i64') {
					result.push(0n);
				} else {
					result.push(0);
				}
			}
		} else {
			this.valueType.lowerFlat(result, memory, optValue.value, context);
		}
	}

	public copy(dest: Memory, dest_ptr: number, src: Memory, src_ptr: number, context: ComponentModelContext): void {
		u8.copy(dest, dest_ptr, src, src_ptr, context);
		const caseIndex = u8.load(src, src_ptr, context);
		if (caseIndex === 0) {
			return;
		} else {
			src_ptr += u8.size;
			src_ptr = align(src_ptr, this.alignment);
			dest_ptr += u8.size;
			dest_ptr = align(dest_ptr, this.alignment);
			this.valueType.copy(dest, dest_ptr, src, src_ptr, context);
		}
	}

	private asOptionValue(value: T | option<T> | undefined, options: Options): option<T> {
		if (option.isOption(value)) {
			if (!options.keepOption) {
				throw new ComponentModelError('Received an option value although options should be unpacked.');
			}
			return value as option<T>;
		} else {
			if (options.keepOption) {
				throw new ComponentModelError('Received a unpacked option value although options should NOT be unpacked.');
			}
			return value === undefined ? option._ctor<T>(option.none, undefined) : option._ctor(option.some, value);
		}
	}

	private computeSize(): size {
		let result = u8.size;
		result = align(result, this.valueType.alignment);
		return result + this.valueType.size;
	}

	private computeAlignment(): Alignment {
		return Math.max(u8.alignment, this.valueType.alignment) as Alignment;
	}

	private computeFlatTypes(): readonly WasmTypeKind[] {
		return [...u8.flatTypes, ...this.valueType.flatTypes];
	}
}

export namespace result {
	export const ok = 'ok' as const;
	export type Ok<O extends JType | void, E extends JType | void> = { readonly tag: typeof ok; readonly value: O } & _common<O, E>;
	export function Ok<O extends JType | void , E extends JType | void>(value: O): Ok<O, E> {
		return new ResultImpl<O, E>(ok, value) as Ok<O, E>;
	}

	export const error = 'error' as const;
	export type Error<O extends JType | void, E extends JType | void> = { readonly tag: typeof error; readonly value: E } & _common<O, E>;
	export function Error<O extends JType | void, E extends JType | void>(value: E): Error<O, E> {
		return new ResultImpl<O, E>(error, value) as Error<O, E>;
	}

	export type _tt = typeof ok | typeof error;
	export type _vt<O extends JType | void, E extends JType | void> = O | E;
	type _common<O extends JType | void, E extends JType | void> = Omit<ResultImpl<O, E>, 'tag' | 'value'>;

	export function _ctor<O extends JType | void, E extends JType | void>(c: _tt, v: _vt<O, E>): result<O, E> {
		return new ResultImpl<O, E>(c, v) as result<O, E>;
	}

	export class ResultImpl<O extends JType | void, E extends JType | void> implements JVariantCase {

		private readonly _tag: _tt;
		private readonly _value: _vt<O, E>;

		constructor(tag: _tt, value: _vt<O, E>) {
			this._tag = tag;
			this._value = value;
		}

		get tag(): _tt {
			return this._tag;
		}

		get value(): _vt<O, E> {
			return this._value;
		}

		public isOk(): this is Ok<O, E> {
			return this._tag === ok;
		}

		public isError(): this is Error<O, E> {
			return this._tag === error;
		}
	}
}
export type result<O extends JType | void, E extends JType | void = void> = result.Ok<O, E> | result.Error<O, E>;
export class ResultType<O extends JType | void, E extends JType | void = void> extends VariantType<result<O, E>, 'ok' | 'error', O | E> {
	constructor(okType: GenericComponentModelType | undefined, errorType: GenericComponentModelType | undefined) {
		super([['ok', okType], ['error', errorType]], result._ctor<O, E>, ComponentModelTypeKind.result);
	}
}

export interface JInterface {
	__handle?: ResourceHandle;
}

export type JType = number | bigint | string | boolean | JArray | JRecord | JVariantCase | JTuple | JEnum | JInterface | option<any> | undefined | result<any, any> | Int8Array | Int16Array | Int32Array | BigInt64Array | Uint8Array | Uint16Array | Uint32Array | BigUint64Array | Float32Array | Float64Array;

export type CallableParameter = [/* name */string, /* type */GenericComponentModelType];

export type JFunction = (...params: JType[]) => JType | void;
export interface ServiceInterface {
	readonly [key: string]: (JFunction | ServiceInterface);
}
type GenericClass = {
	new (...params: JType[]): JInterface;
	[key: string]: JFunction;
};

export type WasmFunction = (...params: wasmType[]) => wasmType | void;

class Callable {

	public static readonly MAX_FLAT_PARAMS = 16;
	public static readonly MAX_FLAT_RESULTS = 1;

	public readonly witName: string;
	public readonly params: CallableParameter[];
	public readonly returnType: GenericComponentModelType | undefined;
	public readonly paramFlatTypes: ReadonlyArray<WasmTypeKind>;
	public readonly returnFlatTypes: ReadonlyArray<WasmTypeKind>;

	public readonly paramTupleType: TupleType<JTuple>;
	protected readonly mode: 'lift' | 'lower';

	constructor(witName: string, params: CallableParameter[], returnType?: GenericComponentModelType) {
		this.witName = witName;
		this.params = params;
		this.returnType = returnType;
		const paramTypes: GenericComponentModelType[] = [];
		let paramFlatTypes: WasmTypeKind[] = [];
		for (const param of params) {
			paramTypes.push(param[1]);
			paramFlatTypes.push(...param[1].flatTypes);
		}
		this.paramFlatTypes = paramFlatTypes;
		this.paramTupleType = new TupleType(paramTypes);
		this.returnFlatTypes = returnType !== undefined ? returnType.flatTypes : [];
		this.mode = 'lower';
	}

	public liftParamValues(wasmValues: (number | bigint)[], memory: Memory, context: ComponentModelContext): JType[] {
		if (this.paramFlatTypes.length > Callable.MAX_FLAT_PARAMS) {
			const p0 = wasmValues[0];
			if (!Number.isInteger(p0)) {
				throw new ComponentModelError('Invalid pointer');
			}
			return this.paramTupleType.load(memory, p0 as size, context);
		} else {
			return this.paramTupleType.liftFlat(memory, wasmValues.values(), context);
		}
	}

	public liftReturnValue(value: wasmType | void, memory: Memory, context: ComponentModelContext): JType | void {
		if (this.returnFlatTypes.length === 0) {
			return;
		} else if (this.returnFlatTypes.length <= Callable.MAX_FLAT_RESULTS) {
			const type = this.returnType!;
			return type.liftFlat(memory, [value!].values(), context);
		} else {
			const type = this.returnType!;
			return type.load(memory, value as size, context);
		}
	}

	public lowerParamValues(values: JType[], memory: Memory, context: ComponentModelContext, out: size | undefined): wasmType[] {
		if (this.paramFlatTypes.length > Callable.MAX_FLAT_PARAMS) {
			const ptr = out !== undefined ? out : memory.alloc(this.paramTupleType.alignment, this.paramTupleType.size);
			this.paramTupleType.store(memory, ptr, values as JTuple, context);
			return [ptr];
		} else {
			const result: wasmType[] = [];
			this.paramTupleType.lowerFlat(result, memory, values, context);
			return result;
		}
	}

	public lowerReturnValue(value: JType | void, memory: Memory, context: ComponentModelContext, out: size | undefined): wasmType | void {
		if (this.returnFlatTypes.length === 0) {
			return;
		} else if (this.returnFlatTypes.length <= Callable.MAX_FLAT_RESULTS) {
			const result: wasmType[] = [];
			this.returnType!.lowerFlat(result, memory, value, context);
			if (result.length !== 1) {
				throw new ComponentModelError('Invalid result');
			}
			return result[0];
		} else {
			const type = this.returnType!;
			const ptr = out !== undefined ? out : memory.alloc(type.alignment, type.size);
			type.store(memory, ptr, value, context);
			return;
		}
	}

	public callWasm(params: JType[], wasmFunction: WasmFunction, context: WasmContext): JType | void {
		const memory = context.getMemory();
		const wasmValues = this.lowerParamValues(params, memory, context, undefined);
		// We currently only support 'lower' mode for results > MAX_FLAT_RESULTS.
		let resultPtr: ptr | undefined = undefined;
		if (this.returnFlatTypes.length > FunctionType.MAX_FLAT_RESULTS) {
			resultPtr = memory.alloc(this.returnType!.alignment, this.returnType!.size);
			wasmValues.push(resultPtr);
		}
		const result = wasmFunction(...wasmValues);
		this.liftReturnValue(result, memory, context);
		switch(this.returnFlatTypes.length) {
			case 0:
				return;
			case 1:
				return this.liftReturnValue(result, memory, context);
			default:
				return this.liftReturnValue(resultPtr, memory, context);
		}
	}
}

export class FunctionType<_T extends Function = Function> extends Callable  {

	constructor(witName: string, params: CallableParameter[], returnType?: GenericComponentModelType) {
		super(witName, params, returnType);
	}

	public callService(serviceFunction: JFunction, params: (number | bigint)[], context: WasmContext): number | bigint | void {
		const memory  = context.getMemory();
		// We currently only support 'lower' mode for results > MAX_FLAT_RESULTS.
		if (this.returnFlatTypes.length > FunctionType.MAX_FLAT_RESULTS && params.length !== this.paramFlatTypes.length + 1) {
			throw new ComponentModelError(`Invalid number of parameters. Received ${params.length} but expected ${this.paramFlatTypes.length + 1}`);
		}
		const jParams = this.liftParamValues(params, memory, context);
		const result: JType | void = serviceFunction(...jParams);
		const out = params[params.length - 1];
		if (typeof out !== 'number') {
			throw new ComponentModelError(`Result pointer must be a number (u32), but got ${out}.`);
		}
		return this.lowerReturnValue(result, memory, context, out);
	}
}

export class ConstructorType<_T extends Function = Function> extends Callable {

	constructor(witName: string, params: CallableParameter[], returnType?: GenericComponentModelType) {
		super(witName, params, returnType);
	}

	public callConstructor(clazz: GenericClass, params: (number | bigint)[], resourceManager: ResourceManager, context: WasmContext): number | bigint | void {
		// We currently only support 'lower' mode for results > MAX_FLAT_RESULTS.
		if (this.returnFlatTypes.length > FunctionType.MAX_FLAT_RESULTS && params.length !== this.paramFlatTypes.length + 1) {
			throw new ComponentModelError(`Invalid number of parameters. Received ${params.length} but expected ${this.paramFlatTypes.length + 1}`);
		}
		const memory  = context.getMemory();
		const jParams = this.liftParamValues(params.slice(1), memory, context);
		const obj: JInterface = new clazz(...jParams);
		const handle = resourceManager.register(obj);
		return handle;
	}
}

export class StaticMethodType<_T extends Function = Function> extends Callable {

	constructor(witName: string, params: CallableParameter[], returnType?: GenericComponentModelType) {
		super(witName, params, returnType);
	}

	public callStaticMethod(func: JFunction, params: (number | bigint)[], context: WasmContext): number | bigint | void {
		const memory  = context.getMemory();
		// We currently only support 'lower' mode for results > MAX_FLAT_RESULTS.
		if (this.returnFlatTypes.length > FunctionType.MAX_FLAT_RESULTS && params.length !== this.paramFlatTypes.length + 1) {
			throw new ComponentModelError(`Invalid number of parameters. Received ${params.length} but expected ${this.paramFlatTypes.length + 1}`);
		}
		const jParams = this.liftParamValues(params, memory, context);
		const result: JType | void = func(...jParams);
		const out = params[params.length - 1];
		if (typeof out !== 'number') {
			throw new ComponentModelError(`Result pointer must be a number (u32), but got ${out}.`);
		}
		return this.lowerReturnValue(result, memory, context, out);
	}
}

export class MethodType<_T extends Function = Function> extends Callable {

	constructor(witName: string, params: CallableParameter[], returnType?: GenericComponentModelType) {
		super(witName, params, returnType);
	}

	public callMethod(methodName: string, params: (number | bigint)[], resourceManager: ResourceManager, context: WasmContext): number | bigint | void {
		if (params.length === 0) {
			throw new ComponentModelError(`Method calls must have at least one parameter (the object pointer).`);
		}
		// We currently only support 'lower' mode for results > MAX_FLAT_RESULTS.
		if (this.returnFlatTypes.length > FunctionType.MAX_FLAT_RESULTS && params.length !== this.paramFlatTypes.length + 1) {
			throw new ComponentModelError(`Invalid number of parameters. Received ${params.length} but expected ${this.paramFlatTypes.length + 1}`);
		}
		const handle = params[0];
		if (typeof handle !== 'number') {
			throw new ComponentModelError(`Object handle must be a number (u32), but got ${handle}.`);
		}
		const obj = resourceManager.getResource(handle);
		const memory  = context.getMemory();
		const jParams = this.liftParamValues(params.slice(1), memory, context);
		const result: JType | void = (obj as any)[methodName](...jParams);
		const out = params[params.length - 1];
		if (typeof out !== 'number') {
			throw new ComponentModelError(`Result pointer must be a number (u32), but got ${out}.`);
		}
		return this.lowerReturnValue(result, memory, context, out);
	}
}

export type ResourceCallable<T extends JFunction = JFunction> = MethodType<T> | StaticMethodType<T> | ConstructorType<T>;

export type ResourceHandle = u32;
export class ResourceHandleType implements ComponentModelType<ResourceHandle> {

	public readonly kind: ComponentModelTypeKind;
	public readonly size: size;
	public readonly alignment: Alignment;
	public readonly flatTypes: readonly WasmTypeKind[];

	public readonly witName: string;

	constructor(witName: string) {
		this.witName = witName;
		this.kind = ComponentModelTypeKind.resourceHandle;
		this.size = u32.size;
		this.alignment = u32.alignment;
		this.flatTypes = u32.flatTypes;
	}

	public load(memory: Memory, ptr: ptr, context: ComponentModelContext): ResourceHandle {
		return u32.load(memory, ptr, context);
	}

	public liftFlat(memory: Memory, values: FlatValuesIter, context: ComponentModelContext): ResourceHandle {
		return u32.liftFlat(memory, values, context);
	}

	public alloc(memory: Memory): ptr {
		return u32.alloc(memory);
	}

	public store(memory: Memory, ptr: ptr, value: ResourceHandle, context: ComponentModelContext): void {
		u32.store(memory, ptr, value, context);
	}

	public lowerFlat(result: wasmType[], memory: Memory, value: ResourceHandle, context: ComponentModelContext): void {
		u32.lowerFlat(result, memory, value, context);
	}

	public copy(dest: Memory, dest_ptr: number, src: Memory, src_ptr: number, context: ComponentModelContext): void {
		u32.copy(dest, dest_ptr, src, src_ptr, context);
	}
}

export class ResourceType<T extends JInterface = JInterface> implements ComponentModelType<T> {

	public readonly kind: ComponentModelTypeKind;
	public readonly size: size;
	public readonly alignment: Alignment;
	public readonly flatTypes: readonly WasmTypeKind[];


	public readonly witName: string;
	public readonly id: string;
	public readonly methods: Map<string, ResourceCallable>;

	constructor(witName: string, id: string) {
		this.kind = ComponentModelTypeKind.resource;
		this.size = u32.size;
		this.alignment = u32.alignment;
		this.flatTypes = u32.flatTypes;
		this.witName = witName;
		this.id = id;
		this.methods = new Map();
	}

	public addMethod(jsName: string, func: ResourceCallable): void {
		this.methods.set(jsName, func);
	}

	public getMethod(jsName: string): ResourceCallable {
		const result = this.methods.get(jsName);
		if (result === undefined) {
			throw new ComponentModelError(`Method '${jsName}' not found on resource '${this.witName}'.`);
		}
		return result;
	}

	public load(memory: Memory, ptr: ptr, context: ComponentModelContext): T {
		const handle = u32.load(memory, ptr, context);
		return context.managers.get(this.id).getResource(handle);
	}

	public liftFlat(memory: Memory, values: FlatValuesIter, context: ComponentModelContext): T {
		const handle = u32.liftFlat(memory, values, context);
		return context.managers.get(this.id).getResource(handle);
	}

	public alloc(memory: Memory): ptr {
		return u32.alloc(memory);
	}

	public store(memory: Memory, ptr: ptr, value: JInterface, context: ComponentModelContext): void {
		let handle: ResourceHandle | undefined = value.__handle;
		if (handle === undefined) {
			handle = context.managers.get(this.id).register(value);
		}
		u32.store(memory, ptr, handle, context);
	}

	public lowerFlat(result: wasmType[], memory: Memory, value: JInterface, context: ComponentModelContext): void {
		let handle: ResourceHandle | undefined = value.__handle;
		if (handle === undefined) {
			handle = context.managers.get(this.id).register(value);
		}
		u32.lowerFlat(result, memory, handle, context);
	}

	public copy(dest: Memory, dest_ptr: number, src: Memory, src_ptr: number, context: ComponentModelContext): void {
		u32.copy(dest, dest_ptr, src, src_ptr, context);
	}
}

class AbstractWrapperType implements ComponentModelType<JType> {

	public readonly kind: ComponentModelTypeKind;
	public readonly size: size;
	public readonly alignment: Alignment;
	public readonly flatTypes: readonly WasmTypeKind[];

	private readonly wrapped: ComponentModelType<JType>;

	constructor(kind: ComponentModelTypeKind, wrapped: ComponentModelType<JType>) {
		this.kind = kind;
		this.wrapped = wrapped;
		this.size = u32.size;
		this.alignment = u32.alignment;
		this.flatTypes = u32.flatTypes;
	}

	public load(memory: Memory, ptr: ptr, context: ComponentModelContext): JType {
		return this.wrapped.load(memory, ptr, context);
	}

	public liftFlat(memory: Memory, values: FlatValuesIter, context: ComponentModelContext): JType {
		return this.wrapped.liftFlat(memory, values, context);
	}

	public alloc(memory: Memory): ptr {
		return u32.alloc(memory);
	}

	public store(memory: Memory, ptr: ptr, value: JInterface, context: ComponentModelContext): void {
		return this.wrapped.store(memory, ptr, value, context);
	}

	public lowerFlat(result: wasmType[], memory: Memory, value: JInterface, context: ComponentModelContext): void {
		return this.wrapped.lowerFlat(result, memory, value, context);
	}

	public copy(dest: Memory, dest_ptr: number, src: Memory, src_ptr: number, context: ComponentModelContext): void {
		return this.wrapped.copy(dest, dest_ptr, src, src_ptr, context);
	}
}

export type borrow<T extends JType> = T;
export class BorrowType<_T extends JType> extends AbstractWrapperType {
	constructor(type: GenericComponentModelType) {
		super(ComponentModelTypeKind.borrow, type);
	}
}

export type own<T extends JType> = T;
export class OwnType<_T extends JType> extends AbstractWrapperType {
	constructor(type: GenericComponentModelType) {
		super(ComponentModelTypeKind.own, type);
	}
}

export interface ComponentModelTypeVisitor {
	visitU8?(type: typeof $u8): void;
	visitU16?(type: typeof $u16): void;
	visitU32?(type: typeof $u32): void;
	visitU64?(type: typeof $u64): void;
	visitS8?(type: typeof $s8): void;
	visitS16?(type: typeof $s16): void;
	visitS32?(type: typeof $s32): void;
	visitS64?(type: typeof $s64): void;
	visitFloat32?(type: typeof $float32): void;
	visitFloat64?(type: typeof $float64): void;
	visitBool?(type: typeof bool): void;
	visitString?(type: typeof $wstring): void;
	visitBorrow?(type: BorrowType<any>): void;
	visitOwn?(type: OwnType<any>): void;
	visitResource?(type: ResourceType): void;
	visitResourceHandle?(type: ResourceHandleType): void;
	visitEnum?(type: EnumType<any>): void;
	visitFlags?(type: FlagsType<any>): void;
	visitList?(type: ListType<any>): boolean;
	endVisitList?(type: ListType<any>): void;
	visitRecord?(type: RecordType<any>): boolean;
	endVisitRecord?(type: RecordType<any>): void;
	visitTuple?(type: TupleType<any>): boolean;
	endVisitTuple?(type: TupleType<any>): void;
	visitVariant?(type: VariantType<any, any, any>): boolean;
	endVisitVariant?(type: VariantType<any, any, any>): void;
	visitOption?(type: OptionType<any>): boolean;
	endVisitOption?(type: OptionType<any>): void;
	visitResult?(type: ResultType<any, any>): boolean;
	endVisitResult?(type: ResultType<any, any>): void;
}
export namespace ComponentModelTypeVisitor {
	export function visit(type: GenericComponentModelType, visitor: ComponentModelTypeVisitor): void {
		switch (type.kind) {
			case ComponentModelTypeKind.u8:
				visitor.visitU8 !== undefined && visitor.visitU8(type as typeof $u8);
				break;
			case ComponentModelTypeKind.u16:
				visitor.visitU16 !== undefined && visitor.visitU16(type as typeof $u16);
				break;
			case ComponentModelTypeKind.u32:
				visitor.visitU32 !== undefined && visitor.visitU32(type as typeof $u32);
				break;
			case ComponentModelTypeKind.u64:
				visitor.visitU64 !== undefined && visitor.visitU64(type as typeof $u64);
				break;
			case ComponentModelTypeKind.s8:
				visitor.visitS8 !== undefined && visitor.visitS8(type as typeof $s8);
				break;
			case ComponentModelTypeKind.s16:
				visitor.visitS16 !== undefined && visitor.visitS16(type as typeof $s16);
				break;
			case ComponentModelTypeKind.s32:
				visitor.visitS32 !== undefined && visitor.visitS32(type as typeof $s32);
				break;
			case ComponentModelTypeKind.s64:
				visitor.visitS64 !== undefined && visitor.visitS64(type as typeof $s64);
				break;
			case ComponentModelTypeKind.float32:
				visitor.visitFloat32 !== undefined && visitor.visitFloat32(type as typeof $float32);
				break;
			case ComponentModelTypeKind.float64:
				visitor.visitFloat64 !== undefined && visitor.visitFloat64(type as typeof $float64);
				break;
			case ComponentModelTypeKind.bool:
				visitor.visitBool !== undefined && visitor.visitBool(type as typeof bool);
				break;
			case ComponentModelTypeKind.string:
				visitor.visitString !== undefined && visitor.visitString(type as typeof $wstring);
				break;
			case ComponentModelTypeKind.enum:
				visitor.visitEnum !== undefined && visitor.visitEnum(type as EnumType<any>);
				break;
			case ComponentModelTypeKind.flags:
				visitor.visitFlags !== undefined && visitor.visitFlags(type as FlagsType<any>);
				break;
			case ComponentModelTypeKind.borrow:
				visitor.visitBorrow !== undefined && visitor.visitBorrow(type as BorrowType<any>);
				break;
			case ComponentModelTypeKind.own:
				visitor.visitOwn !== undefined && visitor.visitOwn(type as OwnType<any>);
				break;
			case ComponentModelTypeKind.resource:
				visitor.visitResource !== undefined && visitor.visitResource(type as ResourceType);
				break;
			case ComponentModelTypeKind.resourceHandle:
				visitor.visitResourceHandle !== undefined && visitor.visitResourceHandle(type as ResourceHandleType);
				break;
			case ComponentModelTypeKind.list:
				if (visitor.visitList !== undefined && visitor.visitList(type as ListType<any>)) {
					visit((type as ListType<any>).elementType, visitor);
				}
				visitor.endVisitList !== undefined && visitor.endVisitList(type as ListType<any>);
				break;
			case ComponentModelTypeKind.record:
				if ((visitor.visitRecord !== undefined && visitor.visitRecord(type as RecordType<any>) || visitor.visitRecord === undefined)) {
					for (const field of (type as RecordType<any>).fields) {
						visit(field.type, visitor);
					}
				}
				visitor.endVisitRecord !== undefined && visitor.endVisitRecord(type as RecordType<any>);
				break;
			case ComponentModelTypeKind.tuple:
				if ((visitor.visitTuple !== undefined && visitor.visitTuple(type as TupleType<any>) || visitor.visitTuple === undefined)) {
					for (const field of (type as TupleType<any>).fields) {
						visit(field.type, visitor);
					}
				}
				visitor.endVisitTuple !== undefined && visitor.endVisitTuple(type as TupleType<any>);
				break;
			case ComponentModelTypeKind.variant:
				if ((visitor.visitVariant !== undefined && visitor.visitVariant(type as VariantType<any, any, any>) || visitor.visitVariant === undefined)) {
					for (const field of (type as VariantType<any, any, any>).cases) {
						field.type !== undefined && visit(field.type, visitor);
					}
				}
				visitor.endVisitVariant !== undefined && visitor.endVisitVariant(type as VariantType<any, any, any>);
				break;
			case ComponentModelTypeKind.option:
				if ((visitor.visitOption !== undefined && visitor.visitOption(type as OptionType<any>) || visitor.visitOption === undefined)) {
					visit((type as OptionType<any>).valueType, visitor);
				}
				visitor.endVisitOption !== undefined && visitor.endVisitOption(type as OptionType<any>);
				break;
			case ComponentModelTypeKind.result:
				if ((visitor.visitResult !== undefined && visitor.visitResult(type as ResultType<any, any>) || visitor.visitResult === undefined)) {
					for (const field of (type as ResultType<any, any>).cases) {
						field.type !== undefined && visit(field.type, visitor);
					}
				}
				visitor.endVisitResult !== undefined && visitor.endVisitResult(type as ResultType<any, any>);
				break;
			default:
				throw new Error(`Unknown type kind ${type.kind}`);
		}
	}
}

export type InterfaceType = {
	readonly id: string;
	readonly witName: string;
	readonly types: Map<string, GenericComponentModelType>;
	readonly functions: Map<string, FunctionType<JFunction>>;
	readonly resources: Map<string, ResourceType>;
};
export namespace InterfaceType {
	export function is(value: any): value is InterfaceType {
		return typeof value === 'object' && typeof value.id === 'string' && typeof value.witName === 'string'
			&& value.types instanceof Map && value.functions instanceof Map && value.resources instanceof Map;
	}
}

export type PackageType = {
	readonly id: string;
	readonly witName: string;
	readonly interfaces: Map<string, InterfaceType>;
};

export namespace PackageType {
	export function is(value: any): value is PackageType {
		return typeof value === 'object' && typeof value.id === 'string' && typeof value.witName === 'string'
			&& value.interfaces instanceof Map;
	}
}

export interface WasmContext extends ComponentModelContext {
	getMemory(): Memory;
}

export class Resource {
	private $handle: ResourceHandle | undefined;
	constructor() {
		this.$handle = undefined;
	}

	get __handle(): ResourceHandle | undefined {
		return this.$handle;
	}

	set __handle(value: ResourceHandle) {
		if (value === undefined) {
			throw new ComponentModelError('Cannot set undefined handle');
		}
		if (this.$handle !== undefined) {
			throw new ComponentModelError(`Cannot set handle twice. Current handle is ${this.$handle} new handle is ${value}.`);
		}
		this.$handle = value;
	}
}

export type UnionJType = number & bigint & string & boolean & JArray & JRecord & JVariantCase & JTuple & JEnum & JInterface & option<any> & undefined & result<any, any> & Int8Array & Int16Array & Int32Array & BigInt64Array & Uint8Array & Uint16Array & Uint32Array & BigUint64Array & Float32Array & Float64Array;
export type UnionWasmType = number & bigint;

type ParamWasmFunction = (...params: UnionWasmType[]) => wasmType | void;
interface ParamWasmInterface {
	readonly [key: string]: ParamWasmFunction;
}

type ParamServiceFunction = (...params: UnionJType[]) => JType | void;
type ParamGenericClass = {
	new (...params: UnionJType[]): JInterface;
} | {
	[key: string]: ParamServiceFunction;
};
interface ParamServiceInterface {
	readonly [key: string]: (ParamServiceFunction | ParamGenericClass);
}

export type WasmInterface = {
	readonly [key: string]: WasmFunction;
};

export type WasmInterfaces = {
	readonly [key: string]: WasmInterface;
};

export type Host = ParamWasmInterface;
export namespace Host {
	export function create<T extends Host>(signatures: Map<string, FunctionType<JFunction>>, resources: Map<string, ResourceType>, service: ParamServiceInterface, context: WasmContext): T {
		const result: { [key: string]: WasmFunction }  = Object.create(null);
		for (const [funcName, signature] of signatures) {
			result[signature.witName] = createHostFunction(signature, service[funcName] as JFunction, context);
		}
		for (const [resourceName, resource] of resources) {
			const resourceManager = context.managers.get(resource.id);
			for (const [callableName, callable] of resource.methods) {
				if (callable instanceof ConstructorType) {
					result[callable.witName] = createConstructorFunction(callable, (service[resourceName] as GenericClass), resourceManager, context);
				} else if (callable instanceof StaticMethodType) {
					result[callable.witName] = createStaticMethodFunction(callable, (service[resourceName] as GenericClass)[callableName], context);
				} else if (callable instanceof MethodType) {
					result[callable.witName] = createMethodFunction(callableName, callable, resourceManager, context);
				}
			}
		}
		return result as unknown as T;
	}

	function createHostFunction(func: FunctionType<JFunction>, serviceFunction: JFunction, context: WasmContext): WasmFunction {
		return (...params: wasmType[]): number | bigint | void => {
			return func.callService(serviceFunction, params, context);
		};
	}

	function createConstructorFunction(callable: ConstructorType, clazz: GenericClass, manager: ResourceManager, context: WasmContext): WasmFunction {
		return (...params: wasmType[]): number | bigint | void => {
			return callable.callConstructor(clazz, params, manager, context);
		};
	}

	function createStaticMethodFunction(callable: StaticMethodType, func: JFunction, context: WasmContext): WasmFunction {
		return (...params: wasmType[]): number | bigint | void => {
			return callable.callStaticMethod(func, params, context);
		};
	}

	function createMethodFunction(name: string, callable: MethodType, manager: ResourceManager, context: WasmContext): WasmFunction {
		return (...params: wasmType[]): number | bigint | void => {
			return callable.callMethod(name, params, manager, context);
		};
	}
}

export namespace Module {
	export function createObjectModule<T>(resource: ResourceType, wasm: ParamWasmInterface, context: WasmContext): T {
		const result: { [key: string]: JFunction }  = Object.create(null);
		for (const [name, callable] of resource.methods) {
			if (callable instanceof StaticMethodType) {
				continue;
			}
			result[name] = createModuleFunction(callable as any, wasm, context);
		}
		return result as unknown as T;
	}

	export function createClassModule<T>(resource: ResourceType, wasm: ParamWasmInterface, context: WasmContext): T {
		const result: { [key: string]: JFunction }  = Object.create(null);
		for (const [name, callable] of resource.methods) {
			if (callable instanceof StaticMethodType) {
				result[name] = createModuleFunction(callable as any, wasm, context);
			}
		}
		return result as unknown as T;
	}

	function createModuleFunction(func: FunctionType<JFunction>, wasm: ParamWasmInterface, context: WasmContext): JFunction {
		const wasmFunction = wasm[func.witName] as WasmFunction;
		return (...params: JType[]): JType | void => {
			return func.callWasm(params, wasmFunction, context);
		};
	}
}

export type ClassFactory<T extends GenericClass = GenericClass> = (wasmInterface: any, context: WasmContext) => T;
interface WriteableServiceInterface {
	[key: string]: (JFunction | WriteableServiceInterface);
}
export type Service = ParamServiceInterface | {};
export namespace Service {
	export function create<T extends Service>(signatures: Map<string, FunctionType>, resources: [string, ResourceType, ClassFactory<any>][], wasm: ParamWasmInterface, context: WasmContext): T {
		const result: WriteableServiceInterface  = Object.create(null);
		for (const [name, , factory] of resources) {
			result[name] = factory(wasm, context);
		}
		for (const [name, signature] of signatures) {
			result[name] = createServiceFunction(signature, wasm, context);
		}
		return result as unknown as T;
	}

	function createServiceFunction(func: FunctionType<JFunction>, wasm: ParamWasmInterface, context: WasmContext): JFunction {
		const wasmFunction = wasm[func.witName] as WasmFunction;
		return (...params: JType[]): JType | void => {
			return func.callWasm(params, wasmFunction, context);
		};
	}
}

type Distribute<T> = T extends any ? Promisify<T> : never;
export type Promisify<T> = {
	[K in keyof T]: T[K] extends (...args: infer A) => infer R
		? (...args: A) => Promise<R>
		: T[K] extends object
			? Distribute<T[K]>
			: T[K];
};


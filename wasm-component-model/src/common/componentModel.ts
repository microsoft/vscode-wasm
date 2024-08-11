/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as uuid from 'uuid';
import RAL from './ral';

// Type arrays are stored either little or big endian depending on the platform.
// The component model requires little endian so we throw for now if the platform
// is big endian. We can alternatively use data views in type arrays component
// model types to support big endian platforms.

const isLittleEndian = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;
if (!isLittleEndian) {
	throw new Error('Big endian platforms are currently not supported.');
}

export class ComponentModelTrap extends Error {
	constructor(message: string) {
		super(message);
	}
}

namespace BigInts {
	const MAX_VALUE_AS_BIGINT = BigInt(Number.MAX_VALUE);
	export function asNumber(value: bigint): number {
		if (value > MAX_VALUE_AS_BIGINT) {
			throw new ComponentModelTrap('Value too big for number');
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

export enum Alignment {
	byte = 1,
	halfWord = 2,
	word = 4,
	doubleWord = 8
}
export namespace Alignment {
	export function align(ptr: ptr, alignment: Alignment): size {
		return Math.ceil(ptr / alignment) * alignment;
	}
	export function getAlignment(ptr: ptr): Alignment {
		if (ptr % Alignment.doubleWord === 0) {
			return Alignment.doubleWord;
		}
		if (ptr % Alignment.word === 0) {
			return Alignment.word;
		}
		if (ptr % Alignment.halfWord === 0) {
			return Alignment.halfWord;
		}
		return Alignment.byte;
	}
}
const align = Alignment.align;

export interface Memory {
	readonly id: string;
	readonly buffer: ArrayBuffer;
	alloc(align: Alignment, size: size): MemoryRange;
	realloc(range: MemoryRange, align: Alignment, newSize: size): MemoryRange;
	preAllocated(ptr: ptr, size: size): MemoryRange;
	readonly(ptr: ptr, size: size): ReadonlyMemoryRange;
	free?(range: MemoryRange): void;
}

export class MemoryError extends ComponentModelTrap {
	constructor(message: string) {
		super(message);
	}
}

type ArrayClazz<T extends ArrayLike<number> & { set(array: ArrayLike<number>, offset?: number): void }> = {
	new (buffer: ArrayBuffer, byteOffset: number, length: number): T;
	new (length: number): T;
	BYTES_PER_ELEMENT: number;
};
type BigArrayClazz<T extends ArrayLike<bigint> & { set(array: ArrayLike<bigint>, offset?: number): void }> = {
	new (buffer: ArrayBuffer, byteOffset: number, length: number): T;
	new (length: number): T;
	BYTES_PER_ELEMENT: number;
};

export type offset<_T = undefined> = u32;
export abstract class BaseMemoryRange {

	protected readonly _memory: Memory;
	private readonly _ptr: ptr;
	private readonly _size: size;
	private readonly _alignment: Alignment;

	private _view: DataView | undefined;

	protected constructor(memory: Memory, ptr: ptr, size: size) {
		this._memory = memory;
		this._ptr = ptr;
		this._size = size;
		this._alignment = Alignment.getAlignment(ptr);
	}

	public get memory(): Memory {
		return this._memory;
	}

	public get ptr(): ptr {
		return this._ptr;
	}

	public get size(): size {
		return this._size;
	}

	public get alignment(): Alignment {
		return this._alignment;
	}

	protected get view(): DataView {
		if (this._view === undefined || this._view.buffer !== this._memory.buffer) {
			this._view = new DataView(this._memory.buffer, this._ptr, this._size);
		}
		return this._view;
	}

	public getUint8(offset: offset<u8>): u8 {
		return this.view.getUint8(offset);
	}

	public getInt8(offset: offset<s8>): s8 {
		return this.view.getInt8(offset);
	}

	public getUint16(offset: offset<u16>): u16 {
		this.assertAlignment(offset, Alignment.halfWord);
		return this.view.getUint16(offset, true);
	}

	public getInt16(offset: offset<s16>): s16 {
		this.assertAlignment(offset, Alignment.halfWord);
		return this.view.getInt16(offset, true);
	}

	public getUint32(offset: offset<u32>): u32 {
		this.assertAlignment(offset, Alignment.word);
		return this.view.getUint32(offset, true);
	}

	public getInt32(offset: offset<s32>): s32 {
		this.assertAlignment(offset, Alignment.word);
		return this.view.getInt32(offset, true);
	}

	public getUint64(offset: offset<u64>): u64 {
		this.assertAlignment(offset, Alignment.doubleWord);
		return this.view.getBigUint64(offset, true);
	}

	public getInt64(offset: offset<s64>): s64 {
		this.assertAlignment(offset, Alignment.doubleWord);
		return this.view.getBigInt64(offset, true);
	}

	public getFloat32(offset: offset<f32>): f32 {
		this.assertAlignment(offset, Alignment.word);
		return this.view.getFloat32(offset, true);
	}

	public getFloat64(offset: offset<f64>): f64 {
		this.assertAlignment(offset, Alignment.doubleWord);
		return this.view.getFloat64(offset, true);
	}

	public getPtr(offset: offset<ptr>): ptr {
		this.assertAlignment(offset, Alignment.word);
		return this.view.getUint32(offset, true);
	}

	public getUint8Array(offset: offset, length?: size | undefined): Uint8Array {
		return this.getArray(offset, length, Uint8Array);
	}

	public getInt8Array(offset: offset, length?: size | undefined): Int8Array {
		return this.getArray(offset, length, Int8Array);
	}

	public getUint16Array(byteOffset: offset, length?: size | undefined): Uint16Array {
		return this.getArray(byteOffset, length, Uint16Array);
	}

	public getInt16Array(byteOffset: offset, length?: size | undefined): Int16Array {
		return this.getArray(byteOffset, length, Int16Array);
	}

	public getUint32Array(byteOffset: offset, length?: size | undefined): Uint32Array {
		return this.getArray(byteOffset, length, Uint32Array);
	}

	public getInt32Array(byteOffset: offset, length?: size | undefined): Int32Array {
		return this.getArray(byteOffset, length, Int32Array);
	}

	public getUint64Array(byteOffset: offset, length?: size | undefined): BigUint64Array {
		return this.getBigArray(byteOffset, length, BigUint64Array);
	}

	public getInt64Array(byteOffset: offset, length?: size | undefined): BigInt64Array {
		return this.getBigArray(byteOffset, length, BigInt64Array);
	}

	public getFloat32Array(byteOffset: offset, length?: size | undefined): Float32Array {
		return this.getArray(byteOffset, length, Float32Array);
	}

	public getFloat64Array(byteOffset: offset, length?: size | undefined): Float64Array {
		return this.getArray(byteOffset, length, Float64Array);
	}

	public copyBytes(offset: offset, length: size, into: MemoryRange, into_offset: size): void {
		if (offset + length > this.size) {
			throw new MemoryError(`Memory access is out of bounds. Accessing [${offset}, ${length}], allocated[${this.ptr}, ${this.size}]`);
		}
		const target = into.getUint8View(into_offset, length);
		target.set(new Uint8Array(this._memory.buffer, this.ptr + offset, length));
	}

	public assertAlignment(offset: offset, alignment: Alignment): void {
		if (alignment > this.alignment || offset % alignment !== 0) {
			throw new MemoryError(`Memory location is not aligned to ${alignment}. Allocated[${this.ptr},${this.size}]`);
		}
	}

	public getArray<T extends ArrayLike<number> & { set(array: ArrayLike<number>, offset?: number): void }>(byteOffset: offset, length: size | undefined, clazz: ArrayClazz<T>): T {
		length = length ?? (this.size - byteOffset) / clazz.BYTES_PER_ELEMENT;
		if (!Number.isInteger(length)) {
			throw new MemoryError(`Length must be an integer value. Got ${length}.`);
		}
		const result = new clazz(length);
		result.set(new clazz(this._memory.buffer, this.ptr + byteOffset, length));
		return result;
	}

	public getBigArray<T extends ArrayLike<bigint> & { set(array: ArrayLike<bigint>, offset?: number): void }>(byteOffset: offset, length: size | undefined, clazz: BigArrayClazz<T>): T {
		length = length ?? (this.size - byteOffset) / clazz.BYTES_PER_ELEMENT;
		if (!Number.isInteger(length)) {
			throw new MemoryError(`Length must be an integer value. Got ${length}.`);
		}
		const result = new clazz(length);
		result.set(new clazz(this._memory.buffer, this.ptr + byteOffset, length));
		return result;
	}
}

export class ReadonlyMemoryRange extends BaseMemoryRange {

	constructor(memory: Memory, ptr: ptr, size: size) {
		super(memory, ptr, size);
	}

	public range(offset: offset, size: size): ReadonlyMemoryRange {
		if (offset + size > this.size) {
			throw new MemoryError(`Memory access is out of bounds. Accessing [${offset}, ${size}], allocated[${this.ptr}, ${this.size}]`);
		}
		return new ReadonlyMemoryRange(this._memory, this.ptr + offset, size);
	}
}

export class MemoryRange extends BaseMemoryRange {

	public readonly isAllocated: boolean;

	constructor(memory: Memory, ptr: ptr, size: size, isPreallocated: boolean = false) {
		super(memory, ptr, size);
		this.isAllocated = isPreallocated!;
	}

	public free(): void {
		if (typeof this._memory.free !== 'function') {
			throw new MemoryError(`Memory doesn't support free`);
		}
		this._memory.free(this);
	}

	public range(offset: offset, size: size): MemoryRange {
		if (offset + size > this.size) {
			throw new MemoryError(`Memory access is out of bounds. Accessing [${offset}, ${size}], allocated[${this.ptr}, ${this.size}]`);
		}
		return new MemoryRange(this._memory, this.ptr + offset, size);
	}

	public setUint8(offset: offset<u8>, value: u8): void {
		this.view.setUint8(offset, value);
	}

	public setInt8(offset: offset<s8>, value: s8): void {
		this.view.setInt8(offset, value);
	}

	public setUint16(offset: offset<u16>, value: u16): void {
		this.assertAlignment(offset, Alignment.halfWord);
		this.view.setUint16(offset, value, true);
	}

	public setInt16(offset: offset<s16>, value: s16): void {
		this.assertAlignment(offset, Alignment.halfWord);
		this.view.setInt16(offset, value, true);
	}

	public setUint32(offset: offset<u32>, value: u32): void {
		this.assertAlignment(offset, Alignment.word);
		this.view.setUint32(offset, value, true);
	}

	public setInt32(offset: offset<s32>, value: s32): void {
		this.assertAlignment(offset, Alignment.word);
		this.view.setInt32(offset, value, true);
	}

	public setUint64(offset: offset<u64>, value: u64): void {
		this.assertAlignment(offset, Alignment.doubleWord);
		this.view.setBigUint64(offset, value, true);
	}

	public setInt64(offset: offset<s64>, value: s64): void {
		this.assertAlignment(offset, Alignment.doubleWord);
		this.view.setBigInt64(offset, value, true);
	}

	public setFloat32(offset: offset<f32>, value: f32): void {
		this.assertAlignment(offset, Alignment.word);
		this.view.setFloat32(offset, value, true);
	}

	public setFloat64(offset: offset<f64>, value: f64): void {
		this.assertAlignment(offset, Alignment.doubleWord);
		this.view.setFloat64(offset, value, true);
	}

	public setPtr(offset: offset<ptr>, value: ptr): void {
		this.assertAlignment(offset, Alignment.word);
		this.view.setUint32(offset, value, true);
	}

	public getUint8View(offset: offset, length?: size | undefined): Uint8Array {
		return this.getArrayView(offset, length, Uint8Array);
	}

	public getInt8View(offset: offset, length?: size | undefined): Int8Array {
		return this.getArrayView(offset, length, Int8Array);
	}

	public getUint16View(offset: offset, length?: size | undefined): Uint16Array {
		return this.getArrayView(offset, length, Uint16Array);
	}

	public getInt16View(offset: offset, length?: size | undefined): Int16Array {
		return this.getArrayView(offset, length, Int16Array);
	}

	public getUint32View(offset: offset, length?: size | undefined): Uint32Array {
		return this.getArrayView(offset, length, Uint32Array);
	}

	public getInt32View(offset: offset, length?: size | undefined): Int32Array {
		return this.getArrayView(offset, length, Int32Array);
	}

	public getUint64View(offset: offset, length?: size | undefined): BigUint64Array {
		return this.getBigArrayView(offset, length, BigUint64Array);
	}

	public getInt64View(offset: offset, length?: size | undefined): BigInt64Array {
		return this.getBigArrayView(offset, length, BigInt64Array);
	}

	public getFloat32View(offset: offset, length?: size | undefined): Float32Array {
		return this.getArrayView(offset, length, Float32Array);
	}

	public getFloat64View(offset: offset, length?: size | undefined): Float64Array {
		return this.getArrayView(offset, length, Float64Array);
	}

	public setUint8Array(offset: offset, bytes: Uint8Array): void {
		this.setArray(offset, bytes, Uint8Array);
	}

	public setInt8Array(offset: offset, bytes: Int8Array): void {
		this.setArray(offset, bytes, Int8Array);
	}

	public setUint16Array(offset: offset, bytes: Uint16Array): void {
		this.setArray(offset, bytes, Uint16Array);
	}

	public setInt16Array(offset: offset, bytes: Int16Array): void {
		this.setArray(offset, bytes, Int16Array);
	}

	public setUint32Array(offset: offset, bytes: Uint32Array): void {
		this.setArray(offset, bytes, Uint32Array);
	}

	public setInt32Array(offset: offset, bytes: Int32Array): void {
		this.setArray(offset, bytes, Int32Array);
	}

	public setUint64Array(offset: offset, bytes: BigUint64Array): void {
		this.setBigArray(offset, bytes, BigUint64Array);
	}

	public setInt64Array(offset: offset, bytes: BigInt64Array): void {
		this.setBigArray(offset, bytes, BigInt64Array);
	}

	public setFloat32Array(offset: offset, bytes: Float32Array): void {
		this.setArray(offset, bytes, Float32Array);
	}

	public setFloat64Array(offset: offset, bytes: Float64Array): void {
		this.setArray(offset, bytes, Float64Array);
	}

	private getArrayView<T extends ArrayLike<number> & { set(array: ArrayLike<number>, offset?: number): void }>(byteOffset: offset, length: size | undefined, clazz: ArrayClazz<T>): T {
		length = length ?? (this.size - byteOffset) / clazz.BYTES_PER_ELEMENT;
		if (!Number.isInteger(length)) {
			throw new MemoryError(`Length must be an integer value. Got ${length}.`);
		}
		return new clazz(this._memory.buffer, this.ptr + byteOffset, length);
	}

	private getBigArrayView<T extends ArrayLike<bigint> & { set(array: ArrayLike<bigint>, offset?: number): void }>(byteOffset: offset, length: size | undefined, clazz: BigArrayClazz<T>): T {
		length = length ?? (this.size - byteOffset) / clazz.BYTES_PER_ELEMENT;
		if (!Number.isInteger(length)) {
			throw new MemoryError(`Length must be an integer value. Got ${length}.`);
		}
		return new clazz(this._memory.buffer, this.ptr + byteOffset, length);
	}

	private setArray<T extends ArrayLike<number> & { set(array: ArrayLike<number>, offset?: number): void }>(byteOffset: offset, bytes: T, clazz: ArrayClazz<T>): void {
		new clazz(this._memory.buffer, this.ptr + byteOffset, bytes.length).set(bytes);
	}

	private setBigArray<T extends ArrayLike<bigint> & { set(array: ArrayLike<bigint>, offset?: number): void }>(byteOffset: offset, bytes: T, clazz: BigArrayClazz<T>): void {
		new clazz(this._memory.buffer, this.ptr + byteOffset, bytes.length).set(bytes);
	}
}

/**
 * A memory of size 0. Doesn't allow any kind of operation on it.
 */
class NullMemory implements Memory {
	readonly id: string = 'b60336d2-c856-4767-af3b-f66e1ab6c507';
	readonly buffer: ArrayBuffer = new ArrayBuffer(0);
	alloc(): MemoryRange {
		throw new MemoryError('Cannot allocate memory on a null memory.');
	}
	realloc(): MemoryRange {
		throw new MemoryError('Cannot re-allocate memory on a null memory.');
	}
	preAllocated(): MemoryRange {
		throw new MemoryError('Cannot point to pre-allocate memory on a null memory.');
	}
	readonly(): ReadonlyMemoryRange {
		throw new MemoryError('Cannot point to readonly memory on a null memory.');
	}
	free(): void {
		throw new MemoryError('Cannot free memory on a null memory.');
	}
}

export type MemoryExports = {
	memory: { buffer: ArrayBuffer };
	cabi_realloc: (orig: ptr, orig_size: size, orig_align: size, new_size: size) => ptr;
};

export namespace Memory {
	export const Null = new NullMemory();

	export class Default implements Memory {

		public readonly id: string;
		private readonly memory: MemoryExports['memory'];
		private readonly cabi_realloc: MemoryExports['cabi_realloc'];

		constructor(exports: Record<string, any>, id?: string) {
			if (exports.memory === undefined || exports.cabi_realloc === undefined) {
				throw new MemoryError('The exports object must contain a memory object and a cabi_realloc function.');
			}
			this.id = id ?? uuid.v4();
			this.memory = exports.memory;
			this.cabi_realloc = exports.cabi_realloc;
		}

		public get buffer(): ArrayBuffer {
			return this.memory.buffer;
		}

		alloc(align: Alignment, size: number): MemoryRange {
			const ptr = this.cabi_realloc(0, 0, align, size);
			return new MemoryRange(this, ptr, size);
		}

		realloc(range: MemoryRange, newSize: size): MemoryRange {
			const ptr = this.cabi_realloc(range.ptr, range.size, range.alignment, newSize);
			return new MemoryRange(this, ptr, newSize);
		}

		preAllocated(ptr: ptr, size: size): MemoryRange {
			return new MemoryRange(this, ptr, size);
		}
		readonly(ptr: ptr, size: size): ReadonlyMemoryRange {
			return new ReadonlyMemoryRange(this, ptr, size);
		}
	}
}

export type Encodings = 'utf-8' | 'utf-16' | 'latin1+utf-16';
export interface Options {
	encoding: Encodings;
	keepOption?: boolean;
}
export namespace Options {
	export function is(value: any): value is Options {
		const candidate = value as Options;
		return candidate && typeof candidate.encoding === 'string' && (candidate.keepOption === undefined || typeof candidate.keepOption === 'boolean');
	}
}

export enum FlatTypeKind {
	i32 = 'i32',
	i64 = 'i64',
	f32 = 'f32',
	f64 = 'f64'
}
// Internally flat types integers are always store as unsigned ints.
export interface FlatType<F extends i32 | i64 | f32 | f64> {
	readonly kind: FlatTypeKind;
	readonly size: size;
	readonly alignment: Alignment;
	// Loads a flat value directly from the memory buffer
	load(memory: ReadonlyMemoryRange, offset: offset): F;
	// Stores a flat value directly into the memory buffer
	store(memory: MemoryRange, offset: offset, value: F): void;
	// copy a flat value from one memory to another
	copy(dest: MemoryRange, dest_offset: offset, src: ReadonlyMemoryRange, src_offset: offset): void;
}

export type i32 = number;
namespace $i32 {
	export const kind: FlatTypeKind = FlatTypeKind.i32;
	export const size = 4;
	export const alignment: Alignment = Alignment.word;

	export function load(memory: ReadonlyMemoryRange, offset: offset<i32>): i32 {
		return memory.getUint32(offset);
	}
	export function store(memory: MemoryRange, offset: offset<i32>, value: i32): void {
		memory.setUint32(offset, value);
	}
	export function copy(dest: MemoryRange, dest_offset: offset<i32>, src: ReadonlyMemoryRange, src_offset: offset<i32>): void {
		dest.assertAlignment(dest_offset, alignment);
		src.assertAlignment(src_offset, alignment);
		src.copyBytes(src_offset, size, dest, dest_offset);
	}
}
export const i32: FlatType<i32> = $i32;

export type i64 = bigint;
namespace $i64 {
	export const kind: FlatTypeKind = FlatTypeKind.i64;
	export const size = 8;
	export const alignment: Alignment = Alignment.doubleWord;

	export function load(memory: ReadonlyMemoryRange, offset: offset<i64>): i64 {
		return memory.getUint64(offset);
	}
	export function store(memory: MemoryRange, offset: offset<i64>, value: i64): void {
		memory.setUint64(offset, value);
	}
	export function copy(dest: MemoryRange, dest_offset: offset<i64>, src: ReadonlyMemoryRange, src_offset: offset<i64>): void {
		dest.assertAlignment(dest_offset, alignment);
		src.assertAlignment(src_offset, alignment);
		src.copyBytes(src_offset, size, dest, dest_offset);
	}
}
export const i64: FlatType<i64> = $i64;

export type f32 = number;
namespace $f32 {
	export const kind: FlatTypeKind = FlatTypeKind.f32;
	export const size = 4;
	export const alignment:Alignment = Alignment.word;

	export function load(memory: ReadonlyMemoryRange, offset: offset<f32>): f32 {
		return memory.getFloat32(offset);
	}
	export function store(memory: MemoryRange, offset: offset<f32>, value: f32): void {
		memory.setFloat32(offset, value);
	}
	export function copy(dest: MemoryRange, dest_offset: offset<f32>, src: ReadonlyMemoryRange, src_offset: offset<f32>): void {
		dest.assertAlignment(dest_offset, alignment);
		src.assertAlignment(src_offset, alignment);
		src.copyBytes(src_offset, size, dest, dest_offset);
	}
}
export const f32: FlatType<f32> = $f32;

export type f64 = number;
namespace $f64 {
	export const kind: FlatTypeKind = FlatTypeKind.f64;
	export const size = 8;
	export const alignment: Alignment = Alignment.doubleWord;

	export function load(memory: ReadonlyMemoryRange, offset: offset<f64>): f64 {
		return memory.getFloat64(offset);
	}
	export function store(memory: MemoryRange, offset: offset<f64>, value: f64): void {
		memory.setFloat64(offset, value);
	}
	export function copy(dest: MemoryRange, dest_offset: offset<f64>, src: ReadonlyMemoryRange, src_offset: offset<f64>): void {
		dest.assertAlignment(dest_offset, alignment);
		src.assertAlignment(src_offset, alignment);
		src.copyBytes(src_offset, size, dest, dest_offset);
	}
}
export const f64: FlatType<f64> = $f64;

export type WasmType = i32 | i64 | f32 | f64;
type GenericFlatType = FlatType<WasmType>;

export class FlatTuple {

	private readonly types: readonly GenericFlatType[];

	public readonly alignment: Alignment;
	public readonly size: size;

	constructor(types: readonly GenericFlatType[]) {
		this.types = types;
		this.alignment = FlatTuple.alignment(types);
		this.size = FlatTuple.size(types, this.alignment);
	}

	public load(memory: ReadonlyMemoryRange, offset: size): readonly WasmType[] {
		memory.assertAlignment(offset, this.alignment);
		const result: WasmType[] = [];
		for (const type of this.types) {
			offset = align(offset, type.alignment);
			result.push(type.load(memory, offset));
			offset += type.size;
		}
		return result;
	}

	public alloc(memory: Memory): MemoryRange {
		return memory.alloc(this.alignment, this.size);
	}

	public store(memory: MemoryRange, offset: size, values: readonly WasmType[]): void {
		memory.assertAlignment(offset, this.alignment);
		for (const [index, type] of this.types.entries()) {
			const value = values[index];
			offset = align(offset, type.alignment);
			type.store(memory, offset, value);
			offset += type.size;
		}
	}

	public copy(dest: MemoryRange, dest_offset: size, src: ReadonlyMemoryRange, src_offset: size): void {
		dest.assertAlignment(dest_offset, this.alignment);
		src.assertAlignment(src_offset, this.alignment);
		src.copyBytes(src_offset, this.size, dest, dest_offset);
	}

	private static alignment(types: readonly GenericFlatType[]): Alignment {
		let result: Alignment = Alignment.byte;
		for (const type of types) {
			result = Math.max(result, type.alignment);
		}
		return result;
	}

	private static size(types: readonly GenericFlatType[], tupleAlignment: Alignment): size {
		let result: size = 0;
		for (const type of types) {
			result = align(result, type.alignment);
			result += type.size;
		}
		return align(result, tupleAlignment);
	}
}

namespace WasmTypes {

	const $32 = new DataView(new ArrayBuffer(4));
	const $64 = new DataView(new ArrayBuffer(8));

	export function reinterpret_i32_as_f32(i32: i32): f32 {
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

export type FlatValuesIter = Iterator<WasmType, WasmType>;

class CoerceValueIter implements Iterator<WasmType, WasmType> {

	private index: number;

	constructor(private readonly values: FlatValuesIter, private haveFlatTypes: readonly GenericFlatType[], private wantFlatTypes: readonly GenericFlatType[]) {
		if (haveFlatTypes.length < wantFlatTypes.length) {
			throw new ComponentModelTrap(`Invalid coercion: have ${haveFlatTypes.length} values, want ${wantFlatTypes.length} values`);
		}
		this.index = 0;
	}

	next(): IteratorResult<WasmType, WasmType> {
		const value = this.values.next();
		if (value.done) {
			return value;
		}
		const haveType = this.haveFlatTypes[this.index];
		const wantType = this.wantFlatTypes[this.index++];

		if (haveType === $i32 && wantType === $f32) {
			return { done: false, value: WasmTypes.reinterpret_i32_as_f32(value.value as i32) };
		} else if (haveType === $i64 && wantType === $i32) {
			return { done: false, value: WasmTypes.convert_i64_to_i32(value.value as i64) };
		} else if (haveType === $i64 && wantType === $f32) {
			return { done: false, value: WasmTypes.reinterpret_i64_as_f32(value.value as i64) };
		} else if (haveType === $i64 && wantType === $f64) {
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
	readonly resources: ResourceManagers;
}
export namespace ComponentModelContext {
	export function is(value: any): value is ComponentModelContext {
		const candidate = value as ComponentModelContext;
		return candidate && Options.is(candidate.options) && ResourceManagers.is(candidate.resources);
	}
}

export interface ComponentModelType<J> {
	readonly kind : ComponentModelTypeKind;
	readonly size: number;
	readonly alignment: Alignment;
	readonly flatTypes: ReadonlyArray<GenericFlatType>;
	// Loads a component model value directly from the memory buffer
	load(memory: ReadonlyMemoryRange, offset: offset, context: ComponentModelContext): J;
	// Loads a component model value from a flattened array
	liftFlat(memory: Memory, values: FlatValuesIter, context: ComponentModelContext): J;
	// Allocates a new component model value in the memory buffer
	alloc(memory: Memory): MemoryRange;
	// Stores a component model value directly into the memory buffer
	store(memory: MemoryRange, offset: offset, value: J, context: ComponentModelContext): void;
	// Stores a component model value into a flattened array
	lowerFlat(result: WasmType[], memory: Memory, value: J, context: ComponentModelContext): void;
	// copy a component model value from one memory to another
	copy(dest: MemoryRange, dest_offset: offset, src: ReadonlyMemoryRange, src_offset: offset, context: ComponentModelContext): void;
	// copy a component model value from a flattened array to another
	copyFlat(result: WasmType[], dest: Memory, values: FlatValuesIter, src: Memory, context: ComponentModelContext): void;
}
namespace ComponentModelType {
	export function satisfies<T extends JType>(_value: ComponentModelType<T> & { Error: ResultErrorConstructor<T> }): void {
		// This is for pure Type checking.
	}
}
export type AnyComponentModelType = ComponentModelType<JType>;

export class ResultError<V extends JType> extends Error {
	public readonly value: V;
	constructor(value: V, message: string) {
		super(message);
		this.value = value;
	}
}
interface ResultErrorConstructor<V extends JType> {
	new(value: V): ResultError<V>;
}

export type bool = number;
export namespace bool {
	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.bool;
	export const size: number = 1;
	export const alignment: Alignment = Alignment.byte;
	export const flatTypes: ReadonlyArray<GenericFlatType> = [$i32];

	export function load(memory: ReadonlyMemoryRange, offset: offset<bool>): boolean {
		return memory.getUint8(offset) !== 0;
	}

	export function liftFlat(_memory: Memory, values: FlatValuesIter): boolean {
		const value = values.next().value;
		if (value < 0) {
			throw new ComponentModelTrap(`Invalid bool value ${value}`);
		}
		return value !== 0;
	}

	export function alloc(memory: Memory): MemoryRange {
		return memory.alloc(alignment, size);
	}

	export function store(memory: MemoryRange, offset: offset<bool>, value: boolean): void {
		memory.setUint8(offset, value ? 1 : 0);
	}

	export function lowerFlat(result: WasmType[], _memory: Memory, value: boolean): void {
		result.push(value ? 1 : 0);
	}

	export function copy(dest: MemoryRange, dest_offset: offset<bool>, src: ReadonlyMemoryRange, src_offset: offset<bool>): void {
		src.copyBytes(src_offset, bool.size, dest, dest_offset);
	}

	export function copyFlat(result: WasmType[], _dest: Memory, values: FlatValuesIter, _src: Memory): void {
		result.push(values.next().value);
	}

	export class Error extends ResultError<boolean> {
		constructor(value: boolean) {
			super(value, `Error value: ${value}`);
		}
	}
}
ComponentModelType.satisfies(bool);

export type u8 = number;
export namespace u8 {
	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.u8;
	export const size = 1;
	export const alignment: Alignment = Alignment.byte;
	export const flatTypes: ReadonlyArray<GenericFlatType> = [$i32];

	export const LOW_VALUE = 0;
	export const HIGH_VALUE = 255;

	export function load(memory: ReadonlyMemoryRange, offset: offset<u8>): u8 {
		return memory.getUint8(offset);
	}

	export function liftFlat(_memory: Memory, values: FlatValuesIter): u8 {
		const value = values.next().value;
		if (value < LOW_VALUE || value > HIGH_VALUE || !Number.isInteger(value)) {
			throw new ComponentModelTrap(`Invalid u8 value ${value}`);
		}
		return value as u8;
	}

	export function alloc(memory: Memory): MemoryRange {
		return memory.alloc(alignment, size);
	}

	export function store(memory: MemoryRange, offset: offset<u8>, value: u8): void {
		memory.setUint8(offset, value);
	}

	export function lowerFlat(result: WasmType[], _memory: Memory, value: u8): void {
		if (value < LOW_VALUE || value > HIGH_VALUE || !Number.isInteger(value)) {
			throw new ComponentModelTrap(`Invalid u8 value ${value}`);
		}
		result.push(value);
	}

	export function copy(dest: MemoryRange, dest_offset: offset<u8>, src: ReadonlyMemoryRange, src_offset: offset<u8>): void {
		src.copyBytes(src_offset, size, dest, dest_offset);
	}

	export function copyFlat(result: WasmType[], _dest: Memory, values: FlatValuesIter, _src: Memory): void {
		result.push(values.next().value);
	}

	export class Error extends ResultError<u8> {
		constructor(value: u8) {
			super(value, `Error value: ${value}`);
		}
	}
}
ComponentModelType.satisfies(u8);

export type u16 = number;
export namespace u16 {
	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.u16;
	export const size = 2;
	export const alignment: Alignment = Alignment.halfWord;
	export const flatTypes: ReadonlyArray<GenericFlatType> = [$i32];

	export const LOW_VALUE = 0;
	export const HIGH_VALUE = 65535;

	export function load(memory: ReadonlyMemoryRange, offset: offset<u16>): u16 {
		return memory.getUint16(offset);
	}

	export function liftFlat(_memory: Memory, values:FlatValuesIter): u16 {
		const value = values.next().value;
		if (value < LOW_VALUE || value > HIGH_VALUE || !Number.isInteger(value)) {
			throw new ComponentModelTrap(`Invalid u16 value ${value}`);
		}
		return value as u16;
	}

	export function alloc(memory: Memory): MemoryRange {
		return memory.alloc(alignment, size);
	}

	export function store(memory: MemoryRange, offset: offset<u16>, value: u16): void {
		memory.setUint16(offset, value);
	}

	export function lowerFlat(result: WasmType[], _memory: Memory, value: number): void {
		if (value < LOW_VALUE || value > HIGH_VALUE || !Number.isInteger(value)) {
			throw new ComponentModelTrap(`Invalid u16 value ${value}`);
		}
		result.push(value);
	}

	export function copy(dest: MemoryRange, dest_offset: offset<u16>, src: ReadonlyMemoryRange, src_offset: offset<u16>): void {
		dest.assertAlignment(dest_offset, alignment);
		src.assertAlignment(src_offset, alignment);
		src.copyBytes(src_offset, size, dest, dest_offset);
	}
	export function copyFlat(result: WasmType[], _dest: Memory, values: FlatValuesIter, _src: Memory): void {
		result.push(values.next().value);
	}

	export class Error extends ResultError<u16> {
		constructor(value: u16) {
			super(value, `Error value: ${value}`);
		}
	}
}
ComponentModelType.satisfies(u16);

export type u32 = number;
export namespace u32 {
	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.u32;
	export const size = 4;
	export const alignment: Alignment = Alignment.word;
	export const flatTypes: ReadonlyArray<GenericFlatType> = [$i32];

	export const LOW_VALUE = 0;
	export const HIGH_VALUE = 4294967295; // 2 ^ 32 - 1

	export function valid(value: u32): boolean {
		return value >= LOW_VALUE && value <= HIGH_VALUE && Number.isInteger(value);
	}

	export function load(memory: ReadonlyMemoryRange, offset: offset<u32>): u32 {
		return memory.getUint32(offset);
	}

	export function liftFlat(_memory: Memory, values: FlatValuesIter): u32 {
		const value = values.next().value;
		if (value < LOW_VALUE || value > HIGH_VALUE || !Number.isInteger(value)) {
			throw new ComponentModelTrap(`Invalid u32 value ${value}`);
		}
		return value as u32;
	}

	export function alloc(memory: Memory): MemoryRange {
		return memory.alloc(alignment, size);
	}

	export function store(memory: MemoryRange, offset: offset<u32>, value: u32): void {
		memory.setUint32(offset, value);
	}

	export function lowerFlat(result: WasmType[], _memory: Memory, value: number): void {
		if (value < LOW_VALUE || value > HIGH_VALUE || !Number.isInteger(value)) {
			throw new ComponentModelTrap(`Invalid u32 value ${value}`);
		}
		result.push(value);
	}

	export function copy(dest: MemoryRange, dest_offset: offset<u32>, src: ReadonlyMemoryRange, src_offset: offset<u32>): void {
		dest.assertAlignment(dest_offset, alignment);
		src.assertAlignment(src_offset, alignment);
		src.copyBytes(src_offset, size, dest, dest_offset);
	}

	export function copyFlat(result: WasmType[], _dest: Memory, values: FlatValuesIter, _src: Memory): void {
		result.push(values.next().value);
	}

	export class Error extends ResultError<u32> {
		constructor(value: u32) {
			super(value, `Error value: ${value}`);
		}
	}
}
ComponentModelType.satisfies(u32);

export type u64 = bigint;
export namespace u64 {
	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.u64;
	export const size = 8;
	export const alignment: Alignment = Alignment.doubleWord;
	export const flatTypes: ReadonlyArray<GenericFlatType> = [$i64];

	export const LOW_VALUE = 0n;
	export const HIGH_VALUE = 18446744073709551615n; // 2 ^ 64 - 1

	export function load(memory: ReadonlyMemoryRange, offset: offset<u64>): u64 {
		return memory.getUint64(offset);
	}

	export function liftFlat(_memory: Memory, values: FlatValuesIter): u64 {
		const value = values.next().value;
		if (value < LOW_VALUE) {
			throw new ComponentModelTrap(`Invalid u64 value ${value}`);
		}
		return value as u64;
	}

	export function alloc(memory: Memory): MemoryRange {
		return memory.alloc(alignment, size);
	}

	export function store(memory: MemoryRange, offset: offset<u64>, value: u64): void {
		memory.setUint64(offset, value);
	}

	export function lowerFlat(result: WasmType[], _memory: Memory, value: bigint): void {
		if (value < LOW_VALUE) {
			throw new ComponentModelTrap(`Invalid u64 value ${value}`);
		}
		result.push(value);
	}

	export function copy(dest: MemoryRange, dest_offset: offset<u64>, src: ReadonlyMemoryRange, src_offset: offset<u64>): void {
		dest.assertAlignment(dest_offset, alignment);
		src.assertAlignment(src_offset, alignment);
		src.copyBytes(src_offset, size, dest, dest_offset);
	}

	export function copyFlat(result: WasmType[], _dest: Memory, values: FlatValuesIter, _src: Memory): void {
		result.push(values.next().value);
	}

	export class Error extends ResultError<u64> {
		constructor(value: u64) {
			super(value, `Error value: ${value}`);
		}
	}
}
ComponentModelType.satisfies(u64);

export type s8 = number;
export namespace s8 {
	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.s8;
	export const size = 1;
	export const alignment: Alignment = Alignment.byte;
	export const flatTypes: ReadonlyArray<GenericFlatType> = [$i32];

	const LOW_VALUE = -128;
	const HIGH_VALUE = 127;

	export function load(memory: ReadonlyMemoryRange, offset: offset<s8>): s8 {
		return memory.getInt8(offset);
	}

	export function liftFlat(_memory: Memory, values: FlatValuesIter): s8 {
		let value = values.next().value as number;
		if (!Number.isInteger(value)) {
			throw new ComponentModelTrap(`Invalid s8 value ${value}`);
		}
		// All int values in the component model are transferred as unsigned
		// values. So for signed values we need to convert them back.
		if (value > HIGH_VALUE) {
			value = value - 256;
		}
		if (value < LOW_VALUE || value > HIGH_VALUE) {
			throw new ComponentModelTrap(`Invalid s8 value ${value}`);
		}
		return value as s8;
	}

	export function alloc(memory: Memory): MemoryRange {
		return memory.alloc(alignment, size);
	}

	export function store(memory: MemoryRange, offset: offset<s8>, value: s8): void {
		memory.setInt8(offset, value);
	}

	export function lowerFlat(result: WasmType[], _memory: Memory, value: number): void {
		if (value < LOW_VALUE || value > HIGH_VALUE || !Number.isInteger(value)) {
			throw new ComponentModelTrap(`Invalid s8 value ${value}`);
		}
		result.push((value < 0) ? (value + 256) : value);
	}

	export function copy(dest: MemoryRange, dest_offset: offset<u64>, src: ReadonlyMemoryRange, src_offset: offset<u64>): void {
		dest.assertAlignment(dest_offset, alignment);
		src.assertAlignment(src_offset, alignment);
		src.copyBytes(src_offset, size, dest, dest_offset);
	}

	export function copyFlat(result: WasmType[], _dest: Memory, values: FlatValuesIter, _src: Memory): void {
		result.push(values.next().value);
	}

	export class Error extends ResultError<s8> {
		constructor(value: s8) {
			super(value, `Error value: ${value}`);
		}
	}
}
ComponentModelType.satisfies(s8);

export type s16 = number;
export namespace s16 {
	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.s16;
	export const size = 2;
	export const alignment: Alignment = Alignment.halfWord;
	export const flatTypes: ReadonlyArray<GenericFlatType> = [$i32];

	const LOW_VALUE = -32768; // -2 ^ 15
	const HIGH_VALUE = 32767; // 2 ^ 15 - 1

	export function load(memory: ReadonlyMemoryRange, offset: offset<16>): s16 {
		return memory.getInt16(offset);
	}

	export function liftFlat(_memory: Memory, values: FlatValuesIter): s16 {
		let value = values.next().value as number;
		if (!Number.isInteger(value)) {
			throw new ComponentModelTrap(`Invalid s16 value ${value}`);
		}
		// See comment in s8.liftFlat
		if (value > HIGH_VALUE) {
			value = value - 65536;
		}
		if (value < LOW_VALUE || value > HIGH_VALUE) {
			throw new ComponentModelTrap(`Invalid s16 value ${value}`);
		}
		return value as s16;
	}

	export function alloc(memory: Memory): MemoryRange {
		return memory.alloc(alignment, size);
	}

	export function store(memory: MemoryRange, offset: offset<s16>, value: s16): void {
		memory.setInt16(offset, value);
	}

	export function lowerFlat(result: WasmType[], _memory: Memory, value: number): void {
		if (value < LOW_VALUE || value > HIGH_VALUE || !Number.isInteger(value)) {
			throw new ComponentModelTrap(`Invalid s16 value ${value}`);
		}
		result.push((value < 0) ? (value + 65536) : value);
	}

	export function copy(dest: MemoryRange, dest_offset: offset<s16>, src: ReadonlyMemoryRange, src_offset: offset<s16>): void {
		dest.assertAlignment(dest_offset, alignment);
		src.assertAlignment(src_offset, alignment);
		src.copyBytes(src_offset, size, dest, dest_offset);
	}

	export function copyFlat(result: WasmType[], _dest: Memory, values: FlatValuesIter, _src: Memory): void {
		result.push(values.next().value);
	}

	export class Error extends ResultError<s16> {
		constructor(value: s16) {
			super(value, `Error value: ${value}`);
		}
	}
}
ComponentModelType.satisfies(s16);

export type s32 = number;
export namespace s32 {
	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.s32;
	export const size = 4;
	export const alignment: Alignment = Alignment.word;
	export const flatTypes: ReadonlyArray<GenericFlatType> = [$i32];

	const LOW_VALUE = -2147483648; // -2 ^ 31
	const HIGH_VALUE = 2147483647; // 2 ^ 31 - 1

	export function load(memory: ReadonlyMemoryRange, offset: offset<32>): s32 {
		return memory.getInt32(offset);
	}

	export function liftFlat(_memory: Memory, values: FlatValuesIter): s32 {
		let value = values.next().value as number;
		if (!Number.isInteger(value)) {
			throw new ComponentModelTrap(`Invalid s32 value ${value}`);
		}
		// See comment in s8.liftFlat
		if (value > HIGH_VALUE) {
			value = (value as u32) - 4294967296;
		}
		if (value < LOW_VALUE || value > HIGH_VALUE) {
			throw new ComponentModelTrap(`Invalid s32 value ${value}`);
		}
		return value;
	}

	export function alloc(memory: Memory): MemoryRange {
		return memory.alloc(alignment, size);
	}

	export function store(memory: MemoryRange, offset: offset<32>, value: s32): void {
		memory.setInt32(offset, value);
	}

	export function lowerFlat(result: WasmType[], _memory: Memory, value: number): void {
		if (value < LOW_VALUE || value > HIGH_VALUE || !Number.isInteger(value)) {
			throw new ComponentModelTrap(`Invalid s32 value ${value}`);
		}
		result.push((value < 0) ? (value + 4294967296) : value);
	}

	export function copy(dest: MemoryRange, dest_offset: offset<s32>, src: ReadonlyMemoryRange, src_offset: offset<s32>): void {
		dest.assertAlignment(dest_offset, alignment);
		src.assertAlignment(src_offset, alignment);
		src.copyBytes(src_offset, size, dest, dest_offset);
	}

	export function copyFlat(result: WasmType[], _dest: Memory, values: FlatValuesIter, _src: Memory): void {
		result.push(values.next().value);
	}

	export class Error extends ResultError<s32> {
		constructor(value: s32) {
			super(value, `Error value: ${value}`);
		}
	}
}
ComponentModelType.satisfies(s32);

export type s64 = bigint;
export namespace s64 {
	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.s64;
	export const size = 8;
	export const alignment: Alignment = Alignment.doubleWord;
	export const flatTypes: ReadonlyArray<GenericFlatType> = [$i64];

	const LOW_VALUE = -9223372036854775808n; // -2 ^ 63
	const HIGH_VALUE = 9223372036854775807n; // 2 ^ 63 - 1

	export function load(memory: ReadonlyMemoryRange, offset: offset<s64>): s64 {
		return memory.getInt64(offset);
	}

	export function liftFlat(_memory: Memory, values: FlatValuesIter): s64 {
		let value = values.next().value;
		if (typeof value !== 'bigint') {
			throw new ComponentModelTrap(`Invalid s64 value ${value}`);
		}
		// See comment in s8.liftFlat
		if (value > HIGH_VALUE) {
			value = value - 18446744073709551616n;
		}
		if (value < LOW_VALUE || value > HIGH_VALUE) {
			throw new ComponentModelTrap(`Invalid s64 value ${value}`);
		}
		return value;
	}

	export function alloc(memory: Memory): MemoryRange {
		return memory.alloc(alignment, size);
	}

	export function store(memory: MemoryRange, offset: offset<s64>, value: s64): void {
		memory.setInt64(offset, value);
	}

	export function lowerFlat(result: WasmType[], _memory: Memory, value: bigint): void {
		if (value < LOW_VALUE || value > HIGH_VALUE) {
			throw new ComponentModelTrap(`Invalid s64 value ${value}`);
		}
		result.push((value < 0) ? (value + 18446744073709551616n) : value);
	}

	export function copy(dest: MemoryRange, dest_offset: offset<s64>, src: ReadonlyMemoryRange, src_offset: offset<s64>): void {
		dest.assertAlignment(dest_offset, alignment);
		src.assertAlignment(src_offset, alignment);
		src.copyBytes(src_offset, size, dest, dest_offset);
	}

	export function copyFlat(result: WasmType[], _dest: Memory, values: FlatValuesIter, _src: Memory): void {
		result.push(values.next().value);
	}

	export class Error extends ResultError<s64> {
		constructor(value: s64) {
			super(value, `Error value: ${value}`);
		}
	}
}
ComponentModelType.satisfies(s64);

export type float32 = number;
export namespace float32 {
	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.float32;
	export const size = 4;
	export const alignment:Alignment = Alignment.word;
	export const flatTypes: ReadonlyArray<GenericFlatType> = [$f32];

	const LOW_VALUE = -3.4028234663852886e+38;
	const HIGH_VALUE = 3.4028234663852886e+38;
	const NAN = 0x7fc00000;

	export function load(memory: ReadonlyMemoryRange, offset: offset<float32>): float32 {
		return memory.getFloat32(offset);
	}

	export function liftFlat(_memory: Memory, values: FlatValuesIter): float32 {
		const value = values.next().value;
		if (value < LOW_VALUE || value > HIGH_VALUE) {
			throw new ComponentModelTrap(`Invalid float32 value ${value}`);
		}
		return value === NAN ? Number.NaN : value as float32;
	}

	export function alloc(memory: Memory): MemoryRange {
		return memory.alloc(alignment, size);
	}

	export function store(memory: MemoryRange, offset: offset<float32>, value: float32): void {
		memory.setFloat32(offset, value);
	}

	export function lowerFlat(result: WasmType[], _memory: Memory, value: number): void {
		if (value < LOW_VALUE || value > HIGH_VALUE) {
			throw new ComponentModelTrap(`Invalid float32 value ${value}`);
		}
		result.push(Number.isNaN(value) ? NAN : value);
	}

	export function copy(dest: MemoryRange, dest_offset: offset<float32>, src: ReadonlyMemoryRange, src_offset: offset<float32>): void {
		dest.assertAlignment(dest_offset, alignment);
		src.assertAlignment(src_offset, alignment);
		src.copyBytes(src_offset, size, dest, dest_offset);
	}

	export function copyFlat(result: WasmType[], _dest: Memory, values: FlatValuesIter, _src: Memory): void {
		result.push(values.next().value);
	}

	export class Error extends ResultError<float32> {
		constructor(value: float32) {
			super(value, `Error value: ${value}`);
		}
	}
}
ComponentModelType.satisfies(float32);

export type float64 = number;
export namespace float64 {
	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.float64;
	export const size = 8;
	export const alignment: Alignment = Alignment.doubleWord;
	export const flatTypes: ReadonlyArray<GenericFlatType> = [$f64];

	const LOW_VALUE = -1 * Number.MAX_VALUE;
	const HIGH_VALUE = Number.MAX_VALUE;
	const NAN = 0x7ff8000000000000;

	export function load(memory: ReadonlyMemoryRange, offset: offset<float64>): float64 {
		return memory.getFloat64(offset);
	}

	export function liftFlat(_memory: Memory, values: FlatValuesIter): float64 {
		const value = values.next().value;
		if (value < LOW_VALUE || value > HIGH_VALUE) {
			throw new ComponentModelTrap(`Invalid float64 value ${value}`);
		}
		return value === NAN ? Number.NaN : value as float64;
	}

	export function alloc(memory: Memory): MemoryRange {
		return memory.alloc(alignment, size);
	}

	export function store(memory: MemoryRange, offset: offset<float64>, value: float64): void {
		memory.setFloat64(offset, value);
	}

	export function lowerFlat(result: WasmType[], _memory: Memory, value: number): void {
		if (value < LOW_VALUE || value > HIGH_VALUE) {
			throw new ComponentModelTrap(`Invalid float64 value ${value}`);
		}
		result.push(Number.isNaN(value) ? NAN : value);
	}

	export function copy(dest: MemoryRange, dest_offset: offset<float64>, src: ReadonlyMemoryRange, src_offset: offset<float64>): void {
		dest.assertAlignment(dest_offset, alignment);
		src.assertAlignment(src_offset, alignment);
		src.copyBytes(src_offset, size, dest, dest_offset);
	}

	export function copyFlat(result: WasmType[], _dest: Memory, values: FlatValuesIter, _src: Memory): void {
		result.push(values.next().value);
	}

	export class Error extends ResultError<float64> {
		constructor(value: float64) {
			super(value, `Error value: ${value}`);
		}
	}
}
ComponentModelType.satisfies(float64);

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
	copy: u8.copy,
	copyFlat: u8.copyFlat
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
	copy: u32.copy,
	copyFlat: u32.copyFlat
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
	copy: u32.copy,
	copyFlat: u32.copyFlat
};

export namespace char {
	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.char;
	export const size = 4;
	export const alignment: Alignment = Alignment.word;
	export const flatTypes: ReadonlyArray<GenericFlatType> = [$i32];

	export function load(memory: ReadonlyMemoryRange, offset: offset<u32>, _context: ComponentModelContext): string {
		return fromCodePoint(u32.load(memory, offset));
	}

	export function liftFlat(memory: Memory, values: FlatValuesIter, _context: ComponentModelContext): string {
		return fromCodePoint(u32.liftFlat(memory, values));
	}

	export function alloc(memory: Memory): MemoryRange {
		return u32.alloc(memory);
	}

	export function store(memory: MemoryRange, offset: offset<u32>, value: string, _context: ComponentModelContext): void {
		u32.store(memory, offset, asCodePoint(value));
	}

	export function lowerFlat(result: WasmType[], memory: Memory, value: string, _context: ComponentModelContext): void {
		u32.lowerFlat(result, memory, asCodePoint(value));
	}

	export function copy(dest: MemoryRange, dest_offset: offset<u32>, src: ReadonlyMemoryRange, src_offset: offset<u32>): void {
		dest.assertAlignment(dest_offset, alignment);
		src.assertAlignment(src_offset, alignment);
		src.copyBytes(src_offset, size, dest, dest_offset);
	}

	export function copyFlat(result: WasmType[], _dest: Memory, values: FlatValuesIter, _src: Memory): void {
		result.push(values.next().value);
	}

	function fromCodePoint(code: u32): string {
		if (code >= 0x110000 || (0xD800 <= code && code <= 0xDFFF)) {
			throw new ComponentModelTrap('Invalid code point');
		}
		return String.fromCodePoint(code);
	}

	function asCodePoint(str: string): u32 {
		if (str.length !== 1) {
			throw new ComponentModelTrap('String length must be 1');
		}
		const code = str.codePointAt(0)!;
		if (!(code <= 0xD7FF || (0xD800 <= code && code <= 0x10FFFF))) {
			throw new ComponentModelTrap('Invalid code point');
		}
		return code;
	}

	export class Error extends ResultError<string> {
		constructor(value: string) {
			super(value, `Error value: ${value}`);
		}
	}
}
ComponentModelType.satisfies(char);

export namespace wstring {

	const offsets = {
		data: 0,
		codeUnits: 4
	};

	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.string;
	export const size = 8;
	export const alignment: Alignment = Alignment.word;
	export const flatTypes: ReadonlyArray<GenericFlatType> = [$i32, $i32];

	export function load(memRange: ReadonlyMemoryRange, offset: offset<[u32, u32]>, context: ComponentModelContext): string {
		const dataPtr: ptr =  memRange.getUint32(offset + offsets.data);
		const codeUnits: u32 = memRange.getUint32(offset + offsets.codeUnits);
		return loadFromRange(memRange.memory, dataPtr, codeUnits, context.options);
	}

	export function liftFlat(memory: Memory, values: FlatValuesIter, context: ComponentModelContext): string {
		const dataPtr: ptr = values.next().value as ptr;
		const codeUnits: u32 = values.next().value as u32;
		return loadFromRange(memory, dataPtr, codeUnits, context.options);
	}

	export function alloc(memory: Memory): MemoryRange {
		return memory.alloc(alignment, size);
	}

	export function store(memory: MemoryRange, offset: offset<[u32, u32]>, str: string, context: ComponentModelContext): void {
		const [ptr, codeUnits] = storeIntoRange(memory.memory, str, context.options);
		memory.setUint32(offset + offsets.data, ptr);
		memory.setUint32(offset + offsets.codeUnits, codeUnits);
	}

	export function lowerFlat(result: WasmType[], memory: Memory, str: string, context: ComponentModelContext): void {
		result.push(...storeIntoRange(memory, str, context.options));
	}

	export function copy(dest: MemoryRange, dest_offset: offset<[u32, u32]>, src: ReadonlyMemoryRange, src_offset: offset<[u32, u32]>, context: ComponentModelContext): void {
		dest.assertAlignment(dest_offset, wstring.alignment);
		src.assertAlignment(src_offset, wstring.alignment);

		// Copy the actual string data
		const data = src.getUint32(src_offset + offsets.data);
		const codeUnits = src.getUint32(src_offset + offsets.codeUnits);
		const [alignment, byteLength] = getAlignmentAndByteLength(codeUnits, context.options);
		const srcReader = src.memory.readonly(data, byteLength);
		const destWriter = dest.memory.alloc(alignment, byteLength);
		srcReader.copyBytes(0, byteLength, destWriter, 0);

		// Store the new data pointer and code units
		dest.setUint32(dest_offset + offsets.data, destWriter.ptr);
		dest.setUint32(dest_offset + offsets.codeUnits, codeUnits);
	}

	export function copyFlat(result: WasmType[], dest: Memory, values: FlatValuesIter, src: Memory, context: ComponentModelContext): void {
		const data = values.next().value as ptr;
		const codeUnits = values.next().value as u32;
		// Copy the actual string data
		const [alignment, byteLength] = getAlignmentAndByteLength(codeUnits, context.options);
		const srcReader = src.readonly(data, byteLength);
		const destWriter = dest.alloc(alignment, byteLength);
		srcReader.copyBytes(0, byteLength, destWriter, 0);
		// Push new ptr and codeUnits
		result.push(destWriter.ptr, codeUnits);
	}

	export function getAlignmentAndByteLength(codeUnits: u32, options: Options): [Alignment, number] {
		const encoding = options.encoding;
		if (encoding === 'latin1+utf-16') {
			throw new ComponentModelTrap('latin1+utf-16 encoding not yet supported');
		}
		if (encoding === 'utf-8') {
			return [u8.alignment, codeUnits];
		} else if (encoding === 'utf-16') {
			return [u16.alignment, codeUnits * 2];
		} else {
			throw new ComponentModelTrap('Unsupported encoding');
		}
	}

	function loadFromRange(memory: Memory, data: ptr, codeUnits: u32, options: Options): string {
		const encoding = options.encoding;
		if (encoding === 'latin1+utf-16') {
			throw new ComponentModelTrap('latin1+utf-16 encoding not yet supported');
		}
		if (encoding === 'utf-8') {
			const byteLength = codeUnits;
			const reader = memory.readonly(data, byteLength);
			return utf8Decoder.decode(reader.getUint8Array(0, byteLength));
		} else if (encoding === 'utf-16') {
			const reader = memory.readonly(data, codeUnits * 2);
			return String.fromCharCode(...reader.getUint16Array(data, codeUnits));
		} else {
			throw new ComponentModelTrap('Unsupported encoding');
		}
	}

	function storeIntoRange(memory: Memory, str: string, options: Options): [ptr, size] {
		const { encoding } = options;
		if (encoding === 'latin1+utf-16') {
			throw new ComponentModelTrap('latin1+utf-16 encoding not yet supported');
		}
		if (encoding === 'utf-8') {
			const data = utf8Encoder.encode(str);
			const writer = memory.alloc(u8.alignment, data.length);
			writer.setUint8Array(0, data);
			return [writer.ptr, data.length];
		} else if (encoding === 'utf-16') {
			const writer = memory.alloc(u16.alignment, str.length * 2);
			const data = writer.getUint16View(0);
			for (let i = 0; i < str.length; i++) {
				data[i] = str.charCodeAt(i);
			}
			return [writer.ptr, data.length];
		} else {
			throw new ComponentModelTrap('Unsupported encoding');
		}
	}

	export class Error extends ResultError<string> {
		constructor(value: string) {
			super(value, `Error value: ${value}`);
		}
	}
}
ComponentModelType.satisfies(wstring);

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
	public readonly flatTypes: ReadonlyArray<GenericFlatType>;

	constructor(elementType: ComponentModelType<T>) {
		this.elementType = elementType;
		this.kind = ComponentModelTypeKind.list;
		this.size = 8;
		this.alignment = Alignment.word;
		this.flatTypes = [$i32, $i32];
	}

	public load(memRange: ReadonlyMemoryRange, offset: offset<[u32, u32]>, context: ComponentModelContext): T[] {
		const offsets = ListType.offsets;
		const dataPtr: ptr =  memRange.getUint32(offset + offsets.data);
		const length: u32 = memRange.getUint32(offset + offsets.length);
		return this.loadFromRange(memRange.memory.readonly(dataPtr, length * this.elementType.size), length, context);
	}

	public liftFlat(memory: Memory, values: FlatValuesIter, context: ComponentModelContext): T[] {
		const dataPtr: ptr = values.next().value as size;
		const length: u32 = values.next().value as u32;
		return this.loadFromRange(memory.readonly(dataPtr, length * this.elementType.size), length, context);
	}

	public alloc(memory: Memory): MemoryRange {
		return memory.alloc(this.alignment, this.size);
	}

	public store(memRange: MemoryRange, offset: offset<[u32, u32]>, values: T[], context: ComponentModelContext): void {
		const elementMemory = memRange.memory.alloc(this.elementType.alignment, this.elementType.size * values.length);
		this.storeIntoRange(elementMemory, values, context);
		const offsets = ListType.offsets;
		memRange.setUint32(offset + offsets.data, elementMemory.ptr);
		memRange.setUint32(offset + offsets.length, values.length);
	}

	public lowerFlat(result: WasmType[], memory: Memory, values: T[], context: ComponentModelContext): void {
		const elementMemory = memory.alloc(this.elementType.alignment, this.elementType.size * values.length);
		this.storeIntoRange(elementMemory, values, context);
		result.push(elementMemory.ptr, values.length);
	}

	public copy(dest: MemoryRange, dest_offset: offset<[u32, u32]>, src: ReadonlyMemoryRange, src_offset: offset<[u32, u32]>): void {
		dest.assertAlignment(dest_offset, this.alignment);
		src.assertAlignment(src_offset, this.alignment);
		const offsets = ListType.offsets;
		const data = src.getUint32(src_offset + offsets.data);
		const length = src.getUint32(src_offset + offsets.length);
		const byteLength = length * this.elementType.size;
		const srcReader = src.memory.readonly(data, byteLength);
		const destWriter = dest.memory.alloc(this.elementType.alignment, byteLength);
		srcReader.copyBytes(0, byteLength, destWriter, 0);

		dest.setUint32(dest_offset + offsets.data, destWriter.ptr);
		dest.setUint32(dest_offset + offsets.length, length);
	}

	public copyFlat(result: WasmType[], dest: Memory, values: FlatValuesIter, src: Memory, _context: ComponentModelContext): void {
		const data = values.next().value as ptr;
		const length = values.next().value as u32;
		const byteLength = length * this.elementType.size;
		const srcReader = src.readonly(data, byteLength);
		const destWriter = dest.alloc(this.elementType.alignment, byteLength);
		srcReader.copyBytes(0, byteLength, destWriter, 0);
		result.push(destWriter.ptr, length);
	}

	private loadFromRange(memory: ReadonlyMemoryRange, length: u32, context: ComponentModelContext): T[] {
		const result: T[] = [];
		let offset = 0;
		for (let i = 0; i < length; i++) {
			result.push(this.elementType.load(memory, offset, context));
			offset += this.elementType.size;
		}
		return result;
	}

	private storeIntoRange(memory: MemoryRange, values: T[], context: ComponentModelContext): void {
		let offset = 0;
		for (const item of values) {
			this.elementType.store(memory, offset, item, context);
			offset += this.elementType.size;
		}
	}
}
export namespace list {
	export class Error extends ResultError<JType[]> {
		constructor(value: JType[]) {
			super(value, `Error value: ${JSON.stringify(value)}`);
		}
	}
}

abstract class TypeArrayType<T extends { length: number; byteLength: number }, ET> implements ComponentModelType<T> {

	private static readonly offsets = {
		data: 0,
		length: 4
	};

	public readonly kind: ComponentModelTypeKind;
	public readonly size: size;
	public readonly alignment: Alignment;
	public readonly flatTypes: ReadonlyArray<GenericFlatType>;

	protected readonly elementType: ComponentModelType<ET>;

	constructor(elementType: ComponentModelType<ET>) {
		this.kind = ComponentModelTypeKind.list;
		this.size = 8;
		this.alignment = 4;
		this.flatTypes = [$i32, $i32];
		this.elementType = elementType;
	}

	public load(memRange: ReadonlyMemoryRange, offset: offset): T {
		const offsets = TypeArrayType.offsets;
		const dataPtr: ptr =  memRange.getUint32(offset + offsets.data);
		const length: u32 = memRange.getUint32(offset + offsets.length);
		return this.loadFromRange(memRange.memory.readonly(dataPtr, length * this.elementType.size), length);
	}

	public liftFlat(memory: Memory, values: FlatValuesIter): T {
		const dataPtr: ptr = values.next().value as size;
		const length: u32 = values.next().value as u32;
		return this.loadFromRange(memory.readonly(dataPtr, length * this.elementType.size), length);
	}

	public alloc(memory: Memory): MemoryRange {
		return memory.alloc(this.alignment, this.size);
	}

	public store(memRange: MemoryRange, offset: offset, value: T): void {
		const writer = memRange.memory.alloc(this.elementType.alignment, value.byteLength);
		this.storeIntoRange(writer, value);
		const offsets = TypeArrayType.offsets;
		memRange.setUint32(offset + offsets.data, writer.ptr);
		memRange.setUint32(offset + offsets.length, value.length);
	}

	public lowerFlat(result: WasmType[], memory: Memory, value: T): void {
		const writer = memory.alloc(this.elementType.alignment, value.byteLength);
		this.storeIntoRange(writer, value);
		result.push(writer.ptr, value.length);
	}

	public copy(dest: MemoryRange, dest_offset: ptr<u8>, src: ReadonlyMemoryRange, src_offset: ptr<u8>): void {
		dest.assertAlignment(dest_offset, this.alignment);
		src.assertAlignment(src_offset, this.alignment);
		const offsets = TypeArrayType.offsets;
		src.copyBytes(src_offset, this.size, dest, dest_offset);
		const data = src.getUint32(src_offset + offsets.data);
		const byteLength = src.getUint32(src_offset + offsets.length) * this.elementType.size;
		const srcReader = src.memory.readonly(data, byteLength);
		const destWriter = dest.memory.alloc(this.elementType.alignment, byteLength);
		srcReader.copyBytes(0, byteLength, destWriter, 0);
	}

	public copyFlat(result: WasmType[], dest: Memory, values: FlatValuesIter, src: Memory, _context: ComponentModelContext): void {
		const data = values.next().value as ptr;
		const length = values.next().value as u32;
		const byteLength = length * this.elementType.size;
		const srcReader = src.readonly(data, byteLength);
		const destWriter = dest.alloc(this.elementType.alignment, byteLength);
		srcReader.copyBytes(0, byteLength, destWriter, 0);
		result.push(destWriter.ptr, length);
	}

	protected abstract loadFromRange(memory: ReadonlyMemoryRange, length: number): T;
	protected abstract storeIntoRange(memory: MemoryRange, value: T): void;
}

export class Int8ArrayType extends TypeArrayType<Int8Array, s8> {
	constructor() {
		super(s8);
	}
	protected loadFromRange(memory: ReadonlyMemoryRange, length: number): Int8Array {
		return memory.getInt8Array(0, length);
	}
	protected storeIntoRange(memory: MemoryRange, value: Int8Array): void {
		memory.setInt8Array(0, value);
	}
}
export namespace Int8ArrayType {
	export class Error extends ResultError<Int8Array> {
		constructor(value: Int8Array) {
			super(value, `Error value: ${JSON.stringify(value)}`);
		}
	}
}

export class Int16ArrayType extends TypeArrayType<Int16Array, s16> {
	constructor() {
		super(s16);
	}
	protected loadFromRange(memory: ReadonlyMemoryRange, length: number): Int16Array {
		return memory.getInt16Array(0, length);
	}
	protected storeIntoRange(memory: MemoryRange, value: Int16Array): void {
		memory.setInt16Array(0, value);
	}
}
export namespace Int16ArrayType {
	export class Error extends ResultError<Int16Array> {
		constructor(value: Int16Array) {
			super(value, `Error value: ${JSON.stringify(value)}`);
		}
	}
}

export class Int32ArrayType extends TypeArrayType<Int32Array, s32> {
	constructor() {
		super(s32);
	}
	protected loadFromRange(memory: ReadonlyMemoryRange, length: number): Int32Array {
		return memory.getInt32Array(0, length);
	}
	protected storeIntoRange(memory: MemoryRange, value: Int32Array): void {
		memory.setInt32Array(0, value);
	}
}
export namespace Int32ArrayType {
	export class Error extends ResultError<Int32Array> {
		constructor(value: Int32Array) {
			super(value, `Error value: ${JSON.stringify(value)}`);
		}
	}
}

export class BigInt64ArrayType extends TypeArrayType<BigInt64Array, s64> {
	constructor() {
		super(s64);
	}
	protected loadFromRange(memory: ReadonlyMemoryRange, length: number): BigInt64Array {
		return memory.getInt64Array(0, length);
	}
	protected storeIntoRange(memory: MemoryRange, value: BigInt64Array): void {
		memory.setInt64Array(0, value);
	}
}
export namespace BigInt64ArrayType {
	export class Error extends ResultError<BigInt64Array> {
		constructor(value: BigInt64Array) {
			super(value, `Error value: ${JSON.stringify(value)}`);
		}
	}
}

export class Uint8ArrayType extends TypeArrayType<Uint8Array, u8> {
	constructor() {
		super(u8);
	}
	protected loadFromRange(memory: ReadonlyMemoryRange, length: number): Uint8Array {
		return memory.getUint8Array(0, length);
	}
	protected storeIntoRange(memory: MemoryRange, value: Uint8Array): void {
		memory.setUint8Array(0, value);
	}
}
export namespace Uint8ArrayType {
	export class Error extends ResultError<Uint8Array> {
		constructor(value: Uint8Array) {
			super(value, `Error value: ${JSON.stringify(value)}`);
		}
	}
}

export class Uint16ArrayType extends TypeArrayType<Uint16Array, u16> {
	constructor() {
		super(u16);
	}
	protected loadFromRange(memory: ReadonlyMemoryRange, length: number): Uint16Array {
		return memory.getUint16Array(0, length);
	}
	protected storeIntoRange(memory: MemoryRange, value: Uint16Array): void {
		memory.setUint16Array(0, value);
	}
}
export namespace Uint16ArrayType {
	export class Error extends ResultError<Uint16Array> {
		constructor(value: Uint16Array) {
			super(value, `Error value: ${JSON.stringify(value)}`);
		}
	}
}

export class Uint32ArrayType extends TypeArrayType<Uint32Array, u32> {
	constructor() {
		super(u32);
	}
	protected loadFromRange(memory: ReadonlyMemoryRange, length: number): Uint32Array {
		return memory.getUint32Array(0, length);
	}
	protected storeIntoRange(memory: MemoryRange, value: Uint32Array): void {
		memory.setUint32Array(0, value);
	}
}
export namespace Uint32ArrayType {
	export class Error extends ResultError<Uint32Array> {
		constructor(value: Uint32Array) {
			super(value, `Error value: ${JSON.stringify(value)}`);
		}
	}
}

export class BigUint64ArrayType extends TypeArrayType<BigUint64Array, u64> {
	constructor() {
		super(u64);
	}
	protected loadFromRange(memory: ReadonlyMemoryRange, length: number): BigUint64Array {
		return memory.getUint64Array(0, length);
	}
	protected storeIntoRange(memory: MemoryRange, value: BigUint64Array): void {
		memory.setUint64Array(0, value);
	}
}
export namespace BigUint64ArrayType {
	export class Error extends ResultError<BigUint64Array> {
		constructor(value: BigUint64Array) {
			super(value, `Error value: ${JSON.stringify(value)}`);
		}
	}
}

export class Float32ArrayType extends TypeArrayType<Float32Array, float32> {
	constructor() {
		super(float32);
	}
	protected loadFromRange(memory: ReadonlyMemoryRange, length: number): Float32Array {
		return memory.getFloat32Array(0, length);
	}
	protected storeIntoRange(memory: MemoryRange, value: Float32Array): void {
		memory.setFloat32Array(0, value);
	}
}
export namespace Float32ArrayType {
	export class Error extends ResultError<Float32Array> {
		constructor(value: Float32Array) {
			super(value, `Error value: ${JSON.stringify(value)}`);
		}
	}
}

export class Float64ArrayType extends TypeArrayType<Float64Array, float64> {
	constructor() {
		super(float64);
	}
	protected loadFromRange(memory: ReadonlyMemoryRange, length: number): Float64Array {
		return memory.getFloat64Array(0, length);
	}
	protected storeIntoRange(memory: MemoryRange, value: Float64Array): void {
		memory.setFloat64Array(0, value);
	}
}
export namespace Float64ArrayType {
	export class Error extends ResultError<Float64Array> {
		constructor(value: Float64Array) {
			super(value, `Error value: ${JSON.stringify(value)}`);
		}
	}
}

interface TypedField {
	readonly type: AnyComponentModelType;
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
	public readonly flatTypes: ReadonlyArray<GenericFlatType>;

	constructor(fields: F[], kind: ComponentModelTypeKind.record | ComponentModelTypeKind.tuple) {
		this.fields = fields;

		this.kind = kind;
		this.alignment = BaseRecordType.alignment(fields);
		this.size = BaseRecordType.size(fields, this.alignment);
		this.flatTypes = BaseRecordType.flatTypes(fields);
	}

	public load(memory: ReadonlyMemoryRange, offset: offset, context: ComponentModelContext): T {
		memory.assertAlignment(offset, this.alignment);
		const result: JType[] = [];
		for (const field of this.fields) {
			offset = align(offset, field.type.alignment);
			result.push(field.type.load(memory, offset, context));
			offset += field.type.size;
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

	public alloc(memory: Memory): MemoryRange {
		return memory.alloc(this.alignment, this.size);
	}

	public store(memory: MemoryRange, offset: offset, record: T, context: ComponentModelContext): void {
		memory.assertAlignment(offset, this.alignment);
		const values = this.elements(record, this.fields);
		for (let i = 0; i < this.fields.length; i++) {
			const field = this.fields[i];
			const value = values[i];
			offset = align(offset, field.type.alignment);
			field.type.store(memory, offset, value, context);
			offset += field.type.size;
		}
	}

	public lowerFlat(result: WasmType[], memory: Memory, record: T, context: ComponentModelContext): void {
		const values = this.elements(record, this.fields);
		for (let i = 0; i < this.fields.length; i++) {
			const field = this.fields[i];
			const value = values[i];
			field.type.lowerFlat(result, memory, value, context);
		}
	}

	public copy(dest: MemoryRange, dest_offset: offset, src: ReadonlyMemoryRange, src_offset: offset, context: ComponentModelContext): void {
		for (const field of this.fields) {
			dest_offset = align(dest_offset, field.type.alignment);
			src_offset = align(src_offset, field.type.alignment);
			field.type.copy(dest, dest_offset, src, src_offset, context);
			dest_offset += field.type.size;
			src_offset += field.type.size;
		}
	}

	public copyFlat(result: WasmType[], dest: Memory, values: FlatValuesIter, src: Memory, context: ComponentModelContext): void {
		for (const field of this.fields) {
			field.type.copyFlat(result, dest, values, src, context);
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
			result = Math.max(result, field.type.alignment);
		}
		return result;
	}

	private static flatTypes(fields: TypedField[]): ReadonlyArray<GenericFlatType> {
		const result: GenericFlatType[] = [];
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
	export function create(name: string, type: AnyComponentModelType): RecordField {
		return { name, type };
	}
}

export class RecordType<T extends JRecord> extends BaseRecordType<T, RecordField> {

	constructor(fields: [string, AnyComponentModelType][]) {
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
	export function create(type: AnyComponentModelType): TupleField {
		return { type };
	}
}

export class TupleType<T extends JTuple> extends BaseRecordType<T, TupleField> {

	constructor(fields: AnyComponentModelType[]) {
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
export namespace tuple {
	export class Error extends ResultError<JType[]> {
		constructor(value: JType[]) {
			super(value, `Error value: ${JSON.stringify(value)}`);
		}
	}
}

export class FlagsType<_T> implements ComponentModelType<u32 | bigint> {

	public readonly type: AnyComponentModelType | undefined;
	private readonly arraySize: number;

	public readonly kind: ComponentModelTypeKind;
	public readonly size: size;
	public readonly alignment: Alignment;
	public readonly flatTypes: ReadonlyArray<GenericFlatType>;

	constructor(numberOfFlags: number) {
		this.kind = ComponentModelTypeKind.flags;
		this.size = FlagsType.size(numberOfFlags);
		this.alignment = FlagsType.alignment(numberOfFlags);
		this.flatTypes = FlagsType.flatTypes(numberOfFlags);
		this.type = FlagsType.getType(numberOfFlags);
		this.arraySize = FlagsType.num32Flags(numberOfFlags);
	}

	public load(memory: ReadonlyMemoryRange, offset: offset<u8 | u16 | u32 | u32[]>, context: ComponentModelContext): u32 | bigint {
		return this.type === undefined ? 0 : this.loadFrom(this.type.load(memory, offset, context) as (u32 | u32[]));
	}

	public liftFlat(memory: Memory, values: FlatValuesIter, context: ComponentModelContext): u32 | bigint {
		return this.type === undefined ? 0 : this.loadFrom(this.type.liftFlat(memory, values, context) as (u32 | u32[]));
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

	public alloc(memory: Memory): MemoryRange {
		return memory.alloc(this.alignment, this.size);
	}

	public store(memory: MemoryRange, offset: offset<u8 | u16 | u32 | u32[]>, flags: u32 | bigint, context: ComponentModelContext): void {
		if (this.type !== undefined) {
			this.type.store(memory, offset, this.storeInto(flags), context);
		}
	}

	public lowerFlat(result: WasmType[], _memory: Memory, flags: u32 | bigint, context: ComponentModelContext): void {
		if (this.type !== undefined) {
			this.type.lowerFlat(result, _memory, this.storeInto(flags), context);
		}
	}

	public copy(dest: MemoryRange, dest_offset: offset, src: ReadonlyMemoryRange, src_offset: offset, context: ComponentModelContext): void {
		if (this.type !== undefined) {
			this.type.copy(dest, dest_offset, src, src_offset, context);
		}
	}

	public copyFlat(result: WasmType[], dest: Memory, values: FlatValuesIter, src: Memory, context: ComponentModelContext): void {
		if (this.type !== undefined) {
			this.type.copyFlat(result, dest, values, src, context);
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

	private static getType(numberOfFlags: number): typeof u8 | typeof u16 | typeof u32 | TupleType<any> | undefined {
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

	private static flatTypes(numberOfFlags: number): ReadonlyArray<GenericFlatType> {
		return new Array<GenericFlatType>(this.num32Flags(numberOfFlags)).fill($i32);
	}

	private static num32Flags(numberOfFlags: number): number {
		return Math.ceil(numberOfFlags / 32);
	}
}

interface VariantCase {
	readonly index: u32;
	readonly tag: string;
	readonly type: AnyComponentModelType | undefined;
	readonly wantFlatTypes: GenericFlatType[] | undefined;
}

namespace VariantCase {
	export function create(index: number, tag: string, type: AnyComponentModelType | undefined): VariantCase {
		return { index, tag, type, wantFlatTypes: type !== undefined ? [] : undefined };
	}
}

interface JVariantCase {
	readonly tag: string;
	readonly value?: JType | undefined | void;
}

export class VariantType<T extends JVariantCase, I, V extends JType> implements ComponentModelType<T> {

	public readonly cases: VariantCase[];
	private readonly case2Index: Map<string, u32>;
	private readonly ctor: (caseIndex: I, value: V) => T;
	private readonly discriminantType: typeof u8 | typeof u16 | typeof u32;
	private readonly maxCaseAlignment: Alignment;

	public readonly kind: ComponentModelTypeKind;
	public readonly size: size;
	public readonly alignment: Alignment;
	public readonly flatTypes: ReadonlyArray<GenericFlatType>;

	constructor(variants: [string, (AnyComponentModelType | undefined)][], ctor: (caseIndex: I, value: V) => T, kind: ComponentModelTypeKind.variant | ComponentModelTypeKind.result = ComponentModelTypeKind.variant) {
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

	public load(memory: ReadonlyMemoryRange, offset: offset, context: ComponentModelContext): T {
		const caseIndex = this.discriminantType.load(memory, offset);
		const caseVariant = this.cases[caseIndex];
		if (caseVariant.type === undefined) {
			return this.ctor(caseVariant.tag as I, undefined as any);
		} else {
			offset += this.discriminantType.size;
			offset = align(offset, this.maxCaseAlignment);
			const value = caseVariant.type.load(memory, offset, context);
			return this.ctor(caseVariant.tag as I, value as V);
		}
	}

	public liftFlat(memory: Memory, values: FlatValuesIter, context: ComponentModelContext): T {
		// First one is the discriminant type. So skip it.
		let valuesToReadOver = this.flatTypes.length - 1;
		const caseIndex = this.discriminantType.liftFlat(memory, values);
		const caseVariant = this.cases[caseIndex];
		let result: T;
		if (caseVariant.type === undefined) {
			result = this.ctor(caseVariant.tag as I, undefined as any);
		} else {
			// The first flat type is the discriminant type. So skip it.
			const wantFlatTypes = caseVariant.wantFlatTypes!;
			const iter = new CoerceValueIter(values, this.flatTypes.slice(1), wantFlatTypes);
			const value = caseVariant.type.liftFlat(memory, iter, context);
			result = this.ctor(caseVariant.tag as I, value as V);
			valuesToReadOver = valuesToReadOver - wantFlatTypes.length;
		}
		for (let i = 0; i < valuesToReadOver; i++) {
			values.next();
		}
		return result;
	}

	public alloc(memory: Memory): MemoryRange {
		return memory.alloc(this.alignment, this.size);
	}

	public store(memory: MemoryRange, offset: offset, variantValue: T, context: ComponentModelContext): void {
		const index = this.case2Index.get(variantValue.tag);
		if (index === undefined) {
			throw new ComponentModelTrap(`Variant case ${variantValue.tag} not found`);
		}
		this.discriminantType.store(memory, offset, index);
		offset += this.discriminantType.size;
		const c = this.cases[index];
		if (c.type !== undefined && variantValue.value !== undefined) {
			offset = align(offset, this.maxCaseAlignment);
			c.type.store(memory, offset, variantValue.value, context);
		}
	}

	public lowerFlat(result: WasmType[], memory: Memory, variantValue: T, context: ComponentModelContext): void {
		const flatTypes = this.flatTypes;
		const index = this.case2Index.get(variantValue.tag);
		if (index === undefined) {
			throw new ComponentModelTrap(`Variant case ${variantValue.tag} not found`);
		}
		this.discriminantType.lowerFlat(result, memory, index);
		const c = this.cases[index];
		// First one is the discriminant type. So skip it.
		let valuesToFill = this.flatTypes.length - 1;
		if (c.type !== undefined && variantValue.value !== undefined) {
			const payload: WasmType[] = [];
			c.type.lowerFlat(payload, memory, variantValue.value, context);
			// First one is the discriminant type. So skip it.
			const wantTypes = flatTypes.slice(1);
			const haveTypes = c.wantFlatTypes!;
			if (payload.length !== haveTypes.length) {
				throw new ComponentModelTrap('Mismatched flat types');
			}
			for (let i = 0; i < wantTypes.length; i++) {
				const have: GenericFlatType = haveTypes[i];
				const want: GenericFlatType = wantTypes[i];
				if (have === $f32 && want === $i32) {
					payload[i] = WasmTypes.reinterpret_f32_as_i32(payload[i] as number);
				} else if (have === $i32 && want === $i64) {
					payload[i] = WasmTypes.convert_i32_to_i64(payload[i] as number);
				} else if (have === $f32 && want === $i64) {
					payload[i] = WasmTypes.reinterpret_f32_as_i64(payload[i] as number);
				} else if (have === $f64 && want === $i64) {
					payload[i] = WasmTypes.reinterpret_f64_as_i64(payload[i] as number);
				}
			}
			valuesToFill = valuesToFill - payload.length;
			result.push(...payload);
		}
		for(let i = flatTypes.length - valuesToFill; i < flatTypes.length; i++) {
			const type = flatTypes[i];
			if (type === $i64) {
				result.push(0n);
			} else {
				result.push(0);
			}
		}
	}

	public copy(dest: MemoryRange, dest_offset: offset, src: ReadonlyMemoryRange, src_offset: offset, context: ComponentModelContext): void {
		this.discriminantType.copy(dest, dest_offset, src, src_offset);
		const caseIndex = this.discriminantType.load(src, src_offset);
		const caseVariant = this.cases[caseIndex];
		if (caseVariant.type === undefined) {
			return;
		}
		src_offset += this.discriminantType.size;
		src_offset = align(src_offset, this.maxCaseAlignment);
		dest_offset += this.discriminantType.size;
		dest_offset = align(dest_offset, this.maxCaseAlignment);
		caseVariant.type.copy(dest, dest_offset, src, src_offset, context);
	}

	public copyFlat(result: WasmType[], dest: Memory, values: FlatValuesIter, src: Memory, context: ComponentModelContext): void {
		let valuesToCopy = this.flatTypes.length - 1;
		this.discriminantType.copyFlat(result, dest, values, src);
		const caseIndex = result[result.length - 1] as number;
		const caseVariant = this.cases[caseIndex];
		if (caseVariant.type !== undefined) {
			const wantFlatTypes = caseVariant.wantFlatTypes!;
			// The first flat type is the discriminant type. So skip it.
			const iter = new CoerceValueIter(values, this.flatTypes.slice(1), wantFlatTypes);
			caseVariant.type.copyFlat(result, dest, iter, src, context);
			valuesToCopy = valuesToCopy - wantFlatTypes.length;
		}
		for (let i = 0; i < valuesToCopy; i++) {
			result.push(values.next().value);
		}
	}

	private static size(discriminantType: AnyComponentModelType, cases: VariantCase[]): size {
		let result = discriminantType.size;
		result = align(result, this.maxCaseAlignment(cases));
		return result + this.maxCaseSize(cases);
	}

	private static alignment(discriminantType: AnyComponentModelType, cases: VariantCase[]): Alignment {
		return Math.max(discriminantType.alignment, this.maxCaseAlignment(cases)) as Alignment;
	}

	private static flatTypes(discriminantType: AnyComponentModelType, cases: VariantCase[]): ReadonlyArray<GenericFlatType> {
		const flat: GenericFlatType[] = [];
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
		throw new ComponentModelTrap(`Too many cases: ${cases}`);
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

	private static joinFlatType(a: GenericFlatType, b:GenericFlatType) : GenericFlatType {
		if (a === b) {
			return a;
		}
		if ((a === $i32 && b === $f32) || (a === $f32 && b === $i32)) {
			return $i32;
		}
		return $i64;
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
	public readonly flatTypes: readonly GenericFlatType[];

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

	public load(memory: ReadonlyMemoryRange, offset: offset, context: ComponentModelContext): T {
		const index = this.assertRange(this.discriminantType.load(memory, offset, context));
		return this.cases[index] as T;
	}

	public liftFlat(memory: Memory, values: FlatValuesIter, context: ComponentModelContext): T {
		const index = this.assertRange(this.discriminantType.liftFlat(memory, values, context));
		return this.cases[index] as T;
	}

	public alloc(memory: Memory): MemoryRange {
		return memory.alloc(this.alignment, this.size);
	}

	public store(memory: MemoryRange, offset: offset, value: T, context: ComponentModelContext): void {
		const index = this.case2index.get(value);
		if (index === undefined) {
			throw new ComponentModelTrap('Enumeration value not found');
		}
		this.discriminantType.store(memory, offset, index, context);
	}

	public lowerFlat(result: WasmType[], memory: Memory, value: T, context: ComponentModelContext): void {
		const index = this.case2index.get(value);
		if (index === undefined) {
			throw new ComponentModelTrap('Enumeration value not found');
		}
		this.discriminantType.lowerFlat(result, memory, index, context);
	}

	public copy(dest: MemoryRange, dest_offset: offset, src: ReadonlyMemoryRange, src_offset: offset, context: ComponentModelContext): void {
		this.discriminantType.copy(dest, dest_offset, src, src_offset, context);
	}

	public copyFlat(result: WasmType[], dest: Memory, values: FlatValuesIter, src: Memory, context: ComponentModelContext): void {
		this.discriminantType.copyFlat(result, dest, values, src, context);
	}

	private assertRange(value: number): number {
		if (value < 0 || value > this.cases.length) {
			throw new ComponentModelTrap('Enumeration value out of range');
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
		throw new ComponentModelTrap(`Too many cases: ${cases}`);
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

	export class Error extends ResultError<JType> {
		constructor(value: JType) {
			super(value, `Error value: ${JSON.stringify(value)}`);
		}
	}
}
export type option<T extends JType> = option.None<T> | option.Some<T>;
export class OptionType<T extends JType> implements ComponentModelType<T | option<T> | undefined> {

	public readonly valueType: AnyComponentModelType;

	public readonly kind: ComponentModelTypeKind;
	public readonly size: size;
	public readonly alignment: Alignment;
	public readonly flatTypes: readonly GenericFlatType[];


	constructor(valueType: AnyComponentModelType) {
		this.valueType = valueType;
		this.kind = ComponentModelTypeKind.option;
		this.size = this.computeSize();
		this.alignment = this.computeAlignment();
		this.flatTypes = this.computeFlatTypes();
	}

	public load(memory: ReadonlyMemoryRange, offset: offset, context: ComponentModelContext): T | option<T> | undefined {
		const caseIndex = u8.load(memory, offset);
		if (caseIndex === 0) { // index 0 is none
			return context.options.keepOption ? option._ctor<T>(option.none, undefined) : undefined;
		} else {
			offset += u8.size;
			offset = align(offset, this.alignment);
			const value = this.valueType.load(memory, offset, context);
			return (context.options.keepOption ? option._ctor(option.some, value) : value) as T | option<T> | undefined;
		}
	}

	public liftFlat(memory: Memory, values: FlatValuesIter, context: ComponentModelContext): T | option<T> | undefined {
		// First one is the discriminant type. So skip it.
		const caseIndex = u8.liftFlat(memory, values);
		if (caseIndex === 0) { // Index 0 is none
			// Read over the value params
			for (let i = 0; i < this.valueType.flatTypes.length; i++) {
				values.next();
			}
			return context.options.keepOption ? option._ctor<T>(option.none, undefined) : undefined;
		} else {
			const value = this.valueType.liftFlat(memory, values, context);
			return (context.options.keepOption ? option._ctor(option.some, value) : value) as T | option<T> | undefined;
		}
	}

	public alloc(memory: Memory): MemoryRange {
		return memory.alloc(this.alignment, this.size);
	}

	public store(memory: MemoryRange, offset: offset, value: T | option<T> | undefined, context: ComponentModelContext): void {
		const optValue = this.asOptionValue(value, context.options);
		const index = optValue.tag === option.none ? 0 : 1;
		u8.store(memory, offset, index);
		offset += u8.size;
		if (optValue.tag === option.some) {
			offset = align(offset, this.valueType.alignment);
			this.valueType.store(memory, offset, optValue.value, context);
		}
	}

	public lowerFlat(result: WasmType[], memory: Memory, value: T | option<T> | undefined, context: ComponentModelContext): void {
		const optValue = this.asOptionValue(value, context.options);
		const index = optValue.tag === option.none ? 0 : 1;
		u8.lowerFlat(result, memory, index);
		if (optValue.tag === option.none) {
			for (const type of this.valueType.flatTypes) {
				if (type === $i64) {
					result.push(0n);
				} else {
					result.push(0);
				}
			}
		} else {
			this.valueType.lowerFlat(result, memory, optValue.value, context);
		}
	}

	public copy(dest: MemoryRange, dest_offset: offset, src: ReadonlyMemoryRange, src_offset: offset, context: ComponentModelContext): void {
		u8.copy(dest, dest_offset, src, src_offset);
		const caseIndex = u8.load(src, src_offset);
		if (caseIndex === 0) {
			return;
		} else {
			src_offset += u8.size;
			src_offset = align(src_offset, this.alignment);
			dest_offset += u8.size;
			dest_offset = align(dest_offset, this.alignment);
			this.valueType.copy(dest, dest_offset, src, src_offset, context);
		}
	}

	public copyFlat(result: WasmType[], dest: Memory, values: FlatValuesIter, src: Memory, context: ComponentModelContext): void {
		u8.copyFlat(result, dest, values, src);
		const caseIndex = result[result.length - 1] as number;
		if (caseIndex === 0) {
			for (const _type of this.valueType.flatTypes) {
				result.push(values.next().value);
			}
		} else {
			this.valueType.copyFlat(result, dest, values, src, context);
		}
	}

	private asOptionValue(value: T | option<T> | undefined, options: Options): option<T> {
		if (option.isOption(value)) {
			if (!options.keepOption) {
				throw new ComponentModelTrap('Received an option value although options should be unpacked.');
			}
			return value as option<T>;
		} else {
			if (options.keepOption) {
				throw new ComponentModelTrap('Received a unpacked option value although options should NOT be unpacked.');
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

	private computeFlatTypes(): readonly GenericFlatType[] {
		return [...u8.flatTypes, ...this.valueType.flatTypes];
	}
}

export namespace result {
	export const ok = 'ok' as const;
	export type Ok<O extends JType, E extends JType> = { readonly tag: typeof ok; readonly value: O } & _common<O, E>;
	export function Ok<O extends JType, E extends JType>(value: O): Ok<O, E> {
		return new ResultImpl<O, E>(ok, value) as Ok<O, E>;
	}

	export const error = 'error' as const;
	export type Error<O extends JType, E extends JType> = { readonly tag: typeof error; readonly value: E } & _common<O, E>;
	export function Error<O extends JType, E extends JType>(value: E): Error<O, E> {
		return new ResultImpl<O, E>(error, value) as Error<O, E>;
	}

	export type _tt = typeof ok | typeof error;
	export type _vt<O extends JType, E extends JType> = O | E;
	type _common<O extends JType, E extends JType> = Omit<ResultImpl<O, E>, 'tag' | 'value'>;

	export function _ctor<O extends JType, E extends JType>(c: _tt, v: _vt<O, E>): result<O, E> {
		return new ResultImpl<O, E>(c, v) as result<O, E>;
	}

	export class ResultImpl<O extends JType, E extends JType> implements JVariantCase {

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

export type result<O extends JType, E extends JType = void> = result.Ok<O, E> | result.Error<O, E>;
export class ResultType<O extends JType, E extends JType = void> extends VariantType<result<O, E>, 'ok' | 'error', O | E> {

	private readonly _errorClass: ResultErrorConstructor<E> | undefined;

	constructor(okType: AnyComponentModelType | undefined, errorType: AnyComponentModelType | undefined, errorClass?: ResultErrorConstructor<E>) {
		super([['ok', okType], ['error', errorType]], result._ctor<O, E>, ComponentModelTypeKind.result);
		this._errorClass = errorClass;
	}

	get errorClass(): ResultErrorConstructor<E> | undefined {
		return this._errorClass;
	}
}

export interface Resource {
	$handle(): ResourceHandle<this>;
}

export namespace Resource {

	export class Default implements Resource {

		private _handle: ResourceHandle<this>;

		constructor(handle: ResourceHandle);
		constructor(manager: ResourceManager);
		constructor(handleOrManager: ResourceHandle | ResourceManager) {
			if (typeof handleOrManager === 'number') {
				this._handle = handleOrManager;
			} else {
				this._handle = handleOrManager.registerResource(this);
			}
		}

		public $handle(): ResourceHandle<this> {
			return this._handle;
		}
	}

	export function getRepresentation(resource: Resource & { $rep?(): ResourceRepresentation }): ResourceRepresentation | undefined {
		return typeof resource.$rep === 'function' ? resource.$rep() : undefined;
	}
}

export type ResourceRepresentation = u32;
export interface ResourceManager<T extends Resource = Resource> {
	// Handle management

	/** [resource-new]${resource} */
	newHandle(rep: ResourceRepresentation): ResourceHandle<T>;
	/** [resource-rep]${resource} */
	getRepresentation(handle: ResourceHandle<T>): ResourceRepresentation;
	/** [resource-drop]${resource} */
	dropHandle(handle: ResourceHandle<T>): ResourceRepresentation;

	// Resource management
	setProxyInfo(ctor: (new (handleTag: symbol, handle: ResourceHandle<T>, rep: ResourceRepresentation) => T), dtor: (self: ResourceHandle<T>) => void): void;
	hasResource(handle: ResourceHandle<T>): boolean;
	getResource(handle: ResourceHandle<T>): T;
	registerResource(resource: T, handle?: ResourceHandle<T>): ResourceHandle<T>;
	registerProxy(proxy: T): void;
	removeResource(value: ResourceHandle<T> | T): void;

	// Loop support
	registerLoop(handle: ResourceHandle<T>): ResourceHandle<T>;
	getLoop(rep: ResourceRepresentation): ResourceHandle<T>;
}

export namespace ResourceManager {
	export const handleTag: symbol = Symbol('handleTag');

	type FinalizationRegistryData = { handle: ResourceHandle; rep: ResourceRepresentation };
	export class Default<T extends Resource = Resource> implements ResourceManager<T> {


		private handleCounter: ResourceHandle;
		private handleTable: Map<ResourceHandle<T>, ResourceRepresentation>;
		private h2r: Map<ResourceHandle<T>, WeakRef<T> | T | undefined>;
		private finalizer: FinalizationRegistry<FinalizationRegistryData>;
		private ctor: (new (handleTag: symbol, handle: ResourceHandle<T>, rep: ResourceRepresentation) => T) | undefined;
		private dtor: ((self: ResourceHandle<T>) => void) | undefined;

		// We only need the representation counter for the loop implementation.
		// To make them distinguishable from handles or normal representations we
		// start with MaxValue and decrement it for each new representation.
		private representationCounter: ResourceRepresentation;
		private loopTable: undefined | Map<ResourceRepresentation, ResourceHandle<T>>;

		constructor() {
			this.handleCounter = 1;
			this.handleTable = new Map();
			this.h2r = new Map();
			this.finalizer = new FinalizationRegistry((value: FinalizationRegistryData) => {
				const { handle, rep } = value;
				// A proxy was collected, remove the resource.
				try {
					this.dtor!(rep);
				} catch (error) {
					// Log the error.
					RAL().console.error(error);
				}

				// Clean up tables
				this.h2r.delete(handle);
				this.handleTable.delete(handle);

				// Also remove the representation from the loop if existed
				this.loopTable?.delete(rep);
			});
			this.representationCounter = Number.MAX_VALUE;
			this.loopTable = undefined;
		}

		public newHandle(rep: ResourceRepresentation): ResourceHandle<T> {
			const handle = this.handleCounter++;
			this.handleTable.set(handle, rep);
			return handle;
		}

		public getRepresentation(handle: ResourceHandle<T>): ResourceRepresentation {
			const rep = this.handleTable.get(handle);
			if (rep === undefined) {
				throw new ComponentModelTrap(`No representation registered for resource handle ${handle}`);
			}
			return rep;
		}

		public dropHandle(handle: ResourceHandle<T>): ResourceRepresentation {
			const rep = this.handleTable.get(handle);
			if (rep === undefined) {
				throw new ComponentModelTrap(`Unknown resource handle ${handle}`);
			}
			if (this.dtor !== undefined) {
				this.dtor(rep);
			}
			this.handleTable.delete(handle);
			return rep;
		}

		public setProxyInfo(ctor: (new (handleTag: symbol, handle: ResourceHandle<T>, rep: ResourceRepresentation) => T), dtor: (self: ResourceHandle<T>) => void): void {
			this.ctor = ctor;
			this.dtor = dtor;
		}

		public hasResource(handle: ResourceHandle<T>): boolean {
			return this.h2r.has(handle);
		}

		public getResource(handle: ResourceHandle<T>): T {
			const value = this.h2r.get(handle);
			if (value !== undefined) {
				if (value instanceof WeakRef) {
					const unwrapped = value.deref();
					if (unwrapped === undefined) {
						throw new ComponentModelTrap(`Resource for handle ${handle} has been collected.`);
					}
					return unwrapped;
				} else {
					return value;
				}
			}
			// This handle represents a resource that lives on the
			// WebAssembly side. Since we don't have a resource for it
			// yet we create one on the fly.
			const rep = this.handleTable.get(handle);
			if (rep !== undefined) {
				if (this.ctor === undefined) {
					throw new ComponentModelTrap(`No proxy constructor set`);
				}
				const proxy = new this.ctor(handleTag, handle, rep);
				this.setProxy(handle, rep, proxy);
				return proxy;
			} else {
				throw new ComponentModelTrap(`Unknown resource handle ${handle}`);
			}
		}

		public registerResource(resource: T, handle?: ResourceHandle<T>): ResourceHandle<T> {
			if (handle !== undefined) {
				if (handle >= this.handleCounter) {
					throw new ComponentModelTrap(`Handle ${handle} is out of bounds. Current handle counter is ${this.handleCounter}.`);
				}
				if (this.h2r.has(handle)) {
					throw new ComponentModelTrap(`Handle ${handle} is already registered.`);
				}
				if (this.handleTable.has(handle)) {
					throw new ComponentModelTrap(`Handle ${handle} is already in use as a proxy handle.`);
				}
			} else {
				handle = this.handleCounter++;
			}
			this.h2r.set(handle, resource);
			return handle;
		}

		public registerProxy(proxy: T): void {
			const handle = proxy.$handle();
			const rep =  Resource.getRepresentation(proxy) ?? this.handleTable.get(handle);
			if (rep === undefined) {
				throw new ComponentModelTrap(`Unknown proxy handle ${handle}`);
			}
			this.setProxy(handle, rep, proxy);
		}

		public removeResource(value: ResourceHandle<T> | T): void {
			const handle = typeof value === 'number' ? value : value.$handle();
			const resource = this.h2r.get(handle);
			if (resource === undefined) {
				throw new ComponentModelTrap(`Unknown resource handle ${handle}.`);
			}
			if (resource instanceof WeakRef) {
				throw new ComponentModelTrap(`Proxy resources should not be removed manually. They are removed via the GC.`);
			}
			this.h2r.delete(handle);
		}

		public registerLoop(handle: ResourceHandle<T>): ResourceHandle<T> {
			if (this.loopTable === undefined) {
				this.loopTable = new Map();
			}
			const result = this.handleCounter++;
			const representation = this.representationCounter--;

			this.handleTable.set(result, representation);
			this.loopTable.set(representation, handle);

			return result;
		}

		public getLoop(rep: ResourceRepresentation): ResourceHandle<T> {
			const result = this.loopTable?.get(rep);
			if (result === undefined) {
				throw new ComponentModelTrap(`Unknown loop handle for representation ${rep}`);
			}
			return result;
		}

		private setProxy(handle: ResourceHandle, rep: ResourceRepresentation, proxy: T): void {
			if (this.dtor === undefined) {
				throw new ComponentModelTrap(`No proxy destructor set`);
			}
			this.h2r.set(handle, new WeakRef(proxy));
			this.finalizer.register(proxy, { handle, rep } , proxy);
		}
	}

	export function from<T extends Resource = Resource>(obj: any | undefined): ResourceManager<T> | undefined {
		if (obj === undefined) {
			return undefined;
		}
		return (obj.$resources ?? obj.$resourceManager ?? obj.$manager) as ResourceManager<T>;
	}
}

export interface ResourceManagers {
	has(id: string): boolean;
	set(id: string, manager: ResourceManager): void;
	ensure<T extends Resource = Resource>(id: string): ResourceManager<T>;
	get<T extends Resource = Resource>(id: string): ResourceManager<T> | undefined;
}

export namespace ResourceManagers {
	export class Default implements ResourceManagers {

		private readonly managers: Map<string, ResourceManager>;

		constructor() {
			this.managers = new Map();
		}

		public has(id: string): boolean {
			return this.managers.has(id);
		}

		public set(id: string, manager: ResourceManager): void {
			if (this.managers.has(id)) {
				throw new ComponentModelTrap(`Resource manager ${id} already registered.`);
			}
			this.managers.set(id, manager);
		}

		public ensure<T extends Resource = Resource>(id: string): ResourceManager<T> {
			const manager = this.managers.get(id);
			if (manager === undefined) {
				throw new ComponentModelTrap(`Resource manager ${id} not found.`);
			}
			return manager as unknown as ResourceManager<T>;
		}

		public get<T extends Resource = Resource>(id: string): ResourceManager<T> | undefined {
			return this.managers.get(id) as unknown as ResourceManager<T>;
		}
	}

	export function is(value: any): value is ResourceManagers {
		const candidate = value as ResourceManagers;
		return candidate && typeof candidate.has === 'function' && typeof candidate.ensure === 'function' && typeof candidate.get === 'function' && typeof candidate.set === 'function';
	}
}

export type JType = number | bigint | string | boolean | JArray | JRecord | JVariantCase | JTuple | JEnum | Resource | option<any> | undefined | void | result<any, any> | Int8Array | Int16Array | Int32Array | BigInt64Array | Uint8Array | Uint16Array | Uint32Array | BigUint64Array | Float32Array | Float64Array;

export type CallableParameter = [/* name */string, /* type */AnyComponentModelType];

export type JFunction = (...params: JType[]) => JType;
export type JClass = {
	new (...params: JType[]): Resource;
	[key: string]: JFunction;
};

export type JFunctionAsync = (...params: JType[]) => Promise<JType> | JType;
export type JClassAsync = {
	$new(...params: JType[]): Promise<Resource>;
	[key: string]: JFunctionAsync;
};

export type WasmFunction = (...params: WasmType[]) => WasmType | void;

export interface WorkerConnection {
	dispose(): void;
	getMemory(): Memory;
	on(id: string, callback: (memory: Memory, params: WasmType[]) => WasmType | void): void;
	prepareCall(): void;
	callMain(name: string, params: ReadonlyArray<WasmType>): WasmType | void;
	listen(): void;
}

export type Code = WebAssembly_.Module | { module: WebAssembly_.Module; memory?: WebAssembly_.Memory };
export interface MainConnection {
	initialize(code: Code, options: Options): Promise<void>;
	dispose(): void;
	getMemory(): Memory;
	on(id: string, callback: (memory: Memory, params: WasmType[]) => WasmType | void | Promise<WasmType | void>): void;
	prepareCall(): void;
	lock(thunk: () => Promise<JType>): Promise<JType>;
	callWorker(name: string, params: ReadonlyArray<WasmType>): Promise<WasmType | void>;
	listen(): void;
}

class Callable {

	private static readonly EMPTY_JTYPE: ReadonlyArray<JType> = Object.freeze([]);
	private static readonly EMPTY_WASM_TYPE: ReadonlyArray<WasmType> = Object.freeze([]);

	public static readonly MAX_FLAT_PARAMS = 16;
	public static readonly MAX_FLAT_RESULTS = 1;

	public readonly witName: string;
	public readonly params: CallableParameter[];
	public readonly returnType: AnyComponentModelType | undefined;

	public readonly paramType: AnyComponentModelType | undefined;
	protected readonly isSingleParam: boolean;
	protected readonly mode: 'lift' | 'lower';

	constructor(witName: string, params: CallableParameter[], returnType?: AnyComponentModelType) {
		this.witName = witName;
		this.params = params;
		this.returnType = returnType;
		switch (params.length) {
			case 0:
				this.paramType = undefined;
				this.isSingleParam = false;
				break;
			case 1:
				this.paramType = params[0][1];
				this.isSingleParam = true;
				break;
			default:
				this.paramType = new TupleType(params.map(p => p[1]));
				this.isSingleParam = false;
		}
		this.mode = 'lower';
	}

	protected liftParamValues(wasmValues: WasmType[], memory: Memory, context: ComponentModelContext): ReadonlyArray<JType> {
		if (this.paramType === undefined) {
			return Callable.EMPTY_JTYPE;
		}
		let result: JType;
		if (this.paramType.flatTypes.length > Callable.MAX_FLAT_PARAMS) {
			const p0 = wasmValues[0];
			if (!Number.isInteger(p0)) {
				throw new ComponentModelTrap('Invalid pointer');
			}
			result = this.paramType.load(memory.readonly(p0 as ptr, this.paramType.size), 0, context);
		} else {
			result = this.paramType.liftFlat(memory, wasmValues.values(), context);
		}
		return this.isSingleParam ? [result] : result as JType[];
	}

	protected lowerParamValues(values: JType[], memory: Memory, context: ComponentModelContext): ReadonlyArray<WasmType> {
		if (this.paramType === undefined) {
			return Callable.EMPTY_WASM_TYPE;
		}
		if (this.isSingleParam && values.length !== 1) {
			throw new ComponentModelTrap(`Expected a single parameter, but got ${values.length}`);
		}
		const toLower = this.isSingleParam ? values[0] : values;
		if (this.paramType.flatTypes.length > Callable.MAX_FLAT_PARAMS) {
			const writer = this.paramType.alloc(memory);
			this.paramType.store(writer, 0, toLower, context);
			return [writer.ptr];
		} else {
			const result: WasmType[] = [];
			this.paramType.lowerFlat(result, memory, toLower, context);
			return result;
		}
	}

	protected copyParamValues(result: WasmType[], dest: Memory, wasmValues: WasmType[], src: Memory, context: ComponentModelContext): { originalResult: MemoryRange; transferResult: MemoryRange } | undefined {
		const flatReturnTypes = this.returnType !== undefined ? this.returnType.flatTypes.length : 0;
		const flatParamTypes = this.paramType !== undefined ? this.paramType.flatTypes.length : 0;

		let out: ptr | undefined = undefined;
		if (flatReturnTypes > Callable.MAX_FLAT_RESULTS) {
			// Check if the result pointer got passed as the last value in the flat types
			if (wasmValues.length === flatParamTypes + 1) {
				const last = wasmValues[flatParamTypes];
				if (!Number.isInteger(last)) {
					throw new ComponentModelTrap(`Expected a pointer as return parameter, but got ${last}`);
				}
				out = last as ptr;
			}
		}

		if (this.paramType === undefined) {
			if ((out === undefined && wasmValues.length !== 0) || (out !== undefined && wasmValues.length !== 1)) {
				throw new ComponentModelTrap(`Expected no parameters, but got ${wasmValues.length}`);
			}
		} else if (this.paramType.flatTypes.length > Callable.MAX_FLAT_PARAMS) {
			const p0 = wasmValues[0];
			if (!Number.isInteger(p0)) {
				throw new ComponentModelTrap('Invalid pointer');
			}
			const srcReader = src.readonly(p0 as ptr, this.paramType.size);
			this.paramType.copy(this.paramType.alloc(dest), 0, srcReader, 0, context);
		} else {
			this.paramType.copyFlat(result, dest, wasmValues.values(), src, context);
		}
		// Allocate space for the result in dest and add it to the end of the flat values.
		if (out !== undefined && this.returnType !== undefined) {
			const destResult = this.returnType.alloc(dest);
			result.push(destResult.ptr);
			return { transferResult: destResult, originalResult: src.preAllocated(out, this.returnType.size) };
		} else {
			return undefined;
		}
	}

	protected lowerReturnValue(value: JType | void, memory: Memory, context: ComponentModelContext, out: ptr | undefined): WasmType | void {
		if (this.returnType === undefined) {
			return;
		}

		if (this.returnType.flatTypes.length <= Callable.MAX_FLAT_RESULTS) {
			const result: WasmType[] = [];
			this.returnType.lowerFlat(result, memory, value, context);
			if (result.length !== this.returnType.flatTypes.length) {
				throw new ComponentModelTrap(`Expected flat result of length ${this.returnType.flatTypes.length}, but got ${JSON.stringify(result, undefined, undefined)}`);
			}
			return result[0];
		} else {
			const writer = out !== undefined ? memory.preAllocated(out, this.returnType.size) : this.returnType.alloc(memory);
			this.returnType.store(writer, 0, value, context);
			return out !== undefined ? undefined : writer.ptr;
		}
	}

	protected handleError(error: any, memory: Memory, context: ComponentModelContext, out: ptr | undefined): WasmType | void {
		if (!(this.returnType instanceof ResultType) || this.returnType.errorClass === undefined || !(error instanceof this.returnType.errorClass)) {
			throw error;
		}
		const value = result.Error(error.value);
		return this.lowerReturnValue(value, memory, context, out);
	}

	protected copyReturnValue(resultStorage: { originalResult: MemoryRange; transferResult: MemoryRange } | undefined, dest: Memory, src: Memory, value: WasmType | undefined | void, context: ComponentModelContext): WasmType | undefined {
		if (resultStorage !== undefined) {
			if (this.returnType === undefined) {
				throw new ComponentModelTrap(`Result storage should not be set if there is no return type.`);
			}
			if (value !== undefined) {
				throw new ComponentModelTrap(`Can't use both result storage and result value ${value}.`);
			}
			this.returnType.copy(resultStorage.originalResult, 0, resultStorage.transferResult, 0, context);
			return undefined;
		} else if (value !== undefined) {
			if (this.returnType === undefined) {
				throw new ComponentModelTrap(`Expected no return value, but got ${value}`);
			}
			if (this.returnType.flatTypes.length > Callable.MAX_FLAT_RESULTS) {
				if (!Number.isInteger(value)) {
					throw new ComponentModelTrap(`Expected a pointer as return value, but got ${value}`);
				}
				const destWriter = this.returnType.alloc(dest);
				this.returnType.copy(destWriter, 0, src.preAllocated(value as ptr, this.returnType.size), 0, context);
				return destWriter.ptr;
			} else {
				return value;
			}
		} else {
			return undefined;
		}
	}

	/**
	 * Calls a function inside a wasm module.
	 */
	public callWasm(params: JType[], wasmFunction: WasmFunction, context: WasmContext): JType {
		const memory = context.getMemory();
		const wasmValues = this.lowerParamValues(params, memory, context);
		const result: WasmType | void = wasmFunction(...wasmValues);
		return this.liftReturnValue(result, memory, context);
	}

	/**
	 * Calls a resource method inside a wasm module.
	 */
	public callWasmMethod(obj: Resource & { $rep(): ResourceRepresentation}, params: JType[], wasmFunction: WasmFunction, context: WasmContext): JType {
		const memory = context.getMemory();
		const handle = obj.$rep();
		const wasmValues = this.lowerParamValues(params, memory, context);
		const result: WasmType | void = wasmFunction(handle, ...wasmValues);
		return this.liftReturnValue(result, memory, context);
	}

	/**
	 * Call a host function on the main thread from a wasm module.
	 */
	public callMain(connection: WorkerConnection, qualifier: string, params: WasmType[], context: WasmContext): WasmType | void {
		connection.prepareCall();
		const newParams: WasmType[] = [];
		const resultStorage =  this.copyParamValues(newParams, connection.getMemory(), params, context.getMemory(), context);
		const result = connection.callMain(`${qualifier}#${this.witName}`, newParams);
		return this.copyReturnValue(resultStorage, context.getMemory(), connection.getMemory(), result, context);
	}

	/**
	 * Call a wasm function from a worker thread.
	 */
	public callWasmFromWorker(transferMemory: Memory, func: WasmFunction, params: WasmType[], context: WasmContext): WasmType | void {
		const newParams: WasmType[] = [];
		const resultStorage = this.copyParamValues(newParams, context.getMemory(), params, transferMemory, context);
		const result = func(...newParams);
		return this.copyReturnValue(resultStorage, transferMemory, context.getMemory(), result, context);
	}

	/**
	 * Call a wasm method from a worker thread.
	 */
	public callWasmMethodFromWorker(transferMemory: Memory, func: WasmFunction, params: WasmType[], context: WasmContext): WasmType | void {
		const handle = params[0];
		if (typeof handle !== 'number') {
			throw new ComponentModelTrap(`Expected a number as handle, but got ${handle}`);
		}
		const newParams: WasmType[] = [];
		const resultStorage = this.copyParamValues(newParams, context.getMemory(), params.slice(1), transferMemory, context);
		const result = func(handle, ...newParams);
		return this.copyReturnValue(resultStorage, transferMemory, context.getMemory(), result, context);
	}

	/**
	 * Call the wasm function from the main thread.
	 */
	public async callWorker(connection: MainConnection, qualifier: string, params: JType[], context: ComponentModelContext): Promise<JType | void> {
		return connection.lock(async () => {
			connection.prepareCall();
			const memory = connection.getMemory();
			const wasmValues = this.lowerParamValues(params, memory, context);
			let result: WasmType | void = await connection.callWorker(`${qualifier}#${this.witName}`, wasmValues);
			return this.liftReturnValue(result, memory, context);
		});
	}

	/**
	 * Call a resource method inside a wasm module.
	 */
	public async callWorkerMethod(connection: MainConnection, qualifier: string, obj: Resource & { $rep(): ResourceRepresentation}, params: JType[], context: ComponentModelContext): Promise<JType> {
		return connection.lock(async () => {
			connection.prepareCall();
			const memory = connection.getMemory();
			const handle = obj.$rep();
			const wasmValues = this.lowerParamValues(params, memory, context).slice();
			wasmValues.unshift(handle);
			const result: WasmType | void = await connection.callWorker(`${qualifier}#${this.witName}`, wasmValues);
			return this.liftReturnValue(result, memory, context);
		});
	}

	protected getParamValuesForHostCall(params: WasmType[], memory: Memory, context: ComponentModelContext): [ReadonlyArray<JType>, ptr | undefined] {
		const returnFlatTypes = this.returnType === undefined ? 0 : this.returnType.flatTypes.length;
		// We currently only support 'lower' mode for results > MAX_FLAT_RESULTS. From the spec:
		// As an optimization, when lowering the return value of an imported function (via canon lower),
		// the caller can have already allocated space for the return value (e.g., efficiently on the stack),
		// passing in an i32 pointer as an parameter instead of returning an i32 as a return value.
		// See https://github.com/WebAssembly/component-model/blob/main/design/mvp/CanonicalABI.md#flattening
		let out: number | undefined;
		if (returnFlatTypes > FunctionType.MAX_FLAT_RESULTS) {
			const paramFlatTypes = this.paramType !== undefined ? this.paramType.flatTypes.length : 0;
			// The caller allocated the memory. We just need to pass the pointer.
			if (params.length === paramFlatTypes + 1) {
				const last = params[paramFlatTypes];
				if (typeof last !== 'number') {
					throw new ComponentModelTrap(`Result pointer must be a number (u32), but got ${out}.`);
				}
				out = last as number;
			}
		}
		return [this.liftParamValues(params, memory, context), out];
	}


	protected liftReturnValue(value: WasmType | void, memory: Memory, context: ComponentModelContext): JType {
		if (this.returnType === undefined) {
			return;
		}
		let result: JType;
		if (this.returnType.flatTypes.length <= Callable.MAX_FLAT_RESULTS) {
			result = this.returnType.liftFlat(memory, [value!].values(), context);
		} else {
			result = this.returnType.load(memory.readonly(value as ptr, this.returnType.size), 0, context);
		}
		if (this.returnType instanceof ResultType) {
			const resultValue = result as result<JType, JType>;
			if (resultValue.isError()) {
				if (this.returnType.errorClass === undefined) {
					throw new ComponentModelTrap(`Received an error result, but no error class is defined.`);
				}
				throw new this.returnType.errorClass(resultValue.value);
			} else {
				return resultValue.value;
			}
		} else {
			return result;
		}
	}
}

export class FunctionType<_T extends Function = Function> extends Callable  {

	constructor(witName: string, params: CallableParameter[], returnType?: AnyComponentModelType) {
		super(witName, params, returnType);
	}

	/**
	 * Calls a service function from a wasm module.
	 */
	public callService(func: JFunction, params: WasmType[], context: WasmContext): WasmType | void {
		const [jParams, out] = this.getParamValuesForHostCall(params, context.getMemory(), context);
		try {
			const result: JType = func(...jParams);
			return this.lowerReturnValue(result, context.getMemory(), context, out);
		} catch (error) {
			return this.handleError(error, context.getMemory(), context, out);
		}
	}

	public async callServiceAsync(memory: Memory, func: JFunctionAsync, params: WasmType[], context: ComponentModelContext): Promise<WasmType | void> {
		const [jParams, out] = this.getParamValuesForHostCall(params, memory, context);
		try {
			const result: JType = await func(...jParams);
			return this.lowerReturnValue(result, memory, context, out);
		} catch (error) {
			return this.handleError(error, memory, context, out);
		}
	}
}

export class ConstructorType<_T extends Function = Function> extends Callable {

	constructor(witName: string, params: CallableParameter[], returnType: AnyComponentModelType) {
		super(witName, params, returnType);
	}

	public callService(clazz: JClass, params: WasmType[], context: WasmContext): WasmType | void {
		// We currently only support 'lower' mode for results > MAX_FLAT_RESULTS.
		const returnFlatTypes = this.returnType === undefined ? 0 : this.returnType.flatTypes.length;
		if (returnFlatTypes !== 1) {
			throw new ComponentModelTrap(`Expected exactly one return type, but got ${returnFlatTypes}.`);
		}
		const memory  = context.getMemory();
		const jParams = this.liftParamValues(params, memory, context);
		const obj: Resource = new clazz(...jParams);
		return obj.$handle();
	}

	public async callServiceAsync(memory: Memory, clazz: JClassAsync, params: WasmType[], context: ComponentModelContext): Promise<WasmType | void> {
		// We currently only support 'lower' mode for results > MAX_FLAT_RESULTS.
		const returnFlatTypes = this.returnType === undefined ? 0 : this.returnType.flatTypes.length;
		if (returnFlatTypes !== 1) {
			throw new ComponentModelTrap(`Expected exactly one return type, but got ${returnFlatTypes}.`);
		}
		const jParams = this.liftParamValues(params, memory, context);
		const obj: Resource = await clazz.$new(...jParams);
		return obj.$handle();
	}

	public callWasmConstructor(params: JType[], wasmFunction: WasmFunction, context: WasmContext): number {
		const memory = context.getMemory();
		const wasmValues = this.lowerParamValues(params, memory, context);
		const result: WasmType | void = wasmFunction(...wasmValues);
		if (typeof result !== 'number') {
			throw new ComponentModelTrap(`Expected a number (u32) as return value, but got ${result}.`);
		}
		return result;
	}

	public callWasmConstructorAsync(connection: MainConnection, qualifier: string, params: JType[], context: ComponentModelContext): Promise<ResourceHandle> {
		return connection.lock(async () => {
			connection.prepareCall();
			const memory = connection.getMemory();
			const wasmValues = this.lowerParamValues(params, memory, context);
			return connection.callWorker(`${qualifier}#${this.witName}`, wasmValues);
		}) as Promise<ResourceHandle>;
	}
}

export class DestructorType<_T extends Function = Function> extends Callable {

	constructor(witName: string, params: CallableParameter[]) {
		super(witName, params);
	}

	public callService(params: WasmType[], resourceManager: ResourceManager): void {
		const handle = params[0];
		if (typeof handle === 'bigint' || !u32.valid(handle)) {
			throw new ComponentModelTrap(`Object handle must be a number (u32), but got ${handle}.`);
		}
		const resource: any = resourceManager.getResource(handle);
		resource['$drop'] !== undefined && resource['$drop']();
		resourceManager.removeResource(handle);
	}

	public async callServiceAsync(_memory: Memory, params: WasmType[], resourceManager: ResourceManager): Promise<void> {
		const handle = params[0];
		if (typeof handle === 'bigint' || !u32.valid(handle)) {
			throw new ComponentModelTrap(`Object handle must be a number (u32), but got ${handle}.`);
		}
		const resource: any = resourceManager.getResource(handle);
		resource['$drop'] !== undefined && await resource['$drop']();
		resourceManager.removeResource(handle);
	}
}

export class StaticMethodType<_T extends Function = Function> extends Callable {

	constructor(witName: string, params: CallableParameter[], returnType?: AnyComponentModelType) {
		super(witName, params, returnType);
	}

	public callService(func: JFunction, params: WasmType[], context: WasmContext): WasmType | void {
		const [jParams, out] = this.getParamValuesForHostCall(params, context.getMemory(), context);
		try {
			const result: JType = func(...jParams);
			return this.lowerReturnValue(result, context.getMemory(), context, out);
		} catch (error) {
			return this.handleError(error, context.getMemory(), context, out);
		}
	}

	public async callServiceAsync(memory: Memory, func: JFunctionAsync, params: WasmType[], context: ComponentModelContext): Promise<WasmType | void> {
		const [jParams, out] = this.getParamValuesForHostCall(params, memory, context);
		try {
			const result: JType = await func(...jParams);
			return this.lowerReturnValue(result, memory, context, out);
		} catch (error) {
			return this.handleError(error, memory, context, out);
		}
	}
}

export class MethodType<_T extends Function = Function> extends Callable {

	constructor(witName: string, params: CallableParameter[], returnType?: AnyComponentModelType) {
		super(witName, params, returnType);
	}

	public callService(methodName: string, params: WasmType[], resourceManager: ResourceManager, context: WasmContext): WasmType | void {
		if (params.length === 0) {
			throw new ComponentModelTrap(`Method calls must have at least one parameter (the object pointer).`);
		}
		// We need to cut off the first parameter (the object handle).
		const handle = params.shift();
		if (typeof handle !== 'number') {
			throw new ComponentModelTrap(`Object handle must be a number (u32), but got ${handle}.`);
		}
		const [jParams, out] = this.getParamValuesForHostCall(params, context.getMemory(), context);
		const resource = resourceManager.getResource(handle);
		const memory  = context.getMemory();
		try {
			const result: JType = (resource as any)[methodName](...jParams);
			return this.lowerReturnValue(result, memory, context, out);
		} catch (error) {
			return this.handleError(error, memory, context, out);
		}
	}

	public async callServiceAsync(memory: Memory, methodName: string, params: WasmType[], resourceManager: ResourceManager, context: ComponentModelContext): Promise<WasmType | void> {
		if (params.length === 0) {
			throw new ComponentModelTrap(`Method calls must have at least one parameter (the object pointer).`);
		}
		// We need to cut off the first parameter (the object handle).
		const handle = params.shift();
		if (typeof handle !== 'number') {
			throw new ComponentModelTrap(`Object handle must be a number (u32), but got ${handle}.`);
		}
		const [jParams, out] = this.getParamValuesForHostCall(params, memory, context);
		const resource = resourceManager.getResource(handle);
		try {
			const result: JType = await (resource as any)[methodName](...jParams);
			return this.lowerReturnValue(result, memory, context, out);
		} catch (error) {
			return this.handleError(error, memory, context, out);
		}
	}
}

export type ResourceCallable<T extends JFunction = JFunction> = MethodType<T> | StaticMethodType<T> | ConstructorType<T> | DestructorType;

export type ResourceHandle<_T extends Resource = Resource> = u32;
export class ResourceHandleType implements ComponentModelType<ResourceHandle> {

	public readonly kind: ComponentModelTypeKind;
	public readonly size: size;
	public readonly alignment: Alignment;
	public readonly flatTypes: readonly GenericFlatType[];

	public readonly witName: string;

	constructor(witName: string) {
		this.witName = witName;
		this.kind = ComponentModelTypeKind.resourceHandle;
		this.size = u32.size;
		this.alignment = u32.alignment;
		this.flatTypes = u32.flatTypes;
	}

	public load(memory: ReadonlyMemoryRange, offset: offset): ResourceHandle {
		return u32.load(memory, offset);
	}

	public liftFlat(memory: Memory, values: FlatValuesIter): ResourceHandle {
		return u32.liftFlat(memory, values);
	}

	public alloc(memory: Memory): MemoryRange {
		return u32.alloc(memory);
	}

	public store(memory: MemoryRange, offset: offset, value: ResourceHandle): void {
		u32.store(memory, offset, value);
	}

	public lowerFlat(result: WasmType[], memory: Memory, value: ResourceHandle): void {
		u32.lowerFlat(result, memory, value);
	}

	public copy(dest: MemoryRange, dest_offset: offset, src: ReadonlyMemoryRange, src_offset: offset): void {
		u32.copy(dest, dest_offset, src, src_offset);
	}

	public copyFlat(result: WasmType[], dest: Memory, values: FlatValuesIter, src: Memory): void {
		u32.copyFlat(result, dest, values, src);
	}
}

export class ResourceType<T extends Resource = Resource> implements ComponentModelType<T> {

	public readonly kind: ComponentModelTypeKind;
	public readonly size: size;
	public readonly alignment: Alignment;
	public readonly flatTypes: readonly GenericFlatType[];


	public readonly witName: string;
	public readonly id: string;
	public readonly callables: Map<string, ResourceCallable>;

	constructor(witName: string, id: string) {
		this.kind = ComponentModelTypeKind.resource;
		this.size = u32.size;
		this.alignment = u32.alignment;
		this.flatTypes = u32.flatTypes;
		this.witName = witName;
		this.id = id;
		this.callables = new Map();
	}

	public addConstructor(jsName: string, func: ConstructorType): void {
		this.callables.set(jsName, func);
	}

	public addDestructor(jsName: string, func: DestructorType): void {
		this.callables.set(jsName, func);
	}

	public addStaticMethod(jsName: string, func: StaticMethodType): void {
		this.callables.set(jsName, func);
	}

	public addMethod(jsName: string, func: MethodType): void {
		this.callables.set(jsName, func);
	}

	public getCallable(jsName: string): ResourceCallable {
		const result = this.callables.get(jsName);
		if (result === undefined) {
			throw new ComponentModelTrap(`Method '${jsName}' not found on resource '${this.witName}'.`);
		}
		return result;
	}

	public load(memory: ReadonlyMemoryRange, offset: offset, context: ComponentModelContext): T {
		const handle = u32.load(memory, offset);
		return context.resources.ensure(this.id).getResource(handle) as T;
	}

	public liftFlat(memory: Memory, values: FlatValuesIter, context: ComponentModelContext): T {
		const handle = u32.liftFlat(memory, values);
		return context.resources.ensure(this.id).getResource(handle) as T;
	}

	public alloc(memory: Memory): MemoryRange {
		return u32.alloc(memory);
	}

	public store(memory: MemoryRange, offset: offset, value: T): void {
		const handle = value.$handle();
		u32.store(memory, offset, handle);
	}

	public lowerFlat(result: WasmType[], memory: Memory, value: T): void {
		const handle = value.$handle();
		u32.lowerFlat(result, memory, handle);
	}

	public copy(dest: MemoryRange, dest_offset: offset, src: ReadonlyMemoryRange, src_offset: offset): void {
		u32.copy(dest, dest_offset, src, src_offset);
	}

	public copyFlat(result: WasmType[], dest: Memory, values: FlatValuesIter, src: Memory): void {
		u32.copyFlat(result, dest, values, src);
	}
}

class AbstractWrapperType<T extends  NonNullable<JType>> implements ComponentModelType<T> {

	public readonly kind: ComponentModelTypeKind;
	public readonly size: size;
	public readonly alignment: Alignment;
	public readonly flatTypes: readonly GenericFlatType[];

	private readonly wrapped: ComponentModelType<T>;

	constructor(kind: ComponentModelTypeKind, wrapped: ComponentModelType<T>) {
		this.kind = kind;
		this.wrapped = wrapped;
		this.size = u32.size;
		this.alignment = u32.alignment;
		this.flatTypes = u32.flatTypes;
	}

	public load(memory: ReadonlyMemoryRange, offset: offset, context: ComponentModelContext): T {
		return this.wrapped.load(memory, offset, context);
	}

	public liftFlat(memory: Memory, values: FlatValuesIter, context: ComponentModelContext): T {
		return this.wrapped.liftFlat(memory, values, context);
	}

	public alloc(memory: Memory): MemoryRange {
		return u32.alloc(memory);
	}

	public store(memory: MemoryRange, offset: offset, value: T, context: ComponentModelContext): void {
		return this.wrapped.store(memory, offset, value, context);
	}

	public lowerFlat(result: WasmType[], memory: Memory, value: T, context: ComponentModelContext): void {
		return this.wrapped.lowerFlat(result, memory, value, context);
	}

	public copy(dest: MemoryRange, dest_offset: offset, src: ReadonlyMemoryRange, src_offset: offset, context: ComponentModelContext): void {
		return this.wrapped.copy(dest, dest_offset, src, src_offset, context);
	}

	public copyFlat(result: WasmType[], dest: Memory, values: FlatValuesIter, src: Memory, context: ComponentModelContext): void {
		return this.wrapped.copyFlat(result, dest, values, src, context);
	}
}

export type borrow<T extends NonNullable<JType>> = T;
export class BorrowType<T extends NonNullable<JType>> extends AbstractWrapperType<T> {
	constructor(type: ComponentModelType<T>) {
		super(ComponentModelTypeKind.borrow, type);
	}
}

export type own<T extends  NonNullable<JType>> = T;
export class OwnType<T extends  NonNullable<JType>> extends  AbstractWrapperType<T> {
	constructor(type: ComponentModelType<T>) {
		super(ComponentModelTypeKind.own, type);
	}
}

export type InterfaceType = {
	readonly id: string;
	readonly witName: string;
	readonly types?: Map<string, AnyComponentModelType>;
	readonly functions?: Map<string, FunctionType<JFunction>>;
	readonly resources?: Map<string, ResourceType>;
};
export namespace InterfaceType {
	export function is(value: any): value is InterfaceType {
		return typeof value === 'object' && typeof value.id === 'string' && typeof value.witName === 'string'
			&& value.types instanceof Map && value.functions instanceof Map && value.resources instanceof Map;
	}
}

export type WasmModuleImports = Record<string, WasmFunction>;
export type WasmImports = Record<string, WasmModuleImports>;
export type WasmExports = Record<string, Function>;

export type ServiceInterface = Record<string, JFunction | JClass>;
export type WorldServiceInterface = Record<string, JFunction | ServiceInterface>;
export type ServiceInterfaceAsync = Record<string, JFunctionAsync | JClassAsync>;
export type WorldServiceInterfaceAsync = Record<string, JFunction | ServiceInterfaceAsync>;

type ServiceInterfaceImplementation = Record<string, Function | Record<string, Function> | { new (...params: any): Resource }>;
type WorldServiceInterfaceImplementation = Record<string, Function | ServiceInterfaceImplementation>;
type ServiceInterfaceImplementationAsync = Record<string, Function | Record<string, Function> | { $new(...params: any): Resource | Promise<Resource> }>;
type WorldServiceInterfaceImplementationAsync = Record<string, Function | ServiceInterfaceImplementationAsync>;

export type WorldType = {
	readonly id: string;
	readonly witName: string;
	readonly imports?: {
		readonly functions?: Map<string, FunctionType<JFunction>>;
		readonly interfaces?: Map<string, InterfaceType>;
	};
	readonly exports?: {
		readonly functions?: Map<string, FunctionType<JFunction>>;
		readonly interfaces?: Map<string, InterfaceType>;
	};
};

export type PackageType = {
	readonly id: string;
	readonly witName: string;
	readonly interfaces?: Map<string, InterfaceType>;
	readonly worlds?: Map<string, WorldType>;
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

export namespace WasmContext {
	export class Default implements WasmContext {

		private memory: Memory | undefined;
		public readonly options: Options;
		public readonly resources: ResourceManagers;

		constructor(options?: Options, resources?: ResourceManagers) {
			this.options = options ?? { encoding: 'utf-8' };
			this.resources = resources ?? new ResourceManagers.Default();
		}

		public initialize(memory: Memory) {
			if (this.memory !== undefined) {
				throw new MemoryError(`Memory is already initialized.`);
			}
			this.memory = memory;
		}

		public getMemory() {
			if (this.memory === undefined) {
				throw new MemoryError(`Memory not yet initialized.`);
			}
			return this.memory;
		}
	}
	export function is(value: any): value is WasmContext {
		const candidate = value as WasmContext;
		return candidate && typeof candidate.getMemory === 'function' && Options.is(candidate.options) && ResourceManagers.is(candidate.resources);
	}
}

function getResourceManager(resource: ResourceType, clazz: JClass | JClassAsync| undefined, context: ComponentModelContext): ResourceManager {
	let resourceManager: ResourceManager;
	if (context.resources.has(resource.id)) {
		resourceManager = context.resources.ensure(resource.id);
	} else {
		resourceManager = ResourceManager.from(clazz) ?? new ResourceManager.Default();
		context.resources.set(resource.id, resourceManager);
	}
	return resourceManager;
}

export namespace $imports {
	type _Distribute<T> = T extends any ? _Promisify<T> : never;
	type _Required<T> = {
		[K in keyof T]-?: T[K] extends (...args: any[]) => any
			? T[K]
			: T[K] extends object
				? _Required<T[K]>
				: T[K]
	};
	type _Promisify<T> = {
		[K in keyof T]: T[K] extends (...args: infer A) => infer R
			? K extends '$handle'
				? T[K]
				: (...args: A) => Promise<R> | R
			: T[K] extends object
				? _Distribute<T[K]>
				: T[K];
	};
	export type Promisify<T> = _Promisify<_Required<T>>;

	export function create<R>(world: WorldType, service: WorldServiceInterfaceImplementation, context: WasmContext): R {
		const packageName = world.id.substring(0, world.id.indexOf('/'));
		const result: WasmImports = Object.create(null);
		if (world.imports !== undefined) {
			if (world.imports.functions !== undefined) {
				result['$root'] = doCreate(world.imports.functions, undefined, service as ServiceInterfaceImplementation, context);
			}
			if (world.imports.interfaces !== undefined) {
				for (const [name, iface] of world.imports.interfaces) {
					const propName = `${name[0].toLowerCase()}${name.substring(1)}`;
					result[`${packageName}/${iface.witName}`] = doCreate(iface.functions, iface.resources, service[propName] as ServiceInterfaceImplementation, context);
				}
			}
		}
		if (world.exports !== undefined) {
			if (world.exports.interfaces !== undefined) {
				for (const iface of world.exports.interfaces.values()) {
					if (iface.resources === undefined) {
						continue;
					}
					for (const resource of iface.resources.values()) {
						const manager = getResourceManager(resource, undefined, context);
						const exports = Object.create(null);
						exports[`[resource-new]${resource.witName}`] = (rep: u32) => manager.newHandle(rep);
						exports[`[resource-rep]${resource.witName}`] = (handle: u32) => manager.getRepresentation(handle);
						exports[`[resource-drop]${resource.witName}`] = (handle: u32) => manager.dropHandle(handle);
						result[`[export]${packageName}/${iface.witName}`] = exports;
					}
				}
			}
		}
		return result as unknown as R;
	}

	export function loop<R>(world: WorldType, service: WorldServiceInterfaceImplementation, context: WasmContext): R {
		const imports = create<WasmImports>(world, service, context);
		const wasmExports = asExports(imports, context);
		const loop: WorldType = {
			id: world.id,
			witName: world.witName,
			imports: world.exports !== undefined ? {
				functions: world.exports.functions,
				interfaces: world.exports.interfaces,
			} : undefined,
			exports: world.imports !== undefined ? {
				functions: world.imports.functions,
				interfaces: world.imports.interfaces,
			} : undefined,
		};
		return $exports.bind(loop, wasmExports, context) as unknown as R;
	}

	function asExports(imports: WasmImports, context: WasmContext): WasmModuleImports {
		const result: WasmModuleImports = Object.create(null);
		const keys = Object.keys(imports);
		for (const ifaceName of keys) {
			const iface = imports[ifaceName];
			if (ifaceName.startsWith('[export]')) {
				continue;
			} else  if (ifaceName === '$root') {
				for (const funcName of Object.keys(iface)) {
					result[funcName] = iface[funcName];
				}
			} else {
				const qualifier = `${ifaceName}#`;
				for (const funcName of Object.keys(iface)) {
					if (funcName.startsWith('[constructor]')) {
						const managerId = `${ifaceName}/${funcName.substring(13 /* length of [constructor] */)}`;
						const resourceManager = context.resources.ensure(managerId);
						result[`${qualifier}${funcName}`] = (...args: any[]) => {
							const handle = (iface[funcName] as WasmFunction)(...args) as ResourceHandle;
							return resourceManager.registerLoop(handle);
						};
					} else if (funcName.startsWith('[method]')) {
						let resourceName = funcName.substring(8 /* length of [method] */);
						if (resourceName.indexOf('.') !== -1) {
							resourceName = resourceName.substring(0, resourceName.indexOf('.'));
						}
						const managerId = `${ifaceName}/${resourceName}`;
						const resourceManager = context.resources.ensure(managerId);
						result[`${qualifier}${funcName}`] = ((rep: ResourceRepresentation, ...args: any[]): any => {
							return (iface[funcName] as WasmFunction)(resourceManager.getLoop(rep), ...args);
						}) as WasmFunction;
					} else if (funcName.startsWith('[resource-drop]')) {
						result[`${qualifier}[dtor]${funcName.substring(15 /* length of [resource-drop] */)}`] = iface[funcName];
					} else {
						result[`${qualifier}${funcName}`] = iface[funcName] as WasmFunction;
					}
				}
			}
		}
		return result;
	}

	function doCreate(functions: Map<string, FunctionType<JFunction>> | undefined, resources: Map<string, ResourceType> | undefined, service: ServiceInterfaceImplementation, context: WasmContext): WasmModuleImports {
		const result: WasmModuleImports  = Object.create(null);
		if (functions !== undefined) {
			for (const [funcName, func] of functions) {
				result[func.witName] = createFunction(func, service[funcName] as JFunction, context);
			}
		}
		if (resources !== undefined) {
			for (const [resourceName, resource ] of resources) {
				const clazz = service[resourceName] as JClass;
				const resourceManager: ResourceManager = getResourceManager(resource, clazz, context);
				for (const [callableName, callable] of resource.callables) {
					if (callable instanceof ConstructorType) {
						result[callable.witName] = createConstructorFunction(callable, clazz, context);
					} else if (callable instanceof StaticMethodType) {
						result[callable.witName] = createStaticMethodFunction(callable, (service[resourceName] as JClass)[callableName], context);
					} else if (callable instanceof MethodType) {
						result[callable.witName] = createMethodFunction(callableName, callable, resourceManager, context);
					} else if (callable instanceof DestructorType) {
						result[callable.witName] = createDestructorFunction(callable, resourceManager);
					}
				}
			}
		}
		return result;
	}

	function createFunction(callable: FunctionType<JFunction>, serviceFunction: JFunction, context: WasmContext): WasmFunction {
		return function (this: void, ...params: WasmType[]): number | bigint | void {
			return callable.callService(serviceFunction, params, context);
		};
	}

	function createConstructorFunction(callable: ConstructorType, clazz: JClass, context: WasmContext): WasmFunction {
		return function (this: void, ...params: WasmType[]): number | bigint | void {
			return callable.callService(clazz, params, context);
		};
	}

	function createDestructorFunction(callable: DestructorType, manager: ResourceManager): WasmFunction {
		return function (this: void, ...params: WasmType[]): number | bigint | void {
			return callable.callService(params, manager);
		};
	}

	function createStaticMethodFunction(callable: StaticMethodType, func: JFunction, context: WasmContext): WasmFunction {
		return function (this: void, ...params: WasmType[]): number | bigint | void {
			return callable.callService(func, params, context);
		};
	}

	function createMethodFunction(name: string, callable: MethodType, manager: ResourceManager, context: WasmContext): WasmFunction {
		return function (this: void, ...params: WasmType[]): number | bigint | void {
			return callable.callService(name, params, manager, context);
		};
	}

	export namespace worker {
		export function create(connection: WorkerConnection, world: WorldType, context: WasmContext): WasmImports {
			const packageName = world.id.substring(0, world.id.indexOf('/'));
			const result: WasmImports  = Object.create(null);
			if (world.imports !== undefined) {
				if (world.imports.functions !== undefined) {
					result['$root'] = doCreate(connection, '$root', world.imports.functions, undefined, context);
				}
				if (world.imports.interfaces !== undefined) {
					for (const iface of world.imports.interfaces.values()) {
						const qualifier = `${packageName}/${iface.witName}`;
						result[qualifier] = doCreate(connection, qualifier, iface.functions, iface.resources, context);
					}
				}
			}
			if (world.exports !== undefined) {
				if (world.exports.interfaces !== undefined) {
					for (const iface of world.exports.interfaces.values()) {
						if (iface.resources === undefined) {
							continue;
						}
						for (const resource of iface.resources.values()) {
							const exports = Object.create(null);
							const qualifier = `[export]${packageName}/${iface.witName}`;
							const newName = `[resource-new]${resource.witName}`;
							exports[newName] = (rep: u32) => connection.callMain(`${qualifier}#${newName}`, [rep]);
							const repName = `[resource-rep]${resource.witName}`;
							exports[repName] = (handle: u32) => connection.callMain(`${qualifier}#${repName}`, [handle]);
							const dropName = `[resource-drop]${resource.witName}`;
							exports[dropName] = (handle: u32) => connection.callMain(`${qualifier}#${dropName}`, [handle]);
							result[qualifier] = exports;
						}
					}
				}
			}
			return result;
		}

		function doCreate(connection: WorkerConnection, qualifier: string, functions: Map<string, FunctionType<JFunction>> | undefined, resources: Map<string, ResourceType> | undefined, context: WasmContext): WasmModuleImports {
			const result: WasmModuleImports  = Object.create(null);
			if (functions !== undefined) {
				for (const [, func] of functions) {
					result[func.witName] = function(this: void, ...params: WasmType[]): number | bigint | void {
						return func.callMain(connection, qualifier, params, context);
					};
				}
			}
			if (resources !== undefined) {
				for (const resource of resources.values()) {
					for (const callable of resource.callables.values()) {
						result[callable.witName] = function(this: void, ...params: WasmType[]): number | bigint | void {
							return callable.callMain(connection, qualifier, params, context);
						};
					}
				}
			}
			return result;
		}
	}
}

export namespace $exports {
	type _Distribute<T> = T extends any ? _Promisify<T> : never;
	type _Required<T> = {
		[K in keyof T]-?: T[K] extends (...args: any[]) => any
			? T[K]
			: T[K] extends object
				? _Required<T[K]>
				: T[K]
	};
	type _Promisify<T> = {
		[K in keyof T]: T[K] extends (...args: infer A) => infer R
			? K extends '$new'
				? (...arg: A) => Promise<_Promisify<R>>
				: (...args: A) => Promise<R>
			: T[K] extends object
				? _Distribute<T[K]>
				: T[K];
	};
	export type Promisify<T> = _Promisify<_Required<T>>;

	export function bind<R>(world: WorldType, exports: WasmExports, context: WasmContext): R {
		const [root, scoped] = partition(exports);
		const result: WorldServiceInterface = Object.create(null);
		if (world.exports !== undefined) {
			if (world.exports.functions !== undefined) {
				Object.assign(result, doBind(world.exports.functions, undefined, root, context));
			}
			if (world.exports.interfaces !== undefined) {
				for (const [name, iface] of world.exports.interfaces) {
					const propName = `${name[0].toLowerCase()}${name.substring(1)}`;
					result[propName] = doBind(iface.functions, iface.resources, scoped[iface.id], context);
				}
			}
		}
		return result as unknown as R;
	}

	function partition(exports: WasmExports): [WasmExports, Record<string, WasmExports>] {
		const root: WasmExports = Object.create(null);
		const scoped: Record<string, WasmExports> = Object.create(null);
		for (const [key, value] of Object.entries(exports)) {
			const parts = key.split('#');
			if (parts.length === 1) {
				root[key] = value;
			} else {
				const [iface, func] = parts;
				if (scoped[iface] === undefined) {
					scoped[iface] = Object.create(null);
				}
				scoped[iface][func] = value;
			}
		}
		return [root, scoped];
	}

	function doBind(functions: Map<string, FunctionType> | undefined, resources: Map<string, ResourceType> | undefined, wasm: Record<string, Function>, context: WasmContext): ServiceInterface {
		const result: ServiceInterface = Object.create(null);
		if (functions !== undefined) {
			for (const [name, func] of functions) {
				result[name] = createFunction(func, wasm[func.witName] as WasmFunction, context);
			}
		}
		if (resources !== undefined) {
			for (const [name, resource] of resources) {
				const resourceManager = getResourceManager(resource, undefined, context);
				const cl =  clazz.create(resource, wasm, context);
				resourceManager.setProxyInfo(cl, wasm[`[dtor]${resource.witName}`] as (self: number) => void);
				result[name] = cl as unknown as JClass;
			}
		}
		return result;
	}

	function createFunction(func: FunctionType<JFunction>, wasmFunction: WasmFunction, context: WasmContext): JFunction {
		return (...params: JType[]): JType => {
			return func.callWasm(params, wasmFunction, context);
		};
	}

	export namespace worker {
		export function bind(connection: WorkerConnection, world: WorldType, exports: WasmExports, context: WasmContext): void {
			const packageName = world.id.substring(0, world.id.indexOf('/'));
			const [root, scoped] = partition(exports);
			if (world.exports !== undefined) {
				doBind(connection, packageName, world.exports.functions, undefined, root, context);
				if (world.exports.interfaces !== undefined) {
					for (const iface of world.exports.interfaces.values()) {
						doBind(connection, `${packageName}/${iface.witName}`, iface.functions, iface.resources, scoped[iface.id], context);
					}
				}
			}
		}

		function doBind(connection: WorkerConnection, qualifier: string, functions: Map<string, FunctionType> | undefined, resources: Map<string, ResourceType> | undefined, exports: WasmExports, context: WasmContext) : void {
			if (functions !== undefined) {
				for (const func of functions.values()) {
					connection.on(`${qualifier}#${func.witName}`, (memory: Memory, params: WasmType[]) => {
						return func.callWasmFromWorker(memory, exports[func.witName] as WasmFunction, params, context);
					});
				}
			}
			if (resources !== undefined) {
				for (const resource of resources.values()) {
					for (const callable of resource.callables.values()) {
						if (callable instanceof ConstructorType || callable instanceof StaticMethodType) {
							connection.on(`${qualifier}#${callable.witName}`, (memory, params: WasmType[]) => {
								return callable.callWasmFromWorker(memory, exports[callable.witName] as WasmFunction, params, context);
							});
						} else {
							connection.on(`${qualifier}#${callable.witName}`, (memory, params: WasmType[]) => {
								return callable.callWasmMethodFromWorker(memory, exports[callable.witName] as WasmFunction, params, context);
							});
						}
					}
				}
			}
		}
	}
}

namespace clazz {
	interface AnyProxyClass {
		new (handleTag: symbol, handle: ResourceHandle<any>, rep: ResourceRepresentation): any;
		new (...args: any[]): any;
	}
	export function create(resource: ResourceType, wasm: WasmExports, context: WasmContext): AnyProxyClass {
		let resourceManager: ResourceManager;
		if (context.resources.has(resource.id)) {
			resourceManager = context.resources.ensure(resource.id);
		} else {
			resourceManager = new ResourceManager.Default();
			context.resources.set(resource.id, resourceManager);
		}
		const clazz = class extends Resource.Default {
			private readonly _rep: ResourceRepresentation;
			constructor(handleTag: symbol, handle: ResourceHandle, rep: ResourceRepresentation);
			constructor(...args: any[]);
			constructor(...args: any[]) {
				if (args[0] === ResourceManager.handleTag) {
					const handle = args[1] as ResourceHandle;
					super(handle);
					this._rep = (args[2] as ResourceRepresentation);
				} else {
					const ctor = resource.getCallable('constructor') as ConstructorType;
					const handle = ctor.callWasmConstructor(args, wasm[ctor.witName] as WasmFunction, context);
					super(handle);
					this._rep = resourceManager.getRepresentation(this.$handle());
				}
			}
			public $rep(): ResourceRepresentation {
				return this._rep;
			}
		};
		for (const [name, callable] of resource.callables) {
			if (callable instanceof MethodType) {
				(clazz.prototype as any)[name] = function (...params: JType[]): JType {
					return callable.callWasmMethod(this, params, wasm[callable.witName] as WasmFunction, context);
				};
			} else if (callable instanceof DestructorType) {
				(clazz.prototype as any)[name] = function (...params: JType[]): JType {
					return callable.callWasmMethod(this, params, wasm[callable.witName] as WasmFunction, context);
				};
			} else if (callable instanceof StaticMethodType) {
				(clazz as any)[name] = (...params: JType[]): JType => {
					return callable.callWasm(params,  wasm[callable.witName] as WasmFunction, context);
				};
			}
		}
		return clazz;
	}

	interface AnyPromiseProxyClass {
		new (handleTag: symbol, handle: ResourceHandle<any>, rep: ResourceRepresentation): any;
		$new(...args: JType[]): any;
	}
	export function createPromise(connection: MainConnection, qualifier: string, resource: ResourceType, context: ComponentModelContext): AnyPromiseProxyClass {
		let resourceManager: ResourceManager;
		if (context.resources.has(resource.id)) {
			resourceManager = context.resources.ensure(resource.id);
		} else {
			resourceManager = new ResourceManager.Default();
			context.resources.set(resource.id, resourceManager);
		}
		const clazz = class extends Resource.Default {
			private readonly _rep: ResourceRepresentation;

			public static async $new(...args: JType[]): Promise<any> {
				const ctor = resource.getCallable('constructor') as ConstructorType;
				const result = await ctor.callWasmConstructorAsync(connection, qualifier, args, context);
				return new clazz(ResourceManager.handleTag, result, resourceManager.getRepresentation(result)) as unknown as AnyProxyClass;
			}
			constructor(_handleTag: symbol, handle: ResourceHandle, rep: ResourceRepresentation) {
				super(handle);
				this._rep = rep;
			}
			public $rep(): ResourceRepresentation {
				return this._rep;
			}
		};
		for (const [name, callable] of resource.callables) {
			if (callable instanceof MethodType) {
				(clazz.prototype as any)[name] = function (...params: JType[]): Promise<JType> {
					return callable.callWorkerMethod(connection, qualifier, this, params, context);
				};
			} else if (callable instanceof DestructorType) {
				(clazz.prototype as any)[name] = function (...params: JType[]): Promise<JType> {
					return callable.callWorkerMethod(connection, qualifier, this, params, context);
				};
			} else if (callable instanceof StaticMethodType) {
				(clazz as any)[name] = (...params: JType[]): Promise<JType> => {
					return callable.callWorker(connection, qualifier, params, context);
				};
			}
		}
		return clazz;
	}
}

export namespace $main {
	export function bind(world: WorldType, service: WorldServiceInterfaceImplementation | WorldServiceInterfaceImplementationAsync, code: Code, portOrContext?: ComponentModelContext | RAL.ConnectionPort, context?: ComponentModelContext): Promise<any> {
		if (portOrContext === undefined) {
			return bindSync(world, service as WorldServiceInterfaceImplementation, code, new WasmContext.Default());
		} else if (ComponentModelContext.is(portOrContext)) {
			return bindSync(world, service as WorldServiceInterfaceImplementation, code, portOrContext);
		} else {
			return bindAsync(world, service, code, portOrContext, context ?? { options: { encoding: 'utf-8' }, resources: new ResourceManagers.Default() });
		}
	}

	async function bindSync(world: WorldType, service: WorldServiceInterfaceImplementation, code: Code, context: ComponentModelContext | undefined): Promise<any> {
		const wasmContext = context !== undefined ? new WasmContext.Default(context.options, context.resources) : new WasmContext.Default();
		type literal = { module: WebAssembly_.Module; memory?: WebAssembly_.Memory };
		let module: WebAssembly_.Module;
		let memory: WebAssembly_.Memory | undefined = undefined;
		if ((code as literal).module !== undefined) {
			module = (code as literal).module;
			memory = (code as literal).memory;
		} else {
			module = code;
		}
		const imports = $imports.create<WasmImports>(world, service, wasmContext);
		if (memory !== undefined) {
			(imports as any).env.memory = memory;
		}
		const instance = await RAL().WebAssembly.instantiate(module, imports);
		wasmContext.initialize(new Memory.Default(instance.exports));
		return $exports.bind(world, instance.exports as WasmExports, wasmContext);
	}

	async function bindAsync(world: WorldType, service: WorldServiceInterfaceImplementationAsync, code: Code, port: RAL.ConnectionPort, context: ComponentModelContext): Promise<WorldServiceInterfaceAsync> {
		const connection = await RAL().Connection.createMain(port);
		connection.listen();
		await connection.initialize(code, context.options);

		bindServiceAsync(connection, world, service, context);
		return bindApi(connection, world, context);
	}

	function bindServiceAsync(connection: MainConnection, world: WorldType, service: WorldServiceInterfaceImplementationAsync, context: ComponentModelContext): void {
		const packageName = world.id.substring(0, world.id.indexOf('/'));
		if (world.imports !== undefined) {
			if (world.imports.functions !== undefined) {
				doBindServiceAsync(connection, '$root', world.imports.functions, undefined, service, context);
			}
			if (world.imports.interfaces !== undefined) {
				for (const [name, iface] of world.imports.interfaces) {
					const propName = `${name[0].toLowerCase()}${name.substring(1)}`;
					doBindServiceAsync(connection, `${packageName}/${iface.witName}`, iface.functions, iface.resources, service[propName] as ServiceInterfaceImplementationAsync, context);
				}
			}
		}
		if (world.exports !== undefined) {
			if (world.exports.interfaces !== undefined) {
				for (const iface of world.exports.interfaces.values()) {
					if (iface.resources === undefined) {
						continue;
					}
					const qualifier = `[export]${packageName}/${iface.witName}`;
					for (const resource of iface.resources.values()) {
						const manager = getResourceManager(resource, undefined, context);
						connection.on(`${qualifier}#[resource-new]${resource.witName}`, (_memory: Memory, params: WasmType[]) => manager.newHandle(params[0] as u32));
						connection.on(`${qualifier}#[resource-rep]${resource.witName}`, (_memory: Memory, params: WasmType[]) => manager.getRepresentation(params[0] as u32));
						connection.on(`${qualifier}#[resource-drop]${resource.witName}`, (_memory: Memory, params: WasmType[]) => manager.dropHandle(params[0] as u32));
					}
				}
			}
		}
	}

	function doBindServiceAsync(connection: MainConnection, qualifier: string, functions: Map<string, FunctionType> | undefined, resources: Map<string, ResourceType> | undefined, service: WorldServiceInterfaceImplementationAsync, context: ComponentModelContext): void {
		if (functions !== undefined) {
			for (const [funcName, func] of functions) {
				connection.on(`${qualifier}#${func.witName}`, (memory: Memory, params: WasmType[]) => {
					return func.callServiceAsync(memory, service[funcName] as JFunctionAsync, params, context);
				});
			}
		}
		if (resources !== undefined) {
			for (const [resourceName, resource] of resources) {
				const clazz = service[resourceName] as JClassAsync;
				const resourceManager: ResourceManager = getResourceManager(resource, clazz, context);
				for (const [callableName, callable] of resource.callables) {
					if (callable instanceof ConstructorType) {
						connection.on(`${qualifier}#${callable.witName}`, (memory: Memory, params: WasmType[]) => {
							return callable.callServiceAsync(memory, clazz, params, context);
						});
					} else if (callable instanceof StaticMethodType) {
						connection.on(`${qualifier}#${callable.witName}`, (memory: Memory, params: WasmType[]) => {
							return callable.callServiceAsync(memory, (service[resourceName] as JClassAsync)[callableName], params, context);
						});
					} else if (callable instanceof MethodType) {
						connection.on(`${qualifier}#${callable.witName}`, (memory: Memory, params: WasmType[]) => {
							return callable.callServiceAsync(memory, callableName, params, resourceManager, context);
						});
					} else if (callable instanceof DestructorType) {
						connection.on(`${qualifier}#${callable.witName}`, (memory: Memory, params: WasmType[]) => {
							return callable.callServiceAsync(memory, params, resourceManager);
						});
					}
				}
			}
		}
	}

	function bindApi(connection: MainConnection, world: WorldType, context: ComponentModelContext): any {
		const packageName = world.id.substring(0, world.id.indexOf('/'));
		const result = Object.create(null);
		if (world.exports !== undefined) {
			if (world.exports.functions !== undefined) {
				Object.assign(result, doBindApi(connection, packageName, world.exports.functions, undefined, context));
			}
			if (world.exports.interfaces !== undefined) {
				for (const [name, iface] of world.exports.interfaces) {
					const propName = `${name[0].toLowerCase()}${name.substring(1)}`;
					result[propName] = doBindApi(connection, `${packageName}/${iface.witName}`, iface.functions, iface.resources, context);
				}
			}
		}
		return result;
	}

	function doBindApi(connection: MainConnection, qualifier: string, functions: Map<string, FunctionType> | undefined, resources: Map<string, ResourceType> | undefined, context: ComponentModelContext): any {
		const result = Object.create(null);
		if (functions !== undefined) {
			for (const [name, func] of functions) {
				result[name] = (...params: JType[]) => {
					return func.callWorker(connection, qualifier, params, context);
				};
			}
		}
		if (resources !== undefined) {
			for (const [name, resource] of resources) {
				const resourceManager = getResourceManager(resource, undefined, context);
				const cl =  clazz.createPromise(connection, qualifier, resource, context);
				resourceManager.setProxyInfo(cl, (self: number) => {
					connection.callWorker(`${qualifier}#[dtor]${resource.witName}`, [self]).
						catch(() => {
							RAL().console.error(`Failed to call destructor for ${resource.witName}`);
						});
				});
				result[name] = cl;
			}
		}
		return result;
	}
}
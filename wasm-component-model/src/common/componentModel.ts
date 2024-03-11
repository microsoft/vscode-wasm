/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RAL from './ral';

// Type arrays are store either little or big endian depending on the platform.
// The component model requires little endian so we throw for now if the platform
// is big endian. We can alternatively use data views in type arrays component
// model types to support big endian platforms

const isLittleEndian = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;
if (!isLittleEndian) {
	throw new Error('Big endian platforms are currently not supported.');
}

export class ComponentModelTrap extends Error {
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

export interface ResourceManager<T extends JInterface = JInterface> {
	register(value: T): ResourceHandle;
	getResource(resource: ResourceHandle): T;
	getHandle(value: T): ResourceHandle;
	managesHandle(resource: ResourceHandle): boolean;
	managesResource(value: T): boolean;
	unregister(resource: ResourceHandle): void;
}

export namespace ResourceManager {

	class Default<T extends JInterface = JInterface> {

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
			if (value.$handle !== undefined) {
				return value.$handle;
			}
			const handle = this.handleCounter++;
			this.h2r.set(handle, value);
			this.r2h.set(value, handle);
			value.$handle = handle;
			return handle;
		}

		public getResource(resource: ResourceHandle): T {
			const value = this.h2r.get(resource);
			if (value === undefined) {
				throw new ComponentModelTrap(`Unknown resource handle ${resource}`);
			}
			return value;
		}

		public getHandle(value: T): ResourceHandle {
			const handle = this.r2h.get(value);
			if (handle === undefined) {
				throw new ComponentModelTrap(`Unknown resource ${JSON.stringify(value, undefined, 0)}`);
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
	}

	export function createDefault<T extends JInterface>(key: string): ResourceManager<T> {
		return new Default<T>(key);
	}
}

export interface ResourceManagers {
	get(key: string): ResourceManager<any>;
}
export namespace ResourceManagers {
	class Default {
		private readonly managers: Map<string, ResourceManager<any>>;

		constructor() {
			this.managers = new Map();
		}

		public get(key: string): ResourceManager<any> {
			let manager = this.managers.get(key);
			if (manager === undefined) {
				manager = ResourceManager.createDefault(key);
				this.managers.set(key, manager);
			}
			return manager;
		}
	}

	export function createDefault(): ResourceManagers {
		return new Default();
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
	realloc(location: MemoryRange, align: Alignment, newSize: size): MemoryRange;
	preAllocated(ptr: ptr, size: size): MemoryRange;
	readonly(ptr: ptr, size: size): ReadonlyMemoryRange;
	free?(range: MemoryRange): void;
}

export class MemoryError extends Error {
	constructor(message: string) {
		super(message);
	}
}

export type offset<_T = undefined> = u32;

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
// cabi_realloc(void *ptr, size_t orig_size, size_t org_align, size_t new_size)
class DefaultMemory implements Memory {

	public readonly id: string;
	private readonly memory: { buffer: ArrayBuffer };
	private readonly cabi_realloc: (orig: ptr, orig_size: size, orig_align: size, new_size: size) => ptr;

	constructor(id: string, exports: { memory: { buffer: ArrayBuffer }, cabi_realloc: (orig: ptr, orig_size: size, orig_align: size, new_size: size) => ptr }) {
		this.id = id;
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

	realloc(location: MemoryRange, align: Alignment, newSize: size): MemoryRange {

	}
	preAllocated(ptr: ptr, size: size): MemoryRange {

	}
	readonly(ptr: ptr, size: size): ReadonlyMemoryRange {

	}

}


export namespace Memory {
	export const Null = new NullMemory();
	export function

}

export type encodings = 'utf-8' | 'utf-16' | 'latin1+utf-16';
export interface Options {
	encoding: encodings;
	keepOption?: boolean;
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
	readonly managers: ResourceManagers;
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
}
export type GenericComponentModelType = ComponentModelType<any>;

export type bool = number;
export const bool: ComponentModelType<boolean> = {
	kind: ComponentModelTypeKind.bool,
	size: 1,
	alignment: 1,
	flatTypes: [$i32],
	load(memory, offset): boolean {
		return memory.getUint8(offset) !== 0;
	},
	liftFlat(_memory, values): boolean {
		const value = values.next().value;
		if (value < 0) {
			throw new Error(`Invalid bool value ${value}`);
		}
		return value !== 0;
	},
	alloc(memory): MemoryRange {
		return memory.alloc(bool.alignment, bool.size);
	},
	store(memory, offset, value: boolean): void {
		memory.setUint8(offset, value ? 1 : 0);
	},
	lowerFlat(result, _memory, value: boolean): void {
		result.push(value ? 1 : 0);
	},
	copy(dest: MemoryRange, dest_offset: offset<bool>, src: ReadonlyMemoryRange, src_offset: offset<bool>): void {
		src.copyBytes(src_offset, bool.size, dest, dest_offset);
	}
};

export type u8 = number;
namespace $u8 {
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
			throw new Error(`Invalid u8 value ${value}`);
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
			throw new Error(`Invalid u8 value ${value}`);
		}
		result.push(value);
	}

	export function copy(dest: MemoryRange, dest_offset: offset<u8>, src: ReadonlyMemoryRange, src_offset: offset<u8>): void {
		src.copyBytes(src_offset, size, dest, dest_offset);
	}
}
export const u8:ComponentModelType<number> = $u8;

export type u16 = number;
namespace $u16 {
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
			throw new Error(`Invalid u16 value ${value}`);
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
			throw new Error(`Invalid u16 value ${value}`);
		}
		result.push(value);
	}

	export function copy(dest: MemoryRange, dest_offset: offset<u16>, src: ReadonlyMemoryRange, src_offset: offset<u16>): void {
		dest.assertAlignment(dest_offset, alignment);
		src.assertAlignment(src_offset, alignment);
		src.copyBytes(src_offset, size, dest, dest_offset);
	}
}
export const u16: ComponentModelType<number> = $u16;

export type u32 = number;
namespace $u32 {
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
			throw new Error(`Invalid u32 value ${value}`);
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
			throw new Error(`Invalid u32 value ${value}`);
		}
		result.push(value);
	}

	export function copy(dest: MemoryRange, dest_offset: offset<u32>, src: ReadonlyMemoryRange, src_offset: offset<u32>): void {
		dest.assertAlignment(dest_offset, alignment);
		src.assertAlignment(src_offset, alignment);
		src.copyBytes(src_offset, size, dest, dest_offset);
	}
}
export const u32: ComponentModelType<number> = $u32;

export type u64 = bigint;
namespace $u64 {
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
			throw new Error(`Invalid u64 value ${value}`);
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
			throw new Error(`Invalid u64 value ${value}`);
		}
		result.push(value);
	}

	export function copy(dest: MemoryRange, dest_offset: offset<u64>, src: ReadonlyMemoryRange, src_offset: offset<u64>): void {
		dest.assertAlignment(dest_offset, alignment);
		src.assertAlignment(src_offset, alignment);
		src.copyBytes(src_offset, size, dest, dest_offset);
	}
}
export const u64: ComponentModelType<bigint> = $u64;

export type s8 = number;
namespace $s8 {
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

	export function alloc(memory: Memory): MemoryRange {
		return memory.alloc(alignment, size);
	}

	export function store(memory: MemoryRange, offset: offset<s8>, value: s8): void {
		memory.setInt8(offset, value);
	}

	export function lowerFlat(result: WasmType[], _memory: Memory, value: number): void {
		if (value < LOW_VALUE || value > HIGH_VALUE || !Number.isInteger(value)) {
			throw new Error(`Invalid s8 value ${value}`);
		}
		result.push((value < 0) ? (value + 256) : value);
	}

	export function copy(dest: MemoryRange, dest_offset: offset<u64>, src: ReadonlyMemoryRange, src_offset: offset<u64>): void {
		dest.assertAlignment(dest_offset, alignment);
		src.assertAlignment(src_offset, alignment);
		src.copyBytes(src_offset, size, dest, dest_offset);
	}
}
export const s8: ComponentModelType<number> = $s8;

export type s16 = number;
namespace $s16 {
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
		const value = values.next().value;
		if (value < $u16.LOW_VALUE || value > $u16.HIGH_VALUE || !Number.isInteger(value)) {
			throw new Error(`Invalid s16 value ${value}`);
		}
		return (value <= HIGH_VALUE) ? value as s16 : (value as u16) - 65536;
	}

	export function alloc(memory: Memory): MemoryRange {
		return memory.alloc(alignment, size);
	}

	export function store(memory: MemoryRange, offset: offset<s16>, value: s16): void {
		memory.setInt16(offset, value);
	}

	export function lowerFlat(result: WasmType[], _memory: Memory, value: number): void {
		if (value < LOW_VALUE || value > HIGH_VALUE || !Number.isInteger(value)) {
			throw new Error(`Invalid s16 value ${value}`);
		}
		result.push((value < 0) ? (value + 65536) : value);
	}

	export function copy(dest: MemoryRange, dest_offset: offset<s16>, src: ReadonlyMemoryRange, src_offset: offset<s16>): void {
		dest.assertAlignment(dest_offset, alignment);
		src.assertAlignment(src_offset, alignment);
		src.copyBytes(src_offset, size, dest, dest_offset);
	}
}
export const s16: ComponentModelType<number> = $s16;

export type s32 = number;
namespace $s32 {
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
		const value = values.next().value;
		if (value < $u32.LOW_VALUE || value > $u32.HIGH_VALUE || !Number.isInteger(value)) {
			throw new Error(`Invalid s32 value ${value}`);
		}
		return (value <= HIGH_VALUE) ? value as s32 : (value as u32) - 4294967296;
	}

	export function alloc(memory: Memory): MemoryRange {
		return memory.alloc(alignment, size);
	}

	export function store(memory: MemoryRange, offset: offset<32>, value: s32): void {
		memory.setInt32(offset, value);
	}

	export function lowerFlat(result: WasmType[], _memory: Memory, value: number): void {
		if (value < LOW_VALUE || value > HIGH_VALUE || !Number.isInteger(value)) {
			throw new Error(`Invalid s32 value ${value}`);
		}
		result.push((value < 0) ? (value + 4294967296) : value);
	}

	export function copy(dest: MemoryRange, dest_offset: offset<s32>, src: ReadonlyMemoryRange, src_offset: offset<s32>): void {
		dest.assertAlignment(dest_offset, alignment);
		src.assertAlignment(src_offset, alignment);
		src.copyBytes(src_offset, size, dest, dest_offset);
	}
}
export const s32: ComponentModelType<number> = $s32;

export type s64 = bigint;
namespace $s64 {
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
		const value = values.next().value;
		if (value < $u64.LOW_VALUE) {
			throw new Error(`Invalid s64 value ${value}`);
		}
		return (value <= HIGH_VALUE) ? value as s64 : (value as u64) - 18446744073709551616n;
	}

	export function alloc(memory: Memory): MemoryRange {
		return memory.alloc(alignment, size);
	}

	export function store(memory: MemoryRange, offset: offset<s64>, value: s64): void {
		memory.setInt64(offset, value);
	}

	export function lowerFlat(result: WasmType[], _memory: Memory, value: bigint): void {
		if (value < LOW_VALUE || value > HIGH_VALUE) {
			throw new Error(`Invalid s64 value ${value}`);
		}
		result.push((value < 0) ? (value + 18446744073709551616n) : value);
	}

	export function copy(dest: MemoryRange, dest_offset: offset<s64>, src: ReadonlyMemoryRange, src_offset: offset<s64>): void {
		dest.assertAlignment(dest_offset, alignment);
		src.assertAlignment(src_offset, alignment);
		src.copyBytes(src_offset, size, dest, dest_offset);
	}
}
export const s64: ComponentModelType<bigint> = $s64;

export type float32 = number;
namespace $float32 {
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
			throw new Error(`Invalid float32 value ${value}`);
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
			throw new Error(`Invalid float32 value ${value}`);
		}
		result.push(Number.isNaN(value) ? NAN : value);
	}

	export function copy(dest: MemoryRange, dest_offset: offset<float32>, src: ReadonlyMemoryRange, src_offset: offset<float32>): void {
		dest.assertAlignment(dest_offset, alignment);
		src.assertAlignment(src_offset, alignment);
		src.copyBytes(src_offset, size, dest, dest_offset);
	}
}
export const float32: ComponentModelType<number> = $float32;

export type float64 = number;
namespace $float64 {
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
			throw new Error(`Invalid float64 value ${value}`);
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
			throw new Error(`Invalid float64 value ${value}`);
		}
		result.push(Number.isNaN(value) ? NAN : value);
	}

	export function copy(dest: MemoryRange, dest_offset: offset<float64>, src: ReadonlyMemoryRange, src_offset: offset<float64>): void {
		dest.assertAlignment(dest_offset, alignment);
		src.assertAlignment(src_offset, alignment);
		src.copyBytes(src_offset, size, dest, dest_offset);
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
	export const flatTypes: ReadonlyArray<GenericFlatType> = [$i32];

	export function load(memory: ReadonlyMemoryRange, offset: offset<u32>, context: ComponentModelContext): string {
		return fromCodePoint(u32.load(memory, offset, context));
	}

	export function liftFlat(memory: Memory, values: FlatValuesIter, context: ComponentModelContext): string {
		return fromCodePoint(u32.liftFlat(memory, values, context));
	}

	export function alloc(memory: Memory): MemoryRange {
		return u32.alloc(memory);
	}

	export function store(memory: MemoryRange, offset: offset<u32>, value: string, context: ComponentModelContext): void {
		u32.store(memory, offset, asCodePoint(value), context);
	}

	export function lowerFlat(result: WasmType[], memory: Memory, value: string, context: ComponentModelContext): void {
		u32.lowerFlat(result, memory, asCodePoint(value), context);
	}

	export function copy(dest: MemoryRange, dest_offset: offset<u32>, src: ReadonlyMemoryRange, src_offset: offset<u32>): void {
		dest.assertAlignment(dest_offset, alignment);
		src.assertAlignment(src_offset, alignment);
		src.copyBytes(src_offset, size, dest, dest_offset);
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
		dest.assertAlignment(dest_offset, $wstring.alignment);
		src.assertAlignment(src_offset, $wstring.alignment);
		src.copyBytes(src_offset, size, dest, dest_offset);
		const data = src.getUint32(src_offset + offsets.data);
		const codeUnits = src.getUint32(src_offset + offsets.codeUnits);
		const [alignment, byteLength] = getAlignmentAndByteLength(codeUnits, context.options);
		const srcReader = src.memory.readonly(data, byteLength);
		const destWriter = dest.memory.alloc(alignment, byteLength);
		srcReader.copyBytes(0, byteLength, destWriter, 0);
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

	function loadFromRange(memory: Memory, data: ptr, codeUnits: u32, options: Options): string {
		const encoding = options.encoding;
		if (encoding === 'latin1+utf-16') {
			throw new Error('latin1+utf-16 encoding not yet supported');
		}
		if (encoding === 'utf-8') {
			const byteLength = codeUnits;
			const reader = memory.readonly(data, byteLength);
			return utf8Decoder.decode(reader.getUint8Array(0, byteLength));
		} else if (encoding === 'utf-16') {
			const reader = memory.readonly(data, codeUnits * 2);
			return String.fromCharCode(...reader.getUint16Array(data, codeUnits));
		} else {
			throw new Error('Unsupported encoding');
		}
	}

	function storeIntoRange(memory: Memory, str: string, options: Options): [ptr, size] {
		const { encoding } = options;
		if (encoding === 'latin1+utf-16') {
			throw new Error('latin1+utf-16 encoding not yet supported');
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
		src.copyBytes(src_offset, this.size, dest, dest_offset);
		const data = src.getUint32(src_offset + offsets.data);
		const byteLength = src.getUint32(src_offset + offsets.length) * this.elementType.size;
		const srcReader = src.memory.readonly(data, byteLength);
		const destWriter = dest.memory.alloc(this.elementType.alignment, byteLength);
		srcReader.copyBytes(0, byteLength, destWriter, 0);
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

	protected abstract loadFromRange(memory: ReadonlyMemoryRange, length: number): T;
	protected abstract storeIntoRange(memory: MemoryRange, value: T): void;
}

export class Int8ArrayType extends TypeArrayType<Int8Array, s8> {
	constructor() {
		super($s8);
	}
	protected loadFromRange(memory: ReadonlyMemoryRange, length: number): Int8Array {
		return memory.getInt8Array(0, length);
	}
	protected storeIntoRange(memory: MemoryRange, value: Int8Array): void {
		memory.setInt8Array(0, value);
	}
}

export class Int16ArrayType extends TypeArrayType<Int16Array, s16> {
	constructor() {
		super($s16);
	}
	protected loadFromRange(memory: ReadonlyMemoryRange, length: number): Int16Array {
		return memory.getInt16Array(0, length);
	}
	protected storeIntoRange(memory: MemoryRange, value: Int16Array): void {
		memory.setInt16Array(0, value);
	}
}

export class Int32ArrayType extends TypeArrayType<Int32Array, s32> {
	constructor() {
		super($s32);
	}
	protected loadFromRange(memory: ReadonlyMemoryRange, length: number): Int32Array {
		return memory.getInt32Array(0, length);
	}
	protected storeIntoRange(memory: MemoryRange, value: Int32Array): void {
		memory.setInt32Array(0, value);
	}
}

export class BigInt64ArrayType extends TypeArrayType<BigInt64Array, s64> {
	constructor() {
		super($s64);
	}
	protected loadFromRange(memory: ReadonlyMemoryRange, length: number): BigInt64Array {
		return memory.getInt64Array(0, length);
	}
	protected storeIntoRange(memory: MemoryRange, value: BigInt64Array): void {
		memory.setInt64Array(0, value);
	}
}

export class Uint8ArrayType extends TypeArrayType<Uint8Array, u8> {
	constructor() {
		super($u8);
	}
	protected loadFromRange(memory: ReadonlyMemoryRange, length: number): Uint8Array {
		return memory.getUint8Array(0, length);
	}
	protected storeIntoRange(memory: MemoryRange, value: Uint8Array): void {
		memory.setUint8Array(0, value);
	}
}

export class Uint16ArrayType extends TypeArrayType<Uint16Array, u16> {
	constructor() {
		super($u16);
	}
	protected loadFromRange(memory: ReadonlyMemoryRange, length: number): Uint16Array {
		return memory.getUint16Array(0, length);
	}
	protected storeIntoRange(memory: MemoryRange, value: Uint16Array): void {
		memory.setUint16Array(0, value);
	}
}

export class Uint32ArrayType extends TypeArrayType<Uint32Array, u32> {
	constructor() {
		super($u32);
	}
	protected loadFromRange(memory: ReadonlyMemoryRange, length: number): Uint32Array {
		return memory.getUint32Array(0, length);
	}
	protected storeIntoRange(memory: MemoryRange, value: Uint32Array): void {
		memory.setUint32Array(0, value);
	}
}

export class BigUint64ArrayType extends TypeArrayType<BigUint64Array, u64> {
	constructor() {
		super($u64);
	}
	protected loadFromRange(memory: ReadonlyMemoryRange, length: number): BigUint64Array {
		return memory.getUint64Array(0, length);
	}
	protected storeIntoRange(memory: MemoryRange, value: BigUint64Array): void {
		memory.setUint64Array(0, value);
	}
}

export class Float32ArrayType extends TypeArrayType<Float32Array, float32> {
	constructor() {
		super($float32);
	}
	protected loadFromRange(memory: ReadonlyMemoryRange, length: number): Float32Array {
		return memory.getFloat32Array(0, length);
	}
	protected storeIntoRange(memory: MemoryRange, value: Float32Array): void {
		memory.setFloat32Array(0, value);
	}
}

export class Float64ArrayType extends TypeArrayType<Float64Array, float64> {
	constructor() {
		super($float64);
	}
	protected loadFromRange(memory: ReadonlyMemoryRange, length: number): Float64Array {
		return memory.getFloat64Array(0, length);
	}
	protected storeIntoRange(memory: MemoryRange, value: Float64Array): void {
		memory.setFloat64Array(0, value);
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
		return this.type === undefined ? 0 : this.loadFrom(this.type.load(memory, offset, context));
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
	readonly type: GenericComponentModelType | undefined;
	readonly wantFlatTypes: GenericFlatType[] | undefined;
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
	public readonly flatTypes: ReadonlyArray<GenericFlatType>;

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

	public load(memory: ReadonlyMemoryRange, offset: offset, context: ComponentModelContext): T {
		const caseIndex = this.discriminantType.load(memory, offset, context);
		const caseVariant = this.cases[caseIndex];
		if (caseVariant.type === undefined) {
			return this.ctor(caseVariant.tag as I, undefined as any);
		} else {
			offset += this.discriminantType.size;
			offset = align(offset, this.maxCaseAlignment);
			const value = caseVariant.type.load(memory, offset, context);
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

	public alloc(memory: Memory): MemoryRange {
		return memory.alloc(this.alignment, this.size);
	}

	public store(memory: MemoryRange, offset: offset, variantValue: T, context: ComponentModelContext): void {
		const index = this.case2Index.get(variantValue.tag);
		if (index === undefined) {
			throw new ComponentModelTrap(`Variant case ${variantValue.tag} not found`);
		}
		this.discriminantType.store(memory, offset, index, context);
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
		this.discriminantType.lowerFlat(result, memory, index, context);
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
		this.discriminantType.copy(dest, dest_offset, src, src_offset, context);
		const caseIndex = this.discriminantType.load(src, src_offset, context);
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

	private static size(discriminantType: GenericComponentModelType, cases: VariantCase[]): size {
		let result = discriminantType.size;
		result = align(result, this.maxCaseAlignment(cases));
		return result + this.maxCaseSize(cases);
	}

	private static alignment(discriminantType: GenericComponentModelType, cases: VariantCase[]): Alignment {
		return Math.max(discriminantType.alignment, this.maxCaseAlignment(cases)) as Alignment;
	}

	private static flatTypes(discriminantType: GenericComponentModelType, cases: VariantCase[]): ReadonlyArray<GenericFlatType> {
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
}
export type option<T extends JType> = option.None<T> | option.Some<T>;
export class OptionType<T extends JType> implements ComponentModelType<T | option<T> | undefined> {

	public readonly valueType: GenericComponentModelType;

	public readonly kind: ComponentModelTypeKind;
	public readonly size: size;
	public readonly alignment: Alignment;
	public readonly flatTypes: readonly GenericFlatType[];


	constructor(valueType: GenericComponentModelType) {
		this.valueType = valueType;
		this.kind = ComponentModelTypeKind.option;
		this.size = this.computeSize();
		this.alignment = this.computeAlignment();
		this.flatTypes = this.computeFlatTypes();
	}

	public load(memory: ReadonlyMemoryRange, offset: offset, context: ComponentModelContext): T | option<T> | undefined {
		const caseIndex = u8.load(memory, offset, context);
		if (caseIndex === 0) { // index 0 is none
			return context.options.keepOption ? option._ctor<T>(option.none, undefined) : undefined;
		} else {
			offset += u8.size;
			offset = align(offset, this.alignment);
			const value = this.valueType.load(memory, offset, context);
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

	public alloc(memory: Memory): MemoryRange {
		return memory.alloc(this.alignment, this.size);
	}

	public store(memory: MemoryRange, offset: offset, value: T | option<T> | undefined, context: ComponentModelContext): void {
		const optValue = this.asOptionValue(value, context.options);
		const index = optValue.tag === option.none ? 0 : 1;
		u8.store(memory, offset, index, context);
		offset += u8.size;
		if (optValue.tag === option.some) {
			offset = align(offset, this.valueType.alignment);
			this.valueType.store(memory, offset, optValue.value, context);
		}
	}

	public lowerFlat(result: WasmType[], memory: Memory, value: T | option<T> | undefined, context: ComponentModelContext): void {
		const optValue = this.asOptionValue(value, context.options);
		const index = optValue.tag === option.none ? 0 : 1;
		u8.lowerFlat(result, memory, index, context);
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
		u8.copy(dest, dest_offset, src, src_offset, context);
		const caseIndex = u8.load(src, src_offset, context);
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
	$handle?: ResourceHandle;
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

export type WasmFunction = (...params: WasmType[]) => WasmType | void;

class Callable {

	public static readonly MAX_FLAT_PARAMS = 16;
	public static readonly MAX_FLAT_RESULTS = 1;

	public readonly witName: string;
	public readonly params: CallableParameter[];
	public readonly returnType: GenericComponentModelType | undefined;

	public readonly paramTupleType: TupleType<JTuple>;
	protected readonly mode: 'lift' | 'lower';

	constructor(witName: string, params: CallableParameter[], returnType?: GenericComponentModelType) {
		this.witName = witName;
		this.params = params;
		this.returnType = returnType;
		const paramTypes: GenericComponentModelType[] = [];
		for (const param of params) {
			paramTypes.push(param[1]);
		}
		this.paramTupleType = new TupleType(paramTypes);
		this.mode = 'lower';
	}

	public liftParamValues(wasmValues: (number | bigint)[], memory: Memory, context: ComponentModelContext): JType[] {
		if (this.paramTupleType.flatTypes.length > Callable.MAX_FLAT_PARAMS) {
			const p0 = wasmValues[0];
			if (!Number.isInteger(p0)) {
				throw new ComponentModelTrap('Invalid pointer');
			}
			return this.paramTupleType.load(memory.readonly(p0 as ptr, this.paramTupleType.size), 0, context);
		} else {
			return this.paramTupleType.liftFlat(memory, wasmValues.values(), context);
		}
	}

	public liftReturnValue(value: WasmType | void, memory: Memory, context: ComponentModelContext): JType | void {
		if (this.returnType === undefined) {
			return;
		} else if (this.returnType.flatTypes.length <= Callable.MAX_FLAT_RESULTS) {
			return this.returnType.liftFlat(memory, [value!].values(), context);
		} else {
			return this.returnType.load(memory.readonly(value as ptr, this.returnType.size), 0, context);
		}
	}

	public lowerParamValues(values: JType[], memory: Memory, context: ComponentModelContext, out: ptr | undefined): WasmType[] {
		if (this.paramTupleType.flatTypes.length > Callable.MAX_FLAT_PARAMS) {
			const writer = out !== undefined ? memory.preAllocated(out, this.paramTupleType.size) : this.paramTupleType.alloc(memory);
			this.paramTupleType.store(writer, 0, values, context);
			return [writer.ptr];
		} else {
			const result: WasmType[] = [];
			this.paramTupleType.lowerFlat(result, memory, values, context);
			return result;
		}
	}

	public lowerReturnValue(value: JType | void, memory: Memory, context: ComponentModelContext, out: ptr | undefined): WasmType | void {
		if (this.returnType === undefined) {
			return;
		} else if (this.returnType.flatTypes.length <= Callable.MAX_FLAT_RESULTS) {
			const result: WasmType[] = [];
			this.returnType.lowerFlat(result, memory, value, context);
			if (result.length !== 1) {
				throw new ComponentModelTrap('Invalid result');
			}
			return result[0];
		} else {
			const writer = out !== undefined ? memory.preAllocated(out, this.returnType.size) : this.returnType.alloc(memory);
			this.returnType.store(writer, 0, value, context);
			return;
		}
	}

	public callWasm(params: JType[], wasmFunction: WasmFunction, context: WasmContext): JType | void {
		const memory = context.getMemory();
		const wasmValues = this.lowerParamValues(params, memory, context, undefined);
		// We currently only support 'lower' mode for results > MAX_FLAT_RESULTS.
		let resultRange: MemoryRange | undefined = undefined;
		if (this.returnType !== undefined && this.returnType.flatTypes.length > FunctionType.MAX_FLAT_RESULTS) {
			resultRange = this.returnType.alloc(memory);
			wasmValues.push(resultRange.ptr);
		}
		const result = wasmFunction(...wasmValues);
		const flatReturnTypes = this.returnType === undefined ? 0 : this.returnType.flatTypes.length;
		switch(flatReturnTypes) {
			case 0:
				return;
			case 1:
				return this.liftReturnValue(result, memory, context);
			default:
				return this.liftReturnValue(resultRange!.ptr, memory, context);
		}
	}
}

export class FunctionType<_T extends Function = Function> extends Callable  {

	constructor(witName: string, params: CallableParameter[], returnType?: GenericComponentModelType) {
		super(witName, params, returnType);
	}

	public callService(serviceFunction: JFunction, params: (number | bigint)[], context: WasmContext): number | bigint | void {
		const memory  = context.getMemory();
		const returnFlatTypes = this.returnType === undefined ? 0 : this.returnType.flatTypes.length;
		const paramFlatTypes = this.paramTupleType.flatTypes.length;
		// We currently only support 'lower' mode for results > MAX_FLAT_RESULTS.
		if (returnFlatTypes > FunctionType.MAX_FLAT_RESULTS && params.length !== paramFlatTypes + 1) {
			throw new ComponentModelTrap(`Invalid number of parameters. Received ${params.length} but expected ${paramFlatTypes + 1}`);
		}
		const jParams = this.liftParamValues(params, memory, context);
		const result: JType | void = serviceFunction(...jParams);
		const out = params[params.length - 1];
		if (typeof out !== 'number') {
			throw new ComponentModelTrap(`Result pointer must be a number (u32), but got ${out}.`);
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
		const returnFlatTypes = this.returnType === undefined ? 0 : this.returnType.flatTypes.length;
		const paramFlatTypes = this.paramTupleType.flatTypes.length;
		if (returnFlatTypes > FunctionType.MAX_FLAT_RESULTS && params.length !== paramFlatTypes + 1) {
			throw new ComponentModelTrap(`Invalid number of parameters. Received ${params.length} but expected ${paramFlatTypes + 1}`);
		}
		const memory  = context.getMemory();
		const jParams = this.liftParamValues(params, memory, context);
		const obj: JInterface = new clazz(...jParams);
		const handle = resourceManager.register(obj);
		return handle;
	}
}

export class DestructorType<_T extends Function = Function> extends Callable {

	constructor(witName: string, params: CallableParameter[]) {
		super(witName, params);
	}

	public callDestructor(func: JFunction, params: (number | bigint)[], resourceManager: ResourceManager): void {
		const handle = params[0];
		if (typeof handle === 'bigint' || !$u32.valid(handle)) {
			throw new ComponentModelTrap(`Object handle must be a number (u32), but got ${handle}.`);
		}
		const obj = resourceManager.getResource(handle);
		func(obj);
		resourceManager.unregister(handle);
	}
}

export class StaticMethodType<_T extends Function = Function> extends Callable {

	constructor(witName: string, params: CallableParameter[], returnType?: GenericComponentModelType) {
		super(witName, params, returnType);
	}

	public callStaticMethod(func: JFunction, params: (number | bigint)[], context: WasmContext): number | bigint | void {
		const memory  = context.getMemory();
		// We currently only support 'lower' mode for results > MAX_FLAT_RESULTS.
		const returnFlatTypes = this.returnType === undefined ? 0 : this.returnType.flatTypes.length;
		const paramFlatTypes = this.paramTupleType.flatTypes.length;
		if (returnFlatTypes > FunctionType.MAX_FLAT_RESULTS && params.length !== paramFlatTypes + 1) {
			throw new ComponentModelTrap(`Invalid number of parameters. Received ${params.length} but expected ${paramFlatTypes + 1}`);
		}
		const jParams = this.liftParamValues(params, memory, context);
		const result: JType | void = func(...jParams);
		const out = params[params.length - 1];
		if (typeof out !== 'number') {
			throw new ComponentModelTrap(`Result pointer must be a number (u32), but got ${out}.`);
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
			throw new ComponentModelTrap(`Method calls must have at least one parameter (the object pointer).`);
		}
		const returnFlatTypes = this.returnType === undefined ? 0 : this.returnType.flatTypes.length;
		const paramFlatTypes = this.paramTupleType.flatTypes.length;
		// We currently only support 'lower' mode for results > MAX_FLAT_RESULTS.
		if (returnFlatTypes > FunctionType.MAX_FLAT_RESULTS && params.length !== paramFlatTypes + 1) {
			throw new ComponentModelTrap(`Invalid number of parameters. Received ${params.length} but expected ${paramFlatTypes + 1}`);
		}
		const handle = params[0];
		if (typeof handle !== 'number') {
			throw new ComponentModelTrap(`Object handle must be a number (u32), but got ${handle}.`);
		}
		const obj = resourceManager.getResource(handle);
		const memory  = context.getMemory();
		const jParams = this.liftParamValues(params, memory, context);
		// We need to cut off the first parameter (the object handle).
		const result: JType | void = (obj as any)[methodName](...jParams.slice(1));
		const out = params[params.length - 1];
		if (typeof out !== 'number') {
			throw new ComponentModelTrap(`Result pointer must be a number (u32), but got ${out}.`);
		}
		return this.lowerReturnValue(result, memory, context, out);
	}
}

export type ResourceCallable<T extends JFunction = JFunction> = MethodType<T> | StaticMethodType<T> | ConstructorType<T> | DestructorType;

export type ResourceHandle = u32;
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

	public load(memory: ReadonlyMemoryRange, offset: offset, context: ComponentModelContext): ResourceHandle {
		return u32.load(memory, offset, context);
	}

	public liftFlat(memory: Memory, values: FlatValuesIter, context: ComponentModelContext): ResourceHandle {
		return u32.liftFlat(memory, values, context);
	}

	public alloc(memory: Memory): MemoryRange {
		return u32.alloc(memory);
	}

	public store(memory: MemoryRange, offset: offset, value: ResourceHandle, context: ComponentModelContext): void {
		u32.store(memory, offset, value, context);
	}

	public lowerFlat(result: WasmType[], memory: Memory, value: ResourceHandle, context: ComponentModelContext): void {
		u32.lowerFlat(result, memory, value, context);
	}

	public copy(dest: MemoryRange, dest_offset: offset, src: ReadonlyMemoryRange, src_offset: offset, context: ComponentModelContext): void {
		u32.copy(dest, dest_offset, src, src_offset, context);
	}
}

export class ResourceType<T extends JInterface = JInterface> implements ComponentModelType<T> {

	public readonly kind: ComponentModelTypeKind;
	public readonly size: size;
	public readonly alignment: Alignment;
	public readonly flatTypes: readonly GenericFlatType[];


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

	public addCallable(jsName: string, func: ResourceCallable): void {
		this.methods.set(jsName, func);
	}

	public getCallable(jsName: string): ResourceCallable {
		const result = this.methods.get(jsName);
		if (result === undefined) {
			throw new ComponentModelTrap(`Method '${jsName}' not found on resource '${this.witName}'.`);
		}
		return result;
	}

	public load(memory: ReadonlyMemoryRange, offset: offset, context: ComponentModelContext): T {
		const handle = u32.load(memory, offset, context);
		return context.managers.get(this.id).getResource(handle);
	}

	public liftFlat(memory: Memory, values: FlatValuesIter, context: ComponentModelContext): T {
		const handle = u32.liftFlat(memory, values, context);
		return context.managers.get(this.id).getResource(handle);
	}

	public alloc(memory: Memory): MemoryRange {
		return u32.alloc(memory);
	}

	public store(memory: MemoryRange, offset: offset, value: JInterface, context: ComponentModelContext): void {
		let handle: ResourceHandle | undefined = value.$handle;
		if (handle === undefined) {
			handle = context.managers.get(this.id).register(value);
		}
		u32.store(memory, offset, handle, context);
	}

	public lowerFlat(result: WasmType[], memory: Memory, value: JInterface, context: ComponentModelContext): void {
		let handle: ResourceHandle | undefined = value.$handle;
		if (handle === undefined) {
			handle = context.managers.get(this.id).register(value);
		}
		u32.lowerFlat(result, memory, handle, context);
	}

	public copy(dest: MemoryRange, dest_offset: offset, src: ReadonlyMemoryRange, src_offset: offset, context: ComponentModelContext): void {
		u32.copy(dest, dest_offset, src, src_offset, context);
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

export type WorldType = {
	readonly id: string;
	readonly witName: string;
	readonly Exports: {
		readonly functions?: Map<string, FunctionType<JFunction>>;
		readonly interfaces?: Map<string, InterfaceType>;
	};
	readonly Imports: {
		readonly functions?: Map<string, FunctionType<JFunction>>;
		readonly interfaces?: Map<string, InterfaceType>;
	};
};

export type PackageType = {
	readonly id: string;
	readonly witName: string;
	readonly interfaces: Map<string, InterfaceType>;
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

export class Resource {
	private _handle: ResourceHandle | undefined;
	constructor() {
		this._handle = undefined;
	}

	get $handle(): ResourceHandle | undefined {
		return this._handle;
	}

	set $handle(value: ResourceHandle) {
		if (value === undefined) {
			throw new ComponentModelTrap('Cannot set undefined handle');
		}
		if (this._handle !== undefined) {
			throw new ComponentModelTrap(`Cannot set handle twice. Current handle is ${this._handle} new handle is ${value}.`);
		}
		this._handle = value;
	}
}

export type UnionJType = number & bigint & string & boolean & JArray & JRecord & JVariantCase & JTuple & JEnum & JInterface & option<any> & undefined & result<any, any> & Int8Array & Int16Array & Int32Array & BigInt64Array & Uint8Array & Uint16Array & Uint32Array & BigUint64Array & Float32Array & Float64Array;
export type UnionWasmType = number & bigint;

type ParamWasmFunction = (...params: UnionWasmType[]) => WasmType | void;
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

export type Imports = ParamWasmInterface;
export namespace Imports {
	export function create<T extends Imports>(signatures: Map<string, FunctionType<JFunction>>, resources: Map<string, ResourceType> | undefined, service: ParamServiceInterface, context: WasmContext): T {
		const result: { [key: string]: WasmFunction }  = Object.create(null);
		for (const [funcName, signature] of signatures) {
			result[signature.witName] = createFunction(signature, service[funcName] as JFunction, context);
		}
		if (resources !== undefined) {
			for (const [resourceName, resource] of resources) {
				const resourceManager = context.managers.get(resource.id);
				for (const [callableName, callable] of resource.methods) {
					if (callable instanceof ConstructorType) {
						result[callable.witName] = createConstructorFunction(callable, (service[resourceName] as GenericClass), resourceManager, context);
					} else if (callable instanceof StaticMethodType) {
						result[callable.witName] = createStaticMethodFunction(callable, (service[resourceName] as GenericClass)[callableName], context);
					} else if (callable instanceof MethodType) {
						result[callable.witName] = createMethodFunction(callableName, callable, resourceManager, context);
					} else if (callable instanceof DestructorType) {
						result[callable.witName] = createDestructorFunction(callable, (service[resourceName] as GenericClass)[callableName], resourceManager);
					}
				}
			}
		}
		return result as unknown as T;
	}

	function createFunction(func: FunctionType<JFunction>, serviceFunction: JFunction, context: WasmContext): WasmFunction {
		return (...params: WasmType[]): number | bigint | void => {
			return func.callService(serviceFunction, params, context);
		};
	}

	function createConstructorFunction(callable: ConstructorType, clazz: GenericClass, manager: ResourceManager, context: WasmContext): WasmFunction {
		return (...params: WasmType[]): number | bigint | void => {
			return callable.callConstructor(clazz, params, manager, context);
		};
	}

	function createDestructorFunction(callable: DestructorType, func: JFunction, manager: ResourceManager): WasmFunction {
		return (...params: WasmType[]): number | bigint | void => {
			return callable.callDestructor(func, params, manager);
		};
	}

	function createStaticMethodFunction(callable: StaticMethodType, func: JFunction, context: WasmContext): WasmFunction {
		return (...params: WasmType[]): number | bigint | void => {
			return callable.callStaticMethod(func, params, context);
		};
	}

	function createMethodFunction(name: string, callable: MethodType, manager: ResourceManager, context: WasmContext): WasmFunction {
		return (...params: WasmType[]): number | bigint | void => {
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
			} else if (callable instanceof DestructorType) {
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

export type Exports = ParamServiceInterface | {};
export namespace Exports {
	export function filter<T extends ParamWasmInterface>(exports: { [key: string]: any}, functions: Map<string, FunctionType>, resources: Map<string, ResourceType> | undefined, id: string, version: string | undefined, _context: WasmContext): T {
		const key = version !== undefined ? `${id}@${version}` : id;
		let result: any = exports[key];
		// We could actually check if all properties exist in the result.
		if (result !== null && typeof result === 'object') {
			return result;
		}
		result = Object.create(null);
		for (const func of functions.values()) {
			const funcKey = `${key}#${func.witName}`;
			const candidate = exports[funcKey];
			if (candidate !== null && candidate !== undefined) {
				result[func.witName] = candidate;
			}
		}
		if (resources !== undefined) {
			for (const resource of resources.values()) {
				for (const callable of resource.methods.values()) {
					const callableKey = `${key}#${callable.witName}`;
					const candidate = exports[callableKey];
					if (candidate !== null && candidate !== undefined) {
						result[callable.witName] = candidate;
					}
				}
			}

		}
		return result;
	}
	export function bind<T extends Exports>(functions: Map<string, FunctionType>, resources: ([string, ResourceType, ClassFactory<any>][]) | undefined, wasm: ParamWasmInterface, context: WasmContext): T {
		const result: WriteableServiceInterface  = Object.create(null);
		for (const [name, signature] of functions) {
			result[name] = createServiceFunction(signature, wasm, context);
		}
		if (resources !== undefined) {
			for (const [name, , factory] of resources) {
				result[name] = factory(wasm, context);
			}
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
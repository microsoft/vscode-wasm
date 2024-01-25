/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/// <reference path="../../typings/webAssemblyCommon.d.ts" />

import RAL from './ral';

import { Memory as _Memory, Alignment, ComponentModelContext, GenericComponentModelType, ResourceManagers, ptr, u32, size, JType, RAL as _RAL } from '@vscode/wasm-component-model';

export interface Memory extends _Memory {
	free(ptr: ptr): void;
	isSame(memory: WebAssembly.Memory): boolean;
}
export namespace Memory {
	export function create(memory: WebAssembly.Memory, exports: Exports): Memory {
		return new MemoryImpl(memory, exports);
	}
	export interface Exports {
		malloc(size: number): number;
		free(ptr: number): void;
		aligned_alloc(align: number, size: number): number;
	}
}

class MemoryImpl implements Memory {

	public readonly memory: WebAssembly.Memory;
	private readonly exports: Memory.Exports;

	private _raw: Uint8Array | undefined;
	private _view: DataView | undefined;

	constructor(memory: WebAssembly.Memory, exports: Memory.Exports) {
		this.memory = memory;
		this.exports = exports;
	}

	public isSame(memory: WebAssembly.Memory): boolean {
		return this.memory === memory;
	}

	public get buffer(): ArrayBuffer {
		return this.memory.buffer;
	}

	public get raw(): Uint8Array {
		if (this._raw === undefined || this._raw.buffer !== this.memory.buffer) {
			this._raw = new Uint8Array(this.memory.buffer);
		}
		return this._raw;
	}

	public get view(): DataView {
		if (this._view === undefined || this._view.buffer !== this.memory.buffer) {
			this._view = new DataView(this.memory.buffer);
		}
		return this._view;
	}

	public alloc(align: Alignment, size: size): ptr {
		try {
			const ptr = this.exports.aligned_alloc(align, size);
			if (ptr === 0) {
				throw new Error('Allocation failed');
			}
			return ptr;
		} catch (error) {
			_RAL().console.error(`Alloc [${align}, ${size}] failed. Buffer size: ${this.memory.buffer.byteLength}`);
			throw error;
		}
	}

	public realloc(_ptr: ptr, _oldSize: size, _align: Alignment, _newSize: size): ptr {
		throw new Error('Not implemented');
	}

	public free(ptr: ptr): void {
		try {
			this.exports.free(ptr);
		} catch (error) {
			_RAL().console.error(`Free ptr ${ptr} failed. Buffer size: ${this.memory.buffer.byteLength}`);
			throw error;
		}
	}
}

export type MemoryLocation = {
	value: ptr;
};
export namespace MemoryLocation {
	export function create(ptr: ptr): MemoryLocation {
		return { value: ptr };
	}

	export function is(value: unknown): value is MemoryLocation {
		let candidate = value as MemoryLocation;
		return typeof candidate === 'object' && candidate !== null && typeof candidate.value === 'number';
	}
}

export type Allocation = {
	align: Alignment;
	size: size;
};
export namespace Allocation {
	export function create(align: Alignment, size: size): Allocation {
		return { align, size };
	}
	export function is(value: unknown): value is Allocation {
		let candidate = value as Allocation;
		return typeof candidate === 'object' && candidate !== null && typeof candidate.align === 'number' && typeof candidate.size === 'number';
	}
}

export class Lock {

	private readonly buffer: Int32Array;
	private lockCount: number;

	constructor(buffer: Int32Array) {
		this.buffer = buffer;
		this.lockCount = 0;
	}

	public acquire(): void {
		// We already have a lock.
		if (this.lockCount > 0) {
			this.lockCount++;
			return;
		}
		while (true) {
			const value = Atomics.load(this.buffer, 0);
			if (value > 0 && Atomics.compareExchange(this.buffer, 0, value, value - 1) === value) {
				this.lockCount = 1;
				return;
			}
			Atomics.wait(this.buffer, 0, value);
		}
	}

	public release(): void {
		if (this.lockCount > 1) {
			this.lockCount--;
			return;
		}
		Atomics.add(this.buffer, 0, 1);
		Atomics.notify(this.buffer, 0, 1);
		this.lockCount = 0;
	}

}

export abstract class SharedObject {

	public static Context: ComponentModelContext = {
		options: { encoding: 'utf-8' },
		managers: ResourceManagers.createDefault()
	};

	private static _memory: Memory | undefined;
	public static async initialize(memory: WebAssembly.Memory): Promise<void> {
		if (this._memory !== undefined && this._memory.isSame(memory)) {
			return;
		}
		if (this._memory !== undefined) {
			throw new Error('Memory is already initialized.');
		}
		if (!(memory.buffer instanceof SharedArrayBuffer)) {
			throw new Error('Memory is not a shared memory.');
		}
		this._memory = await RAL().Memory.create(memory);
	}

	public static memory(): Memory {
		if (this._memory === undefined) {
			throw new Error('Memory is not initialized');
		}
		return this._memory;
	}

	protected readonly ptr: ptr;
	private readonly allocated: boolean;

	protected constructor(allocationOrLocation: Allocation | MemoryLocation) {
		if (MemoryLocation.is(allocationOrLocation)) {
			this.ptr = allocationOrLocation.value;
			this.allocated = false;
		} else if (Allocation.is(allocationOrLocation)) {
			this.ptr = SharedObject.memory().alloc(allocationOrLocation.align, allocationOrLocation.size);
			this.allocated = true;
		} else {
			throw new Error('Invalid argument');
		}
	}

	public dispose(): void {
		if (!this.allocated) {
			// We should think about a trace when we dispose
			// a shared object from a thread that hasn't allocated it.
		}
		this.memory().free(this.ptr);
	}

	protected memory(): Memory {
		return SharedObject.memory();
	}

	public location(): MemoryLocation {
		return MemoryLocation.create(this.ptr);
	}
}

export type Properties = [string, GenericComponentModelType][];
type RecordProperties = { [key: string]: JType };
export type RecordInfo<T extends RecordProperties> = { [key in keyof T]: { offset: number; type: GenericComponentModelType } };

export class RecordDescriptor<T extends RecordProperties> {
	public readonly alignment: Alignment;
	public readonly size: size;
	private readonly _fields: Map<string, { type: GenericComponentModelType; offset: number }>;
	public readonly fields: RecordInfo<T>;

	constructor(properties: Properties) {
		let alignment: Alignment = Alignment.byte;
		let size = 0;
		const fields = Object.create(null);
		const fieldsMap: Map<string, { type: GenericComponentModelType; offset: number }> = new Map();
		for (const [name, type] of properties) {
			if (fieldsMap.has(name)) {
				throw new Error(`Duplicate property ${name}`);
			}
			alignment = Math.max(alignment, type.alignment);
			size = Alignment.align(size, type.alignment);
			const info = { offset: size, type };
			fieldsMap.set(name, info);
			fields[name] = info;
			size = size + type.size;
		}
		this.alignment = alignment;
		this.size = size;
		this.fields = fields;
		this._fields = fieldsMap;
	}

	getField(name: string): { type: GenericComponentModelType; offset: number } | undefined {
		return this._fields.get(name);
	}

	hasField(name: string): boolean {
		return this._fields.has(name);
	}

	createAccess(memory: Memory, ptr: ptr): T {
		const access = Object.create(null);
		for (const [name, { type, offset }] of this._fields) {
			if (name.startsWith('_')) {
				continue;
			}
			Object.defineProperty(access, name, {
				get() {
					return type.load(memory, ptr + offset, SharedObject.Context);
				},
				set(value) {
					type.store(memory, ptr + offset, value, SharedObject.Context);
				}
			});
		}
		return access as T;
	}
}

export abstract class SharedRecord<T extends RecordProperties> extends SharedObject {

	protected readonly access: T;

	constructor(recordInfo: RecordDescriptor<T>, location?: MemoryLocation) {
		if (location !== undefined) {
			super(location);
		} else {
			super(Allocation.create(recordInfo.alignment, recordInfo.size));
		}
		const ptr = this.ptr;
		const mem = this.memory();
		this.access = recordInfo.createAccess(mem, ptr);
	}

	protected abstract getRecordInfo(): RecordDescriptor<T>;
}

export abstract class LockableRecord<T extends RecordProperties> extends SharedRecord<T> {

	protected static createRecordInfo<T extends RecordProperties>(properties: Properties): RecordDescriptor<T> {
		let hasLock = false;
		for (const [name, ] of properties) {
			if (name === '_lock') {
				hasLock = true;
				break;
			}
		}
		if (!hasLock) {
			properties = properties.slice();
			properties.push(['_lock', u32]);
		}
		return new RecordDescriptor(properties);
	}

	private readonly lock: Lock;

	protected constructor(recordInfo: RecordDescriptor<T>, location?: MemoryLocation, lock?: Lock) {
		if (!recordInfo.hasField('_lock')) {
			throw new Error('RecordInfo does not contain a lock field');
		}
		super(recordInfo, location);
		if (lock === undefined) {
			const offset = recordInfo.getField('_lock')!.offset;
			const lockBuffer = new Int32Array(this.memory().buffer, this.ptr + offset, 1);
			// We allocated the memory for this shared record so we need to initialize
			// the lock count to 1. If we use an existing memory location, we need to
			// leave the lock count untouched since the shared record could be locked in
			// another thread.
			if (location === undefined) {
				Atomics.store(lockBuffer, 0, 1);
			}
			this.lock = new Lock(lockBuffer);
		} else {
			this.lock = lock;
		}
	}

	public runLocked(callback: (value: this) => void): void {
		this.acquireLock();
		try {
			callback(this);
		} finally {
			this.releaseLock();
		}
	}

	protected acquireLock(): void {
		this.lock.acquire();
	}

	protected releaseLock(): void {
		this.lock.release();
	}
}
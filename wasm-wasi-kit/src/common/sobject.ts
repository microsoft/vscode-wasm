/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/// <reference path="../../typings/webAssemblyCommon.d.ts" />
import RAL from './ral';

import * as uuid from 'uuid';

import {
	Memory, ReadonlyMemoryRange, type BaseMemoryRange,
	Alignment, ComponentModelContext, GenericComponentModelType, ResourceManagers, ptr, u32, size, JType,
	MemoryRangeTransferable, MemoryError, MemoryRange
} from '@vscode/wasm-component-model';

export interface SharedMemory extends Memory {
	id: string;
	free(range: MemoryRange): void;
	isSame(memory: SharedMemory): boolean;
	getTransferable(): SharedMemory.Transferable;
	copyWithin(dest: MemoryRange, src: ReadonlyMemoryRange): void;
	range: {
		fromWritable(transferable: MemoryRangeTransferable): MemoryRange;
		fromReadonly(transferable: MemoryRangeTransferable): ReadonlyMemoryRange;
	};
}

export namespace SharedMemory {

	export type Transferable = {
		id: string;
		module: WebAssembly.Module;
		memory: WebAssembly.Memory;
	};
	export interface Exports {
		malloc(size: number): number;
		free(ptr: number): void;
		aligned_alloc(align: number, size: number): number;
	}

	export function is(value: any): value is SharedMemory {
		return value instanceof MemoryImpl;
	}

	export function create(): Promise<SharedMemory> {
		return RAL().Memory.create(MemoryImpl);
	}

	export function createFrom(transferable: SharedMemory.Transferable): Promise<SharedMemory> {
		return RAL().Memory.createFrom(MemoryImpl, transferable);
	}
}

class MemoryImplRange {

	private readonly memory: SharedMemory;

	constructor(memory: SharedMemory) {
		this.memory = memory;
	}

	public fromWritable(transferable: MemoryRangeTransferable): MemoryRange {
		if (transferable.memory.id !== this.memory.id) {
			throw new MemoryError('Memory transferable has different memory id.');
		}
		if (transferable.kind !== 'writable') {
			throw new Error(`Transferable doesn't denote a writeable memory range`);
		}
		return new MemoryRange(this.memory, transferable.ptr, transferable.size, true);

	}
	public fromReadonly(transferable: MemoryRangeTransferable): ReadonlyMemoryRange{
		if (transferable.memory.id !== this.memory.id) {
			throw new MemoryError('Memory transferable has different memory id.');
		}
		return new ReadonlyMemoryRange(this.memory, transferable.ptr, transferable.size);
	}
}

class MemoryImpl implements SharedMemory {

	public readonly id: string;
	public readonly range: SharedMemory['range'];

	private readonly module: WebAssembly.Module;
	private readonly memory: WebAssembly.Memory;
	private readonly exports: SharedMemory.Exports;

	private _raw: Uint8Array | undefined;
	private _view: DataView | undefined;

	public constructor(module: WebAssembly.Module, memory: WebAssembly.Memory, exports: SharedMemory.Exports, id?: string) {
		this.id = id ?? uuid.v4();
		this.module = module;
		this.memory = memory;
		this.exports = exports;
		this.range = new MemoryImplRange(this);
	}

	public isSame(memory: SharedMemory): boolean {
		return this.buffer === memory.buffer;
	}

	public getTransferable(): SharedMemory.Transferable {
		return { id: this.id, module: this.module, memory: this.memory };
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

	public alloc(align: Alignment, size: size): MemoryRange {
		try {
			const ptr = this.exports.aligned_alloc(align, size);
			if (ptr === 0) {
				throw new Error('Allocation failed');
			}
			return new MemoryRange(this, ptr, size);
		} catch (error) {
			RAL().console.error(`Alloc [${align}, ${size}] failed. Buffer size: ${this.memory.buffer.byteLength}`);
			throw error;
		}
	}

	public realloc(_range: MemoryRange, _align: Alignment, _newSize: size): MemoryRange {
		throw new Error('Not implemented');
	}

	public preAllocated(ptr: number, size: number): MemoryRange {
		if (ptr + size > this.buffer.byteLength) {
			throw new MemoryError(`Memory access is out of bounds. Accessing [${ptr}, ${size}], allocated[${0},${this.buffer.byteLength}]`);
		}
		return new MemoryRange(this, ptr, size, true);
	}

	public free(range: MemoryRange): void {
		try {
			this.exports.free(range.ptr);
		} catch (error) {
			RAL().console.error(`Free ptr ${ptr} failed. Buffer size: ${this.memory.buffer.byteLength}`);
			throw error;
		}
	}

	public readonly(ptr: ptr, size: size): ReadonlyMemoryRange {
		if (ptr + size > this.buffer.byteLength) {
			throw new MemoryError(`Memory access is out of bounds. Accessing [${ptr}, ${size}], allocated[${0},${this.buffer.byteLength}]`);
		}
		return new ReadonlyMemoryRange(this, ptr, size);
	}

	public fromTransferable(transferable: MemoryRangeTransferable): BaseMemoryRange {
		if (transferable.memory.id !== this.id) {
			throw new MemoryError('Memory transferable has different memory id.');
		}
		if (transferable.kind === 'writable') {
			return new MemoryRange(this, transferable.ptr, transferable.size, true);
		} else {
			return new ReadonlyMemoryRange(this, transferable.ptr, transferable.size);
		}
	}

	public copyWithin(dest: MemoryRange, src: ReadonlyMemoryRange): void {
		const raw = new Uint8Array(this.buffer);
		raw.copyWithin(dest.ptr, src.ptr, src.ptr + src.size);
	}
}

export class Allocation {

	private readonly memory: SharedMemory;
	private readonly align: Alignment;
	private readonly size: size;

	constructor(memory: SharedMemory, align: Alignment, size: size) {
		this.memory = memory;
		this.align = align;
		this.size = size;
	}

	public alloc(): MemoryRange {
		return this.memory.alloc(this.align, this.size);
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

	private readonly _memoryRange: MemoryRange;
	private readonly _allocated: boolean;

	protected constructor(allocationOrLocation: Allocation | MemoryRange) {
		if (allocationOrLocation instanceof MemoryRange) {
			this._memoryRange = allocationOrLocation;
			this._allocated = false;
		} else if (allocationOrLocation instanceof Allocation) {
			this._memoryRange = allocationOrLocation.alloc();
			this._allocated = true;
		} else {
			throw new Error('Invalid argument');
		}
	}

	public dispose(): void {
		if (!this._allocated) {
			// We should think about a trace when we dispose
			// a shared object from a thread that hasn't allocated it.
		}
		this._memoryRange.free();
	}

	public get memoryRange(): MemoryRange {
		return this._memoryRange;
	}

	protected get memory(): SharedMemory {
		const result = this._memoryRange.memory;
		if (!(result instanceof MemoryImpl)) {
			throw new Error(`Memory is not a shared memory instance`);
		}
		return result as SharedMemory;
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

	createAccess(memory: MemoryRange): T {
		const access = Object.create(null);
		for (const [name, { type, offset }] of this._fields) {
			if (name.startsWith('_')) {
				continue;
			}
			Object.defineProperty(access, name, {
				get() {
					return type.load(memory, offset, SharedObject.Context);
				},
				set(value) {
					type.store(memory, offset, value, SharedObject.Context);
				}
			});
		}
		return access as T;
	}
}

export abstract class SharedRecord<T extends RecordProperties> extends SharedObject {

	protected readonly access: T;

	constructor(recordInfo: RecordDescriptor<T>, memoryOrLocation: SharedMemory | MemoryRange) {
		if (memoryOrLocation instanceof MemoryRange) {
			super(memoryOrLocation);
		} else {
			super(new Allocation(memoryOrLocation, recordInfo.alignment, recordInfo.size));
		}
		this.access = recordInfo.createAccess(this.memoryRange);
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

	protected constructor(recordInfo: RecordDescriptor<T>, memoryOrLocation: SharedMemory | MemoryRange, lock?: Lock) {
		if (!recordInfo.hasField('_lock')) {
			throw new Error('RecordInfo does not contain a lock field');
		}
		super(recordInfo, memoryOrLocation);
		if (lock === undefined) {
			const offset = recordInfo.getField('_lock')!.offset;
			const lockBuffer = this.memoryRange.getInt32Array(offset, 1);
			// We allocated the memory for this shared record so we need to initialize
			// the lock count to 1. If we use an existing memory location, we need to
			// leave the lock count untouched since the shared record could be locked in
			// another thread.
			if (SharedMemory.is(memoryOrLocation)) {
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
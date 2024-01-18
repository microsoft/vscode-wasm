/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/// <reference path="../../typings/webAssemblyCommon.d.ts" />

import { Memory, Alignment, ComponentModelContext, GenericComponentModelType, ResourceManagers, ptr, u32, size } from '@vscode/wasm-component-model';

import malloc from './malloc';

export interface SMemory extends Memory {
	free(ptr: ptr): void;
}

interface Exports {
	malloc(size: number): number;
	free(ptr: number): void;
	aligned_alloc(align: number, size: number): number;
}

declare var console: any;

class MemoryImpl implements SMemory {

	public readonly memory: WebAssembly.Memory;
	private readonly exports: Exports;

	private _raw: Uint8Array | undefined;
	private _view: DataView | undefined;

	constructor(memory: WebAssembly.Memory, exports: Exports) {
		this.memory = memory;
		this.exports = exports;
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
			// eslint-disable-next-line no-console
			console.error(`Alloc [${align}, ${size}] failed. Buffer size: ${this.memory.buffer.byteLength}`);
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
			// eslint-disable-next-line no-console
			console.error(`Free ptr ${ptr} failed. Buffer size: ${this.memory.buffer.byteLength}`);
			throw error;
		}
	}
}

export type Properties = [string, GenericComponentModelType][];

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
		Atomics.store(buffer, 0, 1);
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

	protected static Context: ComponentModelContext = {
		options: { encoding: 'utf-8' },
		managers: new ResourceManagers()
	};

	private static _memory: MemoryImpl | undefined;
	public static async initialize(memory: WebAssembly.Memory): Promise<void> {
		if (this._memory?.memory === memory) {
			return;
		}
		if (this._memory !== undefined) {
			throw new Error('Memory is already initialized.');
		}
		if (!(memory.buffer instanceof SharedArrayBuffer)) {
			throw new Error('Memory is not a shared memory.');
		}
		const module = await malloc;
		const instance = new WebAssembly.Instance(module, {
			env: {
				memory
			},
			wasi_snapshot_preview1: {
				sched_yield: () => 0
			}
		});
		this._memory = new MemoryImpl(memory, instance.exports as unknown as Exports);
	}

	public static memory(): SMemory {
		if (this._memory === undefined) {
			throw new Error('Memory is not initialized');
		}
		return this._memory;
	}

	protected readonly ptr: ptr;

	protected constructor(allocation: Allocation);
	protected constructor(location: MemoryLocation);
	protected constructor(arg0: Allocation | MemoryLocation) {
		if (MemoryLocation.is(arg0)) {
			this.ptr = arg0.value;
		} else if (Allocation.is(arg0)) {
			this.ptr = SharedObject.memory().alloc(arg0.align, arg0.size);
		} else {
			throw new Error('Invalid argument');
		}
	}

	protected memory(): SMemory {
		return SharedObject.memory();
	}

	public location(): MemoryLocation {
		return MemoryLocation.create(this.ptr);
	}
}

export abstract class SharedRecord<T> extends SharedObject {

	protected readonly access: T;
	protected readonly offsets: Map<string, number>;

	constructor(properties: Properties, location?: MemoryLocation) {
		let align: Alignment = Alignment.byte;
		let size = 0;
		const offsets: Map<string, number> = new Map();
		for (const [name, type] of properties) {
			if (offsets.has(name)) {
				throw new Error(`Duplicate property ${name}`);
			}
			align = Math.max(align, type.alignment);
			size = Alignment.align(size, type.alignment);
			offsets.set(name, size);
			size = size + type.size;
		}
		if (location !== undefined) {
			super(location);
		} else {
			super(Allocation.create(align, size));
		}
		const ptr = this.ptr;
		const mem = this.memory();
		const access = Object.create(null);
		for (const [name, type] of properties) {
			if (name.startsWith('_')) {
				continue;
			}
			const offset = offsets.get(name)!;
			Object.defineProperty(access, name, {
				get() {
					return type.load(mem, ptr + offset, SharedObject.Context);
				},
				set(value) {
					type.store(mem, ptr + offset, value, SharedObject.Context);
				}
			});
		}
		this.access = access as T;
		this.offsets = offsets;
	}
}

export class LockableRecord<T> extends SharedRecord<T> {

	private readonly lock: Lock;

	protected constructor(properties: Properties, location?: MemoryLocation, lock?: Lock) {
		if (lock === undefined) {
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
		}
		super(properties, location);
		if (lock === undefined) {
			const offset = this.offsets.get('_lock')!;
			this.lock = new Lock(new Int32Array(this.memory().buffer, this.ptr + offset, 1));
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
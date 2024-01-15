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
		const ptr = this.exports.aligned_alloc(align, size);
		if (ptr === 0) {
			throw new Error('Allocation failed');
		}
		return ptr;
	}

	public realloc(_ptr: ptr, _oldSize: size, _align: Alignment, _newSize: size): ptr {
		throw new Error('Not implemented');
	}

	public free(ptr: ptr): void {
		this.exports.free(ptr);
	}
}

type Properties = {
	[key: string]: GenericComponentModelType;
};

export type MemoryLocation = {
	ptr: ptr;
};

export namespace MemoryLocation {
	export function create(ptr: ptr): MemoryLocation {
		return { ptr };
	}

	export function is(value: unknown): value is MemoryLocation {
		let candidate = value as MemoryLocation;
		return typeof candidate === 'object' && candidate !== null && typeof candidate.ptr === 'number';
	}
}

export class Semaphore {

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

export class SObject<T> {

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
			throw new Error('Memory is already initialized');
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

	public static get memory(): SMemory {
		if (this._memory === undefined) {
			throw new Error('Memory is not initialized');
		}
		return this._memory;
	}

	protected readonly ptr: ptr;
	protected readonly access: T;
	private readonly semaphore: Semaphore;

	protected constructor(properties: Properties, location?: MemoryLocation, semaphore?: Semaphore) {
		let align: Alignment = Alignment.word;
		// For the semaphore
		let size = u32.size;
		const offsets: { [key: string]: number } = Object.create(null);
		for (const key in properties) {
			align = Math.max(align, properties[key].alignment);
			const offset = size;
			offsets[key] = offset;
			size = size + properties[key].size;
		}
		const mem = SObject.memory;
		const ptr = location?.ptr ?? mem.alloc(align, size);
		const access = Object.create(null);
		for (const key in properties) {
			const offset = offsets[key];
			const type = properties[key];
			Object.defineProperty(access, key, {
				get() {
					return type.load(mem, ptr + offset, SObject.Context);
				},
				set(value) {
					type.store(mem, ptr + offset, value, SObject.Context);
				}
			});
		}
		if (semaphore !== undefined) {
			this.semaphore = semaphore;
		} else {
			const buffer = new Int32Array(mem.buffer, ptr, 1);
			if (location === undefined) {
				buffer[0] = 1;
			}
			this.semaphore = new Semaphore(buffer);
		}
		this.ptr = ptr;
		this.access = access;
	}

	public location(): MemoryLocation {
		return MemoryLocation.create(this.ptr);
	}

	public runLocked(callback: (value: this) => void): void {
		this.lock();
		try {
			callback(this);
		} finally {
			this.release();
		}
	}

	protected get memory(): SMemory {
		return SObject.memory;
	}

	protected lock(): void {
		this.semaphore.acquire();
	}

	protected release(): void {
		this.semaphore.release();
	}
}
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/// <reference path="../typings/webAssemblyCommon.d.ts" />

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

	private readonly memory: WebAssembly.Memory;
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

export class SObject<T> {

	protected static Context: ComponentModelContext = {
		options: { encoding: 'utf-8' },
		managers: new ResourceManagers()
	};

	private static _memory: MemoryImpl | undefined;
	public static async initialize(memory: WebAssembly.Memory): Promise<void> {
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

	private static get memory(): SMemory {
		if (this._memory === undefined) {
			throw new Error('Memory is not initialized');
		}
		return this._memory;
	}

	private static readonly sem: number = 0;
	private static readonly refs: number = 1;

	private readonly header: Int32Array;
	protected readonly ptr: ptr;
	protected readonly access: T;

	protected constructor(properties: Properties, allocated?: ptr) {
		let align: Alignment = Alignment.word;
		let size = u32.size * 2;
		const offsets: { [key: string]: number } = Object.create(null);
		for (const key in properties) {
			align = Math.max(align, properties[key].alignment);
			const offset = size;
			offsets[key] = offset;
			size = size + properties[key].size;
		}
		const mem = SObject.memory;
		const ptr = allocated ?? mem.alloc(align, size);
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
		const header = new Int32Array(mem.buffer, ptr, 2);
		if (allocated === undefined) {
			header[SObject.sem] = 1;
			header[SObject.refs] = 1;
		} else {
			Atomics.add(header, SObject.refs, 1);
		}
		this.ptr = ptr;
		this.access = access;
		this.header = header;
	}

	protected get memory(): SMemory {
		return SObject.memory;
	}

	protected lock(): void {
		while (true) {
			const value = Atomics.load(this.header, SObject.sem);
			if (value > 0 && Atomics.compareExchange(this.header, SObject.sem, value, value - 1) === value) {
				return;
			}
			Atomics.wait(this.header, SObject.sem, value);
		}
	}

	protected release(): void {
		Atomics.add(this.header, SObject.sem, 1);
		Atomics.notify(this.header, SObject.sem, 1);
	}
}
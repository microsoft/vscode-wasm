/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Memory, Alignment, ComponentModelContext, GenericComponentModelType, ResourceManagers, ptr, u32, size } from '@vscode/wasm-component-model';

export interface SMemory extends Memory {
	free(ptr: ptr): void;
}

interface Exports {
	malloc(size: number): number;
	free(ptr: number): void;
	aligned_alloc(align: number, size: number): number;
}

let _memory: SMemory;

class MemoryImpl implements SMemory {

	private readonly memory: WebAssembly.Memory;
	private readonly exports: Exports;
	private readonly registry: FinalizationRegistry<ptr>;

	private _raw: Uint8Array | undefined;
	private _view: DataView | undefined;

	constructor(memory: WebAssembly.Memory, exports: Exports) {
		this.memory = memory;
		this.exports = exports;
		this.registry = new FinalizationRegistry<ptr>((ptr) => {
			const header = new Int32Array(this.memory.buffer, ptr, 2);
			const value = Atomics.load(header, SObject.refs);
			this.free(ptr);
		});
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

export function initialize(module: WebAssembly.Module, memory: WebAssembly.Memory): void {
	if (_memory !== undefined) {
		throw new Error('Memory is already initialized');

	}
	const instance = new WebAssembly.Instance(module, {
		env: {
			memory
		},
		wasi_snapshot_preview1: {
			sched_yield: () => 0
		}
	});
	_memory = new MemoryImpl(memory, instance.exports as unknown as Exports);
}

export function memory(): SMemory {
	if (!_memory) {
		throw new Error('Memory is not initialized');
	}
	return _memory;
}

type Properties = {
	[key: string]: GenericComponentModelType;
};

export class SObject<T> {

	private static Context: ComponentModelContext = {
		options: { encoding: 'utf-8' },
		managers: new ResourceManagers()
	};

	public static readonly sem: number = 0;
	public static readonly refs: number = 1;

	private readonly header: Int32Array;
	private readonly ptr: ptr;
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
		const mem = memory();
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
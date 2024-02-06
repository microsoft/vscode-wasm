/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { ComponentModelType, JType, ptr, u32 } from '@vscode/wasm-component-model';

import { MemoryLocation, LockableRecord, SharedObject, RecordDescriptor, Memory } from './sobject';

namespace SArray {
	export type Properties = {
		state: u32;
		capacity: u32;
		start: u32;
		next: u32;
		elements: ptr;
	};
}

export class SArray<T extends JType> extends LockableRecord<SArray.Properties> {

	private static recordInfo: RecordDescriptor<SArray.Properties> = LockableRecord.createRecordInfo([
		['_lock', u32],
		['state', u32],
		['capacity', u32],
		['start', u32],
		['next', u32],
		['elements', ptr]
	]);

	private readonly type: ComponentModelType<T>;

	constructor(type: ComponentModelType<T>, memoryOrLocation: Memory | MemoryLocation, capacity: number = 32) {
		super(SArray.recordInfo, memoryOrLocation);
		this.type = type;
		const access = this.access;
		if (Memory.is(memoryOrLocation)) {
			access.state = 0;
			access.capacity = capacity;
			access.start = 0;
			access.next = 0;
			access.elements = memoryOrLocation.alloc(u32.alignment, capacity * u32.size);
		}
	}

	protected getRecordInfo(): RecordDescriptor<SArray.Properties> {
		return SArray.recordInfo;
	}

	public get length(): number {
		try {
			this.acquireLock();
			return this.access.next - this.access.start;
		} finally {
			this.releaseLock();
		}
	}

	public get size(): number {
		return this.length;
	}

	public at(index: number): T | undefined {
		try {
			this.acquireLock();
			const access = this.access;
			const start = access.start;
			const next = access.next;
			if (index < 0 || index >= next - start) {
				return undefined;
			}
			return this.loadElement(start + index);
		} finally {
			this.releaseLock();
		}
	}

	push(...items: T[]): void {
		try {
			this.acquireLock();
			const memory = this.memory();
			const access = this.access;
			access.state = access.state + 1;
			const numberOfItems = items.length;
			if (access.next + numberOfItems > access.capacity) {
				const currentElements = access.elements;
				const currentCapacity = access.capacity;
				const newCapacity = Math.max(currentCapacity * 2, currentCapacity + numberOfItems);
				const newElements = memory.alloc(u32.alignment, newCapacity * u32.size);
				memory.raw.copyWithin(newElements, currentElements, currentElements + currentCapacity * u32.size);
				access.elements = newElements;
				access.capacity = newCapacity;
				memory.free(currentElements);
			}
			let next = access.next;
			for(const value of items) {
				const ptr = this.type.alloc(memory);
				this.type.store(memory, ptr, value, SharedObject.Context);
				u32.store(memory, access.elements + next * u32.size, ptr, SharedObject.Context);
				next = next + 1;
			}
			access.next = next;
		} finally {
			this.releaseLock();
		}
	}

	public pop(): T | undefined {
		try {
			this.acquireLock();
			const memory = this.memory();
			const access = this.access;
			const start = access.start;
			const next = access.next;
			if (next === start) {
				return undefined;
			}
			access.state = access.state + 1;
			const [value, ptr] = this.loadElementAndPtr(next - 1);
			memory.free(ptr);
			access.next = next - 1;
			return value;
		} finally {
			this.releaseLock();
		}
 	}

	public *keys(): IterableIterator<number> {
		const access = this.access;
		const state = access.state;
		const length = access.next - access.start;
		for (let i = 0; i < length; i++) {
			if (access.state !== state) {
				throw new Error(`Array got modified during iteration.`);
			}
			yield i;
		}
	}

	public *values(): IterableIterator<T> {
		const access = this.access;
		const state = access.state;
		let current = access.start;
		while (current < access.next) {
			yield this.loadElement(current, state);
			current = current + 1;
		}
	}

	public *entries(): IterableIterator<[number, T]> {
		const access = this.access;
		const state = access.state;
		const start = access.start;
		let current = start;
		let index = 0;
		while (current < access.next) {
			yield [index, this.loadElement(current, state)];
			current = current + 1;
			index = index + 1;
		}
	}

	public asArray(): T[] {
		try {
			this.acquireLock();
			const access = this.access;
			const start = access.start;
			const next = access.next;
			const result: T[] = [];
			for (let i = start; i < next; i++) {
				result.push(this.loadElement(i));
			}
			return result;
		} finally {
			this.releaseLock();
		}
	}

	public [Symbol.iterator](): IterableIterator<[number, T]> {
		return this.entries();
	}

	private loadElement(index: number, state?: number): T {
		const access = this.access;
		const memory = this.memory();
		try {
			this.acquireLock();
			if (state !== undefined && access.state !== state) {
				throw new Error(`Array got modified during access.`);
			}
			const ptr = u32.load(memory, access.elements + u32.size * index, SharedObject.Context);
			return this.type.load(memory, ptr, SharedObject.Context);
		} finally {
			this.releaseLock();
		}
	}

	private loadElementAndPtr(index: number, state?: number): [T, ptr] {
		const access = this.access;
		const memory = this.memory();
		try {
			this.acquireLock();
			if (state !== undefined && access.state !== state) {
				throw new Error(`Array got modified during access.`);
			}
			const ptr = u32.load(memory, access.elements + u32.size * index, SharedObject.Context);
			return [this.type.load(memory, ptr, SharedObject.Context), ptr];
		} finally {
			this.releaseLock();
		}
	}
}
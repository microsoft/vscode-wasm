/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { ComponentModelType, JType, MemoryRange, ptr, u32 } from '@vscode/wasm-component-model';

import { LockableRecord, SharedObject, RecordDescriptor, SharedMemory } from './sobject';

namespace SArray {
	export type Properties = {
		state: u32;
		start: u32;
		next: u32;
		elementSize: u32;
		elements: MemoryRange;
	};
}

export class ConcurrentModificationError extends Error {
	constructor(message: string) {
		super(message);
	}
}

export class SArray<T extends JType> extends LockableRecord<SArray.Properties> {

	private static recordInfo: RecordDescriptor<SArray.Properties> = LockableRecord.createRecordInfo([
		['_lock', u32],
		['state', u32],
		['start', u32],
		['next', u32],
		['elementSize', u32],
		['elements', MemoryRange]
	]);

	private readonly type: ComponentModelType<T>;

	constructor(type: ComponentModelType<T>, memoryOrLocation: SharedMemory | MemoryRange, capacity: number = 32) {
		super(SArray.recordInfo, memoryOrLocation);
		this.type = type;
		const access = this.access;
		if (SharedMemory.is(memoryOrLocation)) {
			access.state = 0;
			access.start = 0;
			access.next = 0;
			access.elementSize = type.size;
			access.elements = memoryOrLocation.alloc(u32.alignment, capacity * ptr.size);
		} else {
			if (type.size !== access.elementSize) {
				throw new Error(`Element size differs between element type [${this.type.size}] and allocated memory [${access.elementSize}].`);
			}
		}
	}

	protected getRecordInfo(): RecordDescriptor<SArray.Properties> {
		return SArray.recordInfo;
	}

	private get capacity(): number {
		const result = this.access.elements.size / this.type.size;
		if (!Number.isInteger(result)) {
			throw new Error(`Capacity must me an integer, but got [${result}]`);
		}
		return result;
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
			const memory = this.memory;
			const access = this.access;
			access.state = access.state + 1;
			const numberOfItems = items.length;
			const currentCapacity = this.capacity;
			if (access.next + numberOfItems > currentCapacity) {
				const currentElements = access.elements;
				const newCapacity = Math.max(currentCapacity * 2, currentCapacity + numberOfItems);
				const newElements = memory.alloc(u32.alignment, newCapacity * u32.size);
				memory.copyWithin(newElements, currentElements);
				access.elements = newElements;
				currentElements.free();
			}
			let next = access.next;
			for(const value of items) {
				const range = this.type.alloc(this.memory);
				this.type.store(range, 0, value, SharedObject.Context);
				ptr.store(access.elements, next * ptr.size, range.ptr, SharedObject.Context);
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
			const memory = this.memory;
			const access = this.access;
			const start = access.start;
			const next = access.next;
			if (next === start) {
				return undefined;
			}
			access.state = access.state + 1;
			const [value, range] = this.loadElementAndPtr(next - 1);
			memory.free(range);
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
		try {
			this.acquireLock();
			if (state !== undefined && access.state !== state) {
				throw new ConcurrentModificationError(`Array got modified during access.`);
			}
			const ptr = access.elements.getPtr(u32.size * index);
			const range = this.memory.readonly(ptr, access.elementSize);
			return this.type.load(range, 0, SharedObject.Context);
		} finally {
			this.releaseLock();
		}
	}

	private loadElementAndPtr(index: number, state?: number): [T, MemoryRange] {
		const access = this.access;
		try {
			this.acquireLock();
			if (state !== undefined && access.state !== state) {
				throw new Error(`Array got modified during access.`);
			}
			const ptr = access.elements.getPtr(u32.size * index);
			const range = this.memory.preAllocated(ptr, access.elementSize);
			return [this.type.load(range, 0, SharedObject.Context), range];
		} finally {
			this.releaseLock();
		}
	}
}
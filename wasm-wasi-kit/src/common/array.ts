/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { MemoryRange, ptr, u32, type Alignment, type offset, type size, ComponentModelError } from '@vscode/wasm-component-model';
import { SharedObject, RecordDescriptor, PropertyType, JType, SharedProperty } from './sharedObject';


export class ConcurrentModificationError extends Error {
	constructor(message: string) {
		super(message);
	}
}

export class SharedArray<T extends JType> extends SharedProperty {

	private readonly elementType: PropertyType<T>;
	private access: SharedArray.Properties;

	constructor(elementType: PropertyType<T>, memoryRange: MemoryRange, capacity?: number | undefined) {
		super(memoryRange);
		this.elementType = elementType;
		const access = SharedArray.recordInfo.createAccess(memoryRange);
		if (capacity !== undefined) {
			access.state = 0;
			access.start = 0;
			access.next = 0;
			access.elementSize = elementType.size;
			access.elements = memoryRange.memory.alloc(u32.alignment, capacity * ptr.size);
		} else {
			if (elementType.size !== access.elementSize) {
				throw new ComponentModelError(`Element size differs between element type [${this.elementType.size}] and allocated memory [${access.elementSize}].`);
			}
		}
		this.access = access;
	}

	storeInto(memory: MemoryRange): void {
		this.memoryRange.copyBytes(0, this.getRecordInfo().size, memory, 0);
	}

	protected getRecordInfo(): RecordDescriptor<SharedArray.Properties> {
		return SharedArray.recordInfo;
	}

	private get capacity(): number {
		const result = this.access.elements.size / ptr.size;
		if (!Number.isInteger(result)) {
			throw new Error(`Capacity must me an integer, but got [${result}]`);
		}
		return result;
	}

	public get length(): number {
		return this.access.next - this.access.start;
	}

	public get size(): number {
		return this.length;
	}

	public at(index: number): T | undefined {
		const access = this.access;
		const start = access.start;
		const next = access.next;
		if (index < 0 || index >= next - start) {
			return undefined;
		}
		return this.loadElement(start + index);
	}

	push(...items: T[]): void {
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
			const range = memory.alloc(this.elementType.alignment, this.elementType.size);
			this.elementType.store(range, 0, value, SharedObject.Context);
			ptr.store(access.elements, next * ptr.size, range.ptr, SharedObject.Context);
			next = next + 1;
		}
		access.next = next;
	}

	public pop(): T | undefined {
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
 	}

	public *keys(): IterableIterator<number> {
		const access = this.access;
		const state = access.state;
		const length = access.next - access.start;
		for (let i = 0; i < length; i++) {
			if (access.state !== state) {
				throw new ConcurrentModificationError(`Array got modified during iteration.`);
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
		const access = this.access;
		const start = access.start;
		const next = access.next;
		const result: T[] = [];
		for (let i = start; i < next; i++) {
			result.push(this.loadElement(i));
		}
		return result;
	}

	public [Symbol.iterator](): IterableIterator<[number, T]> {
		return this.entries();
	}

	private loadElement(index: number, state?: number): T {
		const access = this.access;
		if (state !== undefined && access.state !== state) {
			throw new ConcurrentModificationError(`Array got modified during access.`);
		}
		const ptr = access.elements.getPtr(u32.size * index);
		const range = this.memory.readonly(ptr, access.elementSize);
		return this.elementType.load(range, 0, SharedObject.Context);
	}

	private loadElementAndPtr(index: number, state?: number): [T, MemoryRange] {
		const access = this.access;
		if (state !== undefined && access.state !== state) {
			throw new Error(`Array got modified during access.`);
		}
		const ptr = access.elements.getPtr(u32.size * index);
		const range = this.memory.preAllocated(ptr, access.elementSize);
		return [this.elementType.load(range, 0, SharedObject.Context), range];
	}
}

export namespace SharedArray {

	export type Properties = {
		state: u32;
		start: u32;
		next: u32;
		elementSize: u32;
		elements: MemoryRange;
	};

	export const recordInfo: RecordDescriptor<SharedArray.Properties> = new RecordDescriptor([
		['state', u32],
		['start', u32],
		['next', u32],
		['elementSize', u32],
		['elements', PropertyType.MemoryRange]
	]);

	export class Type<T extends JType> implements PropertyType<SharedArray<T>>{
		public size: size;
		public alignment: Alignment;
		private elementType: PropertyType<T>;
		constructor(elementType: PropertyType<T>) {
			this.elementType = elementType;
			this.size = recordInfo.size;
			this.alignment = recordInfo.alignment;
		}
		public load(memory: MemoryRange, offset: offset): SharedArray<any> {
			const arrayMemory = memory.range(offset, this.size);
			return new SharedArray<T>(this.elementType, arrayMemory);
		}
		public store(memory: MemoryRange, offset: offset, value: SharedArray<any>): void {
			const arrayMemory = memory.range(offset, this.size);
			value.storeInto(arrayMemory);
		}
	}
}

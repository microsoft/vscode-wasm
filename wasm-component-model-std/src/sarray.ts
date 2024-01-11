/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { ComponentModelType, GenericComponentModelType, JType, ptr, u32 } from '@vscode/wasm-component-model';

import { SObject } from './sobject';

type SArrayProperties = {
	capacity: u32;
	start: u32;
	next: u32;
	elements: ptr;
};

new Array();

export class SArray<T extends JType> extends SObject<SArrayProperties> {

	static properties: { [key: string]: GenericComponentModelType } = {
		capacity: u32,
		start: u32,
		next: u32,
		elements: ptr
	};

	private readonly type: ComponentModelType<T>;

	constructor(type: ComponentModelType<T>) {
		super(SArray.properties);
		this.type = type;
		this.access.capacity = 20;
		this.access.start = 0;
		this.access.next = 0;
		this.access.elements = this.memory.alloc(u32.alignment, u32.size * this.access.capacity);
	}

	public get length(): number {
		try {
			this.lock();
			return this.access.next - this.access.start;
		} finally {
			this.release();
		}
	}

	public size(): number {
		return this.length;
	}

	push(value: T): void {
		try {
			this.lock();
			const memory = this.memory;
			const access = this.access;
			if (access.next === access.capacity) {
				const currentElements = access.elements;
				const currentCapacity = access.capacity;
				const newCapacity = currentCapacity * 2;
				const newElements = memory.alloc(u32.alignment, newCapacity);
				memory.raw.copyWithin(newElements, currentElements, currentElements + currentCapacity * u32.size);
				access.elements = newElements;
				access.capacity = newCapacity;
				memory.free(currentElements);
			}
			const ptr = this.type.alloc(memory);
			this.type.store(memory, ptr, value, SObject.Context);
			const next = access.next;
			u32.store(memory, access.elements + u32.size * next, ptr, SObject.Context);
			access.next = next + 1;
		} finally {
			this.release();
		}
	}

	public get(index: number): T | undefined {
		try {
			this.lock();
			const memory = this.memory;
			const access = this.access;
			const start = access.start;
			const next = access.next;
			if (index < 0 || index >= next - start) {
				return undefined;
			}
			const ptr = u32.load(memory, access.elements + u32.size * (start + index), SObject.Context);
			return this.type.load(memory, ptr, SObject.Context);
		} finally {
			this.release();
		}
	}

	public pop(): T | undefined {
		try {
			this.lock();
			const memory = this.memory;
			const access = this.access;
			const start = access.start;
			const next = access.next;
			if (next === start) {
				return undefined;
			}
			const ptr = u32.load(memory, access.elements + u32.size * (next - 1), SObject.Context);
			const value = this.type.load(memory, ptr, SObject.Context);
			memory.free(ptr);
			access.next = next - 1;
			return value;
		} finally {
			this.release();
		}
	}
}
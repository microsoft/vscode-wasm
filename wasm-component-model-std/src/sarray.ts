/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { ComponentModelType, GenericComponentModelType, JType, ptr, u32 } from '@vscode/wasm-component-model';
import { SObject } from './sobject';
import { memory } from './memory';

type SArrayProperties = {
	capacity: u32;
	start: u32;
	next: u32;
	elements: ptr;
};

export class SArray<T extends JType> extends SObject<SArrayProperties> {

	static properties: { [key: string]: GenericComponentModelType } = {
		capacity: u32,
		start: u32,
		next: u32,
		elements: ptr
	};

	private readonly type: ComponentModelType<T>;
	private readonly access: SArrayProperties;

	constructor(type: ComponentModelType<T>) {
		super(SArray.properties);
		this.type = type;
		this.access = SObject.access(SArray.properties);
		this.access.capacity = 20;
		this.access.start = 0;
		this.access.next = 0;
		this.access.elements = memory().alloc(this.type.alignment, this.type.size * this.access.capacity);
	}

	push(value: T): void {
		if (this.access.next < this.access.capacity) {
			this.type.store(memory(), this.access.elements + this.type.size * this.access.next, value, SObject.Context);
			this.access.next = this.access.next + 1;
		} else {
			this.access.capacity = this.access.capacity * 2;
			const newElements = memory().alloc(this.type.alignment, this.type.size * this.access.capacity);
			memory().view.setUint32(newElements, this.access.next, true);
			memory().view.setUint32(newElements + u32.size, this.access.next, true);
			memory().view.setUint32(newElements + u32.size * 2, this.access.capacity, true);
			memory().view.setUint32(newElements + u32.size * 3, this.access.elements, true);
			this.access.elements = newElements;
		}
	}

	public size(): number {
		return this.access.next - this.access.start;
	}
}
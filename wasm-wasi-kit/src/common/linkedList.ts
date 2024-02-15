/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { ptr, u32, type MemoryRange, type size, type Alignment, type offset, ComponentModelTrap } from '@vscode/wasm-component-model';
import { ObjectProperty, Record, type ObjectType, type ValueType, SharedObjectContext } from './sharedObject';



export class SharedLinkedList<T> extends ObjectProperty {

	private readonly elementType: ValueType<T>;
	protected readonly access: SharedLinkedList.Properties;

	constructor(elementType: ValueType<T>, memoryRange: MemoryRange, context: SharedObjectContext) {
		super(memoryRange);
		this.elementType = elementType;
		const access = SharedLinkedList.properties.load(memoryRange, 0, context);
		if (context.mode === SharedObjectContext.Mode.new) {
			access.state = 0;
			access.head = 0;
			access.tail = 0;
			access.size = 0;
			access.elementSize = elementType.size;
		} else {
			if (elementType.size !== access.elementSize) {
				throw new ComponentModelTrap(`Element size differs between element type [${this.elementType.size}] and allocated memory [${access.elementSize}].`);
			}
		}
		this.access = access;
	}
}

export namespace SharedLinkedList {
	export type Properties = {
		state: u32;
		head: ptr;
		tail: ptr;
		size: u32;
		elementSize: u32;
	};

	export const properties: Record.Type<Properties> = new Record.Type([
		['state', u32],
		['head', ptr],
		['tail', ptr],
		['size', u32],
		['elementSize', u32],
	]);

	export class Type<T> implements ObjectType<SharedLinkedList<T>>{
		public size: size;
		public alignment: Alignment;
		private elementType: ValueType<T>;
		constructor(elementType: ValueType<T>) {
			this.elementType = elementType;
			this.size = properties.size;
			this.alignment = properties.alignment;
		}
		public load(memory: MemoryRange, offset: offset, context: SharedObjectContext): SharedLinkedList<any> {
			const linkedListMemory = memory.range(offset, this.size);
			return new SharedLinkedList<T>(this.elementType, linkedListMemory, context);
		}
	}
}
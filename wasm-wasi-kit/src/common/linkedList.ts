/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { ptr, u32, type JType, type ComponentModelType, type MemoryRange } from '@vscode/wasm-component-model';
import { LockableRecord, RecordDescriptor, SharedMemory } from './sobject';


namespace SharedLinkedList {
	export type Properties = LockableRecord.Properties & {
		state: u32;
		head: ptr;
		tail: ptr;
		size: u32;
		elementSize: u32;
	};
}

export class SharedLinkedList<T extends JType> extends LockableRecord<SharedLinkedList.Properties> {

	private static recordInfo: RecordDescriptor<SharedLinkedList.Properties> = new RecordDescriptor(LockableRecord.properties, [
		['state', u32],
		['head', ptr],
		['tail', ptr],
		['size', u32],
		['elementSize', u32],
	]);

	private readonly type: ComponentModelType<T>;

	constructor(type: ComponentModelType<T>, memoryOrLocation: SharedMemory | MemoryRange) {
		super(SharedLinkedList.recordInfo, memoryOrLocation);
		this.type = type;
		const access = this.access;
		if (SharedMemory.is(memoryOrLocation)) {
			access.state = 0;
			access.head = 0;
			access.tail = 0;
			access.size = 0;
			access.elementSize = type.size;
		} else {
			if (type.size !== access.elementSize) {
				throw new Error(`Element size differs between element type [${this.type.size}] and allocated memory [${access.elementSize}].`);
			}
		}
	}

	protected getRecordInfo(): RecordDescriptor<SharedLinkedList.Properties> {
		return SharedLinkedList.recordInfo;
	}
}
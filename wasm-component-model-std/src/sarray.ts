/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { alloc } from './memory';
import { Alignment, ComponentModelType, JType, ptr } from '@vscode/wasm-component-model';

export class SArray<T extends JType> {

	private readonly type: ComponentModelType<T>;
	private ptr: ptr;
	private capacity: number;
	private start: number;
	private next: number;

	constructor(type: ComponentModelType<T>) {
		this.type = type;
		this.start = 0;
		this.next = 0;
		const alignment = Math.max(type.alignment, Alignment.word);
		// We start with 20 elements
		this.capacity = 20;
		this.ptr = alloc(alignment, type.size * this.capacity + 8);
		
	}

	push(value: T): void {
		throw new Error('Not implemented');
	}

	public size(): number {
		return this.next - this.start;
	}
}
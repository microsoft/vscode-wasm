/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { io } from '@vscode/wasi';

import { ResourceHandle, ptr, u32 } from '@vscode/wasm-component-model';
import { MemoryLocation, SharedObject } from '@vscode/wasm-component-model-std';

export class Pollable extends SharedObject implements io.Poll.Pollable {

	private buffer: Int32Array;

	constructor(location?: MemoryLocation) {
		super(location ?? { align: u32.alignment, size: u32.size });
		this.buffer = new Int32Array(this.memory().buffer, this.ptr, 1);
	}

	public handle(): ResourceHandle {
		return this.ptr;
	}

	public ready(): boolean {
		return Atomics.load(this.buffer, 0) === 1;
	}

	public block(): void {
		Atomics.wait(this.buffer, 0, 0);
	}

	public markReady(): void {
		Atomics.store(this.buffer, 0, 1);
		Atomics.notify(this.buffer, 0);
	}
}

export class PollableList extends SharedObject {

	private buffer: Int32Array;

	constructor(locationOrValues: MemoryLocation | Pollable[] | ptr<Pollable>[]) {
		super(u32.size);
		this.buffer = new Int32Array(this.memory().buffer, this.ptr, 1);
	}

	public handle(): ResourceHandle {
		return this.ptr;
	}

	public ready(): boolean {
		return Atomics.load(this.buffer, 0) === 1;
	}

	public block(): void {
		Atomics.wait(this.buffer, 0, 0);
	}
}
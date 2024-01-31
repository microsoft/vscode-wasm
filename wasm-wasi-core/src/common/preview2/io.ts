/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { io } from '@vscode/wasi';

import { ResourceHandle, ptr, s32, u32 } from '@vscode/wasm-component-model';
import { MemoryLocation, RecordDescriptor, SharedObject } from '@vscode/wasm-component-model-std';

export class Pollable extends SharedObject implements io.Poll.Pollable {

	private signal: Int32Array;

	constructor(location?: MemoryLocation) {
		super(location ?? { align: s32.alignment, size: s32.size });
		this.signal = new Int32Array(this.memory().buffer, this.ptr, 1);
	}

	public get $handle(): ResourceHandle {
		return this.ptr;
	}

	public set $handle(_value: ResourceHandle) {
		throw new Error('Pollable handles are immutable.');
	}

	public ready(): boolean {
		return Atomics.load(this.signal, 0) === 1;
	}

	public block(): void {
		Atomics.wait(this.signal, 0, 0);
	}

	public async blockAsync(): Promise<void> {
		const result = Atomics.waitAsync(this.signal, 0, 0);
		if (result.async) {
			const value = await result.value;
			if (value === 'timed-out') {
				throw new Error('timed-out should never happen.');
			}
		} else {
			if (result.value === 'timed-out') {
				throw new Error('timed-out should never happen.');
			}
			return Promise.resolve();
		}
	}

	public markReady(): void {
		Atomics.store(this.signal, 0, 1);
		Atomics.notify(this.signal, 0);
	}
}

namespace PollableList {
	export type Properties = {
		signal: s32;
		length: u32;
		elements: ptr;
	};
}

export class PollableList extends SharedObject {

	private static RecordInfo: RecordDescriptor<PollableList.Properties> = new RecordDescriptor([
		['signal', s32],
		['length', u32],
		['elements', ptr],
	]);

	private readonly access: PollableList.Properties;
	private readonly signal: Int32Array;

	constructor(locationOrValues: MemoryLocation | Pollable[] | ptr<Pollable>[]) {
		if (MemoryLocation.is(locationOrValues)) {
			super(locationOrValues);
		} else {
			const length = locationOrValues.length;
			const size = PollableList.RecordInfo.size + (length - 1) * ptr.size;
			const alignment = PollableList.RecordInfo.alignment;
			super({ align: alignment, size });
			let mem = this.memory();
			if (length > 0) {
				let location = this.ptr + PollableList.RecordInfo.fields.elements.offset;
				for (const value of locationOrValues) {
					ptr.store(mem, location, typeof value === 'number' ? value : value.$handle, SharedObject.Context);
					location += ptr.size;
				}
			}
		}
		this.access = PollableList.RecordInfo.createAccess(this.memory(), this.ptr);
		const signalOffset = PollableList.RecordInfo.fields.signal.offset;
		this.signal = new Int32Array(this.memory().buffer, this.ptr + signalOffset, 1);
	}

	public get length(): number {
		return this.access.length;
	}

	public get $handle(): ResourceHandle {
		return this.ptr;
	}

	public block(): Uint32Array {
		Atomics.wait(this.signal, 0, 0);
		const length = this.access.length;
		const mem = this.memory();
		const pollables: Pollable[] = [];
		let location = this.ptr + PollableList.RecordInfo.fields.elements.offset;
		for (let i = 0; i < length; i++) {
			const handle = ptr.load(mem, location, SharedObject.Context);
			pollables.push(new Pollable(MemoryLocation.create(handle)));
			location += ptr.size;
		}
		const result: number[] = [];
		for (const [index, pollable] of pollables.entries()) {
			if (pollable.ready()) {
				result.push(index);
			}
		}
		return new Uint32Array(result);
	}
}
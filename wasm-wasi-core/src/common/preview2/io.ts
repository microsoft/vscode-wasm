/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { io } from '@vscode/wasi';

import { ResourceHandle, s32, MemoryRange } from '@vscode/wasm-component-model';
import { Allocation, SharedObject, type SharedMemory, Signal } from '@vscode/wasm-wasi-kit';
import type { WasiClient } from './wasiClient';

export class Pollable extends SharedObject implements io.Poll.Pollable {

	public static $drop(inst: io.Poll.Pollable) {
		if (!(inst instanceof this)) {
			throw new Error(`Instance if not an instance of Pollable`);
		}
		inst.free();
	}

	private signal: Signal;

	constructor(rangeOrMemory: MemoryRange | SharedMemory) {
		if (rangeOrMemory instanceof MemoryRange) {
			super(rangeOrMemory);
		} else {
			super(new Allocation(rangeOrMemory, s32.alignment, s32.size));
		}
		this.signal = new Signal(this.memoryRange.getInt32View(0, 1));
	}

	public get $handle(): ResourceHandle {
		return this.memoryRange.ptr;
	}

	public set $handle(_value: ResourceHandle) {
		throw new Error('Pollable handles are immutable.');
	}

	public signalRange(): MemoryRange {
		return this.memoryRange;
	}

	public ready(): boolean {
		return this.signal.isResolved();
	}

	public block(): void {
		this.signal.wait();
	}

	public async blockAsync(): Promise<void> {
		return this.signal.waitAsync();
	}

	public resolve(): void {
		this.signal.resolve();
	}
}

export function createPoll(client: WasiClient) {
	return {
		Pollable: Pollable,
		poll(p: io.Poll.Pollable.Interface[]): Uint32Array {
			const pollables: Pollable[] = p as Pollable[];
			const signal = new Signal(new Allocation(client.getSharedMemory(), s32.alignment, s32.size));
			client.racePollables(signal.memoryRange, pollables.map(p => p.signalRange()));
			signal.wait();
			const result: number[] = [];
			for (const [index, pollable] of pollables.entries()) {
				if (pollable.ready()) {
					result.push(index);
				}
			}
			return new Uint32Array(result);
		}
	} satisfies io.Poll;
}
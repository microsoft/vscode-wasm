/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { io } from '@vscode/wasi';

import { SharedObject, type SharedMemory, Signal, SharedResource, Record } from '@vscode/wasm-kit';
import type { WasiClient } from './wasiClient';

export class Pollable extends SharedResource<Pollable.Properties> implements io.Poll.Pollable {

	public static $drop(inst: io.Poll.Pollable) {
		if (!(inst instanceof this)) {
			throw new Error(`Instance if not an instance of Pollable`);
		}
		inst.free();
	}

	constructor(memoryOrSurrogate: SharedMemory | SharedObject.Surrogate) {
		super(Pollable.record, memoryOrSurrogate);
	}

	protected getRecord(): Record.Type<Pollable.Properties> {
		return Pollable.record;
	}

	public ready(): boolean {
		return this.access.signal.isResolved();
	}

	public block(): void {
		this.access.signal.wait();
	}

	public async blockAsync(): Promise<void> {
		return this.access.signal.waitAsync();
	}

	public resolve(): void {
		this.access.signal.resolve();
	}
}

export namespace Pollable {
	export interface Properties extends SharedResource.Properties { signal: Signal }
	export const properties: Record.PropertyTypes = SharedResource.properties.concat([
		['signal', Signal.Type]
	]);
	export const record = new Record.Type<Properties>(properties);
}

export function createPoll(client: WasiClient) {
	return {
		Pollable: Pollable,
		poll(p: io.Poll.Pollable.Interface[]): Uint32Array {
			const pollables: Pollable[] = p as Pollable[];
			const signal = new Signal(client.getSharedMemory());
			client.racePollables(signal, pollables);
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
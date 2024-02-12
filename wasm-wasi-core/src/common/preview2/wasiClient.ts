/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import type { MemoryRange, MemoryRangeTransferable } from '@vscode/wasm-component-model';
import { AnyConnection, BaseConnection, ConnectionPort, type SharedMemory } from '@vscode/wasm-wasi-kit';

export namespace Client {
	export type Jobs = {
		method: 'setTimeout';
		params: {
			signal: MemoryRangeTransferable;
			currentTime: number;
			timeout: number;
		};
	} | {
		method: 'pollables/race';
		params: {
			signal: MemoryRangeTransferable;
			pollables: MemoryRangeTransferable[];
		};
	};
	export type SyncCalls = {
		method: 'clearTimeout';
		params: {
			signal: MemoryRangeTransferable;
		};
		result: void;
	};
}

type ConnectionType = BaseConnection<undefined, Client.SyncCalls, Client.Jobs, undefined, undefined, undefined>;

export class WasiClient {

	private readonly connection: ConnectionType;

	constructor(memory: SharedMemory, port: ConnectionPort) {
		this.connection = AnyConnection.create(port);
		this.connection.initializeSyncCall(memory);
		this.connection.listen();
	}

	public getSharedMemory(): SharedMemory {
		return this.connection.getSharedMemory();
	}

	public setTimeout(signal: MemoryRange, timeout: bigint): void {
		const ms = Number(timeout / 1000000n) ;
		this.connection.notify('setTimeout', { signal: signal.getTransferable(), currentTime: Date.now(), timeout: ms });
	}

	public clearTimeout(signal: MemoryRange): void {
		this.connection.callSync('clearTimeout', { signal: signal.getTransferable() });
	}

	public racePollables(signal: MemoryRange, pollables: MemoryRange[]): void {
		return this.connection.notify('pollables/race', { signal: signal.getTransferable(), pollables: pollables.map(p => p.getTransferable()) });
	}
}
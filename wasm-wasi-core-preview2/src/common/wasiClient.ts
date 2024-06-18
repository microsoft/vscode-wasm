/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { AnyConnection, BaseConnection, ConnectionPort, type MemoryLocation, type SharedMemory, type SharedObject, type Signal } from '@vscode/wasm-kit';
import type { Pollable } from './io';

export namespace Client {
	export type Jobs = {
		method: 'setTimeout';
		params: {
			signal: MemoryLocation;
			currentTime: number;
			timeout: number;
		};
	} | {
		method: 'pollable/setTimeout';
		params: {
			pollable: SharedObject.Location;
			currentTime: number;
			timeout: number;
		};
	} | {
		method: 'pollables/race';
		params: {
			signal: MemoryLocation;
			pollables: SharedObject.Location[];
		};
	};
	export type SyncCalls = {
		method: 'pollable/clearTimeout';
		params: {
			pollable: SharedObject.Location;
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

	public rawSetTimeout(signal: Signal, timeout: bigint): void {
		const ms = Number(timeout / 1000000n) ;
		this.connection.notify('setTimeout', { signal: signal.location(), currentTime: Date.now(), timeout: ms });
	}

	public setTimeout(pollable: Pollable, timeout: bigint): void {
		const ms = Number(timeout / 1000000n) ;
		this.connection.notify('pollable/setTimeout', { pollable: pollable.location(), currentTime: Date.now(), timeout: ms });
	}

	public clearTimeout(pollable: Pollable): void {
		this.connection.callSync('pollable/clearTimeout', { pollable: pollable.location() });
	}

	public racePollables(signal: Signal, pollables: Pollable[]): void {
		return this.connection.notify('pollables/race', { signal: signal.location(), pollables: pollables.map(p => p.location()) });
	}
}
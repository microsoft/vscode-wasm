/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import RAL from './ral';

import { AnyConnection, BaseConnection } from './connection';
import { type MemoryLocation } from './sobject';
import { WorkerClientBase } from './workerClient';

export namespace Client {
	export type Jobs = {
		method: 'setTimeout';
		params: {
			signal: MemoryLocation;
			currentTime: number;
			timeout: number;
		};
	};
	export type SyncCalls = {
		method: 'clearTimeout';
		params: {
			signal: MemoryLocation;
		};
		result: void;
	};
}

type ConnectionType = BaseConnection<undefined, Client.SyncCalls, Client.Jobs, undefined, undefined, undefined>;

class _WasiClient extends WorkerClientBase {

	private _connection: ConnectionType | undefined;

	protected setConnection(connection: AnyConnection): void {
		this._connection = AnyConnection.cast<ConnectionType>(connection);
	}

	protected get connection(): ConnectionType {
		if (this._connection === undefined) {
			throw new Error('Connection is not initialized.');
		}
		return this._connection;
	}

	public setTimeout(signal: MemoryLocation, timeout: bigint): void {
		const ms = Number(timeout / 1000000n) ;
		this.connection.notify('setTimeout', { signal, currentTime: Date.now(), timeout: ms });
	}

	public clearTimeout(signal: MemoryLocation): void {
		this.connection.callSync('clearTimeout', { signal });
	}
}
export const WasiClient = RAL().WorkerClient<_WasiClient>(_WasiClient, './wasiWorker.js');

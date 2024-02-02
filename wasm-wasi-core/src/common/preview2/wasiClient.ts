/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import RAL from './ral';

import { AnyConnection, BaseConnection, ConnectionPort, type MemoryLocation } from '@vscode/wasm-component-model-std';

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

export class WasiClient {

	private readonly connection: ConnectionType;

	constructor(port: ConnectionPort) {
		this.connection = AnyConnection.cast<ConnectionType>(RAL().Connection.create(port));
		this.connection.listen();
	}

	public setTimeout(signal: MemoryLocation, timeout: bigint): void {
		const ms = Number(timeout / 1000000n) ;
		this.connection.notify('setTimeout', { signal, currentTime: Date.now(), timeout: ms });
	}

	public clearTimeout(signal: MemoryLocation): void {
		this.connection.callSync('clearTimeout', { signal });
	}
}
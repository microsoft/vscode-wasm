/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import type { MemoryRange, MemoryRangeTransferable } from '@vscode/wasm-component-model';
import { AnyConnection, BaseConnection, ConnectionPort } from '@vscode/wasm-wasi-kit';

export namespace Client {
	export type Jobs = {
		method: 'setTimeout';
		params: {
			signal: MemoryRangeTransferable;
			currentTime: number;
			timeout: number;
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

	constructor(port: ConnectionPort) {
		this.connection = AnyConnection.create(port);
		this.connection.listen();
	}

	public setTimeout(signal: MemoryRange, timeout: bigint): void {
		const ms = Number(timeout / 1000000n) ;
		this.connection.notify('setTimeout', { signal: signal.getTransferable(), currentTime: Date.now(), timeout: ms });
	}

	public clearTimeout(signal: MemoryRange): void {
		this.connection.callSync('clearTimeout', { signal: signal.getTransferable() });
	}
}
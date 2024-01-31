/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import RAL from './ral';
import type { BaseConnection } from './connection';
import { SharedObject, type MemoryLocation } from './sobject';
import { MultiConnectionWorker, type BaseWorker } from './workerService';
import type { Disposable } from '@vscode/wasm-component-model/lib/common/disposable';

export namespace Client {
	export type Jobs = {
		method: 'setTimeout';
		params: {
			signal: MemoryLocation;
			timeout: bigint;
		};
	} | {
		method: 'clearTimeout';
		params: {
			signal: MemoryLocation;
		};
	};
}

type ConnectionType = BaseConnection<undefined, undefined, undefined, undefined, undefined, Client.Jobs>;

export class WasiJobWorker extends MultiConnectionWorker<ConnectionType> {

	private readonly timeouts: Map<number, Disposable>;

	constructor(port: MessagePort) {
		const connection = RAL().Connection.create(port) as unknown as BaseWorker.ConnectionType;
		super(connection);
		this.timeouts = new Map();
	}

	protected createConnection(port: MessagePort): Promise<ConnectionType> {
		const connection = RAL().Connection.create(port) as unknown as ConnectionType;
		connection.onNotify('setTimeout', async (params) => {
			const ms = Number(params.timeout / 1000000n) ;
			const disposable = RAL().timer.setTimeout(() => {
				const signal = new Int32Array(SharedObject.memory().buffer, params.signal.value, 1);
				Atomics.notify(signal, 0);
			}, ms);
			this.timeouts.set(params.signal.value, disposable);
		});
		connection.onNotify('clearTimeout', async (params) => {
			const key = params.signal.value;
			const disposable = this.timeouts.get(key);
			if (disposable !== undefined) {
				this.timeouts.delete(key);
				disposable.dispose();
			}
		});
		return Promise.resolve(connection);
	}

	protected dropConnection(connection: ConnectionType): Promise<void> {
		connection.dispose();
		return Promise.resolve();
	}
}
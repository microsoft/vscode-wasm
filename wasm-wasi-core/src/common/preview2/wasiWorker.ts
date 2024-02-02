/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import RAL from './ral';
import { AnyConnection, BaseConnection, type ConnectionPort } from './connection';
import { SharedObject } from './sobject';
import { MultiConnectionWorker, type BaseWorker } from './workerService';
import type { Client } from './wasiClient';

type ConnectionType = BaseConnection<undefined, undefined, undefined, undefined, Client.SyncCalls, Client.Jobs>;

class WasiWorker extends MultiConnectionWorker<ConnectionType> {

	private readonly timeouts: Map<number, RAL.Disposable>;

	constructor(connection: AnyConnection) {
		super(AnyConnection.cast<BaseWorker.ConnectionType>(connection));
		this.timeouts = new Map();
	}

	protected createConnection(port: ConnectionPort): Promise<ConnectionType> {
		const connection = AnyConnection.cast<ConnectionType>(RAL().Connection.create(port));
		connection.initializeSyncCall(this.connection.getSyncMemory());
		connection.onNotify('setTimeout', async (params) => {
			const diff = Date.now() - params.currentTime;
			const ms = params.timeout - diff;
			const signal = new Int32Array(SharedObject.memory().buffer, params.signal.value, 1);
			if (ms <= 0) {
				Atomics.notify(signal, 0);
			} else {
				const disposable = RAL().timer.setTimeout(() => {
					Atomics.notify(signal, 0);
				}, ms);
				this.timeouts.set(params.signal.value, disposable);
			}
		});
		connection.onSyncCall('clearTimeout', async (params) => {
			const key = params.signal.value;
			const disposable = this.timeouts.get(key);
			if (disposable !== undefined) {
				this.timeouts.delete(key);
				disposable.dispose();
			}
		});
		connection.listen();
		return Promise.resolve(connection);
	}

	protected dropConnection(connection: ConnectionType): Promise<void> {
		connection.dispose();
		return Promise.resolve();
	}
}

export const Constructor = WasiWorker;
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import RAL from '../ral';

import type { Disposable } from 'vscode';
import { AnyConnection, BaseConnection, type ConnectionPort, MultiConnectionWorker, BaseWorker, type SharedMemory, Signal } from '@vscode/wasm-wasi-kit';
import type { Client } from './wasiClient';

type ConnectionType = BaseConnection<undefined, undefined, undefined, undefined, Client.SyncCalls, Client.Jobs>;

export class WasiWorker extends MultiConnectionWorker<ConnectionType> {

	private memory!: SharedMemory;
	private readonly timeouts: Map<number, Disposable>;

	constructor(connection: AnyConnection) {
		super(AnyConnection.cast<BaseWorker.ConnectionType>(connection));
		this.timeouts = new Map();
	}

	protected initialize(memory: SharedMemory): void {
		this.memory = memory;
	}

	protected createConnection(port: ConnectionPort): Promise<ConnectionType> {
		const connection: ConnectionType = AnyConnection.create(port);
		connection.initializeSyncCall(this.connection.getSharedMemory());
		connection.onNotify('setTimeout', async (params) => {
			this.memory.range.assertSameMemory(params.signal);
			const diff = Date.now() - params.currentTime;
			const ms = params.timeout - diff;
			const signal = new Int32Array(this.memory.buffer, params.signal.ptr, 1);
			if (ms <= 0) {
				Atomics.store(signal, 0, 1);
				Atomics.notify(signal, 0);
			} else {
				const disposable = RAL().timer.setTimeout(() => {
					Atomics.store(signal, 0, 1);
					Atomics.notify(signal, 0);
				}, ms);
				this.timeouts.set(params.signal.ptr, disposable);
			}
		});
		connection.onSyncCall('clearTimeout', async (params) => {
			this.memory.range.assertSameMemory(params.signal);
			const key = params.signal.ptr;
			const disposable = this.timeouts.get(key);
			if (disposable !== undefined) {
				this.timeouts.delete(key);
				disposable.dispose();
			}
		});
		connection.onNotify('pollables/race', async (params) => {
			this.memory.range.assertSameMemory(params.signal);
			this.memory.range.assertSameMemory(params.pollables);
			const signal = new Signal(new Int32Array(this.memory.buffer, params.signal.ptr, 1));
			const promises: Promise<void>[] = [];
			let isReady: boolean = false;
			for (const pollable of params.pollables) {
				const ps = new Signal(new Int32Array(this.memory.buffer, pollable.ptr, 1));
				const result = ps.waitAsync();
				if (result instanceof Promise) {
					promises.push(result);
				} else {
					isReady = true;
					break;
				}
			}
			if (isReady || promises.length === 0) {
				signal.resolve();
			} else {
				await Promise.race(promises);
				signal.resolve();
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
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import RAL from '../ral';

import type { Disposable } from 'vscode';
import { AnyConnection, BaseConnection, type ConnectionPort, MultiConnectionWorker, BaseWorker, type SharedMemory, Signal } from '@vscode/wasm-kit';
import type { Client } from './wasiClient';
import { Pollable } from './io';

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
			const signal = new Signal(this.memory.range.fromLocation(params.signal));
			const diff = Date.now() - params.currentTime;
			const ms = params.timeout - diff;
			if (ms <= 0) {
				signal.resolve();
			} else {
				RAL().timer.setTimeout(() => {
					signal.resolve();
				}, ms);
			}
		});
		connection.onNotify('pollable/setTimeout', async (params) => {
			const memoryRange = this.memory.range.fromLocation(params.pollable);
			const pollable = new Pollable({ memoryRange, id: params.pollable.id });
			const diff = Date.now() - params.currentTime;
			const ms = params.timeout - diff;
			if (ms <= 0) {
				pollable.resolve();
			} else {
				const disposable = RAL().timer.setTimeout(() => {
					pollable.resolve();
				}, ms);
				this.timeouts.set(pollable.$handle, disposable);
			}
		});
		connection.onSyncCall('pollable/clearTimeout', async (params) => {
			const key = params.pollable.id;
			const disposable = this.timeouts.get(key);
			if (disposable !== undefined) {
				this.timeouts.delete(key);
				disposable.dispose();
			}
		});
		connection.onNotify('pollables/race', async (params) => {
			const signal = new Signal(this.memory.range.fromLocation(params.signal));
			const promises: Promise<void>[] = [];
			let isReady: boolean = false;
			for (const entry of params.pollables) {
				const pollable = new Pollable({ memoryRange: this.memory.range.fromLocation(entry), id: entry.id });
				const result = pollable.blockAsync();
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
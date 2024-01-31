/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Worker } from 'worker_threads';

import type * as Messages from '../common/workerMessages';
import { Connection } from './connection';
import { SharedObject } from '../common/sobject';

export class WorkerClient {

	private readonly module: string;
	private worker: Worker | undefined;
	private connection: WorkerClient.ConnectionType | undefined;

	constructor(module: string) {
		this.module = module;
	}

	public async launch(): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.worker = new Worker('./workerMain.js', { argv: [this.module] });
			const connection = new Connection<Messages.Client.AsyncCalls, undefined, undefined, undefined, undefined, Messages.Service.Notifications>(this.worker);
			connection.onNotify('workerReady', () => {
				const { module, memory } = SharedObject.memory().getTransferable();
				connection.callAsync('initialize', { sharedMemory: { module: module, memory: memory } }).then(resolve, reject);
			});
			connection.listen();
			this.connection = connection;
		});
	}

	public terminate(): Promise<number> {
		if (this.worker === undefined) {
			return Promise.resolve(0);
		} else {
			return this.worker.terminate();
		}
	}
}
namespace WorkerClient {
	export type ConnectionType = Connection<Messages.Client.AsyncCalls, undefined, undefined, undefined, undefined, Messages.Service.Notifications>;
}
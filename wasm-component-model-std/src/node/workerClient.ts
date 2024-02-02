/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import path from 'node:path';
import { Worker } from 'node:worker_threads';

import type * as Messages from '../common/workerMessages';
import { Connection } from './connection';
import { SharedObject } from '../common/sobject';
import type { AnyConnection } from '../common/connection';
import * as cc from '../common/workerClient';

export function WorkerClient<C>(base: new () => cc.WorkerClientBase, module: string): (new () => cc.WorkerClient & C) {
	return (class extends base {

		private worker: Worker | undefined;

		constructor() {
			super();
		}

		public async launch(): Promise<void> {
			return new Promise<void>((resolve, reject) => {
				const fileName = path.join(__dirname, 'workerMain.js');
				this.worker = new Worker(fileName, { argv: [module] });
				const connection = new Connection<Messages.Client.AsyncCalls, undefined, undefined, undefined, undefined, Messages.Service.Notifications>(this.worker);
				connection.onNotify('workerReady', () => {
					const { module, memory } = SharedObject.memory().getTransferable();
					connection.callAsync('initialize', { sharedMemory: { module: module, memory: memory } }).then(resolve, reject);
				});
				connection.listen();
				this.setConnection(connection as unknown as AnyConnection);
			});
		}

		public terminate(): Promise<number> {
			if (this.worker === undefined) {
				return Promise.resolve(0);
			} else {
				return this.worker.terminate();
			}
		}
	}) as unknown as (new () => cc.WorkerClient & C);
}
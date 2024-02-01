/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import type * as Messages from '../common/workerMessages';
import { Connection } from './connection';
import { SharedObject } from '../common/sobject';
import type { AnyConnection } from '../common/connection';
import { WorkerClient, WorkerClientBase } from '../common/workerClient';

export function WorkerClient<C>(base: new () => WorkerClientBase, module: string): (new () => WorkerClient & C) {
	return (class extends base {

		private worker: Worker | undefined;

		constructor() {
			super();
		}

		public async launch(): Promise<void> {
			return new Promise<void>((resolve, reject) => {
				const url: URL = new URL('./workerMain.js');
				url.searchParams.set('0', module);
				this.worker = new Worker(url);
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
				this.worker.terminate();
				return Promise.resolve(0);
			}
		}
	}) as unknown as (new () => WorkerClient & C);
}
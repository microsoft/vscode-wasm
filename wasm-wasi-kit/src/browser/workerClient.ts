/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import type * as Messages from '../common/workerMessages';
import { Connection } from './connection';
import { type SharedMemory } from '../common/sharedObject';
import type { AnyConnection } from '../common/connection';
import * as cc from '../common/workerClient';
import type { URI } from 'vscode-uri';

export function WorkerClient<C>(base: new () => cc.WorkerClientBase, workerLocation: URI, _args?: string[]): (new () => cc.WorkerClient & C) {
	return (class extends base {

		private worker: Worker | undefined;

		constructor() {
			super();
		}

		public async launch(memory: SharedMemory): Promise<void> {
			return new Promise<void>((resolve, reject) => {
				this.worker = new Worker(new URL(workerLocation.toString()));
				const connection = new Connection<Messages.Client.AsyncCalls, undefined, undefined, undefined, undefined, Messages.Service.Notifications>(this.worker);
				connection.onNotify('workerReady', () => {
					connection.callAsync('initialize', { sharedMemory: memory.getTransferable() }).then(resolve, reject);
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
	}) as unknown as (new () => cc.WorkerClient & C);
}
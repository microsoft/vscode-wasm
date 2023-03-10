/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { MessagePort, Worker, parentPort } from 'worker_threads';

import { WasiHost} from '../common/host';
import { NodeHostConnection } from './connection';
import { StartMainMessage, WorkerReadyMessage } from '../common/connection';

if (parentPort === null) {
	throw new Error('This file is only intended to be run in a worker thread');
}

class WasiMainWorker {

	private readonly port: MessagePort | Worker;

	public constructor(port: MessagePort | Worker) {
		this.port = port;
	}

	public listen(): void {
		const connection = new NodeHostConnection(this.port);
		this.port.on('message', async (message: StartMainMessage) => {
			const module = message.module;
			const memory = message.memory;
			const host = WasiHost.create(connection);
			const imports: WebAssembly.Imports = {
				wasi_snapshot_preview1: host,
				wasi: host
			};
			if (memory !== undefined) {
				imports.env = {
					memory: memory
				};
			}
			const instance  = await WebAssembly.instantiate(module, imports);
			host.initialize(instance, memory);
			(instance.exports._start as Function)();
		});
		const ready: WorkerReadyMessage = { method: 'workerReady' };
		connection.postMessage(ready);
	}
}

const worker = new WasiMainWorker(parentPort);
worker.listen();
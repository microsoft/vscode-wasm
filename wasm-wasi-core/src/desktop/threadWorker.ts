/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { MessagePort, Worker, parentPort } from 'worker_threads';

import { WasiHost} from '../common/host';
import { NodeHostConnection } from './connection';
import { StartThreadMessage, WorkerReadyMessage } from '../common/connection';

if (parentPort === null) {
	throw new Error('This file is only intended to be run in a worker thread');
}

class WasiThreadWorker {

	private readonly port: MessagePort | Worker;

	public constructor(port: MessagePort | Worker) {
		this.port = port;
	}

	public listen(): void {
		const connection = new NodeHostConnection(this.port);
		this.port.on('message', async (message: StartThreadMessage) => {
			const module = message.module;
			const memory = message.memory;
			const host = WasiHost.create(connection);
			const instance = await WebAssembly.instantiate(module, {
				env: { memory: memory },
				wasi_snapshot_preview1: host,
				wasi: host
			});
			host.initialize(instance, memory);
			(instance.exports.wasi_thread_start as Function)(message.tid, message.start_arg);
			host.thread_exit(message.tid);
		});
		const ready: WorkerReadyMessage = { method: 'workerReady' };
		connection.postMessage(ready);
	}
}

const worker = new WasiThreadWorker(parentPort);
worker.listen();
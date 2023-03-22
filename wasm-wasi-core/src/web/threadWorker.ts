/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { WasiHost} from '../common/host';
import { BrowserHostConnection } from './connection';
import { StartThreadMessage, WorkerReadyMessage } from '../common/connection';

class WasiThreadWorker {

	private readonly port: MessagePort | Worker | DedicatedWorkerGlobalScope;

	public constructor(port: MessagePort | Worker | DedicatedWorkerGlobalScope) {
		this.port = port;
	}

	public listen(): void {
		const connection = new BrowserHostConnection(this.port);
		this.port.onmessage = (async (event: MessageEvent<StartThreadMessage>) => {
			const message = event.data;
			const module = message.module;
			const memory = message.memory;
			const host = WasiHost.create(connection);
			const instance = await WebAssembly.instantiate(module, {
				env: { memory: memory },
				wasi_snapshot_preview1: host,
				wasi: host
			});
			host.initialize(memory ?? instance);
			(instance.exports.wasi_thread_start as Function)(message.tid, message.start_arg);
			host.thread_exit(message.tid);
		});
		const ready: WorkerReadyMessage = { method: 'workerReady' };
		connection.postMessage(ready);
	}
}

const worker = new WasiThreadWorker(self);
worker.listen();
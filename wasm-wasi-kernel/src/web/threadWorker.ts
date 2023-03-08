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
			const binary: Uint8Array = new Uint8Array(message.bits as SharedArrayBuffer);
			const host = WasiHost.create(connection);
			const { instance } = await WebAssembly.instantiate(binary, {
				wasi_snapshot_preview1: host,
				wasi: host
			});
			host.initialize(instance);
			try {
				(instance.exports.wasi_thread_start as Function)(message.tid, message.start_arg);
			} catch (error) {
				// console.log(error);
			}
		});
		const ready: WorkerReadyMessage = { method: 'workerReady' };
		connection.postMessage(ready);
	}
}

const worker = new WasiThreadWorker(self);
worker.listen();
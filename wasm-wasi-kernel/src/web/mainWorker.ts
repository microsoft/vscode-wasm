/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WasiHost} from '../common/host';
import { BrowserHostConnection } from './connection';
import { StartMainMessage, WorkerReadyMessage } from '../common/connection';

class WasiMainWorker {

	private readonly port: MessagePort | Worker | DedicatedWorkerGlobalScope;

	public constructor(port: MessagePort | Worker | DedicatedWorkerGlobalScope) {
		this.port = port;
	}

	public listen(): void {
		const connection = new BrowserHostConnection(this.port);
		this.port.onmessage = (async (event: MessageEvent<StartMainMessage>) => {
			const message = event.data;
			const binary: Uint8Array = new Uint8Array(message.bits as SharedArrayBuffer);
			const host = WasiHost.create(connection);
			const memory = new WebAssembly.Memory({ initial: 160, maximum: 160, shared: true });
			const { instance } = await WebAssembly.instantiate(binary, {
				"env": {
					"memory": memory
				},
				wasi_snapshot_preview1: host,
				wasi: host
			});
			host.initialize(instance);
			(instance.exports._start as Function)();
		});
		const ready: WorkerReadyMessage = { method: 'workerReady' };
		connection.postMessage(ready);
	}
}

const worker = new WasiMainWorker(self);
worker.listen();
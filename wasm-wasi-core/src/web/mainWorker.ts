/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RIL from './ril';
RIL.install();

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
			host.initialize(memory ?? instance);
			(instance.exports._start as Function)();
		});
		const ready: WorkerReadyMessage = { method: 'workerReady' };
		connection.postMessage(ready);
	}
}

const worker = new WasiMainWorker(self);
worker.listen();
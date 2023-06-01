/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RIL from './ril';
RIL.install();

import { TraceWasiHost, Tracer, WasiHost} from '../common/host';
import { BrowserHostConnection } from './connection';
import { ServiceMessage, StartMainMessage, WorkerReadyMessage } from '../common/connection';
import { CapturedPromise } from '../common/promises';

class MainBrowserHostConnection extends BrowserHostConnection {

	private _done: CapturedPromise<void>;

	constructor(port: MessagePort | Worker | DedicatedWorkerGlobalScope) {
		super(port);
		this._done = CapturedPromise.create();
	}

	public done(): Promise<void> {
		return this._done.promise;
	}

	protected async handleMessage(message: ServiceMessage): Promise<void> {
		if (StartMainMessage.is(message)) {
			const module = message.module;
			const memory = message.memory;
			let host = WasiHost.create(this);
			let tracer: Tracer | undefined;
			if (message.trace) {
				tracer  = TraceWasiHost.create(this, host);
				host = tracer.tracer;
			}
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
			if (tracer !== undefined) {
				tracer.printSummary();
			}
			this._done.resolve();
		}
	}
}

async function main(port: MessagePort | Worker | DedicatedWorkerGlobalScope): Promise<void> {
	const connection = new MainBrowserHostConnection(port);
	try {
		const ready: WorkerReadyMessage = { method: 'workerReady' };
		connection.postMessage(ready);
		await connection.done();
	} finally {
		connection.postMessage({ method: 'workerDone' });
		connection.destroy();
	}
}

main(self).catch(RIL().console.error).finally(() => close());
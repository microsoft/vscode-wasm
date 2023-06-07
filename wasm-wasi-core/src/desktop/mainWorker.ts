/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RIL from './ril';
RIL.install();

import { MessagePort, Worker, parentPort } from 'worker_threads';

import { TraceWasiHost, Tracer, WasiHost} from '../common/host';
import { NodeHostConnection } from './connection';
import { ServiceMessage, StartMainMessage, WorkerReadyMessage } from '../common/connection';
import { CapturedPromise } from '../common/promises';

if (parentPort === null) {
	throw new Error('This file is only intended to be run in a worker thread');
}

class MainNodeHostConnection extends NodeHostConnection {

	private _done: CapturedPromise<void>;

	constructor(port: MessagePort | Worker) {
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

async function main(port: MessagePort | Worker): Promise<void> {
	const connection = new MainNodeHostConnection(port);
	const ready: WorkerReadyMessage = { method: 'workerReady' };
	connection.postMessage(ready);
	await connection.done();
	connection.destroy();
}
main(parentPort)
	.catch((error) => {
		RIL().console.error('Running main thread failed', error);
	})
	.finally(() => {
		parentPort?.unref();
	});
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { MessagePort, parentPort } from 'worker_threads';
import { HostConnection, WasiHost} from '../common/wasiHost';

if (parentPort === null) {
	throw new Error('This file is only intended to be run in a worker thread');
}

class Connection extends HostConnection {

	private readonly port: MessagePort;

	public constructor(port: MessagePort) {
		super();
		this.port = port;
	}

	public postMessage(buffers: [SharedArrayBuffer, SharedArrayBuffer]): void {
		this.port.postMessage(buffers);
	}
}

class WasiMainWorker {

	private readonly port: MessagePort;

	public constructor(port: MessagePort) {
		this.port = port;
	}

	public listen(): void {
		this.port.on('message', async (message) => {
			const connection = new Connection(this.port);
			const binary: SharedArrayBuffer = message;
			const host = WasiHost.create(connection);
			const { instance } = await WebAssembly.instantiate(binary, {
				wasi_snapshot_preview1: host,
				wasi: host
			});
			host.initialize(instance);
			(instance.exports._start as Function)();
		});
	}
}

const worker = new WasiMainWorker(parentPort);
worker.listen();
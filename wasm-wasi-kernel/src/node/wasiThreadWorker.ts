/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { MessagePort, parentPort } from 'worker_threads';

import { WasiHost} from '../common/wasiHost';
import { NodeHostConnection } from './connection';
import { StartThreadMessage } from '../common/wasiService';

if (parentPort === null) {
	throw new Error('This file is only intended to be run in a worker thread');
}

class WasiThreadWorker {

	private readonly port: MessagePort;

	public constructor(port: MessagePort) {
		this.port = port;
	}

	public listen(): void {
		this.port.on('message', async (message: StartThreadMessage) => {
			const connection = new NodeHostConnection(this.port);
			const binary: SharedArrayBuffer = message.bits as SharedArrayBuffer;
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

const worker = new WasiThreadWorker(parentPort);
worker.listen();
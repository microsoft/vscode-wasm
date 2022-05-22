/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import RIL from './ril';
RIL.install();

import { MessagePort, Worker } from 'worker_threads';

import { BaseReceiver, BaseSender } from '../common/connection';

export class Sender extends BaseSender {

	private readonly port: MessagePort | Worker;

	constructor(port: MessagePort | Worker) {
		super();
		this.port = port;
	}

	protected postMessage(sharedArrayBuffer: SharedArrayBuffer) {
		this.port.postMessage(sharedArrayBuffer);
	}
}

export class Receiver extends BaseReceiver {
	constructor(port: MessagePort | Worker) {
		super();
		port.on('message', (sharedArrayBuffer: SharedArrayBuffer) => {
			this.handleRequest(sharedArrayBuffer);
		});
	}
}
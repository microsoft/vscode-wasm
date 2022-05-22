/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import RIL from './ril';
RIL.install();

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
	constructor(worker: Worker) {
		super();
		worker.onmessage = ((event: MessageEvent<SharedArrayBuffer>) => {
			this.handleRequest(event.data);
		});
	}
}
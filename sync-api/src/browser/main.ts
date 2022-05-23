/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import RIL from './ril';
RIL.install();

import { BaseServiceConnection, BaseClientConnection, Message } from '../common/connection';

export * from '../common/api';

export class ClientConnection extends BaseClientConnection {

	private readonly port: MessagePort | Worker;

	constructor(port: MessagePort | Worker) {
		super();
		this.port = port;
	}

	protected postMessage(sharedArrayBuffer: SharedArrayBuffer) {
		this.port.postMessage(sharedArrayBuffer);
	}
}

export class ServiceConnection extends BaseServiceConnection {

	private readonly worker: Worker;

	constructor(worker: Worker) {
		super();
		this.worker = worker;
		this.worker.onmessage = ((event: MessageEvent<SharedArrayBuffer>) => {
			this.handleMessage(event.data);
		});
	}

	protected postMessage(message: Message): void {
		this.worker.postMessage(JSON.stringify(message, undefined, 0));
	}
}
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { MessagePort, Worker } from 'worker_threads';

import RAL from '../common/ral';
import { BaseServiceConnection, BaseClientConnection, Message, RequestType, Params } from '../common/connection';

export class ClientConnection<Requests extends RequestType | undefined = undefined, ReadyParams extends Params | undefined = undefined> extends BaseClientConnection<Requests, ReadyParams> {

	private readonly port: MessagePort | Worker;

	constructor(port: MessagePort | Worker) {
		super();
		this.port = port;
		this.port.on('message', (message: Message) => {
			try {
				this.handleMessage(message);
			} catch (error) {
				RAL().console.error(error);
			}
		});
	}

	protected postMessage(sharedArrayBuffer: SharedArrayBuffer) {
		this.port.postMessage(sharedArrayBuffer);
	}
}

export class ServiceConnection<RequestHandlers extends RequestType | undefined = undefined, ReadyParams extends Params | undefined = undefined> extends BaseServiceConnection<RequestHandlers, ReadyParams> {

	private readonly port: MessagePort | Worker;

	constructor(port: MessagePort | Worker) {
		super();
		this.port = port;
		this.port.on('message', async (sharedArrayBuffer: SharedArrayBuffer) => {
			try {
				await this.handleMessage(sharedArrayBuffer);
			} catch (error) {
				RAL().console.error(error);
			}
		});
	}

	protected postMessage(message: Message): void {
		this.port.postMessage(message);
	}
}
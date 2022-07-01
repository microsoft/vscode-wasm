/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import RIL from './ril';
RIL.install();

import RAL from '../common/ral';

import { MessagePort, Worker } from 'worker_threads';

import { BaseServiceConnection, BaseClientConnection, Message, RequestType } from '../common/connection';

export class ClientConnection<Requests extends RequestType | undefined = undefined> extends BaseClientConnection<Requests> {

	private readonly port: MessagePort | Worker;

	constructor(port: MessagePort | Worker) {
		super();
		this.port = port;
		this.port.on('message', (data: string) => {
			try {
				const message: Message = JSON.parse(data);
				this.handleMessage(message);
			} catch (error) {
				RIL().console.error(error);
			}
		});
	}

	protected postMessage(sharedArrayBuffer: SharedArrayBuffer) {
		this.port.postMessage(sharedArrayBuffer);
	}
}

export class ServiceConnection<RequestHandlers extends RequestType | undefined = undefined> extends BaseServiceConnection<RequestHandlers> {

	private readonly port: MessagePort | Worker;

	constructor(port: MessagePort | Worker) {
		super();
		this.port = port;
		this.port.on('message', (sharedArrayBuffer: SharedArrayBuffer) => {
			void this.handleMessage(sharedArrayBuffer);
		});
	}

	protected postMessage(message: Message): void {
		this.port.postMessage(JSON.stringify(message, undefined, 0));
	}
}

export * from '../common/api';
export default RAL;
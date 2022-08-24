/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import RAL from '../common/ral';
import { BaseServiceConnection, BaseClientConnection, Message, RequestType } from '../common/connection';

export class ClientConnection<Requests extends RequestType | undefined = undefined> extends BaseClientConnection<Requests> {

	private readonly port: MessagePort | Worker | DedicatedWorkerGlobalScope;

	constructor(port: MessagePort | Worker | DedicatedWorkerGlobalScope) {
		super();
		this.port = port;
		this.port.onmessage = ((event: MessageEvent<string>) => {
			try {
				const message: Message = JSON.parse(event.data);
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

export class ServiceConnection<RequestHandlers extends RequestType | undefined = undefined> extends BaseServiceConnection<RequestHandlers> {

	private readonly port: MessagePort | Worker | DedicatedWorkerGlobalScope;

	constructor(port: MessagePort | Worker | DedicatedWorkerGlobalScope) {
		super();
		this.port = port;
		this.port.onmessage = ((event: MessageEvent<SharedArrayBuffer>) => {
			void this.handleMessage(event.data);
		});
	}

	protected postMessage(message: Message): void {
		this.port.postMessage(JSON.stringify(message, undefined, 0));
	}
}
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import RAL from '../common/ral';

import { BaseMessageConnection, RequestType, NotificationType } from '../common/messageConnection';

export class MessageConnection <Requests extends RequestType | undefined, Notifications extends NotificationType | undefined, RequestHandlers extends RequestType | undefined = undefined, NotificationHandlers extends NotificationType | undefined = undefined> extends BaseMessageConnection<Transferable, Requests, Notifications, RequestHandlers, NotificationHandlers> {

	private readonly port: MessagePort | Worker | DedicatedWorkerGlobalScope;

	constructor(port: MessagePort | Worker | DedicatedWorkerGlobalScope) {
		super();
		this.port = port;
	}

	protected postMessage(message: any, transferList?: Transferable[]): void {
		transferList !== undefined ? this.port.postMessage(message, transferList) : this.port.postMessage(message);
	}

	public listen(): void {
		this.port.onmessage = (event: MessageEvent<any>) => {
			this.handleMessage(event.data).catch(RAL().console.error);
		};
	}
}
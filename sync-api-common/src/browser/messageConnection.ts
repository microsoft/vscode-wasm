/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import RAL from '../common/ral';

import { BaseMessageConnection } from '../common/messageConnection';

export class MessageConnection <Requests extends BaseMessageConnection.RequestType | undefined, Notifications extends BaseMessageConnection.NotificationType | undefined, RequestHandlers extends BaseMessageConnection.RequestType | undefined = undefined, NotificationHandlers extends BaseMessageConnection.NotificationType | undefined = undefined> extends BaseMessageConnection<Requests, Notifications, RequestHandlers, NotificationHandlers, Transferable> {

	private readonly port: MessagePort | Worker | DedicatedWorkerGlobalScope;

	constructor(port: MessagePort | Worker | DedicatedWorkerGlobalScope) {
		super();
		this.port = port;
	}

	protected postMessage(message: BaseMessageConnection.Message, transfer?: Transferable[]): void {
		transfer !== undefined ? this.port.postMessage(message, transfer) : this.port.postMessage(message);
	}

	public listen(): void {
		this.port.onmessage = (event: MessageEvent<BaseMessageConnection.Message>) => {
			this.handleMessage(event.data).catch(RAL().console.error);
		};
	}
}
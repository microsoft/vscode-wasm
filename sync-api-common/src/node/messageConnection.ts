/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import RAL from '../common/ral';

import { MessagePort, Worker, TransferListItem } from 'worker_threads';
import { BaseMessageConnection } from '../common/messageConnection';

export class MessageConnection <Requests extends BaseMessageConnection.RequestType | undefined, Notifications extends BaseMessageConnection.NotificationType | undefined, RequestHandlers extends BaseMessageConnection.RequestType | undefined = undefined, NotificationHandlers extends BaseMessageConnection.NotificationType | undefined = undefined> extends BaseMessageConnection<Requests, Notifications, RequestHandlers, NotificationHandlers, TransferListItem> {

	private readonly port: MessagePort | Worker;

	constructor(port: MessagePort | Worker) {
		super();
		this.port = port;
	}

	protected postMessage(message: BaseMessageConnection.Message, transferList?: TransferListItem[]): void {
		this.port.postMessage(message, transferList);
	}

	public listen(): void {
		this.port.on('message', (value: BaseMessageConnection.Message) => {
			this.handleMessage(value).catch(RAL().console.error);
		});
	}
}
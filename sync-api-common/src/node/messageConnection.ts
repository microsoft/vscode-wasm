/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import RAL from '../common/ral';

import { MessagePort, Worker, TransferListItem } from 'worker_threads';
import { BaseMessageConnection, RequestType, NotificationType } from '../common/messageConnection';

export class MessageConnection <Requests extends RequestType | undefined, Notifications extends NotificationType | undefined, RequestHandlers extends RequestType | undefined = undefined, NotificationHandlers extends NotificationType | undefined = undefined> extends BaseMessageConnection<TransferListItem, Requests, Notifications, RequestHandlers, NotificationHandlers> {

	private readonly port: MessagePort | Worker;

	constructor(port: MessagePort | Worker) {
		super();
		this.port = port;
	}

	protected postMessage(message: any, transferList?: TransferListItem[]): void {
		this.port.postMessage(message, transferList);
	}

	public listen(): void {
		this.port.on('message', (value: any) => {
			this.handleMessage(value).catch(RAL().console.error);
		});
	}
}
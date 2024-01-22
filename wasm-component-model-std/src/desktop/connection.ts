/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { MessagePort, Worker, TransferListItem } from 'worker_threads';
import { BaseConnection } from '../common/connection';

export class MessageConnection <Requests extends BaseConnection.RequestType | undefined, Notifications extends BaseConnection.NotifyType | undefined, RequestHandlers extends BaseConnection.RequestType | undefined = undefined, NotificationHandlers extends BaseConnection.NotifyType | undefined = undefined> extends BaseConnection<Requests, Notifications, RequestHandlers, NotificationHandlers, TransferListItem> {

	private readonly port: MessagePort | Worker;

	constructor(port: MessagePort | Worker) {
		super();
		this.port = port;
	}

	protected postMessage(message: BaseConnection.Message, transferList?: TransferListItem[]): void {
		this.port.postMessage(message, transferList);
	}

	public listen(): void {
		this.port.on('message', (value: BaseConnection.Message) => {
			// eslint-disable-next-line no-console
			this.handleMessage(value).catch(console.error);
		});
	}
}
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { MessagePort, Worker, TransferListItem } from 'worker_threads';
import { BaseConnection } from '../common/connection';

export { BaseConnection };
export class Connection<
	AsyncCalls extends BaseConnection.AsyncCallType | undefined, SyncCalls extends BaseConnection.SyncCallType | undefined, Notifications extends BaseConnection.NotifyType | undefined,
	AsyncCallHandlers extends BaseConnection.AsyncCallType | undefined = undefined, SyncCallHandlers extends BaseConnection.SyncCallType | undefined = undefined, NotifyHandlers extends BaseConnection.NotifyType | undefined = undefined
> extends BaseConnection<AsyncCalls, SyncCalls, Notifications, AsyncCallHandlers, SyncCallHandlers, NotifyHandlers, TransferListItem> {

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
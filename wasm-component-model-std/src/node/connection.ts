/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { MessagePort, Worker, TransferListItem } from 'worker_threads';

import RAL  from '../common/ral';

import { BaseConnection, AnyConnection as _AnyConnection } from '../common/connection';

export class Connection<
	AsyncCalls extends BaseConnection.AsyncCallType | undefined, SyncCalls extends BaseConnection.SyncCallType | undefined, Notifications extends BaseConnection.NotifyType | undefined,
	AsyncCallHandlers extends BaseConnection.AsyncCallType | undefined = undefined, SyncCallHandlers extends BaseConnection.SyncCallType | undefined = undefined, NotifyHandlers extends BaseConnection.NotifyType | undefined = undefined
> extends BaseConnection<AsyncCalls, SyncCalls, Notifications, AsyncCallHandlers, SyncCallHandlers, NotifyHandlers, TransferListItem> {

	private readonly port: MessagePort | Worker;

	constructor(port: MessagePort | Worker) {
		super();
		this.port = port;
	}

	public dispose(): void {
		this.port.removeAllListeners('message');
		if (this.port instanceof MessagePort) {
			this.port.close();
		}
		super.dispose();
	}

	protected postMessage(message: BaseConnection.Message, transferList?: TransferListItem[]): void {
		this.port.postMessage(message, transferList);
	}

	public listen(): void {
		this.port.on('message', (value: BaseConnection.Message) => {
			this.handleMessage(value).catch((error) => {
				RAL().console.error(error);
			});
		});
	}
}

export class AnyConnection extends Connection<_AnyConnection.AsyncCall, _AnyConnection.SyncCall, _AnyConnection.Notification, _AnyConnection.AsyncCall, _AnyConnection.SyncCall, _AnyConnection.Notification> {
	constructor(port: MessagePort | Worker) {
		super(port);
	}
}
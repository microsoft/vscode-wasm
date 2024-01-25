/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { RAL } from '@vscode/wasm-component-model';

import { BaseConnection } from '../common/connection';

export { BaseConnection };
export class Connection<
	AsyncCalls extends BaseConnection.AsyncCallType | undefined, SyncCalls extends BaseConnection.SyncCallType | undefined, Notifications extends BaseConnection.NotifyType | undefined,
	AsyncCallHandlers extends BaseConnection.AsyncCallType | undefined = undefined, SyncCallHandlers extends BaseConnection.SyncCallType | undefined = undefined, NotifyHandlers extends BaseConnection.NotifyType | undefined = undefined
> extends BaseConnection<AsyncCalls, SyncCalls, Notifications, AsyncCallHandlers, SyncCallHandlers, NotifyHandlers, Transferable> {

	private readonly port: MessagePort | Worker | DedicatedWorkerGlobalScope;

	constructor(port: MessagePort | Worker | DedicatedWorkerGlobalScope) {
		super();
		this.port = port;
	}

	protected postMessage(message: BaseConnection.Message, transfer?: Transferable[]): void {
		transfer !== undefined ? this.port.postMessage(message, transfer) : this.port.postMessage(message);
	}

	public listen(): void {
		this.port.onmessage = (event: MessageEvent<BaseConnection.Message>) => {
			this.handleMessage(event.data).catch(RAL().console.error);
		};
	}
}
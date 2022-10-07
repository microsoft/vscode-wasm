/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import RAL from '../common/ral';
import { BaseServiceConnection, BaseClientConnection, Message, RequestType, KnownConnectionIds, BroadcastChannelName } from '../common/connection';

export class ClientConnection<Requests extends RequestType | undefined = undefined> extends BaseClientConnection<Requests> {

	private readonly channel: BroadcastChannel;

	constructor() {
		super(self.location.pathname);
		this.channel = new BroadcastChannel(BroadcastChannelName);
		this.channel.addEventListener('message', (ev: MessageEvent) => {
			try {
				if (ev.data.dest === this.connectionId || ev.data.dest === KnownConnectionIds.All) {
					this.handleMessage(ev.data);
				}
			} catch (error) {
				RAL().console.error(error);
			}
		});
	}

	protected postMessage(sharedArrayBuffer: SharedArrayBuffer) {
		this.channel.postMessage(sharedArrayBuffer);
	}
}

export class ServiceConnection<RequestHandlers extends RequestType | undefined = undefined> extends BaseServiceConnection<RequestHandlers> {

	private readonly channel: BroadcastChannel;

	constructor() {
		super(KnownConnectionIds.Main);
		this.channel = new BroadcastChannel(BroadcastChannelName);
		this.channel.addEventListener('message', async (ev: MessageEvent) => {
			try {
				await this.handleMessage(ev.data);
			} catch (error) {
				RAL().console.error(error);
			}
		});
	}

	protected postMessage(message: Message) {
		this.channel.postMessage(message);
	}
}
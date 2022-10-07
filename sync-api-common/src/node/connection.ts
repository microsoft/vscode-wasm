/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { BroadcastChannel, isMainThread, threadId } from 'worker_threads';

import RAL from '../common/ral';
import { BaseServiceConnection, BaseClientConnection, Message, RequestType, BroadcastChannelName, KnownConnectionIds } from '../common/connection';

export class ClientConnection<Requests extends RequestType | undefined = undefined> extends BaseClientConnection<Requests> {

	private readonly channel: BroadcastChannel;

	constructor() {
		super(isMainThread ? KnownConnectionIds.Main : threadId.toString());
		this.channel = new BroadcastChannel(BroadcastChannelName);
		this.channel.onmessage = (message: any) => {
			try {
				if (message.data.dest === this.connectionId || message.data.dest === KnownConnectionIds.All) {
					this.handleMessage(message.data);
				}
			} catch (error) {
				RAL().console.error(error);
			}
		};
	}

	protected postMessage(sharedArrayBuffer: SharedArrayBuffer) {
		this.channel.postMessage(sharedArrayBuffer);
	}
}

export class ServiceConnection<RequestHandlers extends RequestType | undefined = undefined> extends BaseServiceConnection<RequestHandlers> {

	private readonly channel: BroadcastChannel;

	constructor() {
		super(isMainThread ? KnownConnectionIds.Main : threadId.toString());
		this.channel = new BroadcastChannel(BroadcastChannelName);
		this.channel.onmessage = async (message: any) => {
			try {
				await this.handleMessage(message.data as SharedArrayBuffer);
			} catch (error) {
				RAL().console.error(error);
			}
		};
	}

	protected postMessage(message: Message) {
		this.channel.postMessage(message);
	}
}
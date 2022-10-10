/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { BroadcastChannel, isMainThread, threadId } from 'worker_threads';

import RAL from '../common/ral';
import { BaseServiceConnection, BaseClientConnection, Message, RequestType, BroadcastChannelName, KnownConnectionIds } from '../common/connection';

export class ClientConnection<Requests extends RequestType | undefined = undefined> extends BaseClientConnection<Requests> {

	private readonly channel: BroadcastChannel;

	constructor(channelName: string = BroadcastChannelName) {
		super(isMainThread ? KnownConnectionIds.Main : threadId.toString());
		this.channel = new BroadcastChannel(channelName);
		this.channel.onmessage = (message: any) => {
			try {
				if (message.data?.dest === this.connectionId || message.data?.dest === KnownConnectionIds.All) {
					this.handleMessage(message.data);
				}
			} catch (error) {
				RAL().console.error(error);
			}
		};
	}

	dispose() {
		this.channel.onmessage = () => {};
		this.channel.close();
	}

	protected postMessage(sharedArrayBuffer: SharedArrayBuffer) {
		this.channel.postMessage(sharedArrayBuffer);
	}
}

export class ServiceConnection<RequestHandlers extends RequestType | undefined = undefined> extends BaseServiceConnection<RequestHandlers> {

	private readonly channel: BroadcastChannel;

	constructor(channelName: string = BroadcastChannelName) {
		super(isMainThread ? KnownConnectionIds.Main : threadId.toString());
		this.channel = new BroadcastChannel(channelName);
		this.channel.onmessage = async (message: any) => {
			try {
				// Skip broadcast messages that aren't SharedArrayBuffers
				if (message.data?.byteLength) {
					await this.handleMessage(message.data as SharedArrayBuffer);
				}
			} catch (error) {
				RAL().console.error(error);
			}
		};
	}

	dispose() {
		this.channel.onmessage = () => {};
		this.channel.close();
	}

	protected postMessage(message: Message) {
		this.channel.postMessage(message);
	}
}
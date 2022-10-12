/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { BroadcastChannel, isMainThread, MessageChannel, MessagePort, threadId } from 'worker_threads';

import RAL from '../common/ral';
import { BaseServiceConnection, BaseClientConnection, Message, RequestType, BroadcastChannelName, KnownConnectionIds, Notification } from '../common/connection';

export class ClientConnection<Requests extends RequestType | undefined = undefined> extends BaseClientConnection<Requests> {

	private readonly broadcastChannel: BroadcastChannel;
	private readonly messageChannel: MessageChannel;
	private readonly sendPort: MessagePort;

	constructor(channelName: string = BroadcastChannelName) {
		super(isMainThread ? KnownConnectionIds.Main : threadId.toString());
		this.broadcastChannel = new BroadcastChannel(channelName);
		this.messageChannel = new MessageChannel();
		this.sendPort = this.messageChannel.port1;
		this.sendPort.on('message', this._handleMessage.bind(this));

		// Need to send the port as transfer item, but official api doesn't support that. Do a big hack
		// to pull the MessagePort out of the broadcastchannel
		const symbols = Object.getOwnPropertySymbols(this.broadcastChannel);
		const port = (this.broadcastChannel as any)[symbols[5]] as MessagePort;
		port.postMessage(this.createPortBroadcastMessage(this.messageChannel.port2), [this.messageChannel.port2]);
	}

	dispose() {
		this.messageChannel.port1.close();
		this.messageChannel.port2.close();
		this.broadcastChannel.close();
	}

	protected override postMessage(sharedArrayBuffer: SharedArrayBuffer): void {
		this.sendPort.postMessage(sharedArrayBuffer);
	}

	private _handleMessage(message: Message) {
		try {
			if (message.dest === this.connectionId || message.dest === KnownConnectionIds.All) {
				this.handleMessage(message);
			}
		} catch (error) {
			RAL().console.error(error);
		}

	}
}

export class ServiceConnection<RequestHandlers extends RequestType | undefined = undefined> extends BaseServiceConnection<RequestHandlers> {

	private readonly broadcastChannel: BroadcastChannel;
	private readonly clientPorts: Map<string, MessagePort>;

	constructor(channelName: string = BroadcastChannelName) {
		super(isMainThread ? KnownConnectionIds.Main : threadId.toString());
		this.broadcastChannel = new BroadcastChannel(channelName);
		this.broadcastChannel.onmessage = this.handleBroadcastMessage.bind(this);
		this.clientPorts = new Map<string, MessagePort>();
	}

	dispose() {
		this.clientPorts.clear();
		this.broadcastChannel.onmessage = () => {};
		this.broadcastChannel.close();
	}

	protected postMessage(message: Message) {
		if (message.dest === KnownConnectionIds.All) {
			const clientPorts = [...this.clientPorts.values()];
			clientPorts.forEach(c => c.postMessage(message));
		} else {
			const clientPort = this.clientPorts.get(message.dest);
			clientPort?.postMessage(message);
		}
	}

	protected onBroadcastPort(message: Message): void {
		if (message.params && message.src && message.params.port) {
			const messagePort = message.params.port as MessagePort;
			messagePort.on('message', this.handleMessage.bind(this));
			this.clientPorts.set(message.src, message.params.port as MessagePort);
		}
	}
}
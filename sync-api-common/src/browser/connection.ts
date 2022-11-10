/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import RAL from '../common/ral';
import { BaseServiceConnection, BaseClientConnection, Message, RequestType, KnownConnectionIds, BroadcastChannelName } from '../common/connection';

export class ClientConnection<Requests extends RequestType | undefined = undefined> extends BaseClientConnection<Requests> {

	private readonly broadcastChannel: BroadcastChannel;
	private readonly messageChannel: MessageChannel;
	private readonly sendPort: MessagePort;

	constructor(channelName: string = BroadcastChannelName) {
		super(self.location.pathname);
		console.log(`Creating client with name ${channelName} with origin ${origin}`);
		this.broadcastChannel = new BroadcastChannel(channelName);
		this.messageChannel = new MessageChannel();
		this.sendPort = this.messageChannel.port1;
		this.sendPort.addEventListener('message', this._handleMessage.bind(this));

		// Need to send the port as transfer item, but official api doesn't support that.
		const postMessageFunc = this.broadcastChannel.postMessage.bind(this.broadcastChannel) as any;
		postMessageFunc(this.createPortBroadcastMessage(this.messageChannel.port2), [this.messageChannel.port2]);
	}

	dispose() {
		this.sendPort.removeEventListener('message', this._handleMessage.bind(this));
		this.messageChannel.port1.close();
		this.messageChannel.port2.close();
		this.broadcastChannel.close();
	}

	protected override postMessage(sharedArrayBuffer: SharedArrayBuffer): void {
		this.sendPort.postMessage(sharedArrayBuffer);
	}

	private _handleMessage(message: any) {
		try {
			if (message.data?.dest === this.connectionId || message.data?.dest === KnownConnectionIds.All) {
				this.handleMessage(message.data);
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
		super(KnownConnectionIds.Main);
		console.log(`Creating server with name ${channelName} with origin ${origin}`);
		this.broadcastChannel = new BroadcastChannel(channelName);
		this.clientPorts = new Map<string, MessagePort>();
		this.broadcastChannel.addEventListener('message', this.handleBroadcastMessage.bind(this));
	}

	dispose() {
		this.clientPorts.clear();
		this.broadcastChannel.removeEventListener('message', this.handleBroadcastMessage.bind(this));
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
			messagePort.addEventListener('message', this._handleClientMessage.bind(this));
			this.clientPorts.set(message.src, message.params.port as MessagePort);
		}
	}

	private _handleClientMessage(ev: MessageEvent) {
		if (ev.data?.byteLength) {
			this.handleMessage(ev.data);
		}
	}
}
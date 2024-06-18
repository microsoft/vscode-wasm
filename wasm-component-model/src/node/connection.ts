/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { MessagePort, Worker, type TransferListItem } from 'worker_threads';

import type { WorldType } from '../common/componentModel';
import { BaseMainConnection, BaseWorkerConnection, Connection } from '../common/connection';

export class MainConnection extends BaseMainConnection {

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

	protected postMessage(message: Connection.WorkerCallMessage, transferList?: TransferListItem[]): void {
		this.port.postMessage(message, transferList);
	}

	public listen(): void {
		this.port.on('message', (value: Connection.MainCallMessage | Connection.ReportResultMessage) => {
			this.handleMessage(value);
		});
	}
}

export class WorkerConnection extends BaseWorkerConnection {

	private readonly port: MessagePort;

	constructor(port: MessagePort, world: WorldType, timeout?: number) {
		super(world, timeout);
		this.port = port;
	}

	public dispose(): void {
		this.port.removeAllListeners('message');
		super.dispose();
	}

	protected postMessage(message: Connection.MainCallMessage | Connection.ReportResultMessage, transferList?: TransferListItem[]): void {
		this.port.postMessage(message, transferList);
	}

	public listen(): void {
		this.port.on('message', (value: Connection.WorkerCallMessage) => {
			this.handleMessage(value);
		});
	}
}
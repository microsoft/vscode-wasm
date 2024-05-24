/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { BaseMainConnection, BaseWorkerConnection, Connection } from '../common/connection';
import type { WorldType } from './main';

export class MainConnection extends BaseMainConnection {

	private readonly port: MessagePort | Worker;

	constructor(port: MessagePort | Worker) {
		super();
		this.port = port;
	}

	public dispose(): void {
		this.port.onmessage = null;
		if (this.port instanceof MessagePort) {
			this.port.close();
		}
		super.dispose();
	}

	protected postMessage(message: Connection.WorkerCallMessage, transfer?: Transferable[]): void {
		transfer !== undefined ? this.port.postMessage(message, transfer) : this.port.postMessage(message);
	}

	public listen(): void {
		this.port.onmessage = (event: MessageEvent<Connection.MainCallMessage | Connection.ReportResultMessage>) => {
			this.handleMessage(event.data);
		};
	}
}

export class WorkerConnection extends BaseWorkerConnection {

	private readonly port: MessagePort | DedicatedWorkerGlobalScope;

	constructor(port: MessagePort | DedicatedWorkerGlobalScope, world: WorldType, timeout?: number) {
		super(world, timeout);
		this.port = port;
	}

	public dispose(): void {
		this.port.onmessage = null;
		super.dispose();
	}

	protected postMessage(message: Connection.MainCallMessage | Connection.ReportResultMessage, transfer?: Transferable[]): void {
		transfer !== undefined ? this.port.postMessage(message, transfer) : this.port.postMessage(message);
	}

	public listen(): void {
		this.port.onmessage = (event: MessageEvent<Connection.WorkerCallMessage>) => {
			this.handleMessage(event.data);
		};
	}
}
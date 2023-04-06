/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { MessagePort, Worker } from 'worker_threads';

import RAL from '../common/ral';
import { HostConnection } from '../common/host';
import type { HostMessage, WorkerMessage } from '../common/connection';

export class NodeHostConnection extends HostConnection {

	private readonly port: MessagePort | Worker;

	public constructor(port: MessagePort | Worker) {
		super();
		this.port = port;
		this.port.on('message', (message: HostMessage) => {
			this.handleMessage(message).catch(RAL().console.error);
		});
	}

	public postMessage(message: WorkerMessage): void {
		this.port.postMessage(message);
	}

	public destroy(): void {
		this.port.removeAllListeners('message');
	}

	protected async handleMessage(_message: HostMessage): Promise<void> {
	}
}
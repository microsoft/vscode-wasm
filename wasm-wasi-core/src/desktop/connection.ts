/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { MessagePort, Worker } from 'worker_threads';

import RAL from '../common/ral';
import { HostConnection } from '../common/host';
import type { ServiceMessage, WorkerMessage } from '../common/connection';

export abstract class NodeHostConnection extends HostConnection {

	private readonly port: MessagePort | Worker;

	public constructor(port: MessagePort | Worker) {
		super();
		this.port = port;
		this.port.on('message', (message: ServiceMessage) => {
			this.handleMessage(message).catch((error) => {
				RAL().console.error(error);
			});
		});
	}

	public postMessage(message: WorkerMessage): void {
		this.port.postMessage(message);
	}

	public destroy(): void {
		this.port.removeAllListeners('message');
	}

	protected abstract handleMessage(message: ServiceMessage): Promise<void>;
}
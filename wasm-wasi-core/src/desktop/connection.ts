/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { MessagePort, Worker } from 'worker_threads';

import { HostConnection } from '../common/host';
import { WasiCallMessage, WorkerReadyMessage } from '../common/connection';

export class NodeHostConnection extends HostConnection {

	private readonly port: MessagePort | Worker;

	public constructor(port: MessagePort | Worker) {
		super();
		this.port = port;
	}

	public postMessage(message: WasiCallMessage | WorkerReadyMessage): void {
		this.port.postMessage(message);
	}
}
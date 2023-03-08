/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { HostConnection } from '../common/host';
import { WasiCallMessage, WorkerReadyMessage } from '../common/connection';

export class BrowserHostConnection extends HostConnection {

	private readonly port: MessagePort | Worker | DedicatedWorkerGlobalScope;

	public constructor(port: MessagePort | Worker | DedicatedWorkerGlobalScope) {
		super();
		this.port = port;
	}

	public postMessage(message: WasiCallMessage | WorkerReadyMessage): void {
		this.port.postMessage(message);
	}
}

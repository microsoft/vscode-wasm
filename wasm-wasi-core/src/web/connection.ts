/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import RAL from '../common/ral';
import { HostConnection } from '../common/host';
import { HostMessage, WasiCallMessage, WorkerMessage } from '../common/connection';

export class BrowserHostConnection extends HostConnection {

	private readonly port: MessagePort | Worker | DedicatedWorkerGlobalScope;

	public constructor(port: MessagePort | Worker | DedicatedWorkerGlobalScope) {
		super();
		this.port = port;
		this.port.onmessage = ((event: MessageEvent<HostMessage>) => {
			this.handleMessage(event.data).catch(RAL().console.error);
		});
	}

	public postMessage(message: WasiCallMessage | WorkerMessage): void {
		this.port.postMessage(message);
	}

	protected async handleMessage(_message: HostMessage): Promise<void> {
	}
}
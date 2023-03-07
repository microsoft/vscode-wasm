/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { MessagePort } from 'worker_threads';

import { HostConnection } from '../common/wasiHost';

export class NodeHostConnection extends HostConnection {

	private readonly port: MessagePort;

	public constructor(port: MessagePort) {
		super();
		this.port = port;
	}

	public postMessage(buffers: [SharedArrayBuffer, SharedArrayBuffer]): void {
		this.port.postMessage(buffers);
	}
}

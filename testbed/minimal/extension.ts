/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { Worker } from 'worker_threads';

import { EventEmitter, ExtensionContext, window } from 'vscode';
import { ApiService, ServiceConnection } from 'vscode-sync-api/node';

const name = 'WASI Minimal Example';
const ptyWriteEmitter: EventEmitter<string> = new EventEmitter();
const terminal = window.createTerminal({ name, pty: {
	onDidWrite: ptyWriteEmitter.event,
	open: () => {
		ptyWriteEmitter.fire(`\x1b[31m${name}\x1b[0m\r\n\r\n`);
	},
	close: () => {
	},
	handleInput: (_data: string) => {
	}
}});
terminal.show();

let apiService: ApiService;
let connection: ServiceConnection;

export async function activate(_context: ExtensionContext) {
	const worker = new Worker(path.join(__dirname, './worker.js'));
	connection = new ServiceConnection(worker);
	apiService = new ApiService(connection, ptyWriteEmitter);
	connection.signalReady({});
}

export function deactivate() {
	console.log(apiService, connection);
}
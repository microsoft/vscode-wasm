/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { Worker } from 'worker_threads';

import { ExtensionContext, Terminal, window } from 'vscode';

import { ServiceConnection, Requests } from 'vscode-sync-rpc/node';
import { ApiService } from 'vscode-sync-api-service';

const name = 'WASI Minimal Example';
let apiService: ApiService<Requests>;
let connection: ServiceConnection<Requests>;
let terminal: Terminal;

export async function activate(_context: ExtensionContext) {
	const worker = new Worker(path.join(__dirname, './worker.js'));
	connection = new ServiceConnection<Requests>(worker);
	apiService = new ApiService(name, connection);

	terminal = window.createTerminal({ name, pty: apiService.getPty() });
	terminal.show();
	connection.signalReady({});
}

export function deactivate() {
	console.log(apiService, connection);
}
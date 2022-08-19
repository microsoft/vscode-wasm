/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { Worker } from 'worker_threads';

import { commands, ExtensionContext, Terminal, window } from 'vscode';

import { ServiceConnection } from '@vscode/sync-api-common/node';
import { ApiService, APIRequests } from '@vscode/sync-api-service';

const name = 'Run Rust';
let apiService: ApiService;
let connection: ServiceConnection<APIRequests>;
let terminal: Terminal;

export async function activate(_context: ExtensionContext) {

	commands.registerCommand('testbed-rust.run', () => {
		const worker = new Worker(path.join(__dirname, './worker.js'));
		connection = new ServiceConnection<APIRequests>(worker);
		apiService = new ApiService(name, connection, (_rval) => {
			process.nextTick(() => worker.terminate());
		});
		terminal = window.createTerminal({ name, pty: apiService.getPty() });
		terminal.show();
		connection.signalReady();
	});
}

export function deactivate() {
}
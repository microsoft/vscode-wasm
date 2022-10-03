/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { Worker } from 'worker_threads';

import { commands, ExtensionContext, window } from 'vscode';

import { ServiceConnection } from '@vscode/sync-api-common/node';
import { ApiService, Requests } from '@vscode/sync-api-service';

export async function activate(_context: ExtensionContext) {

	commands.registerCommand('vscode-wasm-wasi-c-example.run', () => {
		const name = 'Run C Example';
		// The worker to execute the web assembly
		const worker = new Worker(path.join(__dirname, './worker.js'));
		// A special connection that allows the worker to talk to the
		// extension host API using sync API.
		const connection = new ServiceConnection<Requests>(worker);
		// The actual sync implementation of parts of the VS Code API
		const apiService = new ApiService(name, connection, {
			exitHandler: (_rval) => {
				process.nextTick(() => worker.terminate());
			}
		});
		// A terminal to show the output of the web assembly execution
		const terminal = window.createTerminal({ name, pty: apiService.getPty() });
		terminal.show();

		connection.signalReady();
	});
}

export function deactivate() {
}
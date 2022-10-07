/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { Worker } from 'worker_threads';

import { commands, ExtensionContext, Terminal, window, workspace } from 'vscode';

import { ServiceConnection } from '@vscode/sync-api-common/node';
import { Requests, ApiService } from '@vscode/sync-api-service';

const connectionState: Map<number, [Worker, ServiceConnection<Requests>, ApiService, Terminal]> = new Map();

export async function activate(_context: ExtensionContext) {

	commands.registerCommand('testbed-python.runFile', () => {
		const activeDocument = window.activeTextEditor?.document;
		if (activeDocument === undefined || activeDocument.languageId !== 'python') {
			return;
		}

		const key = Date.now();
		const worker = new Worker(path.join(__dirname, './worker.js'));
		const connection = new ServiceConnection<Requests>();
		const apiService = new ApiService('Python Run', connection, {
			exitHandler: (_rval) => {
				connectionState.delete(key);
				process.nextTick(() => worker.terminate());
			}
		});
		const terminal = window.createTerminal({ name: 'Python Run', pty: apiService.getPty() });
		terminal.show();

		connectionState.set(key, [worker, connection, apiService, terminal]);

		connection.signalReady();
	});

	commands.registerCommand('testbed-python.runInteractive', () => {
		const key = Date.now();
		const worker = new Worker(path.join(__dirname, './worker.js'));
		const connection = new ServiceConnection<Requests>();
		const apiService = new ApiService('Python Shell', connection, {
			exitHandler: (_rval) => {
				connectionState.delete(key);
				process.nextTick(() => worker.terminate());
			}
		});
		const terminal = window.createTerminal({ name: 'Python Shell', pty: apiService.getPty() });
		terminal.show();

		connectionState.set(key, [worker, connection, apiService, terminal]);
		connection.signalReady();
	});
}

export function deactivate() {
}
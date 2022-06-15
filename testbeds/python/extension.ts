/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { Worker } from 'worker_threads';

import { commands, ExtensionContext, Terminal, window, workspace } from 'vscode';

import { ServiceConnection, Requests, ProcExitRequest } from 'vscode-sync-rpc/node';
import { ApiService } from 'vscode-sync-api-service';

import { Ready, WorkspaceFolder } from './ready';

const connectionState: Map<number, [Worker, ServiceConnection<Requests | ProcExitRequest, Ready>, ApiService, Terminal]> = new Map();

export async function activate(_context: ExtensionContext) {

	commands.registerCommand('testbed-python.runFile', () => {
		const activeDocument = window.activeTextEditor?.document;
		if (activeDocument === undefined || activeDocument.languageId !== 'python') {
			return;
		}

		const key = Date.now();
		const worker = new Worker(path.join(__dirname, './worker.js'));
		const connection = new ServiceConnection<Requests | ProcExitRequest, Ready>(worker);
		const apiService = new ApiService<Ready>('Python Run', connection, (_rval) => {
			connectionState.delete(key);
			process.nextTick(() => worker.terminate());
		});
		const terminal = window.createTerminal({ name: 'Python Run', pty: apiService.getPty() });
		terminal.show();

		connectionState.set(key, [worker, connection, apiService, terminal]);

		const workspaceFolders: WorkspaceFolder[] = [];
		if (workspace.workspaceFolders !== undefined) {
			for (const folder of workspace.workspaceFolders) {
				workspaceFolders.push({ name: folder.name, uri: folder.uri.toJSON() });
			}
		}
		connection.signalReady({
			workspaceFolders,
			pythonFile: activeDocument.uri.toJSON()
		});
	});

	commands.registerCommand('testbed-python.runInteractive', () => {
		const key = Date.now();
		const worker = new Worker(path.join(__dirname, './worker.js'));
		const connection = new ServiceConnection<Requests | ProcExitRequest, Ready>(worker);
		const apiService = new ApiService<Ready>('Python Shell', connection, (_rval) => {
			connectionState.delete(key);
			process.nextTick(() => worker.terminate());
		});
		const terminal = window.createTerminal({ name: 'Python Shell', pty: apiService.getPty() });
		terminal.show();

		connectionState.set(key, [worker, connection, apiService, terminal]);
		const workspaceFolders: WorkspaceFolder[] = [];
		if (workspace.workspaceFolders !== undefined) {
			for (const folder of workspace.workspaceFolders) {
				workspaceFolders.push({ name: folder.name, uri: folder.uri.toJSON() });
			}
		}
		connection.signalReady({
			workspaceFolders,
		});
	});
}

export function deactivate() {
}
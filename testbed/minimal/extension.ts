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

const name = 'Python Execution Shell';
let apiService: ApiService<Requests | ProcExitRequest>;
let connection: ServiceConnection<Requests | ProcExitRequest, Ready>;
let terminal: Terminal;

export async function activate(_context: ExtensionContext) {

	commands.registerCommand('testbed.runPython', () => {
		const worker = new Worker(path.join(__dirname, './worker.js'));
		connection = new ServiceConnection<Requests | ProcExitRequest, Ready>(worker);
		apiService = new ApiService<Ready>(name, connection, (_rval) => {
			process.nextTick(() => worker.terminate());
		});
		terminal = window.createTerminal({ name, pty: apiService.getPty() });
		terminal.show();

		const workspaceFolders: WorkspaceFolder[] = [];
		if (workspace.workspaceFolders !== undefined) {
			for (const folder of workspace.workspaceFolders) {
				workspaceFolders.push({ name: folder.name, uri: folder.uri.toJSON() });
			}
		}
		connection.signalReady({
			workspaceFolders
		});
	});
}

export function deactivate() {
}
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { Worker } from 'worker_threads';

import { commands, ExtensionContext, Terminal, window } from 'vscode';

import { ServiceConnection } from '@vscode/sync-api-common/node';
import { Requests, ApiService, ApiServiceConnection, ServicePseudoTerminal } from '@vscode/sync-api-service';

const connectionState: Map<number, [Worker, ApiServiceConnection, ApiService, Terminal]> = new Map();

export async function activate(_context: ExtensionContext) {

	commands.registerCommand('testbed-ruby.runFile', () => {
		const activeDocument = window.activeTextEditor?.document;
		if (activeDocument === undefined || activeDocument.languageId !== 'ruby') {
			return;
		}

		const key = Date.now();
		const worker = new Worker(path.join(__dirname, './worker.js'));
		const connection: ApiServiceConnection = new ServiceConnection<Requests, ApiServiceConnection.ReadyParams>(worker);
		const apiService = new ApiService('ruby', connection, {
			exitHandler: (_rval) => {
				connectionState.delete(key);
				process.nextTick(() => worker.terminate());
			}
		});
		const pty = ServicePseudoTerminal.create();
		apiService.registerCharacterDeviceDriver(pty, true);
		const terminal = window.createTerminal({ name: 'Run Ruby', pty: pty });
		terminal.show();
		connectionState.set(key, [worker, connection, apiService, terminal]);
		apiService.signalReady();
	});
}

export function deactivate() {
}
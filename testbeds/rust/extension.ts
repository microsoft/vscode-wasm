/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { Worker } from 'worker_threads';

import { commands, ExtensionContext, window } from 'vscode';

import { ServiceConnection } from '@vscode/sync-api-common/node';
import { ApiService, ApiServiceConnection, ServicePseudoTerminal, Requests } from '@vscode/sync-api-service';

export async function activate(_context: ExtensionContext) {
	commands.registerCommand('testbed-rust.run', () => {
		const worker = new Worker(path.join(__dirname, './worker.js'));
		const connection: ApiServiceConnection = new ServiceConnection<Requests, ApiServiceConnection.ReadyParams>(worker);
		const apiService = new ApiService('rust', connection, {
			exitHandler: (_rval) => {
				process.nextTick(() => worker.terminate());
			}
		});
		const pty = ServicePseudoTerminal.create();
		apiService.registerCharacterDeviceDriver(pty, true);
		const terminal = window.createTerminal({ name: 'Run Rust', pty: pty });
		terminal.show();
		apiService.signalReady();
	});
}

export function deactivate() {
}
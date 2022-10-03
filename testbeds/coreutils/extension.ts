/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { Worker } from 'worker_threads';

import { commands, ExtensionContext, window } from 'vscode';

import { ServiceConnection } from '@vscode/sync-api-common/node';
import { ApiService, Requests, PseudoTerminalProvider, ApiServiceConnection } from '@vscode/sync-api-service';

export async function activate(_context: ExtensionContext) {

	commands.registerCommand('testbed-coreutils.run', () => {
		const name = 'Core Utils [base32 test.bat]';
		const worker = new Worker(path.join(__dirname, './worker.js'));
		const connection: ApiServiceConnection = new ServiceConnection<Requests>(worker);
		const apiService = new ApiService(name, connection, {
			exitHandler: (_rval) => {
				process.nextTick(() => worker.terminate());
			}
		});
		const ptp = new PseudoTerminalProvider();
		apiService.registerCharacterDeviceProvider(PseudoTerminalProvider.scheme, ptp);
		const pty = ptp.createAndRegisterPseudoTerminal();
		const terminal = window.createTerminal({ name, pty: pty });
		terminal.show();
		apiService.signalReady({ stdio: pty.getStdioConfiguration() });
	});
}

export function deactivate() {
}
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { commands, ExtensionContext, Uri, window } from 'vscode';

import { ServiceConnection } from '@vscode/sync-api-common/browser';
import { ApiService, ApiServiceConnection, Requests, ServicePseudoTerminal } from '@vscode/sync-api-service';

export async function activate(context: ExtensionContext) {

	commands.registerCommand('testbed-demo.ruby.runEditorContents', () => {
		const activeDocument = window.activeTextEditor?.document;
		if (activeDocument === undefined || activeDocument.languageId !== 'ruby') {
			return;
		}

		const filename = Uri.joinPath(context.extensionUri, './dist/web/rubyWorker.js').toString();
		const worker = new Worker(filename);
		const connection = new ServiceConnection<Requests, ApiServiceConnection.ReadyParams>(worker);
		const apiService = new ApiService('cpp', connection, {
			exitHandler: (_rval) => {
				process.nextTick(() => worker.terminate());
			}
		});
		const pty = ServicePseudoTerminal.create();
		apiService.registerCharacterDeviceDriver(pty, true);
		const terminal = window.createTerminal({ name: 'Run Ruby Program', pty: pty });
		terminal.show();
		apiService.signalReady();
	});

	commands.registerCommand('testbed-demo.php.runEditorContents', () => {
		const activeDocument = window.activeTextEditor?.document;
		if (activeDocument === undefined || activeDocument.languageId !== 'ruby') {
			return;
		}

		const filename = Uri.joinPath(context.extensionUri, './dist/web/phpWorker.js').toString();
		const worker = new Worker(filename);
		const connection = new ServiceConnection<Requests, ApiServiceConnection.ReadyParams>(worker);
		const apiService = new ApiService('cpp', connection, {
			exitHandler: (_rval) => {
				process.nextTick(() => worker.terminate());
			}
		});
		const pty = ServicePseudoTerminal.create();
		apiService.registerCharacterDeviceDriver(pty, true);
		const terminal = window.createTerminal({ name: 'Run Ruby Program', pty: pty });
		terminal.show();
		apiService.signalReady();
	});
}

export function deactivate() {
}
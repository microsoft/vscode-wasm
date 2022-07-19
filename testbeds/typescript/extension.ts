/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { commands, ExtensionContext, Uri } from 'vscode';
import { APIRequests, ApiService } from 'vscode-sync-api-service';
import { ServiceConnection } from 'vscode-sync-rpc/browser';

let apiService: ApiService;
let connection: ServiceConnection<APIRequests>;

export async function activate(context: ExtensionContext) {

	commands.registerCommand('testbed-typescript.run', () => {
		const worker = new Worker(Uri.joinPath(context.extensionUri, './dist/worker.js').toString());
		connection = new ServiceConnection<APIRequests>(worker);
		apiService = new ApiService('TypeScript', connection, (_rval) => {
			worker.terminate();
		});
		connection.signalReady();
	});
}

export function deactivate() {
}

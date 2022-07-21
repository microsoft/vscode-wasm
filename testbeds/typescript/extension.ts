/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { APIRequests, ApiService } from 'vscode-sync-api-service';
import { ServiceConnection } from 'vscode-sync-rpc/browser';


export async function activate(context: vscode.ExtensionContext) {

	const worker = new Worker(vscode.Uri.joinPath(context.extensionUri, './dist/worker.js').toString());

	// create a separate message channel for the sync-rpc communication
	// post the message port to the worker and use the default channel (postMessage, onmessage)
	// for "normal" communication
	const syncChannel = new MessageChannel();
	worker.postMessage(syncChannel.port2, [syncChannel.port2])

	const connection = new ServiceConnection<APIRequests>(syncChannel.port1);
	new ApiService('TypeScript', connection, (_rval) => worker.terminate());
	connection.signalReady();

	context.subscriptions.push(new vscode.Disposable(() => worker.terminate()))

	vscode.commands.registerCommand('testbed-typescript.run', (arg) => {
		let uri: vscode.Uri | undefined;
		if (arg instanceof vscode.Uri) {
			uri = arg;
		} else {
			uri = vscode.window.activeTextEditor?.document.uri
		}
		if (uri) {
			worker.postMessage(vscode.workspace.asRelativePath(uri));
		}
	});
}

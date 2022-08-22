/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { parentPort  } from 'worker_threads';

import { ClientConnection } from '@vscode/sync-api-common/node';
import { ApiClient, APIRequests } from '@vscode/sync-api-client';
import path from 'path';

if (parentPort === null) {
	process.exit();
}

const connection = new ClientConnection<APIRequests>(parentPort);
connection.serviceReady().then(() => {
	const client = new ApiClient(connection);
	const workspaceFolders = client.vscode.workspace.workspaceFolders;
	const folder = workspaceFolders[0];
	client.vscode.workspace.fileSystem.readFile(folder.uri.with( { path: path.join(folder.uri.path, 'test.txt') }));
}).catch(console.error);
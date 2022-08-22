/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import path from 'path';
import { parentPort  } from 'worker_threads';

import RAL, { ClientConnection } from '@vscode/sync-api-common/node';
import { ApiClient, APIRequests } from '@vscode/sync-api-client';
import assert from 'assert';

if (parentPort === null) {
	process.exit();
}

const connection = new ClientConnection<APIRequests>(parentPort);
const client = new ApiClient(connection);
connection.serviceReady().then(() => {
	const workspaceFolders = client.vscode.workspace.workspaceFolders;
	const folder = workspaceFolders[0];
	const content = RAL().TextDecoder.create().decode(client.vscode.workspace.fileSystem.readFile(folder.uri.with( { path: path.join(folder.uri.path, 'test.txt') })));
	assert.strictEqual(content, 'test conttent');
	client.process.procExit(0);
}).catch((error) => {
	console.error(error);
	client.process.procExit(1);
});
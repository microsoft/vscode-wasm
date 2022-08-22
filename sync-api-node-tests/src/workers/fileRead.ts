/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import path from 'path';
import { parentPort  } from 'worker_threads';
import assert from 'assert';

import RAL, { ClientConnection } from '@vscode/sync-api-common/node';
import { ApiClient, APIRequests } from '@vscode/sync-api-client';
import { TestRequests } from '../testSupport';

if (parentPort === null) {
	process.exit();
}

const connection = new ClientConnection<APIRequests | TestRequests>(parentPort);
const client = new ApiClient(connection);
connection.serviceReady().then(() => {
	debugger;
	const workspaceFolders = client.vscode.workspace.workspaceFolders;
	const folder = workspaceFolders[0];
	const content = RAL().TextDecoder.create().decode(client.vscode.workspace.fileSystem.readFile(folder.uri.with( { path: path.join(folder.uri.path, 'test.txt') })));
	assert.strictEqual(content, 'test conttent');
	client.process.procExit(0);
}).catch((error: Error) => {
	connection.sendRequest('testing/setMessage', { message: error.message });
	client.process.procExit(1);
});
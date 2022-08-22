/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import path from 'path';
import vscode from 'vscode';

import { Worker } from 'worker_threads';
import { APIRequests, ApiService } from '@vscode/sync-api-service';
import { ServiceConnection } from '@vscode/sync-api-common/node';

import { TestRequests } from './testSupport';

function getFolder(): vscode.WorkspaceFolder {
	const folders = vscode.workspace.workspaceFolders;
	assert.ok(folders);
	const folder = folders[0];
	assert.ok(folder);
	return folder;
}

suite('API Tests', () => {

	test('File access', async () => {
		const folder = getFolder();
		const fileUri = folder.uri.with( { path: path.join(folder.uri.path, 'test.txt') });
		vscode.workspace.fs.writeFile(fileUri, Buffer.from('test content'));

		const worker = new Worker(path.join(__dirname, './workers/fileRead.js'));
		const connection = new ServiceConnection<APIRequests | TestRequests>(worker);
		connection.onRequest('testing/setMessage', (params) => {
			console.error(params.message);
			return { errno: 0 };
		});
		const errno = await new Promise<number>((resolve) => {
			new ApiService('File access', connection, (rval) => {
				worker.terminate().catch(console.error);
				resolve(rval);
			});
			connection.signalReady();
		});
		assert.strictEqual(errno, 0);
	});
});
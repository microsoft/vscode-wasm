/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert, { AssertionError } from 'assert';
import path from 'path';
import vscode from 'vscode';

import { Worker } from 'worker_threads';
import { APIRequests, ApiService } from '@vscode/sync-api-service';
import { ServiceConnection } from '@vscode/sync-api-common/node';

import { AssertionErrorData, ErrorData, TestRequests } from './tests';

function getFolder(): vscode.WorkspaceFolder {
	const folders = vscode.workspace.workspaceFolders;
	assert.ok(folders);
	const folder = folders[0];
	assert.ok(folder);
	assert.strictEqual(folder.uri.scheme, 'file');
	return folder;
}

async function runTest(name: string, filename: string) {
	const worker = new Worker(path.join(__dirname, filename));
	const connection = new ServiceConnection<APIRequests | TestRequests>(worker);

	let assertionError: AssertionErrorData | undefined;
	let error: ErrorData | undefined;

	connection.onRequest('testing/assertionError', (params) => {
		assertionError = params;
		return { errno: 0 };
	});
	connection.onRequest('testing/error', (params) => {
		error = params;
		return { errno: 0 };
	});

	const errno = await new Promise<number>((resolve) => {
		new ApiService(name, connection, (rval) => {
			worker.terminate().catch(console.error);
			resolve(rval);
		});
		connection.signalReady();
	});
	if (assertionError !== undefined) {
		throw new AssertionError(assertionError);
	}
	if (error !== undefined) {
		throw new Error(error.message);
	}
	assert.strictEqual(errno, 0);
}

suite('API Tests', () => {
	test('File access', async () => {
		const folder = getFolder();
		const textFile = path.join(folder.uri.fsPath, 'test.txt');
		const fileUri = vscode.Uri.file(textFile);
		await vscode.workspace.fs.writeFile(fileUri, Buffer.from('test content'));
		await runTest('File access', './workers/fileRead.js');
	});
});
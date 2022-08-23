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
	const folder = getFolder();
	const textFile = path.join(folder.uri.fsPath, 'test.txt');
	const toDelete = path.join(folder.uri.fsPath, 'toDelete.txt');
	const directory = path.join(folder.uri.fsPath, 'directory');
	const entry1 = path.join(directory, 'entry1.txt');
	const entry2 = path.join(directory, 'entry2.txt');
	const entry3 = path.join(directory, 'entry3.txt');

	// Setting up test files in workspace
	suiteSetup(async () => {
		const fileSystem = vscode.workspace.fs;
		await fileSystem.writeFile(vscode.Uri.file(textFile), Buffer.from('test content'));
		await fileSystem.writeFile(vscode.Uri.file(toDelete), Buffer.from(''));
		await fileSystem.createDirectory(vscode.Uri.file(directory));
		await fileSystem.writeFile(vscode.Uri.file(entry1), Buffer.from(''));
		await fileSystem.writeFile(vscode.Uri.file(entry2), Buffer.from(''));
		await fileSystem.writeFile(vscode.Uri.file(entry3), Buffer.from(''));
	});

	test('File stat', async () => {
		await runTest('File access', './workers/fileStat.js');
	});

	test('File read', async () => {
		await runTest('File read', './workers/fileRead.js');
	});

	test('File rename', async () => {
		await runTest('File rename', './workers/fileRename.js');
		const newName = path.join(folder.uri.fsPath, 'testNew.txt');
		assert.doesNotThrow(async () => {
			await vscode.workspace.fs.stat(vscode.Uri.file(newName));
		});
	});

	test('File delete', async () => {
		await runTest('File delete', './workers/fileDelete.js');
		let notFound = false;
		try {
			await vscode.workspace.fs.stat(vscode.Uri.file(toDelete));
		} catch (error) {
			assert.ok(error instanceof vscode.FileSystemError);
			notFound = error.code === 'FileNotFound';
		}
		assert.strictEqual(notFound, true, 'File delete failed');
	});

	test('Directory stat', async () => {
		await runTest('Directory stat', './workers/dirStat.js');
	});

	test('Directory read', async () => {
		await runTest('Directory read', './workers/dirRead.js');
	});

	test('Directory rename', async () => {
		await runTest('Directory rename', './workers/dirRename.js');
		const newName = path.join(folder.uri.fsPath, 'directory_new');
		assert.doesNotThrow(async () => {
			await vscode.workspace.fs.stat(vscode.Uri.file(newName));
		});
	});

	test('Directory delete', async () => {
		await runTest('Directory delete', './workers/dirDelete.js');
		const dirToDelete = path.join(folder.uri.fsPath, 'directory_new');
		let notFound = false;
		try {
			await vscode.workspace.fs.stat(vscode.Uri.file(dirToDelete));
		} catch (error) {
			assert.ok(error instanceof vscode.FileSystemError);
			notFound = error.code === 'FileNotFound';
		}
		assert.strictEqual(notFound, true, 'Directory delete failed');
	});
});
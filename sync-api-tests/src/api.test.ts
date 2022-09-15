/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { posix as path } from 'path';
import vscode, { Uri } from 'vscode';

import { Requests, ApiService } from '@vscode/sync-api-service';
import { RAL } from '@vscode/sync-api-common';

import { AssertionErrorData, ErrorData, TestRequests } from './tests';

export function contribute(workerResolver: (testCase: string) => string, scheme: string): void {

	function getFolder(): vscode.WorkspaceFolder {
		const folders = vscode.workspace.workspaceFolders;
		assert.ok(folders);
		const folder = folders[0];
		assert.ok(folder);
		assert.strictEqual(folder.uri.scheme, scheme);
		return folder;
	}

	async function runTest(name: string, testCase: string) {

		const connection = RAL().$testing.ServiceConnection.create<Requests | TestRequests>(workerResolver(testCase));
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
				connection.terminate().catch(console.error);
				resolve(rval);
			});
			connection.signalReady();
		});
		if (assertionError !== undefined) {
			throw new assert.AssertionError(assertionError);
		}
		if (error !== undefined) {
			throw new Error(error.message);
		}
		assert.strictEqual(errno, 0);
	}

	function joinPath(uri: Uri, value: string): Uri {
		return uri.with({ path: path.join(uri.path, value) });
	}

	suite('API Tests', () => {
		const folder = getFolder();
		const textFile: Uri = joinPath(folder.uri, 'test.txt');
		const toDelete: Uri = joinPath(folder.uri, 'toDelete.txt');
		const directory: Uri = joinPath(folder.uri, 'directory');
		const entry1 = joinPath(directory, 'entry1.txt');
		const entry2 = joinPath(directory, 'entry2.txt');
		const entry3 = joinPath(directory, 'entry3.txt');

		const encoder = RAL().TextEncoder.create();
		const empty = encoder.encode('');

		// Setting up test files in workspace
		suiteSetup(async () => {
			const fileSystem = vscode.workspace.fs;
			await fileSystem.writeFile(textFile, encoder.encode('test content'));
			await fileSystem.writeFile(toDelete, empty);
			await fileSystem.createDirectory(directory);
			await fileSystem.writeFile(entry1, empty);
			await fileSystem.writeFile(entry2, empty);
			await fileSystem.writeFile(entry3, empty);
		});

		test('File stat', async () => {
			await runTest('File access', 'fileStat');
		});

		test('File read', async () => {
			await runTest('File read', 'fileRead');
		});

		test('File rename', async () => {
			await runTest('File rename', 'fileRename');
			const newName =  joinPath(folder.uri, 'testNew.txt');
			assert.doesNotThrow(async () => {
				await vscode.workspace.fs.stat(newName);
			});
		});

		test('File delete', async () => {
			await runTest('File delete', 'fileDelete');
			let notFound = false;
			try {
				await vscode.workspace.fs.stat(toDelete);
			} catch (error) {
				assert.ok(error instanceof vscode.FileSystemError);
				notFound = error.code === 'FileNotFound';
			}
			assert.strictEqual(notFound, true, 'File delete failed');
		});

		test('Directory stat', async () => {
			await runTest('Directory stat', 'dirStat');
		});

		test('Directory read', async () => {
			await runTest('Directory read', 'dirRead');
		});

		test('Directory rename', async () => {
			await runTest('Directory rename', 'dirRename');
			const newName = joinPath(folder.uri, 'directory_new');
			assert.doesNotThrow(async () => {
				await vscode.workspace.fs.stat(newName);
			});
		});

		test('Directory delete', async () => {
			await runTest('Directory delete', 'dirDelete');
			const dirToDelete = joinPath(folder.uri, 'directory_new');
			let notFound = false;
			try {
				await vscode.workspace.fs.stat(dirToDelete);
			} catch (error) {
				assert.ok(error instanceof vscode.FileSystemError);
				notFound = error.code === 'FileNotFound';
			}
			assert.strictEqual(notFound, true, 'Directory delete failed');
		});
	});
}
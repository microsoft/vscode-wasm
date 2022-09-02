/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import path from 'path';
import vscode, { Uri } from 'vscode';

import { APIRequests, ApiService } from '@vscode/sync-api-service';
import { RAL } from '@vscode/sync-api-common/';

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

		const connection = RAL().$testing.ServiceConnection.create<APIRequests | TestRequests>(workerResolver(testCase));
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

	suite('API Tests', () => {
		const folder = getFolder();
		const textFile: Uri = folder.uri.with({ path: path.posix.join(folder.uri.path, 'test.txt') });
		const toDelete: Uri = folder.uri.with({ path: path.posix.join(folder.uri.path, 'toDelete.txt') });
		const directory: Uri = folder.uri.with({ path: path.posix.join(folder.uri.path, 'directory') });
		const entry1 = directory.with({ path: path.posix.join(directory.path, 'entry1.txt') });
		const entry2 = directory.with({ path: path.posix.join(directory.path, 'entry2.txt') });
		const entry3 = directory.with({ path: path.posix.join(directory.path, 'entry3.txt') });

		const encoder = RAL().TextEncoder.create();
		const empty = encoder.encode('');

		// Setting up test files in workspace
		suiteSetup(async () => {
			const fileSystem = vscode.workspace.fs;
			console.log(textFile.toString(true));
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
			const newName = path.join(folder.uri.fsPath, 'testNew.txt');
			assert.doesNotThrow(async () => {
				await vscode.workspace.fs.stat(vscode.Uri.file(newName));
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
			const newName = path.join(folder.uri.fsPath, 'directory_new');
			assert.doesNotThrow(async () => {
				await vscode.workspace.fs.stat(vscode.Uri.file(newName));
			});
		});

		test('Directory delete', async () => {
			await runTest('Directory delete', 'dirDelete');
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
}
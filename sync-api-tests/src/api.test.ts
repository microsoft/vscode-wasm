/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { posix as path } from 'path';
import vscode, { Uri } from 'vscode';

import { Requests, ApiService, ApiServiceConnection, RAL } from '@vscode/sync-api-service';

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

	async function runTest(name: string, testCase: string, serviceHook?: (apiService: ApiService) => void) {

		const connection = RAL().$testing.ServiceConnection.create<Requests | TestRequests, ApiServiceConnection.ReadyParams>(workerResolver(testCase));
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
			const service = new ApiService(name, connection, {
				exitHandler: (rval) => {
					connection.terminate().catch(console.error);
					resolve(rval);
				}
			});
			if (serviceHook !== undefined) {
				serviceHook(service);
			}
			service.signalReady();
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
		const encoder = RAL().TextEncoder.create();
		const empty = encoder.encode('');

		let folder!: vscode.WorkspaceFolder;
		let textFile!: Uri;
		let toDelete!: Uri;
		let directory!: Uri;
		let entry1!: Uri;
		let entry2!: Uri;
		let entry3!: Uri;
		// Setting up test files in workspace
		suiteSetup(async () => {
			folder = getFolder();
			textFile = joinPath(folder.uri, 'test.txt');
			toDelete = joinPath(folder.uri, 'toDelete.txt');
			directory = joinPath(folder.uri, 'directory');
			entry1 = joinPath(directory, 'entry1.txt');
			entry2 = joinPath(directory, 'entry2.txt');
			entry3 = joinPath(directory, 'entry3.txt');
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

		test('Byte Sink', async() => {
			let writeReceived: boolean = false;
			await runTest('Byte Sink', 'byteSink', (service) => {
				service.registerByteSink({
					uri: Uri.from({ scheme: 'byteSink', authority: 'byteSink', path: '/write' }),
					write (bytes: Uint8Array): Promise<number> {
						if (RAL().TextDecoder.create().decode(bytes.slice()) === 'hello') {
							writeReceived = true;
						}
						return Promise.resolve(bytes.byteLength);
					}
				});
			});
			assert.strictEqual(writeReceived, true);
		});
	});
}
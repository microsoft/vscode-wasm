/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import path from 'path';
import vscode from 'vscode';

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
	});
});
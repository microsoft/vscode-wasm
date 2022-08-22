/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import path from 'path';
import assert from 'assert';
import RAL from '@vscode/sync-api-common/node';
import runSingle from './tests';

void runSingle(async (client, folder) => {
	const content = RAL().TextDecoder.create().decode(client.vscode.workspace.fileSystem.readFile(folder.uri.with( { path: path.join(folder.uri.path, 'test.txt') })));
	assert.strictEqual(content, 'test content');
});
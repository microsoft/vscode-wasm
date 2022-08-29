/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import * as assert from 'assert';
import { URI } from 'vscode-uri';
import RAL from '@vscode/sync-api-common/node';
import runSingle from './tests';

void runSingle((client, folder) => {
	const filename = path.join(folder.uri.fsPath, 'test.txt');
	const content = RAL().TextDecoder.create().decode(client.vscode.workspace.fileSystem.readFile(URI.file(filename)));
	assert.strictEqual(content, 'test content');
});
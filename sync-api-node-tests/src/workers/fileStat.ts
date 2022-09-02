/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as path from 'path';
import assert from 'assert';

import { URI } from 'vscode-uri';
import { FileType } from '@vscode/sync-api-client';
import runSingle from './tests';

runSingle((client, folder) => {
	const filename = path.join(folder.uri.fsPath, 'test.txt');
	const stat = client.vscode.workspace.fileSystem.stat(URI.file(filename));
	assert.strictEqual(stat.type, FileType.File);
	assert.strictEqual(stat.size, 12);
}).catch(console.error);

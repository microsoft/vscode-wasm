/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import path from 'path';
import assert from 'assert';
import { URI } from 'vscode-uri';
import { FileType } from '@vscode/sync-api-client';
import runSingle from './tests';

void runSingle((client, folder) => {
	const dirname = path.join(folder.uri.fsPath, 'directory');
	const stat = client.vscode.workspace.fileSystem.stat(URI.file(dirname));
	assert.strictEqual(stat.type, FileType.Directory);
});
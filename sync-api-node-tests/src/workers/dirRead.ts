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
	const dirname = path.join(folder.uri.fsPath, 'directory');
	const entries = client.vscode.workspace.fileSystem.readDirectory(URI.file(dirname));
	const valid = new Set<string>(['entry1.txt', 'entry2.txt', 'entry3.txt']);
	for (const entry of entries) {
		assert.ok(valid.has(entry[0]));
		assert.strictEqual(entry[1], FileType.File);
		valid.delete(entry[0]);
	}
	assert.strictEqual(valid.size, 0);
}).catch(console.error);
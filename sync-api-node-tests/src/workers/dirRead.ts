/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as _path from 'path';
const path = _path.posix;

import assert from 'assert';

import { FileType } from '@vscode/sync-api-client';
import runSingle from './tests';

runSingle((client, folder) => {
	const dirname = folder.uri.with( { path: path.join(folder.uri.path, 'directory') });
	const entries = client.vscode.workspace.fileSystem.readDirectory(dirname);
	const valid = new Set<string>(['entry1.txt', 'entry2.txt', 'entry3.txt']);
	for (const entry of entries) {
		assert.ok(valid.has(entry[0]));
		assert.strictEqual(entry[1], FileType.File);
		valid.delete(entry[0]);
	}
	assert.strictEqual(valid.size, 0);
}).catch(console.error);
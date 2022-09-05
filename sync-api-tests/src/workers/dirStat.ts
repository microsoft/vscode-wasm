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
	const stat = client.vscode.workspace.fileSystem.stat(dirname);
	assert.strictEqual(stat.type, FileType.Directory);
}).catch(console.error);

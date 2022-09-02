/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';

import { URI } from 'vscode-uri';
import runSingle from './tests';

runSingle((client, folder) => {
	const oldName = path.join(folder.uri.fsPath, 'test.txt');
	const newName = path.join(folder.uri.fsPath, 'testNew.txt');
	client.vscode.workspace.fileSystem.rename(URI.file(oldName), URI.file(newName));
}).catch(console.error);

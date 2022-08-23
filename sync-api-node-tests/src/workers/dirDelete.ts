/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import path from 'path';
import { URI } from 'vscode-uri';
import runSingle from './tests';

void runSingle((client, folder) => {
	const dirname = path.join(folder.uri.fsPath, 'directory_new');
	client.vscode.workspace.fileSystem.delete(URI.file(dirname), { recursive: true });
});
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import path from 'path';
import fs from 'fs';
import os from 'os';
import * as uuid from 'uuid';

import { runTests } from '@vscode/test-electron';

function rimraf(location: string) {
	const stat = fs.lstatSync(location);
	if (stat) {
		if (stat.isDirectory() && !stat.isSymbolicLink()) {
			for (const dir of fs.readdirSync(location)) {
				rimraf(path.join(location, dir));
			}

			fs.rmdirSync(location);
		}
		else {
			fs.unlinkSync(location);
		}
	}
}


async function go() {
	const testDir = path.join(os.tmpdir(), uuid.v4());
	try {
		const extensionDevelopmentPath = path.join(__dirname, '..', '..');
		const extensionTestsPath = __dirname;

		fs.mkdirSync(testDir, { recursive: true });
		const userDataDir = path.join(testDir, 'userData');
		fs.mkdirSync(userDataDir);
		const extensionDir = path.join(testDir, 'extensions');
		fs.mkdirSync(extensionDir);
		const workspaceFolder = path.join(testDir, 'workspace');
		fs.mkdirSync(workspaceFolder);
		console.log(workspaceFolder);

		/**
		 * Basic usage
		 */
		await runTests({
			version: 'insiders',
			extensionDevelopmentPath,
			extensionTestsPath,
			launchArgs: [
				'--user-data-dir', userDataDir,
				'--extensions-dir', extensionDir,
				'--enable-proposed-api', 'ms-vscode.sync-api-node-tests',
				workspaceFolder
			]
		});
	} catch (err) {
		console.error('Failed to run tests');
		process.exitCode = 1;
	} finally {
		rimraf(testDir);
	}
}

go().catch(console.error);
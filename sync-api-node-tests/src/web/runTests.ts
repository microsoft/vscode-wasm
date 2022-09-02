/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as uuid from 'uuid';

import { runTests } from '@vscode/test-web';

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
		fs.mkdirSync(testDir, { recursive: true });
		const extensionDevelopmentPath = path.resolve(__dirname, '..', '..');
		const extensionTestsPath = path.resolve(__dirname, '..', '..', 'dist', 'web', 'index.js');

		/**
		 * Basic usage
		 */
		await runTests({
			browserType: 'chromium',
			version: 'insiders',
			extensionDevelopmentPath,
			extensionTestsPath,
			folderPath: testDir,
			devTools: false,
			headless: true,
			coi: true
		});
	} catch (err) {
		console.error('Failed to run tests');
		process.exitCode = 1;
	} finally {
		rimraf(testDir);
	}
}

go().catch(console.error);
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import * as uuid from 'uuid';

import { runTests } from '@vscode/test-web';

async function main() {
	const testDir = path.join(os.tmpdir(), uuid.v4());
	try {
		await fs.mkdir(testDir, { recursive: true });
		const workspaceRoot = path.resolve(__dirname, '..', '..', '..', '..');
		const extensionDevelopmentPath = path.join(workspaceRoot, 'wasm-wasi-core');
		const extensionTestsPath = path.join(extensionDevelopmentPath, 'dist', 'web', 'test', 'index.js');

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
			// verbose: true,
			// printServerLog: true,
			coi: true
		});
	} catch (err) {
		console.error('Failed to run tests');
		process.exitCode = 1;
	} finally {
		fs.rm(testDir, { recursive: true }).catch(console.error);
	}
}

process.on('uncaughtException', (error: any) => {
	console.error(error);
});

main().catch(console.error);
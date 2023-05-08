/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';

import { runTests } from '@vscode/test-web';

async function go() {
	try {
		const workspaceRoot = path.resolve(__dirname, '..', '..', '..');
		const folderPath = path.join(workspaceRoot, 'sync-api-tests', '.vscode-test-workspace');
		const extensionDevelopmentPath = path.join(workspaceRoot, 'sync-api-tests');
		const extensionTestsPath = path.resolve(workspaceRoot, 'sync-api-tests', 'dist', 'web', 'index.js');

		/**
		 * Basic usage
		 */
		await runTests({
			browserType: 'chromium',
			version: 'insiders',
			extensionDevelopmentPath,
			extensionTestsPath,
			folderPath: folderPath,
			devTools: false,
			headless: true,
			// verbose: true,
			// printServerLog: true,
			coi: true
		});
	} catch (err) {
		console.error('Failed to run tests', err);
		process.exitCode = 1;
	}
}

process.on('uncaughtException', (error: any) => {
	console.error(error);
});

go().catch(console.error);
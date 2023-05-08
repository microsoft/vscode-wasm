/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import path from 'node:path';
import { runTests } from '@vscode/test-web';

async function main() {
	try {
		const workspaceRoot = path.resolve(__dirname, '..', '..', '..', '..');
		const extensionDevelopmentPath = path.join(workspaceRoot, 'wasm-wasi-core');
		const folderPath = path.join(workspaceRoot, 'wasm-wasi-core', '.vscode-test-workspace');
		const extensionTestsPath = path.join(extensionDevelopmentPath, 'dist', 'web', 'test', 'index.js');

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

main().catch(console.error);
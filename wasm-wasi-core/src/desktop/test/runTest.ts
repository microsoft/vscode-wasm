/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as path from 'node:path';
import * as os from 'node:os';
import * as fs from 'node:fs/promises';

import * as uuid from 'uuid';
import fp from 'find-process';

import { runTests } from '@vscode/test-electron';

async function main() {
	try {
		const extensionDevelopmentPath = path.resolve(__dirname, '../../../');
		const extensionTestsPath = path.resolve(__dirname, './index');

		const testDir = path.join(os.tmpdir(), uuid.v4());
		await fs.mkdir(testDir, { recursive: true });
		const userDataDir = path.join(testDir, 'userData');
		await fs.mkdir(userDataDir);
		const extensionDir = path.join(testDir, 'extensions');
		await fs.mkdir(extensionDir);
		const workspaceFolder = path.join(extensionDevelopmentPath, '.vscode-test-workspace');

		// Under Linux we quite often run the tests using Xvfb.
		// In case we have no display set and Xvfb is running use
		// the Xvfb display port as a DISPLAY setting
		let extensionTestsEnv: NodeJS.ProcessEnv | undefined = undefined;
		if (process.platform === 'linux' && !process.env['DISPLAY']) {
			let display: string | undefined;
			const processes = await fp('name', '/usr/bin/Xvfb');
			for (const item of processes) {
				if (item.name !== 'Xvfb') {
					continue;
				}
				if (item.cmd !== undefined && item.cmd.length > 0) {
					display = item.cmd.split(' ')[1];
				}
			}
			if (display !== undefined) {
				extensionTestsEnv = { 'DISPLAY': display };
			}
		}

		// Download VS Code, unzip it and run the integration test
		await runTests({
			version: 'insiders',
			extensionDevelopmentPath,
			extensionTestsPath,
			launchArgs: [
				'--user-data-dir', userDataDir,
				'--extensions-dir', extensionDir,
				'--enable-proposed-api', 'ms-vscode.wasm-wasi-core',
				workspaceFolder
			],
			extensionTestsEnv
		});
	} catch (err) {
		console.error('Failed to run tests', err);
		process.exit(1);
	}
}

main().catch(console.error);
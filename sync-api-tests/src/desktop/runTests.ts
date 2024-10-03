/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import fs from 'fs';
import os from 'os';
import path from 'path';
import * as uuid from 'uuid';
import find = require('find-process');

import { runTests } from '@vscode/test-electron';

function rimraf(location: string) {
	const stat = fs.lstatSync(location);
	if (stat) {
		if (stat.isDirectory() && !stat.isSymbolicLink()) {
			for (const dir of fs.readdirSync(location)) {
				rimraf(path.join(location, dir));
			}

			fs.rmSync(location, { recursive: true });
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

		// Under Linux we quite often run the tests using Xvfb.
		// In case we have no display set and Xvfb is running use
		// the Xvfb display port as a DISPLAY setting
		let extensionTestsEnv: NodeJS.ProcessEnv | undefined = undefined;
		if (process.platform === 'linux' && !process.env['DISPLAY']) {
			let display: string | undefined;
			const processes = await find('name', '/usr/bin/Xvfb');
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
				'--enable-proposed-api', 'ms-vscode.sync-api-tests',
				workspaceFolder
			],
			extensionTestsEnv
		});
	} catch (err) {
		console.error('Failed to run tests', err);
		process.exitCode = 1;
	} finally {
		rimraf(testDir);
	}
}
process.on('uncaughtException', (error: any) => {
	console.error(error);
});

go().catch(console.error);
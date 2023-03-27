/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RIL from '../ril';
RIL.install();


import { BrowserServiceConnection } from '../process';
import { createWorkspaceContent, createTmp, cleanupTmp, cleanupWorkspaceContent, createWasiService, WorkspaceContent } from '../../common/test/index';

export async function run(): Promise<void> {

	debugger;
	const workspaceContent = await createWorkspaceContent();

	await doRun(workspaceContent, true);
	try {
		await cleanupTmp(workspaceContent);
	} catch (err) {
		console.error(err);
	}
	await createTmp(workspaceContent);
	await doRun(workspaceContent, false);
	try {
		await cleanupWorkspaceContent(workspaceContent);
	} catch (err) {
		console.error(err);
	}
}

interface TestsDoneMessage {
	method: 'testsDone';
	failures: number;
}

async function doRun(workspaceContent: WorkspaceContent, shared: boolean): Promise<void> {
	const wasiService = createWasiService(workspaceContent);

	const workerURL = `http://localhost:3000/static/devextensions/dist/web/test/testWorker.js?vscode-coi=3${shared ? '&shared' : ''}`;
	const worker = new Worker(workerURL);
	return new Promise(async (resolve, reject) => {
		const connection = new BrowserServiceConnection(wasiService, worker, (message) => {
			if (message.method === 'testsDone') {
				const testsDoneMessage = message as TestsDoneMessage;
				if (testsDoneMessage.failures > 0) {
					reject(new Error(`${testsDoneMessage.failures} tests failed.`));
				} else {
					resolve();
				}
			}
			reject(new Error('Unexpected message: ' + JSON.stringify(message)));
		});
		await connection.workerReady();
	});
}
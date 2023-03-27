/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RIL from '../ril';
RIL.install();

import path from 'node:path';
import {  Worker } from 'node:worker_threads';

import { NodeServiceConnection } from '../process';
import { createWorkspaceContent, createTmp, cleanupTmp, cleanupWorkspaceContent, createWasiService, WorkspaceContent } from '../../common/test/index';

export async function run(): Promise<void> {

	const workspaceContent = await createWorkspaceContent();

	await doRun(['shared'], workspaceContent);
	try {
		await cleanupTmp(workspaceContent);
	} catch (err) {
		console.error(err);
	}
	await createTmp(workspaceContent);
	await doRun(['nonShared'], workspaceContent);
	try {
		await cleanupWorkspaceContent(workspaceContent);
	} catch (err) {
		console.error(err);
	}
}

async function doRun(argv: string[], workspaceContent: WorkspaceContent): Promise<void> {
	const wasiService = await createWasiService(workspaceContent);

	const worker = new Worker(path.join(__dirname, 'testWorker'), { argv: argv });
	const result = new Promise<void>((resolve) => {
		worker.once('exit', resolve);
	});
	const connection = new NodeServiceConnection(wasiService, worker);
	await connection.workerReady();
	await result;
}
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RIL from '../ril';
RIL.install();

import path from 'node:path';
import {  MessagePort, Worker } from 'node:worker_threads';

import { NodeServiceConnection } from '../process';
import { createWorkspaceContent, createTmp, cleanupTmp, cleanupWorkspaceContent, createWasiService, WorkspaceContent } from '../../common/test/index';
import { CapturedPromise, WorkerMessage } from '../../common/connection';
import { WasiService } from '../../common/service';
import { TestsDoneMessage } from '../../common/test/messages';

class TestNodeServiceConnection extends NodeServiceConnection {

	private readonly _testDone: CapturedPromise<void>;

	constructor(wasiService: WasiService, port: MessagePort | Worker) {
		super(wasiService, port);
		this._testDone = CapturedPromise.create<void>();
	}

	public testDone(): Promise<void> {
		return this._testDone.promise;
	}

	protected async handleMessage(message: WorkerMessage): Promise<void> {
		if (TestsDoneMessage.is(message)) {
			if (message.failures > 0) {
				this._testDone.reject(new Error(`${message.failures} tests failed.`));
			} else {
				this._testDone.resolve();
			}
		} else {
			return super.handleMessage(message);
		}
	}
}


export async function run(): Promise<void> {

	const workspaceContent = await createWorkspaceContent();

	try {
		await doRun(workspaceContent, true);
	} catch (error) {
		console.error(error);
	} finally {
		try {
			await cleanupTmp(workspaceContent);
		} catch (err) {
			console.error(err);
		}
	}
	try {
		await createTmp(workspaceContent);
		await doRun(workspaceContent, false);
	} catch (error) {
		console.error(error);
	} finally {
		try {
			await cleanupWorkspaceContent(workspaceContent);
		} catch (err) {
			console.error(err);
		}
	}
}

async function doRun(workspaceContent: WorkspaceContent, shared: boolean): Promise<void> {
	const wasiService = createWasiService(workspaceContent);

	const worker = new Worker(path.join(__dirname, 'testWorker'), { argv: [shared ? 'shared' : 'nonShared'] });
	const connection = new TestNodeServiceConnection(wasiService, worker);
	await connection.workerReady();
	await connection.testDone();
}
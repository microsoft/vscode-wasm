/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RIL from '../ril';
RIL.install();

import path from 'node:path';
import { MessagePort, Worker } from 'node:worker_threads';

import { glob } from 'glob';
import Mocha from 'mocha';

import { WorkerMessage } from '../../common/connection';
import { CapturedPromise } from '../../common/promises';
import { WasiService } from '../../common/service';
import { WorkspaceContent, cleanupTmp, cleanupWorkspaceContent, createTmp, createWasiService, createWorkspaceContent } from '../../common/test/index';
import { TestSetupMessage, TestsDoneMessage } from '../../common/test/messages';
import { NodeServiceConnection } from '../process';

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


export async function run(_testRoot: string): Promise<void> {

	const workspaceContent = await createWorkspaceContent();

	try {
		await doRunWorkerTests(workspaceContent, true);
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
		await doRunWorkerTests(workspaceContent, false);
	} catch (error) {
		console.error(error);
	} finally {
		try {
			await cleanupWorkspaceContent(workspaceContent);
		} catch (err) {
			console.error(err);
		}
	}

	const commonTestRoot = path.join(__dirname, '..', '..', 'common', 'test');
	const files = (await glob('**/**main.test.js', { cwd: commonTestRoot })).map(f => path.resolve(commonTestRoot, f));

	// Create the mocha test
	const mocha = new Mocha({
		ui: 'tdd',
		color: true
	});

	// Add files to the test suite
	files.forEach(f => mocha.addFile(f));
	return new Promise<void>((resolve, reject) => {
		mocha.run(failures => {
			if (failures > 0) {
				reject(new Error(`${failures} tests failed.`));
			} else {
				resolve();
			}
		});
	});
}

async function doRunWorkerTests(workspaceContent: WorkspaceContent, shared: boolean): Promise<void> {
	const wasiService = createWasiService(workspaceContent);

	const worker = new Worker(path.join(__dirname, 'testWorker'));
	const connection = new TestNodeServiceConnection(wasiService, worker);
	await connection.workerReady();
	const message: TestSetupMessage = { method: 'testSetup', shared, stats: workspaceContent.stats };
	connection.postMessage(message);
	await connection.testDone();
}
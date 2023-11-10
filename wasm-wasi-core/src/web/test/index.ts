/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RIL from '../ril';
RIL.install();


import { ConsoleMessage, TestSetupMessage, TestsDoneMessage } from '../../common/test/messages';
import { createWorkspaceContent, createTmp, cleanupTmp, cleanupWorkspaceContent, createWasiService, WorkspaceContent } from '../../common/test/index';
import { WasiService } from '../../common/service';
import { WorkerMessage } from '../../common/connection';
import { CapturedPromise } from '../../common/promises';

import { BrowserServiceConnection } from '../process';

export async function run(): Promise<void> {
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

	require('mocha/mocha');
	// Create the mocha test
	mocha.setup({
		ui: 'tdd',
		color: true,
		reporter: undefined
	});

	require('../../common/test/deviceDriver.main.test');

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

class TestBrowserServiceConnection extends BrowserServiceConnection {

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
		} else if (ConsoleMessage.is(message)) {
			console[message.severity](...message.args);
		} else {
			return super.handleMessage(message);
		}
	}
}

async function doRun(workspaceContent: WorkspaceContent, shared: boolean): Promise<void> {
	const wasiService = createWasiService(workspaceContent);

	const workerURL = 'http://localhost:3000/static/devextensions/dist/web/test/testWorker.js?vscode-coi=3';
	const worker = new Worker(workerURL);
	const connection = new TestBrowserServiceConnection(wasiService, worker);
	await connection.workerReady();
	const message: TestSetupMessage = { method: 'testSetup', shared, stats: workspaceContent.stats };
	connection.postMessage(message);
	return connection.testDone();
}
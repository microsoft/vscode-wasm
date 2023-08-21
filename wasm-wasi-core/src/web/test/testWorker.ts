/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RIL from '../ril';
RIL.install();

import { HostConnection } from '../../common/host';
import { ConsoleMessage, TestSetup, TestSetupMessage, TestsDoneMessage } from '../../common/test/messages';
import { BrowserHostConnection } from '../connection';
import TestEnvironment from '../../common/test/testEnvironment';
import { ServiceMessage } from '../../common/connection';
import { CapturedPromise } from '../../common/promises';


function warpConsoleMethod(hostConnection: HostConnection, severity: 'log' | 'info' | 'warn' | 'error'): void {
	Object.defineProperty(console, severity, {
		set: () => { },
		get: () => (...args: any[]) => {
			const message: ConsoleMessage = { method: 'console', severity, args };
			hostConnection.postMessage(message);
		}
	});
}

function warpConsole(hostConnection: HostConnection): void {
	warpConsoleMethod(hostConnection, 'log');
	warpConsoleMethod(hostConnection, 'info');
	warpConsoleMethod(hostConnection, 'warn');
	warpConsoleMethod(hostConnection, 'error');
}

class TestBrowserHostConnection extends BrowserHostConnection {

	private _testSetup: CapturedPromise<TestSetup>;

	public constructor(port: MessagePort | Worker | DedicatedWorkerGlobalScope) {
		super(port);
		this._testSetup = CapturedPromise.create<TestSetup>();
	}

	public testSetup(): Promise<TestSetup> {
		return this._testSetup.promise;
	}

	protected handleMessage(message: ServiceMessage): Promise<void> {
		if (TestSetupMessage.is(message)) {
			this._testSetup.resolve(Object.assign({}, message, { method: undefined }));
		}
		return Promise.resolve();
	}
}

async function run(): Promise<void> {
	const connection = new TestBrowserHostConnection(self);
	connection.postMessage({ method: 'workerReady'});
	const setup = await connection.testSetup();
	TestEnvironment.setup(connection, setup);
	warpConsole(connection);

	require('mocha/mocha');
	// Create the mocha test
	mocha.setup({
		ui: 'tdd',
		color: true,
		reporter: undefined
	});

	require('../../common/test/wasi.worker.test');

	mocha.run(failures => {
		const message: TestsDoneMessage = { method: 'testsDone', failures };
		connection.postMessage(message);
	});
}

run().catch(console.error);
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RIL from '../ril';
RIL.install();

import * as path from 'node:path';
import { MessagePort, parentPort, Worker } from 'node:worker_threads';

import Mocha from 'mocha';
import { glob } from 'glob';

import { TestSetup, TestSetupMessage, TestsDoneMessage } from '../../common/test/messages';
import TestEnvironment from '../../common/test/testEnvironment';
import { NodeHostConnection } from '../connection';
import { ServiceMessage } from '../../common/connection';
import { CapturedPromise } from '../../common/promises';

class TestNodeHostConnection extends NodeHostConnection {

	private _testSetup: CapturedPromise<TestSetup>;

	public constructor(port: MessagePort | Worker) {
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

	if (parentPort === null) {
		throw new Error('Test must run in a web worker');
	}

	const testsRoot = path.join(__dirname, '..', '..', 'common', 'test');
	const files = (await glob('**/**worker.test.js', { cwd: testsRoot })).map(f => path.resolve(testsRoot, f));

	const connection = new TestNodeHostConnection(parentPort);
	connection.postMessage({ method: 'workerReady' });
	const setup = await connection.testSetup();
	TestEnvironment.setup(connection, setup);

	// Create the mocha test
	const mocha = new Mocha({
		ui: 'tdd',
		color: true
	});

	// Add files to the test suite
	files.forEach(f => mocha.addFile(f));

	mocha.run(failures => {
		const message: TestsDoneMessage = { method: 'testsDone', failures };
		connection.postMessage(message);
	});
}

run().catch(console.error);
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RIL from '../ril';
RIL.install();

import * as path from 'node:path';
import { parentPort } from 'node:worker_threads';

import Mocha from 'mocha';
import glob from 'glob';

import { TestsDoneMessage } from '../../common/test/messages';
import TestEnvironment from '../../common/test/testEnvironment';
import { NodeHostConnection } from '../connection';

async function run(): Promise<void> {

	if (parentPort === null) {
		throw new Error('Test must run in a web worker');
	}

	const testsRoot = path.join(__dirname, '..', '..', 'common', 'test');
	const files = (await glob('**/**.test.js', { cwd: testsRoot })).map(f => path.resolve(testsRoot, f));

	const shared = process.argv[2] === 'shared';
	const connection = new NodeHostConnection(parentPort);
	TestEnvironment.setup(connection, shared);
	connection.postMessage({ method: 'workerReady' });

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
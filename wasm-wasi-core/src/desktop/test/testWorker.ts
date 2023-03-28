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

import { NodeHostConnection } from '../connection';
import TestEnvironment from '../../common/test/testEnvironment';

async function run(): Promise<void> {

	if (parentPort === null) {
		throw new Error('Test must run in a web worker');
	}

	debugger;

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

	return new Promise((c, e) => {
		// Run the mocha test
		mocha.run(failures => {
			if (failures > 0) {
				e(new Error(`${failures} tests failed.`));
			} else {
				c();
			}
		});
	});
}

run().catch(console.error);
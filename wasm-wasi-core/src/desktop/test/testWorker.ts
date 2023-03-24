/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RIL from '../ril';
RIL.install();

import * as path from 'path';
import Mocha from 'mocha';
import glob from 'glob';

async function run(): Promise<void> {

	const testsRoot = path.join(__dirname, '..', '..', 'common', 'test');
	const files = (await glob('**/**.test.js', { cwd: testsRoot })).map(f => path.resolve(testsRoot, f));

	RIL().$testing.sharedMemory = process.argv[2] === 'shared';

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
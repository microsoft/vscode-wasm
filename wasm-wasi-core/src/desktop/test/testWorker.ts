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
	let sharedError: any = undefined;
	let ownError: any = undefined;
	// try {
	// 	await doRun(files, true);
	// } catch (err) {
	// 	sharedError = err;
	// }
	try {
		await doRun(files, false);
	} catch (err) {
		ownError = err;
	}
	if (sharedError !== undefined) {
		throw sharedError;
	}
	if (ownError !== undefined) {
		throw ownError;
	}
}

async function doRun(files: string[], shared: boolean): Promise<void> {
	RIL().$testing.sharedMemory = shared;

	// Create the mocha test
	const mocha = new Mocha({
		ui: 'tdd',
		color: true
	});


	// Add files to the test suite
	files.forEach(f => mocha.addFile(f));

	return new Promise((c, e) => {
		try {
			// Run the mocha test
			mocha.run(failures => {
				if (failures > 0) {
					e(new Error(`${failures} tests failed.`));
				} else {
					c();
				}
			});
		} catch (err) {
			console.error(err);
			e(err);
		}
	});
}

run().catch(console.error);
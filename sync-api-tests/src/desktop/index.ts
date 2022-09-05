/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import path from 'path';
import Mocha from 'mocha';
import glob from 'glob';

export function run(testsRoot: string, cb: (error: any, failures?: number) => void): void {
	// Create the mocha test
	const mocha = new Mocha({
		ui: 'tdd',
		color: true
	});

	glob('**.test.js', { cwd: testsRoot }, (err, files) => {
		if (err) {
			return cb(err);
		}

		// Add files to the test suite
		files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

		try {
			// Run the mocha test
			mocha
				.run(failures => {
					cb(null, failures);
				});

		} catch (err) {
			cb(err);
		}
	});
}
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

require('mocha/mocha');

export function run(): Promise<void> {
	return new Promise((resolve, reject) => {
		// Create the mocha test
		mocha.setup({
			ui: 'tdd',
			color: true,
			reporter: undefined
		});

		require('./all.test');

		try {
			// Run the mocha test
			mocha.run(failures => {
				if (failures > 0) {
					reject(new Error(`${failures} tests failed.`));
				} else {
					resolve();
				}
			});
		} catch (error) {
			console.error(error);
			reject(error);
		}
	});
}
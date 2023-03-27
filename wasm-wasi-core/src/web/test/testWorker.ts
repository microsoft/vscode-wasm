/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RIL from '../ril';
RIL.install();

require('mocha/mocha');

function run(): void {
	debugger;

	RIL().$testing.sharedMemory = true;

	// Create the mocha test
	mocha.setup({
		ui: 'tdd',
		color: true,
		reporter: undefined
	});

	const tests = require('../../common/test/wasi.test');

	mocha.run(failures => {
		tests.hostConnection.postMessage({ method: 'testsDone', failures });
	});
}

try {
	run();
} catch (error) {
	console.error(error);
}
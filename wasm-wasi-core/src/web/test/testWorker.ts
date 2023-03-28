/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RIL from '../ril';
RIL.install();

import { HostConnection } from '../../common/host';
import { ConsoleMessage, TestsDoneMessage } from './messages';
import { BrowserHostConnection } from '../connection';
import TestEnvironment from '../../common/test/testEnvironment';


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

function run(): void {
	debugger;
	const connection = new BrowserHostConnection(self);
	TestEnvironment.setup(connection, true);
	warpConsole(connection);
	connection.postMessage({ method: 'workerReady'} );

	require('mocha/mocha');
	// Create the mocha test
	mocha.setup({
		ui: 'tdd',
		color: true,
		reporter: undefined
	});

	require('../../common/test/wasi.test');

	mocha.run(failures => {
		const message: TestsDoneMessage = { method: 'testsDone', failures };
		connection.postMessage(message);
	});
}

try {
	run();
} catch (error) {
	console.error(error);
}
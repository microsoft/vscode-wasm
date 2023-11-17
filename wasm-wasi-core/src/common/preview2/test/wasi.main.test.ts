/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { HostConnection, Options, WasiHost } from '../host';
import { Memory } from './memory';

suite('WasiWorker', () => {
	test('test', () => {
		const connection = new HostConnection();
		const options: Options = { encoding: 'utf-8' };
		let host = WasiHost.create(connection, options);
		let memory = new Memory();
		host.initialize(memory);
		const monotonic = host['wasi:clocks/monotonic-clock']!;
		monotonic['subscribe-duration'](10n);
	});
});
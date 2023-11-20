/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Memory } from '@vscode/wasm-component-model';
import { AbstractHostConnection, Options, WasiHost } from '../host';
import { Memory } from './memory';

class TestHostConnection extends AbstractHostConnection {
	constructor() {
		super();
	}

	protected doCall(paramMemory: SharedArrayBuffer, heapMemory: SharedArrayBuffer): void {

	}
}

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
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { HostConnection, WasiHost } from '../host';
import { Memory } from './memory';
import { TestSetup } from './messages';

namespace TestEnvironment {
	let _wasi: WasiHost | undefined;
	let _setup: TestSetup | undefined;
	export function setup(connection: HostConnection, setup: TestSetup): void {
		_wasi = WasiHost.create(connection);
		_setup = setup;
	}
	export function wasi(): WasiHost {
		if (_wasi === undefined) {
			throw new Error('TestEnvironment not initialized');
		}
		return _wasi;
	}

	export function createMemory(byteLength: number = 65536): Memory {
		if (_setup === undefined) {
			throw new Error('TestEnvironment not initialized');
		}
		const result = new Memory(byteLength, _setup.shared);
		_wasi?.initialize(result);
		return result;
	}

	export function qualifier(): string {
		if (_setup === undefined) {
			throw new Error('TestEnvironment not initialized');
		}
		return _setup.shared ? 'SharedArrayBuffer' : 'ArrayBuffer';
	}

	export function stats(): TestSetup['stats'] {
		if (_setup === undefined) {
			throw new Error('TestEnvironment not initialized');
		}
		return _setup?.stats;
	}
}

export default TestEnvironment;
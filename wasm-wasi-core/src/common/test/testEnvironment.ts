/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { HostConnection, WasiHost } from '../host';
import { Memory } from './memory';

namespace TestEnvironment {
	let _wasi: WasiHost | undefined;
	let _shared: boolean | undefined;
	export function setup(connection: HostConnection, shared: boolean): void {
		_wasi = WasiHost.create(connection);
		_shared = shared;
	}
	export function wasi(): WasiHost {
		if (_wasi === undefined) {
			throw new Error('TestEnvironment not initialized');
		}
		return _wasi;
	}

	export function createMemory(byteLength: number = 65536): Memory {
		if (_shared === undefined) {
			throw new Error('TestEnvironment not initialized');
		}
		const result = new Memory(byteLength, _shared);
		_wasi?.initialize(result);
		return result;
	}

	export function qualifier(): string {
		if (_shared === undefined) {
			throw new Error('TestEnvironment not initialized');
		}
		return _shared ? 'SharedArrayBuffer' : 'ArrayBuffer';
	}
}

export default TestEnvironment;
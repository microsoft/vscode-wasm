/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fs from 'fs';

import { WASI } from 'vscode-wasi';

void (async function main() {
	const binary = fs.readFileSync('./rust/target/wasm32-wasi/debug/minimal.wasm');
	const wasi = WASI.create(['Dirk', 'Bäumer'], { HOME: '/home/dbaeumer' });
	const { instance } = await WebAssembly.instantiate(binary, {
		wasi_snapshot_preview1: wasi
	});
	wasi.initialize((instance.exports.memory as WebAssembly.Memory).buffer);
	(instance.exports.main as Function)();
})();
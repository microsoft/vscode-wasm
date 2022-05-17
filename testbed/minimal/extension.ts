/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fs from 'fs';
import * as path from 'path';

import { ExtensionContext } from 'vscode';

import { WASI } from 'vscode-wasi/node';

const wasi = WASI.create('WASI Minimal Example', { argv: ['Dirk', 'Bäumer'], env: { HOME: '/home/dbaeumer' } });

export async function activate(context: ExtensionContext) {
	const wasmFile = path.join(context.extensionPath, './rust/target/wasm32-wasi/debug/minimal.wasm');
	const binary = fs.readFileSync(wasmFile);
	const { instance } = await WebAssembly.instantiate(binary, {
		wasi_snapshot_preview1: wasi
	});
	wasi.initialize((instance.exports.memory as WebAssembly.Memory).buffer);
	(instance.exports.main as Function)();
}

export function deactivate() {
}
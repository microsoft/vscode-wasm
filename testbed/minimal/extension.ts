/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fs from 'fs';
import * as path from 'path';

import { EventEmitter, ExtensionContext, window } from 'vscode';

import { WASI } from 'vscode-wasi/node';

const name = 'WASI Minimal Example';
const ptyWriteEmitter: EventEmitter<string> = new EventEmitter();
const terminal = window.createTerminal({ name, pty: {
	onDidWrite: ptyWriteEmitter.event,
	open: () => {
		ptyWriteEmitter.fire(`\x1b[31m${name}\x1b[0m\r\n\r\n`);
	},
	close: () => {
	},
	handleInput: (_data: string) => {
	}
}});
terminal.show();

export async function activate(context: ExtensionContext) {
	const wasi = WASI.create(name, { argv: ['Dirk', 'Bäumer'], env: { HOME: '/home/dbaeumer' }, ptyWriteEmitter });
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
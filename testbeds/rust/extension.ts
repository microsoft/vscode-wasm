/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import fs from 'node:fs/promises';
import path from 'node:path';

import { commands, ExtensionContext, window } from 'vscode';
import { Wasm } from '@vscode/wasm-wasi';


export async function activate(_context: ExtensionContext) {
	const wasm: Wasm = await Wasm.load();
	commands.registerCommand('testbed-rust.run', async () => {
		const pty = wasm.createPseudoterminal();
		const terminal = window.createTerminal({ name: 'Rust', pty, isTransient: true });
		terminal.show(true);
		const options = {
			stdio: pty.stdio,
			mapDir: true
		};
		const module = await WebAssembly.compile(await fs.readFile(path.join(__dirname, '..', 'target', 'wasm32-wasi', 'debug', 'rust-example.wasm')));
		const process = await wasm.createProcess('test-rust', module, options);
		process.run().catch(err => {
			void window.showErrorMessage(err.message);
		});
	});
}

export function deactivate() {
}
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import fs from 'node:fs/promises';
import path from 'node:path';

import { ProcessOptions, Wasm } from '@vscode/wasm-wasi';
import { ExtensionContext, commands, window } from 'vscode';


export async function activate(_context: ExtensionContext) {
	const wasm: Wasm = await Wasm.load();
	commands.registerCommand('testbed-rust.run', async () => {
		const pty = wasm.createPseudoterminal();
		const terminal = window.createTerminal({ name: 'Rust', pty, isTransient: true });
		terminal.show(true);
		const options: ProcessOptions = {
			stdio: pty.stdio,
			mountPoints: [ { kind: 'workspaceFolder'} ]
		};
		const module = await WebAssembly.compile(await fs.readFile(path.join(__dirname, '..', 'target', 'wasm32-wasip1', 'debug', 'rust-example.wasm')));
		const process = await wasm.createProcess('test-rust', module, options);
		process.run().catch(err => {
			void window.showErrorMessage(err.message);
		});
	});
}

export function deactivate() {
}
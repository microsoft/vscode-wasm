/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import fs from 'node:fs/promises';
import path from 'node:path';

import { commands, ExtensionContext, window } from 'vscode';
import { WasiCore, api } from '@vscode/wasm-wasi';


export async function activate(_context: ExtensionContext) {
	const wasiCore: WasiCore = await api();
	commands.registerCommand('testbed-cpp.run', async () => {
		const pty = wasiCore.createPseudoterminal();
		const terminal = window.createTerminal({ name: 'threads', pty, isTransient: true });
		terminal.show(true);
		const options = {
			stdio: pty.stdio,
			mapDir: true
		};
		const module = await WebAssembly.compile(await fs.readFile(path.join(__dirname, 'hello.wasm')));
		const process = await wasiCore.createProcess('threads', module, options);
		process.run().catch(err => {
			void window.showErrorMessage(err.message);
		});
	});
}

export function deactivate() {
}
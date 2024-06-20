/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import fs from 'node:fs/promises';
import path from 'node:path';

import { ProcessOptions, Wasm } from '@vscode/wasm-wasi/v1';
import { commands, ExtensionContext, window } from 'vscode';

export async function activate(_context: ExtensionContext) {
	const wasm: Wasm = await Wasm.load();
	commands.registerCommand('testbed-cpp.run', async () => {
		const pty = wasm.createPseudoterminal();
		const terminal = window.createTerminal({ name: 'CPP', pty, isTransient: true });
		terminal.show(true);
		const rootFileSystem = await wasm.createRootFileSystem([
			{ kind: 'workspaceFolder' }
		]);
		const options: ProcessOptions = {
			stdio: pty.stdio,
			rootFileSystem
		};
		const module = await WebAssembly.compile(await fs.readFile(path.join(__dirname, 'hello.wasm')));
		const process = await wasm.createProcess('test-cpp', module, options);
		process.run().catch(err => {
			void window.showErrorMessage(err.message);
		});
	});
}

export function deactivate() {
}
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import fs from 'node:fs/promises';
import path from 'node:path';

import { commands, ExtensionContext, Uri, window } from 'vscode';
import { WasiCore, api, Options } from '@vscode/wasm-wasi';

export async function activate(_context: ExtensionContext) {
	const wasiCore: WasiCore = await api();
	async function run(fileToRun?: string): Promise<void> {
		const pty = wasiCore.createPseudoterminal();
		const terminal = window.createTerminal({ name: 'Python - Repl', pty, isTransient: true });
		terminal.show(true);
		const options: Options = {
			stdio: pty.stdio,
			mapDir: {
				folders: true,
				entries: [
					{
						vscode_fs: Uri.file(path.join(path.sep, 'home', 'dirkb', 'bin', 'wasm', 'Python-3.11.0')),
						mountPoint: path.posix.sep
					}
				]
			},
			env: {
 				PYTHONPATH: '/workspace'
 			},
			args: fileToRun !== undefined ? ['-X', 'utf8', fileToRun] : ['-X', 'utf8']
		};
		const filename = path.join(path.sep, 'home', 'dirkb', 'bin', 'wasm', 'Python-3.11.0', 'python.wasm');
		const bits = await fs.readFile(filename);
		const module = await WebAssembly.compile(bits);
		const process = await wasiCore.createProcess('python', module, options);
		process.run().catch(err => {
			void window.showErrorMessage(err.message);
		});
	}

	commands.registerCommand('testbed-python.runInteractive', async () => {
		await run();
	});
}

export function deactivate() {
}
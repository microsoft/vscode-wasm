/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import fs from 'node:fs/promises';
import path from 'node:path';

import { commands, ExtensionContext, Uri, window } from 'vscode';
import { Wasm, ProcessOptions } from '@vscode/wasm-wasi';

export async function activate(_context: ExtensionContext) {
	const wasm: Wasm = await Wasm.api();
	async function run(name: string, fileToRun?: Uri): Promise<void> {
		const pty = wasm.createPseudoterminal();
		const terminal = window.createTerminal({ name, pty, isTransient: true });
		terminal.show(true);
		const options: ProcessOptions = {
			stdio: pty.stdio,
			mapDir: {
				folders: true,
				entries: [
					{
						vscode_fs: Uri.file(path.join(path.sep, 'home', 'dirkb', 'bin', 'wasm', 'Python-3.11.3', 'lib')),
						mountPoint: path.posix.join(path.posix.sep, 'usr', 'local', 'lib')
					}
				]
			},
			env: {
 				PYTHONPATH: '/workspace'
 			},
			args: fileToRun !== undefined ? ['-X', 'utf8', fileToRun] : ['-X', 'utf8']
		};
		const filename = path.join(path.sep, 'home', 'dirkb', 'bin', 'wasm', 'Python-3.11.3', 'python.wasm');
		const bits = await fs.readFile(filename);
		const module = await WebAssembly.compile(bits);
		const process = await wasm.createProcess('python', module, options);
		process.run().catch(err => {
			void window.showErrorMessage(err.message);
		});
	}

	commands.registerCommand('testbed-python.runFile', async () => {
		const editor = window.activeTextEditor;
		if (editor === undefined) {
			return;
		}
		const document = editor.document;
		if (document.languageId !== 'python') {
			return;
		}

		await run(`Python File`, document.uri);
	});
	commands.registerCommand('testbed-python.runInteractive', async () => {
		await run(`Python Repl`);
	});
}

export function deactivate() {
}
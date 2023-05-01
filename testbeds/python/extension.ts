/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import fs from 'node:fs/promises';

import { commands, ExtensionContext, Uri, window } from 'vscode';
import { Wasm, ProcessOptions } from '@vscode/wasm-wasi';

export async function activate(context: ExtensionContext) {
	const wasm: Wasm = await Wasm.api();
	async function run(name: string, fileToRun?: Uri): Promise<void> {
		const pty = wasm.createPseudoterminal();
		const terminal = window.createTerminal({ name, pty, isTransient: true });
		terminal.show(true);
		const channel = window.createOutputChannel('Python WASM Trace', { log: true });
		channel.show(true);
		channel.info(`Running ${name}...`);
		const options: ProcessOptions = {
			stdio: pty.stdio,
			mapDir: [
				{ kind: 'workspaceFolder' },
				{ kind: 'extensionLocation', extension: context, path: 'wasm/lib/python3.11', mountPoint: '/usr/local/lib/python3.11' }
			],
			env: {
 				PYTHONPATH: '/workspace'
 			},
			args: fileToRun !== undefined ? ['-X', 'utf8', fileToRun] : ['-X', 'utf8'],
			trace: channel
		};
		const filename = context.asAbsolutePath('wasm/python.wasm');
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
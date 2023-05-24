/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import fs from 'node:fs/promises';
import path from 'node:path';

import { commands, ExtensionContext, window } from 'vscode';
import { Wasm, ProcessOptions } from '@vscode/wasm-wasi';

export async function activate(_context: ExtensionContext) {
	const wasm: Wasm = await Wasm.load();

	commands.registerCommand('testbed-php.runFile', async () => {
		const editor = window.activeTextEditor;
		if (editor === undefined) {
			return;
		}
		const document = editor.document;
		if (document.languageId !== 'php') {
			return;
		}

		const pty = wasm.createPseudoterminal();
		const terminal = window.createTerminal({ name: 'PHP', pty, isTransient: true });
		terminal.show(true);
		const options: ProcessOptions = {
			stdio: pty.stdio,
			mountPoints: [
				{ kind: 'workspaceFolder' }
			],
			args: [document.uri]
		};
		const filename = path.join(path.sep, 'home', 'dirkb', 'bin', 'wasm', 'php-cgi.wasm');
		const bits = await fs.readFile(filename);
		const module = await WebAssembly.compile(bits);
		const process = await wasm.createProcess('php-cgi', module, options);
		process.run().catch(err => {
			void window.showErrorMessage(err.message);
		});
	});
}

export function deactivate() {
}
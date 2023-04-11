/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import fs from 'node:fs/promises';
import path from 'node:path';

import { commands, ExtensionContext, window } from 'vscode';

import { Wasm } from '@vscode/wasm-wasi';

export async function activate(_context: ExtensionContext) {

	const wasm: Wasm = await Wasm.api();

	commands.registerCommand('vscode-wasm-wasi-c-example.run', async () => {
		const pty = wasm.createPseudoterminal();
		const terminal = window.createTerminal({ name: 'Run C Example', pty, isTransient: true });
		terminal.show(true);
		const module = await WebAssembly.compile(await fs.readFile(path.join(__dirname, 'hello.wasm')));
		const process = await wasm.createProcess('hello', module, { stdio: pty.stdio });
		await process.run();
	});
}

export function deactivate() {
}
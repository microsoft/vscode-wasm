/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ExtensionContext, commands, window } from 'vscode';

import { Wasm } from '@vscode/wasm-wasi';

export async function activate(_context: ExtensionContext): Promise<void> {
	const wasm: Wasm = await Wasm.api();
	commands.registerCommand('ms-vscode.webshell.create', async () => {
		const pty = wasm.createPseudoterminal();
		const terminal = window.createTerminal({ name: 'wesh', pty, isTransient: true });
		terminal.show(true);
		pty.write('$ ');
		const line = await pty.readline();
		pty.write(line);
	});
}

export function deactivate(): Promise<void> {
	return Promise.resolve();
}
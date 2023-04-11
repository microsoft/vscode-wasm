/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { commands, window } from 'vscode';
import { WasiCore, api } from '@vscode/wasm-wasi';
import { binary } from './wasm';

export async function activate() {
	const wasiCore: WasiCore = await api();
	commands.registerCommand('testbed-threads.run', async () => {
		const pty = wasiCore.createPseudoterminal();
		const terminal = window.createTerminal({ name: 'threads', pty, isTransient: true });
		terminal.show(true);
		const options = {
			stdio: pty.stdio,
			mapDir: true
		};
		// options.stdio.out = { kind: 'file', path: '/workspace/out.txt' };
		// options.stdio.out = { kind: 'pipe' };
		const process = await wasiCore.createProcess('threads', WebAssembly.compile(binary.buffer), { initial: 2, maximum: 160, shared: true }, options);
		// const decoder = new TextDecoder();
		// process.stdout!.onData(data => {
		// 	console.log('stdout', decoder.decode(data));
		// });
		process.run().catch(err => {
			window.showErrorMessage(err.message);
		});
	});
}

export function deactivate() {
}
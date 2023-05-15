/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { commands, window } from 'vscode';
import { Wasm, ProcessOptions } from '@vscode/wasm-wasi';
import { binary } from './wasm';

export async function activate() {
	const wasm: Wasm = await Wasm.api();
	commands.registerCommand('testbed-threads.run', async () => {
		const pty = wasm.createPseudoterminal();
		const terminal = window.createTerminal({ name: 'threads', pty, isTransient: true });
		terminal.show(true);
		const options: ProcessOptions = {
			stdio: pty.stdio,
			mountPoints: [
				{ kind: 'workspaceFolder' }
			],
		};
		// options.stdio.out = { kind: 'file', path: '/workspace/out.txt' };
		// options.stdio.out = { kind: 'pipe' };
		const process = await wasm.createProcess('threads', WebAssembly.compile(binary.buffer), { initial: 2, maximum: 160, shared: true }, options);
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
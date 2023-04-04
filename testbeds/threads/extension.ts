/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { commands, extensions, window } from 'vscode';
import { WasiCore } from './wasiCore';
import { binary } from './wasm';

export async function activate() {
	const wasiCoreExt = extensions.getExtension('ms-vscode.wasm-wasi-core');
	if (wasiCoreExt === undefined) {
		window.showErrorMessage('The WASI core extension is required to run this testbed.');
		return;
	}

	const wasiCore: WasiCore =  await wasiCoreExt.activate();
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
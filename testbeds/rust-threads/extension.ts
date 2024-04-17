/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { commands, ExtensionContext, Uri, window, workspace } from 'vscode';
import { Wasm, ProcessOptions } from '@vscode/wasm-wasi';

export async function activate(context: ExtensionContext) {
	const wasm: Wasm = await Wasm.load();
	commands.registerCommand('testbed-rust-threads.run', async () => {
		const pty = wasm.createPseudoterminal();
		const terminal = window.createTerminal({ name: 'Rust', pty, isTransient: true });
		terminal.show(true);
		const options: ProcessOptions = {
			stdio: pty.stdio,
			mountPoints: [ { kind: 'workspaceFolder' } ]
		};
		const filename = Uri.joinPath(context.extensionUri, 'target', 'wasm32-wasi-preview1-threads', 'debug', 'rust-threads.wasm');
		const module = await WebAssembly.compile(await workspace.fs.readFile(filename));
		const process = await wasm.createProcess('test-rust', module, { initial: 17, maximum: 17, shared: true }, options);
		process.run().catch(err => {
			void window.showErrorMessage(err.message);
		});
	});
}

export function deactivate() {
}
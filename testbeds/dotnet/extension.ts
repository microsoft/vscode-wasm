/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { commands, ExtensionContext, window, Uri, workspace } from 'vscode';
import { Wasm, ProcessOptions } from '@vscode/wasm-wasi';

export async function activate(context: ExtensionContext) {
	const wasm: Wasm = await Wasm.load();

	commands.registerCommand('testbed-dotnet.runFile', async () => {
		const pty = wasm.createPseudoterminal();
		const terminal = window.createTerminal({ name: 'Dotnet', pty, isTransient: true });
		terminal.show(true);
		const options: ProcessOptions = {
			stdio: pty.stdio,
			mountPoints: [
				{ kind: 'workspaceFolder' },
				{ kind: 'vscodeFileSystem', uri: Uri.joinPath(context.extensionUri, 'tmp'), mountPoint: '/tmp' }
			],
			trace: true
		};
		const filename = Uri.joinPath(context.extensionUri, 'wasm', 'tempDir.wasm');
		const bits = await workspace.fs.readFile(filename);
		const module = await WebAssembly.compile(bits);
		const process = await wasm.createProcess('dotnet', module, options);
		process.run().catch(err => {
			void window.showErrorMessage(err.message);
		});
	});
}

export function deactivate() {
}
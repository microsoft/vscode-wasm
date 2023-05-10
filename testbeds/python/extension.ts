/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { commands, ExtensionContext, Uri, window, workspace } from 'vscode';
import { Wasm, ProcessOptions, MountPointDescriptor, Stdio } from '@vscode/wasm-wasi';

export async function activate(context: ExtensionContext) {
	const wasm: Wasm = await Wasm.api();
	async function run(name: string, fileToRun?: Uri): Promise<void> {
		const pty = wasm.createPseudoterminal();
		const terminal = window.createTerminal({ name, pty, isTransient: true });
		terminal.show(true);
		const channel = window.createOutputChannel('Python WASM Trace', { log: true });
		channel.info(`Running ${name}...`);
		const options: ProcessOptions = {
			stdio: pty.stdio,
			mountPoints: [
				{ kind: 'workspaceFolder' },
				{ kind: 'extensionLocation', extension: context, path: 'wasm/lib', mountPoint: '/usr/local/lib/python3.11' }
			],
			env: {
 				PYTHONPATH: '/workspace'
 			},
			args: fileToRun !== undefined ? ['-B', '-X', 'utf8', fileToRun] : ['-B', '-X', 'utf8'],
			trace: true
		};
		const filename = Uri.joinPath(context.extensionUri, 'wasm', 'bin', 'python.wasm');
		const bits = await workspace.fs.readFile(filename);
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
	commands.registerCommand('testbed-python.webshell.python', async (_command: string, args: string[], _cwd: string, stdio: Stdio, mountPoints?: MountPointDescriptor[] | undefined): Promise<number> => {
		const options: ProcessOptions = {
			stdio,
			mountPoints: (mountPoints ??[]).concat([
				{ kind: 'workspaceFolder' },
				{ kind: 'extensionLocation', extension: context, path: 'wasm/lib', mountPoint: '/usr/local/lib/python3.11' }
			]),
			env: {
 				PYTHONPATH: '/workspace'
 			},
			args: ['-B', '-X', 'utf8', ...args],
			trace: true
		};
		const filename = Uri.joinPath(context.extensionUri, 'wasm', 'bin', 'python.wasm');
		const bits = await workspace.fs.readFile(filename);
		const module = await WebAssembly.compile(bits);
		const process = await wasm.createProcess('python', module, options);
		const result = await process.run();
		return result;
	});
}

export function deactivate() {
}
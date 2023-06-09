/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { commands, ExtensionContext, Uri, window, workspace } from 'vscode';
import { Wasm, ProcessOptions, Stdio, RootFileSystem } from '@vscode/wasm-wasi';

export async function activate(context: ExtensionContext) {
	const wasm: Wasm = await Wasm.load();
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
				{ kind: 'extensionLocation', extension: context, path: 'wasm/lib', mountPoint: '/usr/local/lib/python3.12' }
			],
			env: {
 				PYTHONPATH: '/workspace'
 			},
			args: fileToRun !== undefined ? ['-B', '-X', 'utf8', fileToRun] : ['-B', '-X', 'utf8'],
			trace: true
		};
		try {
			const filename = Uri.joinPath(context.extensionUri, 'wasm', 'bin', 'python.wasm');
			const bits = await workspace.fs.readFile(filename);
			const module = await WebAssembly.compile(bits);
			const process = await wasm.createProcess('python', module, options);
			await process.run();
		} catch (err: any) {
			void pty.write(`Launching python failed: ${err.toString()}`);
		}
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
	commands.registerCommand('testbed-python.webshell.python', async (_command: string, args: string[], cwd: string, stdio: Stdio, rootFileSystem: RootFileSystem): Promise<number> => {
		// WASI doesn't support the concept of an initial working directory.
		// So we need to make file paths absolute.
		// See https://github.com/WebAssembly/wasi-filesystem/issues/24
		const optionsWithArgs = new Set(['-c', '-m', '-W', '-X', '--check-hash-based-pycs']);
		for (let i = 0; i < args.length; i++) {
			const arg = args[i];
			if (optionsWithArgs.has(arg)) {
				const next = args[i + 1];
				if (next !== undefined && !next.startsWith('-')) {
					i++;
					continue;
				}
			} else if (arg.startsWith('-')) {
				continue;
			} else if (!arg.startsWith('/')) {
				args[i] = `${cwd}/${arg}`;
			}
		}
		const options: ProcessOptions = {
			stdio,
			rootFileSystem,
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
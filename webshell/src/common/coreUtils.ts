/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { ExtensionContext, Uri } from 'vscode';

import RAL from './ral';
import { HandlerTarget } from './types';
import { Wasm, WasmPseudoterminal } from '@vscode/wasm-wasi';

let _coreutils: Promise<WebAssembly.Module> | undefined;
function coreutils(context: ExtensionContext): Promise<WebAssembly.Module> {
	if (!_coreutils) {
		_coreutils = RAL().coreUtils.load(context);
	}
	return _coreutils;
}

async function executeWithFileSystem(context: ExtensionContext, wasm: Wasm, pty: WasmPseudoterminal, needsNewLine: boolean, command: string, args: string[], cwd: string, addCwd: boolean = false): Promise<number> {
	const module = await coreutils(context);
	const path = RAL().path;
	let fileFound: boolean = false;
	const newArgs = args.map((arg) => {
		if (arg.startsWith('-')) {
			return arg;
		} else {
			fileFound = true;
			return path.isAbsolute(arg) ? arg : path.join(cwd, arg);
		}

	});
	newArgs.unshift(command);
	if (!fileFound && addCwd) {
		newArgs.push(cwd);
	}
	const process = await wasm.createProcess('coreutils', module, {
		stdio: pty.stdio, args: newArgs,
		mapDir: {
			folders: true,
			entries: [
				{
					vscode_fs: Uri.file(path.join(path.sep, 'home', 'dirkb', 'bin', 'wasm', 'Python-3.11.3', 'lib', 'python3.11')),
					mountPoint: path.join(path.sep, 'usr', 'local', 'lib', 'python3.11')
				}
			]
		}
	});

	const result = await process.run();
	if (needsNewLine) {
		await pty.write('\r\n');
	}
	return result;
}

async function executeWithoutFileSystem(context: ExtensionContext, wasm: Wasm, pty: WasmPseudoterminal, command: string, args: string[]): Promise<number> {
	const module = await coreutils(context);
	const newArgs = [command].concat(args);
	const process = await wasm.createProcess('coreutils', module, { stdio: pty.stdio, args: newArgs });
	const result = await process.run();
	return result;
}

export function contributeHandlers(context: ExtensionContext, wasm: Wasm, target: HandlerTarget): void {
	target.registerCommandHandler('basenc', async (pty, command, args, cwd) => {
		return executeWithFileSystem(context, wasm, pty, true, command, args, cwd);
	});
	target.registerCommandHandler('cat', async (pty, command, args, cwd) => {
		return executeWithFileSystem(context, wasm, pty, true, command, args, cwd);
	});
	target.registerCommandHandler('comm', async (pty, command, args, cwd) => {
		return executeWithFileSystem(context, wasm, pty, false, command, args, cwd);
	});
	target.registerCommandHandler('cp', async (pty, command, args, cwd) => {
		return executeWithFileSystem(context, wasm, pty, false, command, args, cwd);
	});
	target.registerCommandHandler('date', async (pty, command, args, _cwd) => {
		return executeWithoutFileSystem(context, wasm, pty, command, args);
	});
	target.registerCommandHandler('dir', async (pty, command, args, cwd) => {
		return executeWithFileSystem(context, wasm, pty, false, command, args, cwd, true);
	});
	target.registerCommandHandler('echo', async (pty, command, args, _cwd) => {
		return executeWithoutFileSystem(context, wasm, pty, command, args);
	});
	target.registerCommandHandler('expand', async (pty, command, args, cwd) => {
		return executeWithFileSystem(context, wasm, pty, true, command, args, cwd);
	});
	target.registerCommandHandler('factor', async (pty, command, args, _cwd) => {
		return executeWithoutFileSystem(context, wasm, pty, command, args);
	});
	target.registerCommandHandler('head', async (pty, command, args, cwd) => {
		return executeWithFileSystem(context, wasm, pty, true, command, args, cwd);
	});
	target.registerCommandHandler('ls', async (pty, command, args, cwd) => {
		return executeWithFileSystem(context, wasm, pty, false, command, args, cwd, true);
	});
	target.registerCommandHandler('mkdir', async (pty, command, args, cwd) => {
		return executeWithFileSystem(context, wasm, pty, false, command, args, cwd);
	});
	target.registerCommandHandler('mv', async (pty, command, args, cwd) => {
		return executeWithFileSystem(context, wasm, pty, false, command, args, cwd);
	});
	target.registerCommandHandler('printenv', async (pty, command, args, _cwd) => {
		return executeWithoutFileSystem(context, wasm, pty, command, args);
	});
	target.registerCommandHandler('realpath', async (pty, command, args, cwd) => {
		return executeWithFileSystem(context, wasm, pty, false, command, args, cwd);
	});
	target.registerCommandHandler('rm', async (pty, command, args, cwd) => {
		return executeWithFileSystem(context, wasm, pty, false, command, args, cwd);
	});
	target.registerCommandHandler('rmdir', async (pty, command, args, cwd) => {
		return executeWithFileSystem(context, wasm, pty, false, command, args, cwd);
	});
	target.registerCommandHandler('sleep', async (pty, command, args, _cwd) => {
		return executeWithoutFileSystem(context, wasm, pty, command, args);
	});
	target.registerCommandHandler('tail', async (pty, command, args, cwd) => {
		return executeWithFileSystem(context, wasm, pty, true, command, args, cwd);
	});
	target.registerCommandHandler('touch', async (pty, command, args, cwd) => {
		return executeWithFileSystem(context, wasm, pty, false, command, args, cwd);
	});
	target.registerCommandHandler('unexpand', async (pty, command, args, cwd) => {
		return executeWithFileSystem(context, wasm, pty, true, command, args, cwd);
	});
	target.registerCommandHandler('unlink', async (pty, command, args, cwd) => {
		return executeWithFileSystem(context, wasm, pty, false, command, args, cwd);
	});
	target.registerCommandHandler('vdir', async (pty, command, args, cwd) => {
		return executeWithFileSystem(context, wasm, pty, false, command, args, cwd, true);
	});
	target.registerCommandHandler('wc', async (pty, command, args, cwd) => {
		return executeWithFileSystem(context, wasm, pty, false, command, args, cwd);
	});
}
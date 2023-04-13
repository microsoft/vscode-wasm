/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { ExtensionContext } from 'vscode';

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

async function executeWithFileSystem(context: ExtensionContext, wasm: Wasm, pty: WasmPseudoterminal, needsNewLine: boolean, command: string, args: string[], cwd: string): Promise<number> {
	const module = await coreutils(context);
	const path = RAL().path;
	const newArgs = args.map((arg) => {
		return arg.startsWith('-') ? arg : path.isAbsolute(arg) ? arg : path.join(cwd, arg);

	});
	newArgs.unshift(command);
	const process = await wasm.createProcess('coreutils', module, { stdio: pty.stdio, args: newArgs, mapDir: true });
	const result = await process.run();
	if (needsNewLine) {
		pty.write('\r\n');
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
	target.registerCommandHandler('cat', async (pty, command, args, cwd) => {
		return executeWithFileSystem(context, wasm, pty, true, command, args, cwd);
	});
	target.registerCommandHandler('date', async (pty, command, args, _cwd) => {
		return executeWithoutFileSystem(context, wasm, pty, command, args);
	});
	target.registerCommandHandler('echo', async (pty, command, args, _cwd) => {
		return executeWithoutFileSystem(context, wasm, pty, command, args);
	});
}
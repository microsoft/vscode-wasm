/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { ExtensionContext, Uri } from 'vscode';

import RAL from './ral';
import { HandlerTarget } from './types';
import { MapDirDescriptor, Wasm, WasmPseudoterminal } from '@vscode/wasm-wasi';

export class CoreUtils {

	private readonly context: ExtensionContext;
	private coreUtils: Promise<WebAssembly.Module> | undefined;

	constructor(context: ExtensionContext) {
		this.context = context;
	}

	public contributeHandlers(wasm: Wasm, target: HandlerTarget): void {
		target.registerCommandHandler('basenc', async (pty, command, args, cwd, mapDir) => {
			return this.executeWithFileSystem(wasm, pty, true, command, args, cwd, false, mapDir);
		});
		target.registerCommandHandler('cat', async (pty, command, args, cwd, mapDir) => {
			return this.executeWithFileSystem(wasm, pty, true, command, args, cwd, false, mapDir);
		});
		target.registerCommandHandler('comm', async (pty, command, args, cwd, mapDir) => {
			return this.executeWithFileSystem(wasm, pty, false, command, args, cwd, false, mapDir);
		});
		target.registerCommandHandler('cp', async (pty, command, args, cwd, mapDir) => {
			return this.executeWithFileSystem(wasm, pty, false, command, args, cwd, false, mapDir);
		});
		target.registerCommandHandler('date', async (pty, command, args, _cwd, _mapDir) => {
			return this.executeWithoutFileSystem(wasm, pty, command, args);
		});
		target.registerCommandHandler('dir', async (pty, command, args, cwd, mapDir) => {
			return this.executeWithFileSystem(wasm, pty, false, command, args, cwd, true, mapDir);
		});
		target.registerCommandHandler('echo', async (pty, command, args, _cwd, _mapDir) => {
			return this.executeWithoutFileSystem(wasm, pty, command, args);
		});
		target.registerCommandHandler('expand', async (pty, command, args, cwd, mapDir) => {
			return this.executeWithFileSystem(wasm, pty, true, command, args, cwd, false, mapDir);
		});
		target.registerCommandHandler('factor', async (pty, command, args, _cwd, _mapDir) => {
			return this.executeWithoutFileSystem(wasm, pty, command, args);
		});
		target.registerCommandHandler('head', async (pty, command, args, cwd, mapDir) => {
			return this.executeWithFileSystem(wasm, pty, true, command, args, cwd, false, mapDir);
		});
		target.registerCommandHandler('ls', async (pty, command, args, cwd, mapDir) => {
			return this.executeWithFileSystem(wasm, pty, false, command, args, cwd, true, mapDir);
		});
		target.registerCommandHandler('mkdir', async (pty, command, args, cwd, mapDir) => {
			return this.executeWithFileSystem(wasm, pty, false, command, args, cwd, false, mapDir);
		});
		target.registerCommandHandler('mv', async (pty, command, args, cwd, mapDir) => {
			return this.executeWithFileSystem(wasm, pty, false, command, args, cwd, false, mapDir);
		});
		target.registerCommandHandler('printenv', async (pty, command, args, _cwd, _mapDir) => {
			return this.executeWithoutFileSystem(wasm, pty, command, args);
		});
		target.registerCommandHandler('realpath', async (pty, command, args, cwd, mapDir) => {
			return this.executeWithFileSystem(wasm, pty, false, command, args, cwd, false, mapDir);
		});
		target.registerCommandHandler('rm', async (pty, command, args, cwd, mapDir) => {
			return this.executeWithFileSystem(wasm, pty, false, command, args, cwd, false, mapDir);
		});
		target.registerCommandHandler('rmdir', async (pty, command, args, cwd, mapDir) => {
			return this.executeWithFileSystem(wasm, pty, false, command, args, cwd, false, mapDir);
		});
		target.registerCommandHandler('sleep', async (pty, command, args, _cwd, _mapDir) => {
			return this.executeWithoutFileSystem(wasm, pty, command, args);
		});
		target.registerCommandHandler('tail', async (pty, command, args, cwd, mapDir) => {
			return this.executeWithFileSystem(wasm, pty, true, command, args, cwd, false, mapDir);
		});
		target.registerCommandHandler('touch', async (pty, command, args, cwd, mapDir) => {
			return this.executeWithFileSystem(wasm, pty, false, command, args, cwd, false, mapDir);
		});
		target.registerCommandHandler('unexpand', async (pty, command, args, cwd, mapDir) => {
			return this.executeWithFileSystem(wasm, pty, true, command, args, cwd, false, mapDir);
		});
		target.registerCommandHandler('unlink', async (pty, command, args, cwd, mapDir) => {
			return this.executeWithFileSystem(wasm, pty, false, command, args, cwd, false, mapDir);
		});
		target.registerCommandHandler('vdir', async (pty, command, args, cwd, mapDir) => {
			return this.executeWithFileSystem(wasm, pty, false, command, args, cwd, true, mapDir);
		});
		target.registerCommandHandler('wc', async (pty, command, args, cwd, mapDir) => {
			return this.executeWithFileSystem(wasm, pty, false, command, args, cwd, false, mapDir);
		});
	}

	private getCoreUtils(): Promise<WebAssembly.Module> {
		if (this.coreUtils !== undefined) {
			return this.coreUtils;
		}
		const uri = Uri.joinPath(this.context.extensionUri, 'wasm', 'coreutils.wasm');
		this.coreUtils = RAL().webAssembly.compile(uri);
		return this.coreUtils;
	}

	private async executeWithFileSystem(wasm: Wasm, pty: WasmPseudoterminal, needsNewLine: boolean, command: string, args: string[], cwd: string, addCwd: boolean, mapDir: MapDirDescriptor[] | undefined): Promise<number> {
		const module = await this.getCoreUtils();
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
		const _mapDir: MapDirDescriptor[] = [ { kind: 'workspaceFolder'}, ...(mapDir ?? [])];
		const process = await wasm.createProcess('coreutils', module, {
			stdio: pty.stdio, args: newArgs,
			mapDir: _mapDir,
			trace: true
		});

		const result = await process.run();
		if (needsNewLine) {
			await pty.write('\r\n');
		}
		return result;
	}

	private async executeWithoutFileSystem(wasm: Wasm, pty: WasmPseudoterminal, command: string, args: string[]): Promise<number> {
		const module = await this.getCoreUtils();
		const newArgs = [command].concat(args);
		const process = await wasm.createProcess('coreutils', module, { stdio: pty.stdio, args: newArgs, trace: true });
		const result = await process.run();
		return result;
	}
}
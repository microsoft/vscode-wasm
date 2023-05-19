/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { ExtensionContext, Uri } from 'vscode';

import RAL from './ral';
import { HandlerTarget } from './types';
import { ProcessOptions, Stdio, Wasm, RootFileSystem } from '@vscode/wasm-wasi';

export class CoreUtils {

	private readonly context: ExtensionContext;
	private coreUtils: Promise<WebAssembly.Module> | undefined;

	constructor(context: ExtensionContext) {
		this.context = context;
	}

	public contributeHandlers(wasm: Wasm, target: HandlerTarget): void {
		target.registerCommandHandler('basenc', async (command, args, cwd, stdio, rootFileSystem) => {
			return this.executeWithFileSystem(wasm, command, args, cwd, false, stdio, rootFileSystem);
		});
		target.registerCommandHandler('cat', async (command, args, cwd, stdio, rootFileSystem) => {
			return this.executeWithFileSystem(wasm, command, args, cwd, false, stdio, rootFileSystem);
		});
		target.registerCommandHandler('comm', async (command, args, cwd, stdio, rootFileSystem) => {
			return this.executeWithFileSystem(wasm, command, args, cwd, false, stdio, rootFileSystem);
		});
		target.registerCommandHandler('cp', async (command, args, cwd, stdio, rootFileSystem) => {
			return this.executeWithFileSystem(wasm, command, args, cwd, false, stdio, rootFileSystem);
		});
		target.registerCommandHandler('date', async (command, args, _cwd, stdio, _rootFileSystem) => {
			return this.executeWithoutFileSystem(wasm, command, args, stdio);
		});
		target.registerCommandHandler('dir', async (command, args, cwd, stdio, rootFileSystem) => {
			return this.executeWithFileSystem(wasm, command, args, cwd, true, stdio, rootFileSystem);
		});
		target.registerCommandHandler('echo', async (command, args, _cwd, stdio, _rootFileSystem) => {
			return this.executeWithoutFileSystem(wasm, command, args, stdio);
		});
		target.registerCommandHandler('expand', async (command, args, cwd, stdio, rootFileSystem) => {
			return this.executeWithFileSystem(wasm, command, args, cwd, false, stdio, rootFileSystem);
		});
		target.registerCommandHandler('factor', async (command, args, _cwd, stdio, _rootFileSystem) => {
			return this.executeWithoutFileSystem(wasm, command, args, stdio);
		});
		target.registerCommandHandler('head', async (command, args, cwd, stdio, rootFileSystem) => {
			return this.executeWithFileSystem(wasm, command, args, cwd, false, stdio, rootFileSystem);
		});
		target.registerCommandHandler('ls', async (command, args, cwd, stdio, rootFileSystem) => {
			return this.executeWithFileSystem(wasm, command, args, cwd, true, stdio, rootFileSystem);
		});
		target.registerCommandHandler('mkdir', async (command, args, cwd, stdio, rootFileSystem) => {
			return this.executeWithFileSystem(wasm, command, args, cwd, false, stdio, rootFileSystem);
		});
		target.registerCommandHandler('mv', async (command, args, cwd, stdio, rootFileSystem) => {
			return this.executeWithFileSystem(wasm, command, args, cwd, false, stdio, rootFileSystem);
		});
		target.registerCommandHandler('printenv', async (command, args, _cwd, stdio, _rootFileSystem) => {
			return this.executeWithoutFileSystem(wasm, command, args, stdio);
		});
		target.registerCommandHandler('realpath', async (command, args, cwd, stdio, rootFileSystem) => {
			return this.executeWithFileSystem(wasm, command, args, cwd, false, stdio, rootFileSystem);
		});
		target.registerCommandHandler('rm', async (command, args, cwd, stdio, rootFileSystem) => {
			return this.executeWithFileSystem(wasm, command, args, cwd, false, stdio, rootFileSystem);
		});
		target.registerCommandHandler('rmdir', async (command, args, cwd, stdio, rootFileSystem) => {
			return this.executeWithFileSystem(wasm, command, args, cwd, false, stdio, rootFileSystem);
		});
		target.registerCommandHandler('sleep', async (command, args, _cwd, stdio, _rootFileSystem) => {
			return this.executeWithoutFileSystem(wasm, command, args, stdio);
		});
		target.registerCommandHandler('tail', async (command, args, cwd, stdio, rootFileSystem) => {
			return this.executeWithFileSystem(wasm, command, args, cwd, false, stdio, rootFileSystem);
		});
		target.registerCommandHandler('touch', async (command, args, cwd, stdio, rootFileSystem) => {
			return this.executeWithFileSystem(wasm, command, args, cwd, false, stdio, rootFileSystem);
		});
		target.registerCommandHandler('unexpand', async (command, args, cwd, stdio, rootFileSystem) => {
			return this.executeWithFileSystem(wasm, command, args, cwd, false, stdio, rootFileSystem);
		});
		target.registerCommandHandler('unlink', async (command, args, cwd, stdio, rootFileSystem) => {
			return this.executeWithFileSystem(wasm, command, args, cwd, false, stdio, rootFileSystem);
		});
		target.registerCommandHandler('vdir', async (command, args, cwd, stdio, rootFileSystem) => {
			return this.executeWithFileSystem(wasm, command, args, cwd, true, stdio, rootFileSystem);
		});
		target.registerCommandHandler('wc', async (command, args, cwd, stdio, rootFileSystem) => {
			return this.executeWithFileSystem(wasm, command, args, cwd, false, stdio, rootFileSystem);
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

	private async executeWithFileSystem(wasm: Wasm, command: string, args: string[], cwd: string, addCwd: boolean, stdio: Stdio, rootFileSystem: RootFileSystem): Promise<number> {
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
		const options: ProcessOptions = {
			args: newArgs,
			stdio,
			rootFileSystem,
			trace: true
		};
		const process = await wasm.createProcess('coreutils', module, options);
		const result = await process.run();
		return result;
	}

	private async executeWithoutFileSystem(wasm: Wasm, command: string, args: string[], stdio: Stdio): Promise<number> {
		const module = await this.getCoreUtils();
		const newArgs = [command].concat(args);
		const process = await wasm.createProcess('coreutils', module, { stdio: stdio, args: newArgs, trace: true });
		const result = await process.run();
		return result;
	}
}
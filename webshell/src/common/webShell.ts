/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { window, Terminal, commands } from 'vscode';

import { ExtensionLocationDescriptor, MountPointDescriptor, MemoryFileSystem, Wasm, WasmPseudoterminal, Stdio, RootFileSystem, Filetype } from '@vscode/wasm-wasi';

import RAL from './ral';
const paths = RAL().path;
import { CommandHandler } from './types';
import { CommandMountPoint, WebShellContributions } from './webShellContributions';


type CommandLine = {
	command: string; args: string[];
};

export class WebShell {

	private static contributions: WebShellContributions;
	private static commandHandlers: Map<string, CommandHandler>;
	private static rootFs: RootFileSystem;
	private static userBin: MemoryFileSystem;

	public static async initialize(wasm: Wasm, contributions: WebShellContributions): Promise<void> {
		this.contributions = contributions;
		this.commandHandlers = new Map<string, CommandHandler>();
		this.userBin = await wasm.createInMemoryFileSystem();
		const fsContributions: ExtensionLocationDescriptor[] = WebShell.contributions.getDirectoryMountPoints().map(entry => ({ kind: 'extensionLocation', extension: entry.extension, path: entry.path, mountPoint: entry.mountPoint }));
		const mountPoints: MountPointDescriptor[] = [
			{ kind: 'workspaceFolder'},
			{ kind: 'inMemoryFileSystem', fileSystem: this.userBin, mountPoint: '/usr/bin' },
			...fsContributions
		];
		this.rootFs = await wasm.createRootFileSystem(mountPoints);
		for (const contribution of this.contributions.getCommandMountPoints()) {
			this.registerCommandContribution(contribution);
		}
		this.contributions.onChanged((event) => {
			for (const add of event.commands.added) {
				this.registerCommandContribution(add);
			}
			for (const remove of event.commands.removed) {
				this.unregisterCommandContribution(remove);
			}
		});
	}

	private static registerCommandContribution(contribution: CommandMountPoint): void {
		const basename = paths.basename(contribution.mountPoint);
		const dirname = paths.dirname(contribution.mountPoint);
		if (dirname === '/usr/bin') {
			this.registerCommandHandler(basename, async (command: string, args: string[], cwd: string, stdio: Stdio, rootFileSystem: RootFileSystem): Promise<number> => {
				await contribution.extension.activate();
				return commands.executeCommand<number>(contribution.command, command, args, cwd, stdio, rootFileSystem);
			});
		}
	}

	private static unregisterCommandContribution(contribution: CommandMountPoint): void {
		const basename = paths.basename(contribution.mountPoint);
		this.unregisterCommandHandler(basename);
	}

	public static registerCommandHandler(command: string, handler: CommandHandler): void {
		this.userBin.createFile(command, { size: 0n, reader: () => { throw new Error('No permissions'); }});
		this.commandHandlers.set(command, handler);
	}

	public static unregisterCommandHandler(command: string): void {
		this.commandHandlers.delete(command);
	}

	private readonly wasm: Wasm;
	private readonly pty: WasmPseudoterminal;
	private readonly terminal : Terminal;
	private readonly prompt;
	private cwd: string;

	constructor(wasm: Wasm, cwd: string, prompt: string = '$ ') {
		this.wasm = wasm;
		this.prompt = prompt;
		this.pty = this.wasm.createPseudoterminal({ history: true });
		this.terminal = window.createTerminal({ name: 'wesh', pty: this.pty, isTransient: true });
		this.terminal.show();
		this.cwd = cwd;
	}

	public async runCommandLoop(): Promise<void> {
		while (true) {
			void this.pty.prompt(this.getPrompt());
			const line = await this.pty.readline();
			const { command, args } = this.parseCommand(line);
			switch (command) {
				case 'exit':
					this.terminal.dispose();
					return;
				case 'pwd':
					void this.pty.write(`${this.cwd}\r\n`);
					break;
				case 'cd':
					await this.handleCd(args);
					break;
				default:
					const handler = WebShell.commandHandlers.get(command);
					if (handler !== undefined) {
						try {
							const result = await handler(command, args, this.cwd, this.pty.stdio, WebShell.rootFs);
							if (result !== 0) {
							}
						} catch (error: any) {
							const message = error.message ?? error.toString();
							void this.pty.write(`-wesh: executing ${command} failed: ${message}\r\n`);
						}
					} else {
						void this.pty.write(`-wesh: ${command}: command not found\r\n`);
					}
					break;
			}
		}
	}

	private async handleCd(args: string[]): Promise<void> {
		if (args.length > 1) {
			void this.pty.write(`-wesh: cd: too many arguments\r\n`);
			return;
		}
		const path = RAL().path;
		let target = args[0];
		if (!path.isAbsolute(target)) {
			target = path.join(this.cwd, target);
		}
		try {
			const stat = await WebShell.rootFs.stat(target);
			if (stat.filetype === Filetype.directory) {
				this.cwd = target;
				return;
			}
		} catch (error) {
			// Do nothing
		}
		await this.pty.write(`-wesh: cd: ${target}: No such file or directory\r\n`);
	}

	private parseCommand(line: string): CommandLine {
		if (line.endsWith('\n')) {
			line = line.slice(0, -1);
		}
		const items = line.split(' ');
		return { command: items[0], args: items.slice(1).map(arg => arg.trim()).filter(arg => arg.length > 0) };
	}

	private getPrompt(): string {
		return `\x1b[01;34m${this.cwd}\x1b[0m ${this.prompt}`;
	}
}
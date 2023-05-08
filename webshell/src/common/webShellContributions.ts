/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Event, EventEmitter, extensions as Extensions } from 'vscode';

export interface WebShellCommand {
	command: string;
	name: string;
}
namespace WebShellCommand {
	export function is(value: any): value is WebShellCommand {
		const candidate = value as WebShellCommand;
		return candidate && typeof candidate.command === 'string' && typeof candidate.name === 'string';
	}
}

export interface ChangeEvent {
	added: WebShellCommand[];
	removed: WebShellCommand[];
}

type WebShellFileSystem = string;

export interface WebShellContributions {
	readonly onChanged: Event<ChangeEvent>;
	getCommands(): WebShellCommand[];
	getFileSystems(): WebShellFileSystem[];
}

class WebShellContributionsImpl implements WebShellContributions {

	private webShellCommands: WebShellCommand[];
	private webShellFileSystems: WebShellFileSystem[];
	private readonly _onChanged: EventEmitter<ChangeEvent>;

	constructor() {
		this.webShellCommands = [];
		this.webShellFileSystems = [];
		this._onChanged = new EventEmitter<ChangeEvent>();
	}

	public get onChanged(): Event<ChangeEvent> {
		return this._onChanged.event;
	}

	public initialize(): void {
		const { commands, fileSystems } = this.parseExtensions();
		this.webShellCommands = commands;
		this.webShellFileSystems = fileSystems;
		Extensions.onDidChange(() => {
			this.handleExtensionsChanged();
		});
	}

	public getCommands(): WebShellCommand[] {
		return this.webShellCommands;
	}

	public getFileSystems(): WebShellFileSystem[] {
		return this.webShellFileSystems;
	}

	private parseExtensions(): { commands: WebShellCommand[]; fileSystems: WebShellFileSystem[] } {
		const result: { commands: WebShellCommand[]; fileSystems: WebShellFileSystem[] } = { commands: [], fileSystems: [] };
		for (const extension of Extensions.all) {
			const packageJSON = extension.packageJSON;
			const commands: WebShellCommand[] = packageJSON?.contributes?.webshell?.commands;
			if (commands !== undefined) {
				for (const command of commands) {
					if (WebShellCommand.is(command)) {
						result.commands.push(command);
					}
				}
			}
			const fileSystems: WebShellFileSystem[] = packageJSON?.contributes?.webshell?.fileSystems;
			if (fileSystems !== undefined) {
				for (const fileSystem of fileSystems) {
					if (typeof fileSystem === 'string') {
						result.fileSystems.push(fileSystem);
					}
				}
			}
		}
		return result;
	}

	private handleExtensionsChanged(): void {
		const oldCommands: Map<string, WebShellCommand> = new Map(this.webShellCommands.map(command => [command.command, command]));
		const { commands, fileSystems } = this.parseExtensions();
		this.webShellFileSystems = fileSystems;
		const newCommands: Map<string, WebShellCommand> = new Map(commands.map(command => [command.command, command]));
		const added: WebShellCommand[] = [];
		const removed: WebShellCommand[] = [];
		for (const [command, newCommand] of newCommands) {
			if (oldCommands.has(command)) {
				oldCommands.delete(command);
			} else {
				added.push(newCommand);
			}
		}
		for (const oldCommand of oldCommands.values()) {
			removed.push(oldCommand);
		}
		this.webShellCommands = Array.from(newCommands.values());
		this._onChanged.fire({ added, removed });
	}
}

export const WebShellContributions = new WebShellContributionsImpl();
WebShellContributions.initialize();
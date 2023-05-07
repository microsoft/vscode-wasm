/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Event, EventEmitter, extensions as Extensions } from 'vscode';

interface WebShellCommand {
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

export interface WebShellContributions {
	readonly onChanged: Event<ChangeEvent>;
	getCommands(): WebShellCommand[];
}

class WebShellContributionsImpl implements WebShellContributions {

	private webShellCommands: WebShellCommand[] = [];
	private readonly _onChanged: EventEmitter<ChangeEvent>;

	constructor() {
		this.webShellCommands = [];
		this._onChanged = new EventEmitter<ChangeEvent>();
	}

	public get onChanged(): Event<ChangeEvent> {
		return this._onChanged.event;
	}

	public initialize(): void {
		this.webShellCommands = this.parseWebShellCommands();
		Extensions.onDidChange(() => {
			this.handleExtensionsChanged();
		});
	}

	public getCommands(): WebShellCommand[] {
		return this.webShellCommands;
	}

	private parseWebShellCommands(): WebShellCommand[] {
		const result: WebShellCommand[] = [];
		for (const extension of Extensions.all) {
			const packageJSON = extension.packageJSON;
			const commands: WebShellCommand[] = packageJSON?.contributes?.webshell?.commands;
			if (commands !== undefined) {
				for (const command of commands) {
					if (WebShellCommand.is(command)) {
						result.push(command);
					}
				}
			}
		}
		return result;
	}

	private handleExtensionsChanged(): void {
		const oldCommands: Map<string, WebShellCommand> = new Map(this.webShellCommands.map(command => [command.command, command]));
		const newCommands: Map<string, WebShellCommand> = new Map(this.parseWebShellCommands().map(command => [command.command, command]));
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
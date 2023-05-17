/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Event, EventEmitter, Extension, extensions as Extensions, Uri } from 'vscode';

export interface CommandMountPointContribution {
	mountPoint: string;
	command: string;
}
export namespace CommandMountPointContribution {
	export function is(value: object): value is CommandMountPointContribution {
		const candidate = value as CommandMountPointContribution;
		return candidate && typeof candidate.command === 'string' && typeof candidate.mountPoint === 'string';
	}
}
export interface CommandMountPoint extends CommandMountPointContribution {
	extension: Extension<any>;
}

export interface DirectoryMountPointContribution {
	mountPoint: string;
	path: string;
}
export namespace DirectoryMountPointContribution {
	export function is(value: object): value is DirectoryMountPointContribution {
		const candidate = value as DirectoryMountPointContribution;
		return candidate && typeof candidate.path === 'string' && typeof candidate.mountPoint === 'string';
	}
}
export interface DirectoryMountPoint extends DirectoryMountPointContribution {
	extension: Extension<any>;
}


export interface ChangeEvent {
	commands: {
		added: CommandMountPoint[];
		removed: CommandMountPoint[];
	};
	directories: {
		added: DirectoryMountPoint[];
		removed: DirectoryMountPoint[];
	};
}

export interface WebShellContributions {
	readonly onChanged: Event<ChangeEvent>;
	getCommandMountPoints(): CommandMountPoint[];
	getDirectoryMountPoints(): DirectoryMountPoint[];
}

class WebShellContributionsImpl implements WebShellContributions {

	private commandMountPoints: CommandMountPoint[];
	private directoryMountPoints: DirectoryMountPoint[];
	private readonly _onChanged: EventEmitter<ChangeEvent>;

	constructor() {
		this.commandMountPoints = [];
		this.directoryMountPoints = [];
		this._onChanged = new EventEmitter<ChangeEvent>();
	}

	public get onChanged(): Event<ChangeEvent> {
		return this._onChanged.event;
	}

	public initialize(): void {
		const { commands, directories } = this.parseExtensions();
		this.commandMountPoints = commands;
		this.directoryMountPoints = directories;
		Extensions.onDidChange(() => {
			this.handleExtensionsChanged();
		});
	}

	public getCommandMountPoints(): CommandMountPoint[] {
		return this.commandMountPoints;
	}

	public getDirectoryMountPoints(): DirectoryMountPoint[] {
		return this.directoryMountPoints;
	}

	private parseExtensions(): { commands: CommandMountPoint[]; directories: DirectoryMountPoint[] } {
		const result: { commands: CommandMountPoint[]; directories: DirectoryMountPoint[] } = { commands: [], directories: [] };
		for (const extension of Extensions.all) {
			const packageJSON = extension.packageJSON;
			const mountPoints = packageJSON?.contributes?.webShellMountPoints;
			if (mountPoints !== undefined) {
				for (const mountPoint of mountPoints) {
					if (CommandMountPointContribution.is(mountPoint)) {
						result.commands.push(Object.assign({ extension }, mountPoint));
					} else if (DirectoryMountPointContribution.is(mountPoint)) {
						result.directories.push(Object.assign({}, mountPoint, { extension }));
					}
				}
			}
		}
		return result;
	}

	private handleExtensionsChanged(): void {
		const { commands, directories } = this.parseExtensions();

		const oldCommands: Map<string, CommandMountPoint> = new Map(this.commandMountPoints.map(command => [command.command, command]));
		const newCommands: Map<string, CommandMountPoint> = new Map(commands.map(command => [command.command, command]));

		const addedCommands: CommandMountPoint[] = [];
		const removedCommands: CommandMountPoint[] = [];
		for (const [command, newCommand] of newCommands) {
			if (oldCommands.has(command)) {
				oldCommands.delete(command);
			} else {
				addedCommands.push(newCommand);
			}
		}
		for (const oldCommand of oldCommands.values()) {
			removedCommands.push(oldCommand);
		}

		const oldDirectories: Map<string, DirectoryMountPoint> = new Map(this.directoryMountPoints.map(directory => [Uri.joinPath(directory.extension.extensionUri, directory.path).toString(), directory]));
		const newDirectories: Map<string, DirectoryMountPoint> = new Map(directories.map(directory => [Uri.joinPath(directory.extension.extensionUri, directory.path).toString(), directory]));
		const addedDirectories: DirectoryMountPoint[] = [];
		const removedDirectories: DirectoryMountPoint[] = [];
		for (const [path, newDirectory] of newDirectories) {
			if (oldDirectories.has(path)) {
				oldDirectories.delete(path);
			} else {
				addedDirectories.push(newDirectory);
			}
		}
		for (const oldDirectory of oldDirectories.values()) {
			removedDirectories.push(oldDirectory);
		}

		this._onChanged.fire({ commands: { added: addedCommands, removed: removedCommands }, directories: { added: addedDirectories, removed: removedDirectories } });
	}
}

export const WebShellContributions = new WebShellContributionsImpl();
WebShellContributions.initialize();
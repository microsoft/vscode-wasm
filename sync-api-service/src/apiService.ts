/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';

import { RAL, ServiceConnection, Requests, DTOs, RPCErrno } from '@vscode/sync-api-common';

const terminalRegExp = /(\r\n)|(\n)/gm;

type ApiServiceConnection = ServiceConnection<Requests>;

class LineBuffer {

	private cursor: number;
	private content: string[];
	constructor() {
		this.cursor = 0;
		this.content = [];
	}

	public clear(): void {
		this.cursor = 0;
		this.content = [];
	}

	public getLine(): string {
		return this.content.join('');
	}

	public getCursor(): number {
		return this.cursor;
	}

	public isCursorAtEnd(): boolean {
		return this.cursor === this.content.length;
	}

	public isCursorAtBeginning(): boolean {
		return this.cursor === 0;
	}

	public insert(value: String) {
		for (const char of value) {
			this.content.splice(this.cursor, 0, char);
			this.cursor++;
		}
	}

	public del(): boolean {
		if (this.cursor === this.content.length) {
			return false;
		}
		this.content.splice(this.cursor, 1);
		return true;
	}

	public backspace(): boolean {
		if (this.cursor === 0) {
			return false;
		}
		this.cursor -= 1;
		this.content.splice(this.cursor, 1);
		return true;
	}

	public moveCursorRelative(characters: number): boolean {
		const newValue = this.cursor + characters;
		if (newValue < 0 || newValue > this.content.length) {
			return false;
		}
		this.cursor = newValue;
		return true;
	}

	public moveCursorStartOfLine(): boolean {
		if (this.cursor === 0) {
			return false;
		}
		this.cursor = 0;
		return true;
	}

	public moveCursorEndOfLine(): boolean {
		if (this.cursor === this.content.length) {
			return false;
		}
		this.cursor = this.content.length;
		return true;
	}

	public moveCursorWordLeft(): boolean {
		if (this.cursor === 0) {
			return false;
		}
		let index: number;
		// check if we are at the beginning of a word
		if (this.content[this.cursor - 1] === ' ') {
			index = this.cursor - 2;
			while (index > 0) {
				if (this.content[index] === ' ') {
					index--;
				} else {
					break;
				}
			}
		} else {
			index = this.cursor;
		}
		if (index === 0) {
			this.cursor = index;
			return true;
		}
		// On the first character that is not space
		while (index > 0) {
			if (this.content[index] === ' ') {
				index++;
				break;
			} else {
				index--;
			}
		}
		this.cursor = index;
		return true;
	}

	public moveCursorWordRight(): boolean {
		if (this.cursor === this.content.length) {
			return false;
		}
		let index: number;
		if (this.content[this.cursor] === ' ') {
			index = this.cursor + 1;
			while (index < this.content.length) {
				if (this.content[index] === ' ') {
					index++;
				} else {
					break;
				}
			}
		} else {
			index = this.cursor;
		}
		if (index === this.content.length) {
			this.cursor = index;
			return true;
		}

		while (index < this.content.length) {
			if (this.content[index] === ' ') {
				break;
			} else {
				index++;
			}
		}
		this.cursor = index;
		return true;
	}
}

export enum TerminalMode {
	idle = 1,
	inUse = 2
}

export interface ServicePseudoTerminal<D = any> extends vscode.Pseudoterminal {
	readonly onDidCtrlC: vscode.Event<void>;
	readonly onDidClose: vscode.Event<void>;
	readonly onAnyKey: vscode.Event<void>;

	setMode(mode: TerminalMode): void;
	setName(name: string): void;
	write(str: string): void;
	readline(): Promise<string>;
	data: D;
}

export namespace ServicePseudoTerminal {
	export function create<D = any>(mode: TerminalMode): ServicePseudoTerminal<D> {
		return new ServiceTerminalImpl(mode);
	}
}

class ServiceTerminalImpl implements ServicePseudoTerminal {

	private mode: TerminalMode;

	private readonly _onDidClose: vscode.EventEmitter<void>;
	private readonly _onDidWrite: vscode.EventEmitter<string>;
	private readonly _onDidChangeName: vscode.EventEmitter<string>;
	private readonly _onDidCtrlC: vscode.EventEmitter<void>;
	private readonly _onAnyKey: vscode.EventEmitter<void>;

	private lines: string[];
	private lineBuffer: LineBuffer;
	private readlineCallback: ((value: string ) => void) | undefined;

	private isOpen: boolean;
	private nameBuffer: string | undefined;
	private writeBuffer: string[] | undefined;

	public data: any;

	constructor(mode: TerminalMode) {
		this.mode = mode;

		this._onDidClose = new vscode.EventEmitter();
		this.onDidClose = this._onDidClose.event;
		this._onDidWrite = new vscode.EventEmitter<string>();
		this.onDidWrite = this._onDidWrite.event;
		this._onDidChangeName = new vscode.EventEmitter<string>;
		this.onDidChangeName = this._onDidChangeName.event;
		this._onDidCtrlC = new vscode.EventEmitter<void>;
		this.onDidCtrlC = this._onDidCtrlC.event;
		this._onAnyKey = new vscode.EventEmitter<void>;
		this.onAnyKey = this._onAnyKey.event;

		this.lines = [];
		this.lineBuffer = new LineBuffer();

		this.isOpen = false;
	}

	public readonly onDidClose: vscode.Event<void>;

	public readonly onDidWrite: vscode.Event<string>;

	public readonly onDidChangeName: vscode.Event<string>;

	public readonly onDidCtrlC: vscode.Event<void>;

	public readonly onAnyKey: vscode.Event<void>;

	public setMode(mode: TerminalMode): void {
		this.mode = mode;
	}

	public setName(name: string): void {
		if (this.isOpen) {
			this._onDidChangeName.fire(name);
		} else {
			this.nameBuffer = name;
		}
	}

	public open(): void {
		this.isOpen = true;
		if (this.nameBuffer !== undefined) {
			this._onDidChangeName.fire(this.nameBuffer);
			this.nameBuffer = undefined;
		}
		if (this.writeBuffer !== undefined) {
			for (const item of this.writeBuffer) {
				this._onDidWrite.fire(item);
			}
			this.writeBuffer = undefined;
		}
	}

	public close(): void {
		this._onDidClose.fire();
	}

	public readline(): Promise<string> {
		if (this.readlineCallback !== undefined) {
			throw new Error(`Already in readline mode`);
		}
		if (this.lines.length > 0) {
			return Promise.resolve(this.lines.shift()!);
		}
		return new Promise((resolve) => {
			this.readlineCallback = resolve;
		});
	}

	write(str: string): void {
		if (this.isOpen) {
			this._onDidWrite.fire(str);
		} else {
			if (this.writeBuffer === undefined) {
				this.writeBuffer = [];
			}
			this.writeBuffer.push(str);
		}
	}

	public handleInput(data: string): void {
		if (this.mode === TerminalMode.idle) {
			this._onAnyKey.fire();
			return;
		}
		const previousCursor = this.lineBuffer.getCursor();
		switch (data) {
			case '\x03': // ctrl+C
				this._onDidCtrlC.fire();
				break;
			case '\x06': // ctrl+f
			case '\x1b[C': // right
				this.adjustCursor(this.lineBuffer.moveCursorRelative(1), previousCursor, this.lineBuffer.getCursor());
				break;
			case '\x1bf': // alt+f
			case '\x1b[1;5C': // ctrl+right
				this.adjustCursor(this.lineBuffer.moveCursorWordRight(), previousCursor, this.lineBuffer.getCursor());
				break;
			case '\x02': // ctrl+b
			case '\x1b[D': // left
				this.adjustCursor(this.lineBuffer.moveCursorRelative(-1), previousCursor, this.lineBuffer.getCursor());
				break;
			case '\x1bb': // alt+b
			case '\x1b[1;5D': // ctrl+left
				this.adjustCursor(this.lineBuffer.moveCursorWordLeft(), previousCursor, this.lineBuffer.getCursor());
				break;
			case '\x01': // ctrl+a
			case '\x1b[H': // home
				this.adjustCursor(this.lineBuffer.moveCursorStartOfLine(), previousCursor, this.lineBuffer.getCursor());
				break;
			case '\x05': // ctrl+e
			case '\x1b[F': // end
				this.adjustCursor(this.lineBuffer.moveCursorEndOfLine(), previousCursor, this.lineBuffer.getCursor());
				break;
			case '\x1b[A': // up
				this.bell();
				break;
			case '\x1b[B': // down
				this.bell();
				break;
			case '\x08': // shift+backspace
			case '\x7F': // backspace
				this.lineBuffer.backspace() ? this._onDidWrite.fire('\x1b[D\x1b[P') : this.bell();
				break;
			case '\x1b[3~': // delete key
				this.lineBuffer.del() ? this._onDidWrite.fire('\x1b[P'): this.bell();
				break;
			case '\r': // enter
				this.handleEnter();
				break;
			default:
				this.lineBuffer.insert(data);
				if (!this.lineBuffer.isCursorAtEnd()) {
					this._onDidWrite.fire('\x1b[@');
				}
				this._onDidWrite.fire(data);
		}
	}

	private handleEnter(): void {
		this._onDidWrite.fire('\r\n');
		const line = this.lineBuffer.getLine();
		this.lineBuffer.clear();
		this.lines.push(line);
		if (this.readlineCallback !== undefined) {
			this.readlineCallback(`${this.lines.shift()!}\n`);
			this.readlineCallback = undefined;
		}
	}

	private adjustCursor(success: boolean, oldCursor: number, newCursor: number): void {
		if (!success) {
			this.bell();
			return;
		}

		const change = oldCursor - newCursor;
	    const code = change > 0 ? 'D' : 'C';
		const sequence = `\x1b[${code}`.repeat(Math.abs(change));
		this._onDidWrite.fire(sequence);
	}

	private bellIfFalse(success: boolean) {
		if (!success) {
			this.bell();
		}
	}

	private bell() {
		this._onDidWrite.fire('\x07');
	}
}

export type Options = {
	/**
	 * A handler that is called when the WASM exists
	 */
	exitHandler?: (rval: number) => void;

	/**
	 * Whether to echo the service name in the terminal
	 */
	echoName?: boolean;

	/**
	 * The pty to use. If not provided a very simple PTY implementation that
	 * only supports backspace is used.
	 */
	pty?: ServicePseudoTerminal;
};

export class ApiService {

	private readonly connection: ApiServiceConnection;
	private readonly options: Options | undefined;
	private readonly textEncoder: RAL.TextEncoder;
	private readonly textDecoder: RAL.TextDecoder;

	private readonly pty: ServicePseudoTerminal;

	constructor(_name: string, receiver: ApiServiceConnection, options?: Options) {
		this.connection = receiver;
		this.options = options;
		this.textEncoder = RAL().TextEncoder.create();
		this.textDecoder = RAL().TextDecoder.create();

		this.pty = options?.pty ?? new ServiceTerminalImpl(TerminalMode.inUse);

		const handleError = (error: any): { errno: number } => {
			if (error instanceof vscode.FileSystemError) {
				return { errno: this.asFileSystemError(error) };
			}
			return { errno: RPCErrno.UnknownError };

		};

		this.connection.onRequest('timer/sleep', async (params) => {
			await new Promise((resolve) => {
				RAL().timer.setTimeout(resolve, params.ms);
			});
			return { errno: 0 };
		});

		this.connection.onRequest('terminal/write', (params) => {
			if (params !== undefined && params.binary !== undefined) {
				const str = this.textDecoder.decode(params.binary.slice()).replace(terminalRegExp, (match: string, m1: string, m2: string) => {
					if (m1) {
						return m1;
					} else if (m2) {
						return '\r\n';
					} else {
						return match;
					}
				});
				this.pty.write(str);
			}
			return { errno: 0 };
		});

		this.connection.onRequest('terminal/read', async () => {
			const line = await this.pty.readline();
			return { errno: 0, data: this.textEncoder.encode(line) };
		});

		this.connection.onRequest('fileSystem/stat', async (params, resultBuffer) => {
			try {
				const uri = vscode.Uri.from(params.uri);
				const vStat: vscode.FileStat = await vscode.workspace.fs.stat(uri);
				const stat = DTOs.Stat.create(resultBuffer);
				stat.type = vStat.type;
				stat.ctime = vStat.mtime;
				stat.mtime = vStat.mtime;
				stat.size = vStat.size;
				if (vStat.permissions !== undefined) {
					stat.permission = vStat.permissions;
				}
				return { errno: 0 };
			} catch (error) {
				return handleError(error);
			}
		});

		this.connection.onRequest('fileSystem/readFile', async (params) => {
			try {
				const uri = vscode.Uri.from(params.uri);
				const contents = await vscode.workspace.fs.readFile(uri);
				return { errno: 0, data: contents };
			} catch (error) {
				return handleError(error);
			}
		});

		this.connection.onRequest('fileSystem/writeFile', async (params) => {
			try {
				const uri = vscode.Uri.from(params.uri);
				await vscode.workspace.fs.writeFile(uri, params.binary);
				return { errno: 0 };
			} catch (error) {
				return handleError(error);
			}
		});

		this.connection.onRequest('fileSystem/readDirectory', async (params) => {
			try {
				const uri = vscode.Uri.from(params.uri);
				const entries = await vscode.workspace.fs.readDirectory(uri);
				return { errno: 0, data: entries };
			} catch (error) {
				return handleError(error);
			}
		});

		this.connection.onRequest('fileSystem/createDirectory', async (params) => {
			try {
				const uri = vscode.Uri.from(params.uri);
				await vscode.workspace.fs.createDirectory(uri);
				return {errno: 0 };
			} catch (error) {
				return handleError(error);
			}
		});

		this.connection.onRequest('fileSystem/delete', async (params) => {
			try {
				const uri = vscode.Uri.from(params.uri);
				await vscode.workspace.fs.delete(uri, params.options);
				return {errno: 0 };
			} catch (error) {
				return handleError(error);
			}
		});

		this.connection.onRequest('fileSystem/rename', async (params) => {
			try {
				const source = vscode.Uri.from(params.source);
				const target = vscode.Uri.from(params.target);
				await vscode.workspace.fs.rename(source, target, params.options);
				return {errno: 0 };
			} catch (error) {
				return handleError(error);
			}
		});

		this.connection.onRequest('window/activeTextDocument', () => {
			const activeEditor = vscode.window.activeTextEditor;
			if (activeEditor === undefined) {
				return { errno: 0, data: null };
			}
			return { errno: 0, data: { uri: activeEditor.document.uri.toJSON() } };
		});

		this.connection.onRequest('workspace/workspaceFolders', () => {
			const folders = vscode.workspace.workspaceFolders ?? [];
			return { errno: 0, data: folders.map(folder => { return { uri: folder.uri.toJSON(), name: folder.name, index: folder.index }; } )};
		});

		this.connection.onRequest('process/proc_exit', (params) => {
			if (this.options?.exitHandler !== undefined) {
				this.options.exitHandler(params.rval);
			}
			return { errno: 0};
		});
	}

	public getPty(): vscode.Pseudoterminal {
		return this.pty;
	}

	private asFileSystemError(error: vscode.FileSystemError): DTOs.FileSystemError {
		switch(error.code) {
			case 'FileNotFound':
				return DTOs.FileSystemError.FileNotFound;
			case 'FileExists':
				return DTOs.FileSystemError.FileExists;
			case 'FileNotADirectory':
				return DTOs.FileSystemError.FileNotADirectory;
			case 'FileIsADirectory':
				return DTOs.FileSystemError.FileIsADirectory;
			case 'NoPermissions':
				return DTOs.FileSystemError.NoPermissions;
			case 'Unavailable':
				return DTOs.FileSystemError.Unavailable;
			default:
				return RPCErrno.UnknownError;
		}
	}
}
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';

import { RAL, ServiceConnection, ProcExitRequest, Requests, DTOs, RPCErrno } from '@vscode/sync-api-common';

const terminalRegExp = /(\r\n)|(\n)/gm;

export type APIRequests = Requests | ProcExitRequest;
type ApiServiceConnection = ServiceConnection<APIRequests>;

export class ApiService {

	private readonly connection: ApiServiceConnection;
	private readonly exitHandler: ((rval: number) => void) | undefined;
	private readonly textEncoder: RAL.TextEncoder;
	private readonly textDecoder: RAL.TextDecoder;

	private readonly pty: vscode.Pseudoterminal;
	private readonly ptyWriteEmitter: vscode.EventEmitter<string>;
	private inputBuffer: string[];
	private lineAvailable: undefined | (() => void);

	constructor(name: string, receiver: ApiServiceConnection, exitHandler?: (rval: number) => void) {
		this.connection = receiver;
		this.exitHandler = exitHandler;
		this.textEncoder = RAL().TextEncoder.create();
		this.textDecoder = RAL().TextDecoder.create();

		this.ptyWriteEmitter = new vscode.EventEmitter<string>();
		this.pty = {
			onDidWrite: this.ptyWriteEmitter.event,
			open: () => {
				this.ptyWriteEmitter.fire(`\x1b[31m${name}\x1b[0m\r\n\r\n`);
			},
			close: () => {
			},
			handleInput: (data: string) => {
				// Echo the data
				if (data === '\r') {
					data = '\n';
				}
				if (data.charCodeAt(0) === 127) {
					// Delete last character
					this.ptyWriteEmitter.fire('\x1b[D\x1b[P');
					this.inputBuffer.splice(this.inputBuffer.length - 1, 1);
				} else {
					this.ptyWriteEmitter.fire(data === '\n' ? '\r\n' : data);
					this.inputBuffer.push(data);
				}
				if (data === '\n' && this.lineAvailable !== undefined) {
					this.lineAvailable();
				}
			}
		};
		this.inputBuffer = [];

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
				const str = this.textDecoder.decode(params.binary).replace(terminalRegExp, (match: string, m1: string, m2: string) => {
					if (m1) {
						return m1;
					} else if (m2) {
						return '\r\n';
					} else {
						return match;
					}
				});
				this.ptyWriteEmitter.fire(str);
			}
			return { errno: 0 };
		});

		this.connection.onRequest('terminal/read', async () => {
			let line = this.getLine();
			if (line !== undefined) {
				return { errno : 0, data: this.textEncoder.encode(line) };
			}
			const wait = new Promise<void>((resolve) => {
				this.lineAvailable = resolve;
			});
			await wait;
			line = this.getLine();
			if (line === undefined) {
				return { errno: -1 };
			}
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

		this.connection.onRequest('$/proc_exit', (params) => {
			if (this.exitHandler !== undefined) {
				this.exitHandler(params.rval);
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

	private getLine(): string | undefined {
		if (this.inputBuffer.length === 0) {
			return undefined;
		}
		for (let i = 0; i < this.inputBuffer.length; i++) {
			if (this.inputBuffer[i] === '\n') {
				return this.inputBuffer.splice(0, i + 1).join('');
			}
		}
		return undefined;
	}
}
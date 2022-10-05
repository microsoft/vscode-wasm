/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';

import { RAL, ServiceConnection, Requests, DTOs, RPCErrno } from '@vscode/sync-api-common';

import { Stdio, Source, Sink } from './stdio';

export namespace ApiServiceConnection {
	export type ReadyParams = {
		stdio: {
			stdin: DTOs.UriComponents;
			stdout: DTOs.UriComponents;
			stderr: DTOs.UriComponents;
		};
	};
}

export type ApiServiceConnection = ServiceConnection<Requests, ApiServiceConnection.ReadyParams>;

export type Options = {
	/**
	 * A handler that is called when the WASM exists
	 */
	exitHandler?: (rval: number) => void;

	/**
	 * Whether to echo the service name in the terminal
	 */
	echoName?: boolean;
};

export class ApiService {

	private readonly connection: ApiServiceConnection;
	private readonly options: Options | undefined;

	private readonly byteSources: Map<string, Source>;
	private readonly byteSinks: Map<string, Sink>;
	private defaultStdio: Stdio;

	constructor(_name: string, receiver: ApiServiceConnection, options?: Options) {
		this.connection = receiver;

		this.byteSources = new Map();
		this.byteSinks = new Map();
		this.options = options;

		const console = new ConsoleTerminal();
		this.defaultStdio = console;
		this.registerTTY(console, false);

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

		this.connection.onRequest('byteTransfer/read', async (params) => {
			const uri: vscode.Uri = vscode.Uri.from(params.uri);
			const source = this.byteSources.get(uri.toString(true));
			if (source === undefined) {
				return { errno: RPCErrno.NoHandlerFound };
			}
			const contents = await source.read(params.maxBytesToRead);
			return {errno: 0, data: contents };
		});

		this.connection.onRequest('byteTransfer/write', async (params) => {
			const uri: vscode.Uri = vscode.Uri.from(params.uri);
			const sink = this.byteSinks.get(uri.toString(true));
			if (sink === undefined) {
				return { errno: RPCErrno.NoHandlerFound };
			}
			const bytesWritten = await sink.write(params.binary);
			const result = new Uint32Array(1);
			result[0] = bytesWritten;
			return { errno: 0, data: result};
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

	public registerTTY(stdio: Stdio, isDefault: boolean = true): void {
		if (isDefault === true) {
			this.defaultStdio = stdio;
		}
		this.byteSources.set(stdio.stdin.uri.toString(true), stdio.stdin);
		this.byteSinks.set(stdio.stdout.uri.toString(true), stdio.stdout);
		this.byteSinks.set(stdio.stderr.uri.toString(true), stdio.stderr);
	}

	public registerByteSource(source: Source): void {
		this.byteSources.set(source.uri.toString(true), source);
	}

	public registerByteSink(sink: Sink): void {
		this.byteSinks.set(sink.uri.toString(true), sink);
	}

	public signalReady(): void {
		const p: ApiServiceConnection.ReadyParams = {
			stdio: {
				stdin: this.defaultStdio.stdin.uri.toJSON(),
				stdout: this.defaultStdio.stdout.uri.toJSON(),
				stderr: this.defaultStdio.stderr.uri.toJSON()
			}
		};
		this.connection.signalReady(p);
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

class ConsoleTerminal implements Stdio {

	private static authority = 'console' as const;

	public readonly stdin: Source;
	public readonly stdout: Sink;
	public readonly stderr: Sink;

	constructor() {
		const decoder = RAL().TextDecoder.create();
		this.stdin = {
			uri: Stdio.createUri({ authority: ConsoleTerminal.authority, path: '/stdin' }),
			read(): Promise<Uint8Array> {
				throw vscode.FileSystemError.Unavailable(`Can't read from console`);
			}
		};
		this.stdout = {
			uri: Stdio.createUri({ authority: ConsoleTerminal.authority, path: '/stdout' }),
			write(bytes: Uint8Array): Promise<number> {
				RAL().console.log(decoder.decode(bytes.slice()));
				return Promise.resolve(bytes.byteLength);
			}
		};
		this.stderr = {
			uri: Stdio.createUri({ authority: ConsoleTerminal.authority, path: '/stderr' }),
			write(bytes: Uint8Array): Promise<number> {
				RAL().console.error(decoder.decode(bytes.slice()));
				return Promise.resolve(bytes.byteLength);
			}
		};
	}
}
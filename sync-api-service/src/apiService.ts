/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';

import { RAL, ServiceConnection, Requests, DTOs, RPCErrno } from '@vscode/sync-api-common';

import { CharacterDeviceProvider } from './types';

class ConsoleCharacterDeviceProvider implements CharacterDeviceProvider {
	public static scheme = 'sync-api-console' as const;

	private readonly decoder: RAL.TextDecoder;

	constructor() {
		this.decoder = RAL().TextDecoder.create();
	}

	read(_uri: vscode.Uri, _maxBytesToRead: number): Promise<Uint8Array> {
		throw new Error(`Can't read from console device`);
	}

	write(uri: vscode.Uri, bytes: Uint8Array): Promise<void> {
		const path = uri.path;
		const str = this.decoder.decode(bytes);
		if (path === '/stderr') {
			RAL().console.error(str);
		} else {
			RAL().console.log(str);
		}
		return Promise.resolve();
	}
}

export namespace ApiServiceConnection {
	export type ReadyParams = {
		stdio?: {
			stdin?: DTOs.UriComponents;
			stdout?: DTOs.UriComponents;
			stderr?: DTOs.UriComponents;
		};
	};
}

export type ApiServiceConnection = ServiceConnection<Requests, ApiServiceConnection.ReadyParams>;

export type ReadyParams = {
	stdio?: {
		stdin?: vscode.Uri;
		stdout?: vscode.Uri;
		stderr?: vscode.Uri;
	};
};

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

	private characterDeviceProviders: Map<string, CharacterDeviceProvider>;

	constructor(_name: string, receiver: ApiServiceConnection, options?: Options) {
		this.connection = receiver;
		this.characterDeviceProviders = new Map();
		this.characterDeviceProviders.set(ConsoleCharacterDeviceProvider.scheme, new ConsoleCharacterDeviceProvider());
		this.options = options;

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

		this.connection.onRequest('characterDevice/read', async (params, resultBuffer) => {
			const uri: vscode.Uri = vscode.Uri.from(params.uri);
			const provider = this.characterDeviceProviders.get(uri.scheme);
			if (provider === undefined) {
				return { errno: RPCErrno.NoHandlerFound };
			}
			resultBuffer.set(await provider.read(uri, params.maxBytesToRead));
			return {errno: 0 };
		});

		this.connection.onRequest('characterDevice/write', async (params) => {
			const uri: vscode.Uri = vscode.Uri.from(params.uri);
			const provider = this.characterDeviceProviders.get(uri.scheme);
			if (provider === undefined) {
				return { errno: RPCErrno.NoHandlerFound };
			}
			await provider.write(uri, params.binary);
			return { errno: 0};
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

	public registerCharacterDeviceProvider(scheme: string, provider: CharacterDeviceProvider): void {
		this.characterDeviceProviders.set(scheme, provider);
	}

	public signalReady(params?: ReadyParams): void {
		const p: ApiServiceConnection.ReadyParams | undefined = params?.stdio !== undefined
			? {
				stdio: {
					stdin: params.stdio.stdin?.toJSON(),
					stdout: params.stdio.stdout?.toJSON(),
					stderr: params.stdio.stderr?.toJSON()
				}
			  }
			: undefined;
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
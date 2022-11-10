/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';

import { RAL, ServiceConnection, Requests, DTOs, RPCErrno } from '@vscode/sync-api-common';

import { CharacterDeviceDriver, Source, Sink, FileDescriptorDescription } from './device';

export namespace ApiServiceConnection {
	export type ReadyParams = {
		stdio: {
			stdin: DTOs.FileDescriptorDescription;
			stdout: DTOs.FileDescriptorDescription;
			stderr: DTOs.FileDescriptorDescription;
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

	private stdio: {
		stdin: FileDescriptorDescription;
		stdout: FileDescriptorDescription;
		stderr: FileDescriptorDescription;
	};

	constructor(_id: string, receiver: ApiServiceConnection, options?: Options) {
		this.connection = receiver;

		this.byteSources = new Map();
		this.byteSinks = new Map();
		this.options = options;

		const console = new ConsoleTerminal();
		this.stdio = {
			stdin: console.fileDescriptor,
			stdout: console.fileDescriptor,
			stderr: console.fileDescriptor
		};
		this.registerCharacterDeviceDriver(console, false);

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

		this.connection.onRequest('byteSource/read', async (params) => {
			const uri: vscode.Uri = vscode.Uri.from(params.uri);
			const source = this.byteSources.get(uri.toString(true));
			if (source === undefined) {
				return { errno: RPCErrno.NoHandlerFound };
			}
			const contents = await source.read(params.maxBytesToRead);
			return {errno: 0, data: contents };
		});

		this.connection.onRequest('byteSink/write', async (params) => {
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

	public registerCharacterDeviceDriver(deviceDriver: CharacterDeviceDriver, useAsDefaultStdio: boolean): void {
		if (useAsDefaultStdio === true) {
			this.setStdio(deviceDriver.fileDescriptor, deviceDriver.fileDescriptor, deviceDriver.fileDescriptor);
		}
		this.byteSources.set(deviceDriver.uri.toString(true), deviceDriver);
		this.byteSinks.set(deviceDriver.uri.toString(true), deviceDriver);
	}

	public setStdio(stdin: FileDescriptorDescription | undefined, stdout: FileDescriptorDescription | undefined, stderr: FileDescriptorDescription | undefined): void {
		if (stdin !== undefined) {
			this.stdio.stdin = stdin;
		}
		if (stdout !== undefined) {
			this.stdio.stdout = stdout;
		}
		if (stderr !== undefined) {
			this.stdio.stderr = stderr;
		}
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
				stdin: this.asFileDescriptorDescription(this.stdio.stdin),
				stdout: this.asFileDescriptorDescription(this.stdio.stdout),
				stderr: this.asFileDescriptorDescription(this.stdio.stderr),
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

	private asFileDescriptorDescription(fileDescriptor: FileDescriptorDescription): DTOs.FileDescriptorDescription {
		switch (fileDescriptor.kind) {
			case 'fileSystem':
				return { kind: fileDescriptor.kind, uri: fileDescriptor.uri.toJSON(), path: fileDescriptor.path };
			case 'terminal':
				return { kind: fileDescriptor.kind, uri: fileDescriptor.uri.toJSON() };
			case 'console':
				return { kind: fileDescriptor.kind, uri: fileDescriptor.uri.toJSON() };
		}
	}
}

class ConsoleTerminal implements CharacterDeviceDriver {

	private static authority = 'global' as const;

	private decoder: RAL.TextDecoder;
	public readonly uri: vscode.Uri;
	public readonly fileDescriptor: FileDescriptorDescription;

	constructor() {
		this.decoder = RAL().TextDecoder.create();
		this.uri =  vscode.Uri.from({ scheme: 'console', authority: ConsoleTerminal.authority });
		this.fileDescriptor = { kind: 'console', uri: this.uri };
	}

	read(): Promise<Uint8Array> {
		throw vscode.FileSystemError.Unavailable(`Can't read from console`);
	}

	write(bytes: Uint8Array): Promise<number> {
		RAL().console.log(this.decoder.decode(bytes.slice()));
		return Promise.resolve(bytes.byteLength);
	}
}
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { URI } from 'vscode-uri';

import { ClientConnection, Requests, RequestResult, DTOs, VariableResult, RPCErrno, RPCError, RAL, Uint32Result } from '@vscode/sync-api-common';

import * as vscode from './vscode';

export interface Timer {
	sleep(ms: number): void;
}

export interface Process {
	procExit(rval: number): void;
}

export interface ByteSource {
	read(uri: URI, maxBytesToRead: number): Uint8Array;
}

export interface ByteSink {
	write(uri: URI, value: Uint8Array): number;
}

export interface Console {
	log(message?: any, ...optionalParams: any[]): void;
	error(message?: any, ...optionalParams: any[]): void;
}

export interface FileSystem {
	stat(uri: URI): vscode.FileStat;
	readFile(uri: URI): Uint8Array;
	writeFile(uri: URI, content: Uint8Array): void;
	readDirectory(uri: URI): DTOs.DirectoryEntries;
	createDirectory(uri: URI): void;
	delete(uri: URI, options?: { recursive?: boolean; useTrash?: boolean }): void;
	rename(source: URI, target: URI, options?: { overwrite?: boolean }): void;
}

export interface Workspace {
	workspaceFolders: vscode.WorkspaceFolder[];
	fileSystem: FileSystem;
}

export interface TTY {
	write(uri: URI, value: Uint8Array): number;
	read(uri: URI, maxBytesToRead: number): Uint8Array;
}

export type FileDescriptorDescription = {
	kind: 'fileSystem';
	uri: URI;
	path: string;
} | {
	kind: 'terminal';
	uri: URI;
} | {
	kind: 'console';
	uri: URI;
};

export namespace ApiClientConnection {
	export type ReadyParams = {
		stdio: {
			stdin: FileDescriptorDescription;
			stdout: FileDescriptorDescription;
			stderr: FileDescriptorDescription;
		};
	};
}

export type ApiClientConnection = ClientConnection<Requests, ApiClientConnection.ReadyParams>;

class TimerImpl implements Timer {

	private readonly connection: ApiClientConnection;

	constructor(connection: ApiClientConnection) {
		this.connection = connection;
	}

	public sleep(ms: number): void {
		this.connection.sendRequest('timer/sleep', { ms });
	}
}

class ProcessImpl implements Process {
	private readonly connection: ApiClientConnection;

	constructor(connection: ApiClientConnection) {
		this.connection = connection;
	}

	public procExit(rval: number): void {
		this.connection.sendRequest('process/proc_exit', { rval: rval });
	}
}

class ByteSourceImpl implements ByteSource {

	private readonly connection: ApiClientConnection;

	constructor(connection: ApiClientConnection) {
		this.connection = connection;
	}

	public read(uri: URI, maxBytesToRead: number): Uint8Array {
		const result = this.connection.sendRequest('byteSource/read', { uri: uri.toJSON(), maxBytesToRead }, new VariableResult<Uint8Array>('binary'));
		if (RequestResult.hasData(result)) {
			return result.data;
		}
		throw new RPCError(result.errno, `Should never happen`);
	}
}

class ByteSinkImpl implements ByteSink {

	private readonly connection: ApiClientConnection;

	constructor(connection: ApiClientConnection) {
		this.connection = connection;
	}

	public write(uri: URI, value: Uint8Array): number {
		const result = this.connection.sendRequest('byteSink/write', { uri: uri.toJSON(), binary: value }, Uint32Result.fromLength(1));
		if (RequestResult.hasData(result)) {
			return result.data[0];
		}
		throw new RPCError(result.errno, `Should never happen`);
	}
}

class ConsoleImpl implements Console {

	private static scheme = 'stdio' as const;
	private static authority = 'console' as const;
	private static stdout = URI.from( { scheme: ConsoleImpl.scheme, authority: ConsoleImpl.authority, path: '/stdout'} );
	private static stderr = URI.from( { scheme: ConsoleImpl.scheme, authority: ConsoleImpl.authority, path: '/stderr'} );

	private readonly byteTransfer: ByteSink;
	private readonly encoder: RAL.TextEncoder;


	constructor(byteSink: ByteSink, encoder: RAL.TextEncoder) {
		this.byteTransfer = byteSink;
		this.encoder = encoder;
	}

	log(message?: string): void {
		message = message === undefined ? '\n' : `${message}\n`;
		this.byteTransfer.write(ConsoleImpl.stdout, this.encoder.encode(message));
	}

	error(message?: string): void {
		message = message === undefined ? '\n' : `${message}\n`;
		this.byteTransfer.write(ConsoleImpl.stderr, this.encoder.encode(message));
	}
}

class FileSystemImpl implements FileSystem {

	private readonly connection: ApiClientConnection;

	constructor(connection: ApiClientConnection) {
		this.connection = connection;
	}

	public stat(uri: URI): vscode.FileStat {
		const requestResult = this.connection.sendRequest('fileSystem/stat', { uri: uri.toJSON() }, DTOs.Stat.typedResult);
		if (RequestResult.hasData(requestResult)) {
			const stat = DTOs.Stat.create(requestResult.data);
			const permission = stat.permission;
			const result: vscode.FileStat = {
				type: stat.type,
				ctime: stat.ctime,
				mtime: stat.mtime,
				size: stat.size
			};
			if (permission !== 0) {
				result.permissions = permission;
			}
			return result;
		}
		throw this.asFileSystemError(requestResult.errno, uri);
	}

	public readFile(uri: URI): Uint8Array {
		const requestResult = this.connection.sendRequest('fileSystem/readFile', { uri: uri.toJSON() }, new VariableResult<Uint8Array>('binary'));
		if (RequestResult.hasData(requestResult)) {
			return requestResult.data;
		}
		throw this.asFileSystemError(requestResult.errno, uri);
	}

	public writeFile(uri: URI, content: Uint8Array): void {
		const requestResult = this.connection.sendRequest('fileSystem/writeFile', { uri: uri.toJSON(), binary: content });
		if (requestResult.errno !== RPCErrno.Success) {
			throw this.asFileSystemError(requestResult.errno, uri);
		}
	}

	public readDirectory(uri: URI): DTOs.DirectoryEntries {
		const requestResult = this.connection.sendRequest('fileSystem/readDirectory', { uri: uri.toJSON() }, new VariableResult<DTOs.DirectoryEntries>('json'));
		if (RequestResult.hasData(requestResult)) {
			return requestResult.data;
		 }
		 throw this.asFileSystemError(requestResult.errno, uri);
	}

	public createDirectory(uri: URI): void {
		const requestResult = this.connection.sendRequest('fileSystem/createDirectory', { uri: uri.toJSON() });
		if (requestResult.errno !== RPCErrno.Success) {
			throw this.asFileSystemError(requestResult.errno, uri);
		}
	}

	public delete(uri: URI, options?: { recursive?: boolean; useTrash?: boolean }): void {
		const requestResult = this.connection.sendRequest('fileSystem/delete', { uri: uri.toJSON(), options });
		if (requestResult.errno !== RPCErrno.Success) {
			throw this.asFileSystemError(requestResult.errno, uri);
		}
	}

	public rename(source: URI, target: URI, options?: { overwrite?: boolean }): void {
		const requestResult = this.connection.sendRequest('fileSystem/rename', { source: source.toJSON(), target: target.toJSON(), options });
		if (requestResult.errno !== RPCErrno.Success) {
			throw this.asFileSystemError(requestResult.errno, `${source.toString()} -> ${target.toString()}`);
		}
	}

	private asFileSystemError(errno: RPCErrno, uri: URI | string): vscode.FileSystemError {
		switch(errno) {
			case DTOs.FileSystemError.FileNotFound:
				return vscode.FileSystemError.FileNotFound(uri);
			case DTOs.FileSystemError.FileExists:
				return vscode.FileSystemError.FileExists(uri);
			case DTOs.FileSystemError.FileNotADirectory:
				return vscode.FileSystemError.FileNotADirectory(uri);
			case DTOs.FileSystemError.FileIsADirectory:
				return vscode.FileSystemError.FileIsADirectory(uri);
			case DTOs.FileSystemError.NoPermissions:
				return vscode.FileSystemError.NoPermissions(uri);
			case DTOs.FileSystemError.Unavailable:
				return vscode.FileSystemError.Unavailable(uri);
		}
		return vscode.FileSystemError.Unavailable(uri);
	}
}

class WorkspaceImpl implements Workspace {

	private readonly connection: ApiClientConnection;
	public readonly fileSystem: FileSystem;

	constructor(connection: ApiClientConnection) {
		this.connection = connection;
		this.fileSystem = new FileSystemImpl(this.connection);
	}

	public get workspaceFolders(): vscode.WorkspaceFolder[] {
		const requestResult = this.connection.sendRequest('workspace/workspaceFolders', new VariableResult<DTOs.WorkspaceFolder[]>('json'));
		if (RequestResult.hasData(requestResult)) {
			return requestResult.data.map(folder => { return { uri: URI.from(folder.uri), name: folder.name, index: folder.index }; } );
		}
		throw new RPCError(RPCErrno.UnknownError);
	}
}

export interface ApiShape {

	readonly timer: Timer;
	readonly process: Process;
	readonly byteSource: ByteSource;
	readonly byteSink: ByteSink;
	readonly console: Console;
	readonly tty: TTY;
	readonly vscode: {
		readonly workspace: Workspace;
	};
}

export class ApiClient implements ApiShape {

	private readonly connection: ApiClientConnection;
	private readonly encoder: RAL.TextEncoder;

	public readonly timer: Timer;
	public readonly process: Process;
	public readonly byteSource: ByteSource;
	public readonly byteSink: ByteSink;
	public readonly console: Console;
	public readonly tty: TTY;
	public readonly vscode: {
		readonly workspace: Workspace;
	};

	constructor(connection: ApiClientConnection) {
		this.connection = connection;
		this.encoder = RAL().TextEncoder.create();
		this.timer = new TimerImpl(this.connection);
		this.process = new ProcessImpl(this.connection);
		const byteSource = this.byteSource = new ByteSourceImpl(this.connection);
		const byteSink = this.byteSink = new ByteSinkImpl(this.connection);
		this.console = new ConsoleImpl(byteSink, this.encoder);
		this.tty = {
			read(uri, maxBytesToRead) {
				return byteSource.read(uri, maxBytesToRead);
			},
			write(uri, value) {
				return byteSink.write(uri, value);
			},
		};
		this.vscode = {
			workspace: new WorkspaceImpl(this.connection)
		};
	}

	public async serviceReady(): Promise<ApiClientConnection.ReadyParams> {
		const params = await this.connection.serviceReady();
		return { stdio: {
			stdin: this.asFileDescriptorDescription(params.stdio.stdin),
			stdout: this.asFileDescriptorDescription(params.stdio.stdout),
			stderr: this.asFileDescriptorDescription(params.stdio.stderr),
		}};
	}

	private asFileDescriptorDescription(fileDescriptor: DTOs.FileDescriptorDescription): FileDescriptorDescription {
		switch (fileDescriptor.kind) {
			case 'fileSystem':
				return { kind: fileDescriptor.kind, uri: URI.from(fileDescriptor.uri), path: fileDescriptor.path };
			case 'terminal':
				return { kind: fileDescriptor.kind, uri: URI.from(fileDescriptor.uri) };
			case 'console':
				return { kind: fileDescriptor.kind, uri: URI.from(fileDescriptor.uri) };
		}
	}
}
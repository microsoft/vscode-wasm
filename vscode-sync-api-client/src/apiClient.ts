/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { URI } from 'vscode-uri';

import RAL, { BaseClientConnection, Requests, RequestResult, Types, VariableResult, ProcExitRequest, RPCErrno, RPCError } from 'vscode-sync-rpc';

import * as vscode from './vscode';

export interface Terminal {
	write(value: string, encoding?: string): void;
	write(value: Uint8Array): void;
	read(): Uint8Array;
}

export interface FileSystem {
	stat(uri: URI): vscode.FileStat;
	read(uri: URI): Uint8Array;
	write(uri: URI, content: Uint8Array): void;
	readDirectory(uri: URI): Types.DirectoryEntries;
	createDirectory(uri: URI): void;
	delete(uri: URI, options?: { recursive?: boolean; useTrash?: boolean }): void;
	rename(source: URI, target: URI, options?: { overwrite?: boolean }): void;
}

type ApiClientConnection<Ready extends {} | undefined = undefined> = BaseClientConnection<Requests | ProcExitRequest, Ready>;

class TerminalImpl<Ready extends {} | undefined = undefined> implements Terminal {

	private readonly connection: ApiClientConnection<Ready>;
	private readonly encoder: RAL.TextEncoder;

	constructor(connection: ApiClientConnection<Ready>, encoder: RAL.TextEncoder) {
		this.connection = connection;
		this.encoder = encoder;
	}

	public write(value: string, encoding?: string): void;
	public write(value: Uint8Array): void;
	public write(value: string | Uint8Array, _encoding?: string): void {
		const binary = (typeof value === 'string')
			? this.encoder.encode(value) : value;
		this.connection.sendRequest('terminal/write', { binary });
	}
	public read(): Uint8Array {
		const result = this.connection.sendRequest('terminal/read', new VariableResult<Uint8Array>('binary'));
		if (RequestResult.hasData(result)) {
			return result.data;
		}
		throw new RPCError(result.errno, `Should never happen`);
	}
}

class FileSystemImpl<Ready extends {} | undefined = undefined> implements FileSystem {

	private readonly connection: ApiClientConnection<Ready>;
	// todo@dirkb this is temporary. We need to improve this by bundling the
	// Python lib into the worker code.
	private statCache: Map<string, vscode.FileStat> = new Map();

	constructor(connection: ApiClientConnection<Ready>, _encoder: RAL.TextEncoder) {
		this.connection = connection;
	}

	public stat(uri: URI): vscode.FileStat {
		const cached = this.statCache.get(uri.toString());
		if (cached !== undefined) {
			return cached;
		}
		const requestResult = this.connection.sendRequest('fileSystem/stat', { uri: uri.toJSON() }, Types.Stat.typedResult);
		if (RequestResult.hasData(requestResult)) {
			const stat = Types.Stat.create(requestResult.data);
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
			this.statCache.set(uri.toString(), result);
			return result;
		}
		throw this.asFileSystemError(requestResult.errno, uri);
	}

	public read(uri: URI): Uint8Array {
		const requestResult = this.connection.sendRequest('fileSystem/readFile', { uri: uri.toJSON() }, new VariableResult<Uint8Array>('binary'));
		if (RequestResult.hasData(requestResult)) {
			return requestResult.data;
		}
		throw this.asFileSystemError(requestResult.errno, uri);
	}

	public write(uri: URI, content: Uint8Array): void {
		const requestResult = this.connection.sendRequest('fileSystem/writeFile', { uri: uri.toJSON(), binary: content });
		if (requestResult.errno !== RPCErrno.Success) {
			throw this.asFileSystemError(requestResult.errno, uri);
		}
	}

	public readDirectory(uri: URI): Types.DirectoryEntries {
		const requestResult = this.connection.sendRequest('fileSystem/readDirectory', { uri: uri.toJSON() }, new VariableResult<Types.DirectoryEntries>('json'));
		if (RequestResult.hasData(requestResult)) {
			requestResult.data;
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
			case Types.FileSystemError.FileNotFound:
				return vscode.FileSystemError.FileNotFound(uri);
			case Types.FileSystemError.FileExists:
				return vscode.FileSystemError.FileExists(uri);
			case Types.FileSystemError.FileNotADirectory:
				return vscode.FileSystemError.FileNotADirectory(uri);
			case Types.FileSystemError.FileIsADirectory:
				return vscode.FileSystemError.FileIsADirectory(uri);
			case Types.FileSystemError.NoPermissions:
				return vscode.FileSystemError.NoPermissions(uri);
			case Types.FileSystemError.Unavailable:
				return vscode.FileSystemError.Unavailable(uri);
		}
		return vscode.FileSystemError.Unavailable(uri);
	}
}

export class ApiClient<Ready extends {} | undefined = undefined> {

	private readonly connection: ApiClientConnection<Ready>;
	private readonly encoder: RAL.TextEncoder;

	public readonly terminal: Terminal;
	public readonly fileSystem: FileSystem;

	constructor(connection: ApiClientConnection<Ready>) {
		this.connection = connection;
		this.encoder = RAL().TextEncoder.create();
		this.terminal = new TerminalImpl(this.connection, this.encoder);
		this.fileSystem = new FileSystemImpl(this.connection, this.encoder);
	}

	procExit(rval: number): void {
		this.connection.sendRequest('$/proc_exit', { rval: rval });
	}
}
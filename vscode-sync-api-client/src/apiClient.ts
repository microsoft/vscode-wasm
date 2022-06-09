/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { URI } from 'vscode-uri';

import RAL, { BaseClientConnection, Requests, Uint8Result, RequestResult, Types, VariableResult } from 'vscode-sync-rpc';

import { FileStat } from './vscode';

export interface Terminal {
	write(value: string, encoding?: string): void;
	write(value: Uint8Array): void;
	read(bufferSize: number): Uint8Array | undefined;
}

export interface FileSystem {
	stat(uri: URI): FileStat | number;
	read(uri: URI): Uint8Array | number;
	write(uri: URI, content: Uint8Array): number;
	readDirectory(uri: URI): Types.DirectoryEntries | number;
	createDirectory(uri: URI): number;
}

type ApiClientConnection<Ready extends {} | undefined = undefined> = BaseClientConnection<Requests, Ready>;

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
	public read(bufferSize: number): Uint8Array | undefined {
		const result = this.connection.sendRequest('terminal/read', Uint8Result.fromByteLength(bufferSize));
		if (RequestResult.hasData(result)) {
			return result.data;
		}
		return undefined;
	}
}

class FileSystemImpl<Ready extends {} | undefined = undefined> implements FileSystem {

	private readonly connection: ApiClientConnection<Ready>;

	constructor(connection: ApiClientConnection<Ready>, _encoder: RAL.TextEncoder) {
		this.connection = connection;
	}

	public stat(uri: URI): FileStat | number {
		const requestResult = this.connection.sendRequest('fileSystem/stat', { uri: uri.toJSON() }, Types.Stat.typedResult);
		if (RequestResult.hasData(requestResult)) {
			const stat = Types.Stat.create(requestResult.data);
			const permission = stat.permission;
			const result: FileStat = {
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
		return requestResult.errno;
	}

	public read(uri: URI): Uint8Array | number {
		const requestResult = this.connection.sendRequest('fileSystem/readFile', { uri: uri.toJSON() }, new VariableResult<Uint8Array>('binary'));
		if (RequestResult.hasData(requestResult)) {
			return requestResult.data;
		}
		return requestResult.errno;
	}

	public write(uri: URI, content: Uint8Array): number {
		const requestResult = this.connection.sendRequest('fileSystem/writeFile', { uri: uri.toJSON(), binary: content });
		return requestResult.errno;
	}

	public readDirectory(uri: URI): Types.DirectoryEntries | number {
		const requestResult = this.connection.sendRequest('fileSystem/readDirectory', { uri: uri.toJSON() }, new VariableResult<Types.DirectoryEntries>('json'));
		return RequestResult.hasData(requestResult) ? requestResult.data : requestResult.errno;
	}

	public createDirectory(uri: URI): number {
		const requestResult = this.connection.sendRequest('fileSystem/createDirectory', { uri: uri.toJSON() });
		return requestResult.errno;
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
}
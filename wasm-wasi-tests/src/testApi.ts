/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { TextDecoder } from 'util';
import * as path from 'path';
import * as fs from 'fs';

import { URI } from 'vscode-uri';

import { ApiShape, ByteSink, ByteSource, Process, Timer, TTY, Workspace, Console, FileSystem, FileStat, DTOs, WorkspaceFolder, FileType, FilePermission, Rights, rights } from '@vscode/wasm-wasi';

class TimerImpl implements Timer {
	public sleep(_ms: number): void {
	}
}

class ProcessImpl implements Process {

	private readonly api: TestApi;

	public constructor(api: TestApi) {
		this.api = api;
	}

	public procExit(rval: number): void {
		this.api.rval = rval;
	}
}

class ByteSourceImpl implements ByteSource {
	public read(_uri: URI, _maxBytesToRead: number): Uint8Array {
		return new Uint8Array();
	}
}

class ByteSinkImpl implements ByteSink {
	public write(_uri: URI, value: Uint8Array): number {
		return value.byteLength;
	}
}

class ConsoleImpl implements Console {

	public log(message?: any, ...optionalParams: any[]): void {
		console.log(message, ...optionalParams);
	}

	public error(message?: any, ...optionalParams: any[]): void {
		console.error(message, ...optionalParams);
	}
}

class TTYImpl implements TTY {

	private readonly decoder: TextDecoder;

	public constructor(decoder: TextDecoder) {
		this.decoder = decoder;
	}

	public write(_uri: URI, value: Uint8Array): number {
		console.info(this.decoder.decode(value));
		return value.byteLength;
	}

	public read(_uri: URI, _maxBytesToRead: number): Uint8Array {
		throw new Error(`TTY read is not supported`);
	}
}

class FileSystemImpl implements FileSystem {

	public constructor() {
	}

	public stat(uri: URI): FileStat {
		if (uri.scheme !== 'file') {
			throw new Error(`Only file schemes are supported, but got ${uri.scheme}`);
		}
		return this.convertToFileStat(fs.statSync(uri.fsPath));
	}

	public readFile(uri: URI): Uint8Array {
		if (uri.scheme !== 'file') {
			throw new Error(`Only file schemes are supported, but got ${uri.scheme}`);
		}
		return fs.readFileSync(uri.fsPath);
	}

	public writeFile(uri: URI, content: Uint8Array): void {
		if (uri.scheme !== 'file') {
			throw new Error(`Only file schemes are supported, but got ${uri.scheme}`);
		}
		fs.writeFileSync(uri.fsPath, content);
	}

	public readDirectory(uri: URI): DTOs.DirectoryEntries {
		if (uri.scheme !== 'file') {
			throw new Error(`Only file schemes are supported, but got ${uri.scheme}`);
		}
		const fsPath = uri.fsPath;
		const entries = fs.readdirSync(fsPath);
		const result: DTOs.DirectoryEntries = [];
		for (const entry of entries) {
			result.push([entry, this.getFileType(fs.statSync(path.join(fsPath, entry)))]);
		}
		return result;
	}

	public createDirectory(uri: URI): void {
		if (uri.scheme !== 'file') {
			throw new Error(`Only file schemes are supported, but got ${uri.scheme}`);
		}
		// We need to understand what Posix does here in terms of recursive dire creation.
		fs.mkdirSync(uri.fsPath);
	}

	public delete(uri: URI, options?: { recursive?: boolean; useTrash?: boolean }): void {
		if (uri.scheme !== 'file') {
			throw new Error(`Only file schemes are supported, but got ${uri.scheme}`);
		}
		if (options?.recursive === true) {
			throw new Error(`Posix has no support for recursive deletion`);
		}
		fs.unlinkSync(uri.fsPath);
	}

	public rename(source: URI, target: URI, options?: { overwrite?: boolean }): void {
		if (source.scheme !== 'file') {
			throw new Error(`Only file schemes are supported for source, but got ${source.scheme}`);
		}
		if (target.scheme !== 'file') {
			throw new Error(`Only file schemes are supported for target, but got ${target.scheme}`);
		}
		if (options?.overwrite === true) {
			throw new Error(`Posix has no support for overwrites in renames`);
		}
		fs.renameSync(source.fsPath, target.fsPath);
	}

	private convertToFileStat(stat: fs.Stats): FileStat {
		return {
			type: stat.isFile() ? FileType.File : stat.isDirectory() ? FileType.Directory : stat.isSymbolicLink() ? FileType.SymbolicLink : FileType.Unknown,
			size: stat.size,
			ctime: stat.ctime.valueOf(),
			mtime: stat.mtime.valueOf(),
			permissions: (stat.mode & fs.constants.S_IWUSR) === 0 ? FilePermission.Readonly : undefined
		};
	}

	private getFileType(stat: fs.Stats): DTOs.FileType {
		return stat.isFile() ? DTOs.FileType.File : stat.isDirectory() ? DTOs.FileType.Directory : stat.isSymbolicLink() ? DTOs.FileType.SymbolicLink : DTOs.FileType.Unknown;
	}
}

class WorkspaceImpl implements Workspace {
	public readonly workspaceFolders: WorkspaceFolder[];
	public readonly fileSystem: FileSystem;

	public constructor() {
		this.workspaceFolders = [];
		this.fileSystem = new FileSystemImpl();
	}
}

export class TestApi implements ApiShape {
	public rval: number | undefined;

	public readonly timer: Timer;
	public readonly process: Process;
	public readonly byteSource: ByteSource;
	public readonly byteSink: ByteSink;
	public readonly console: Console;
	public readonly tty: TTY;
	public readonly vscode: {
		readonly workspace: Workspace;
	};

	public constructor() {
		const decoder = new TextDecoder('utf8');
		this.timer = new TimerImpl();
		this.process = new ProcessImpl(this);
		this.byteSource = new ByteSourceImpl();
		this.byteSink = new ByteSinkImpl();
		this.console = new ConsoleImpl();
		this.tty = new TTYImpl(decoder);
		this.vscode = {
			workspace: new WorkspaceImpl()
		};
	}
}
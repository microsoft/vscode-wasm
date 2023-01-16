/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { URI } from 'vscode-uri';

import { ApiShape, ByteSink, ByteSource, Process, Timer, TTY, Workspace, Console, FileSystem, FileStat, DTOs, WorkspaceFolder } from '@vscode/wasm-wasi';

class TimerImpl implements Timer {
	sleep(_ms: number): void {
	}
}

class ProcessImpl implements Process {

	private readonly api: TestApi;

	constructor(api: TestApi) {
		this.api = api;
	}

	procExit(rval: number): void {
		this.api.rval = rval;
	}
}

class ByteSourceImpl implements ByteSource {
	public read(_uri: URI, _maxBytesToRead: number): Uint8Array {
		return new Uint8Array();
	}
}

class ByteSinkImpl implements ByteSink {
	write(_uri: URI, value: Uint8Array): number {
		return value.byteLength;
	}
}

class ConsoleImpl implements Console {

	log(message?: any, ...optionalParams: any[]): void {
		console.log(message, ...optionalParams);
	}

	error(message?: any, ...optionalParams: any[]): void {
		console.error(message, ...optionalParams);
	}
}

class TTYImpl implements TTY {

	write(_uri: URI, value: Uint8Array): number {
		return value.byteLength;
	}

	read(_uri: URI, _maxBytesToRead: number): Uint8Array {
		return new Uint8Array();
	}
}

class FileSystemImpl implements FileSystem {

	stat(uri: URI): FileStat {
		throw new Error('Not yet implemented');
	}

	readFile(uri: URI): Uint8Array {
		throw new Error('Not yet implemented');
	}

	writeFile(uri: URI, content: Uint8Array): void {
		throw new Error('Not yet implemented');
	}

	readDirectory(uri: URI): DTOs.DirectoryEntries {
		throw new Error('Not yet implemented');
	}

	createDirectory(uri: URI): void {
		throw new Error('Not yet implemented');
	}

	delete(uri: URI, options?: { recursive?: boolean; useTrash?: boolean }): void {
		throw new Error('Not yet implemented');
	}

	rename(source: URI, target: URI, options?: { overwrite?: boolean }): void {
		throw new Error('Not yet implemented');
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

class TestApi implements ApiShape {

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
		this.timer = new TimerImpl();
		this.process = new ProcessImpl(this);
		this.byteSource = new ByteSourceImpl();
		this.byteSink = new ByteSinkImpl();
		this.console = new ConsoleImpl();
		this.tty = new TTYImpl();
		this.vscode = {
			workspace: new WorkspaceImpl()
		};
	}
}
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Uri, WorkspaceFolder, workspace } from 'vscode';

import RAL from './ral';
import { ptr, size, u32 } from './baseTypes';
import { FileSystemDeviceDriver } from './deviceDriver';
import { FileDescriptor, FileDescriptors } from './fileDescriptor';
import * as vscfs from './vscodeFileSystemDriver';
import * as tdd from './terminalDriver';
import * as pdd from './pipeDriver';
import { DeviceWasiService, ProcessWasiService, EnvironmentWasiService, WasiService, Clock, ClockWasiService } from './service';
import WasiKernel, { DeviceDrivers } from './kernel';
import { Errno, Lookupflags, exitcode } from './wasi';
import { MapDirEntry, Options, StdioDescriptor, StdioFileDescriptor } from './api';
import { CharacterDeviceDriver } from './deviceDriver';
import { WasiPseudoterminal } from './terminal';

namespace MapDirEntry {
	export function is(value: any): value is MapDirEntry {
		const candidate = value as MapDirEntry;
		return candidate && candidate.vscode_fs instanceof Uri && typeof candidate.mountPoint === 'string';
	}
}

type $StdioDescriptor = StdioDescriptor | { kind: 'console' };
type $Stdio = {
	in: $StdioDescriptor;
	out: $StdioDescriptor;
	err: $StdioDescriptor;
};

export interface Writable {
	write(chunk: Uint8Array | string): Promise<void>;
}

export interface Readable {
	[Symbol.asyncIterator](): AsyncIterableIterator<Uint8Array>;
}

enum StreamMode {
	readable = 1,
	writeable = 2,
}

class StdioStream implements Writable {

	private static BufferSize = 16384;

	private readonly mode: StreamMode;
	private readonly encoding: 'utf-8';
	private readonly encoder: RAL.TextEncoder;

	private chunks: Uint8Array[];
	private fillLevel: number;

	private _targetFillLevel: number;
	private _awaitFillLevel: (() => void) | undefined;
	private _awaitData: (() => void) | undefined;

	constructor(mode: StreamMode, encoding?: 'utf-8') {
		this.mode = mode;
		this.encoding = encoding || 'utf-8';
		this.encoder = RAL().TextEncoder.create(this.encoding);
		this.chunks = [];
		this.fillLevel = 0;
		this._targetFillLevel = 0;
	}

	public async write(chunk: Uint8Array | string): Promise<void> {
		if (typeof chunk === 'string') {
			if (this.mode === StreamMode.readable) {
				throw new Error('Invalid state: cannot write string to readable stream. Only Uint8Array is allowed.');
			}
			chunk = this.encoder.encode(chunk);
		}
		// We have enough space
		if (this.fillLevel + chunk.byteLength <= StdioStream.BufferSize) {
			this.chunks.push(chunk);
			this.fillLevel += chunk.byteLength;
			this.signalData();
			return;
		}
		// What for the necessary space.
		const targetFillLevel = Math.max(0, StdioStream.BufferSize - chunk.byteLength);
		await this.awaitFillLevel(targetFillLevel);
		if (this.fillLevel > targetFillLevel) {
			throw new Error(`Invalid state: fillLevel should be <= ${targetFillLevel}`);
		}
		this.chunks.push(chunk);
		this.fillLevel += chunk.byteLength;
		this.signalData();
		return;
	}

	public async read(maxBytes?: size): Promise<Uint8Array> {
		if (this.mode === StreamMode.readable) {
			throw new Error('Invalid state: cannot read single Uint8Array from readable stream. Use [Symbol.asyncIterator] instead.');
		}
		if (this.chunks.length === 0) {
			await this.awaitData();
		}
		if (this.chunks.length === 0) {
			throw new Error('Invalid state: no bytes available after awaiting data');
		}
		// No max bytes or all data fits into the result.
		if (maxBytes === undefined || maxBytes > this.fillLevel) {
			const result = new Uint8Array(this.fillLevel);
			let offset = 0;
			for (const chunk of this.chunks) {
				result.set(chunk, offset);
				offset += chunk.byteLength;
			}
			this.chunks = [];
			this.fillLevel = 0;
			this.signalSpace();
			return result;
		}

		const chunk = this.chunks[0];
		// The first chunk is bigger than the maxBytes. Although not optimal we need
		// to split it up
		if (chunk.byteLength > maxBytes) {
			const result = chunk.subarray(0, maxBytes);
			this.chunks[0] = chunk.subarray(maxBytes);
			this.fillLevel -= maxBytes;
			this.signalSpace();
			return result;
		} else {
			let resultSize = chunk.byteLength;
			for (let i = 1; i < this.chunks.length; i++) {
				if (resultSize + this.chunks[i].byteLength > maxBytes) {
					break;
				}
			}
			const result = new Uint8Array(resultSize);
			let offset = 0;
			for (let i = 0; i < this.chunks.length; i++) {
				const chunk = this.chunks.shift()!;
				if (offset + chunk.byteLength > maxBytes) {
					break;
				}
				result.set(chunk, offset);
				offset += chunk.byteLength;
				this.fillLevel -= chunk.byteLength;
			}
			this.signalSpace();
			return result;
		}
	}

	public [Symbol.asyncIterator](): AsyncIterableIterator<Uint8Array> {
		const result: AsyncIterableIterator<Uint8Array> = {
			[Symbol.asyncIterator]() {
				return result;
			},
			next: async () => {
				if (this.chunks.length === 0) {
					await this.awaitData();
				}
				if (this.chunks.length === 0) {
					return { done: true, value: undefined };
				}
				const chunk = this.chunks.shift()!;
				this.fillLevel -= chunk.byteLength;
				this.signalSpace();
				return { done: false, value: chunk };
			}
		};
		return result;
	}

	private awaitFillLevel(targetFillLevel: number): Promise<void> {
		this._targetFillLevel = targetFillLevel;
		return new Promise<void>((resolve) => {
			this._awaitFillLevel = resolve;
		});
	}

	private signalSpace(): void {
		if (this._awaitFillLevel === undefined) {
			return;
		}
		// Not enough space.
		if (this.fillLevel > this._targetFillLevel) {
			return;
		}
		this._awaitFillLevel();
		this._awaitFillLevel = undefined;
		this._targetFillLevel = 0;
	}

	private awaitData(): Promise<void> {
		return new Promise<void>((resolve) => {
			this._awaitData = resolve;
		});
	}

	private signalData(): void {
		if (this._awaitData === undefined) {
			return;
		}
		this._awaitData();
		this._awaitData = undefined;
	}
}


export abstract class WasiProcess {

	private state: 'created' | 'initialized' | 'running' | 'exited';
	private readonly programName: string;
	protected readonly options: Options;
	private deviceDrivers: DeviceDrivers;
	private resolveCallback: ((value: number) => void) | undefined;
	private threadIdCounter: number;
	private readonly fileDescriptors: FileDescriptors;
	private environmentService!: EnvironmentWasiService;
	private processService!: ProcessWasiService;
	private readonly preOpenDirectories: Map<string, { driver: FileSystemDeviceDriver; fd: FileDescriptor | undefined }>;

	private _stdin: Writable | undefined;
	private _stdout: Readable | undefined;
	private _stderr: Readable | undefined;

	constructor(programName: string, options: Options = {}) {
		this.programName = programName;
		this.options = options;
		this.deviceDrivers = WasiKernel.createLocalDeviceDrivers();
		this.threadIdCounter = 2;
		this.fileDescriptors = new FileDescriptors();
		this.preOpenDirectories = new Map();
		this.state = 'created';
		this._stdin = undefined;
		this._stdout = undefined;
		this._stderr = undefined;
	}

	get stdin(): Writable | undefined {
		return this._stdin;
	}

	get stdout(): Readable | undefined {
		return this._stdout;
	}

	get stderr(): Readable | undefined {
		return this._stderr;
	}

	public async initialize(): Promise<void> {
		if (this.state !== 'created') {
			throw new Error('WasiProcess already initialized or running');
		}
		const options = this.options;
		// Map directories
		if (options.mapDir === true) {
			const folders = workspace.workspaceFolders;
			if (folders !== undefined) {
				if (folders.length === 1) {
					this.mapWorkspaceFolder(folders[0], true);
				} else {
					for (const folder of folders) {
						this.mapWorkspaceFolder(folder, false);
					}
				}
			}
		} else if (Array.isArray(options.mapDir)) {
			for (const entry of options.mapDir) {
				if (!MapDirEntry.is(entry)) {
					continue;
				}
				this.mapDirEntry(entry);
			}
		}
		// Setup stdio file descriptors
		const stdio: $Stdio = Object.assign({ in: 'console', out: 'console', err: 'console'}, options.stdio);
		await this.handleConsole(stdio);
		await this.handleTerminal(stdio);
		await this.handleFiles(stdio);
		await this.handlePipes(stdio);

		this.environmentService = EnvironmentWasiService.create(
			this.fileDescriptors, this.programName,
			this.preOpenDirectories.entries(), options
		);
		this.processService = {
			proc_exit: async (_memory, exitCode: exitcode) => {
				await this.terminate();
				if (this.resolveCallback !== undefined) {
					this.resolveCallback(exitCode);
				}
				return Promise.resolve(Errno.success);
			},
			thread_exit: async (_memory, tid: u32) => {
				await this.threadEnded(tid);
				return Promise.resolve(Errno.success);
			},
			'thread-spawn': async (_memory, start_args: ptr) => {
				try {
					const tid = this.threadIdCounter++;
					const clock: Clock = Clock.create();
					const wasiService: WasiService = Object.assign({},
						this.environmentService,
						ClockWasiService.create(clock),
						DeviceWasiService.create(this.deviceDrivers, this.fileDescriptors, clock, options),
						this.processService
					);
					await this.startThread(wasiService, tid, start_args);
					return Promise.resolve(tid);
				} catch (error) {
					return Promise.resolve(-1);
				}
			}
		};
		this.state = 'initialized';
	}

	public async run(): Promise<number> {
		if (this.state !== 'initialized') {
			throw new Error('WasiProcess is not initialized');
		}
		return new Promise(async (resolve) => {
			this.resolveCallback = resolve;
			const clock: Clock = Clock.create();
			const wasiService: WasiService = Object.assign({},
				this.environmentService,
				ClockWasiService.create(clock),
				DeviceWasiService.create(this.deviceDrivers, this.fileDescriptors, clock, this.options),
				this.processService
			);
			const result = this.startMain(wasiService);
			this.state = 'running';
			return result;
		});
	}

	public abstract terminate(): Promise<number>;

	protected abstract startMain(wasiService: WasiService): Promise<void>;

	protected abstract startThread(wasiService: WasiService, tid: u32, start_arg: ptr): Promise<void>;

	protected abstract threadEnded(tid: u32): Promise<void>;

	protected doesImportMemory(module: WebAssembly.Module): boolean {
		const imports = WebAssembly.Module.imports(module);
		for (const item of imports) {
			if (item.kind === 'memory' && item.name === 'memory') {
				return true;
			}
		}
		return false;
	}

	private mapWorkspaceFolder(folder: WorkspaceFolder, single: boolean): void {
		const path = RAL().path;
		const mountPoint: string = single
			? path.join(path.sep, 'workspace')
			: path.join(path.sep, 'workspaces', folder.name);

		this.mapDirEntry({ vscode_fs: folder.uri, mountPoint: mountPoint });
	}

	private mapDirEntry(entry: MapDirEntry): void {
		let deviceDriver: FileSystemDeviceDriver;
		if (!this.deviceDrivers.hasByUri(entry.vscode_fs)) {
			deviceDriver = vscfs.create(this.deviceDrivers.next(), entry.vscode_fs);
			this.deviceDrivers.add(deviceDriver);
		} else {
			deviceDriver = this.deviceDrivers.getByUri(entry.vscode_fs) as FileSystemDeviceDriver;
		}
		this.preOpenDirectories.set(entry.mountPoint, { driver: deviceDriver, fd: undefined });
	}

	private async handleConsole(stdio: $Stdio): Promise<void> {
		if (stdio.in.kind === 'console') {
			this.fileDescriptors.add(WasiKernel.console.createStdioFileDescriptor(0));
		}
		if (stdio.out.kind === 'console') {
			this.fileDescriptors.add(WasiKernel.console.createStdioFileDescriptor(1));
		}
		if (stdio.out.kind === 'console') {
			this.fileDescriptors.add(WasiKernel.console.createStdioFileDescriptor(2));
		}
	}

	private async handleTerminal(stdio: $Stdio): Promise<void> {
		const terminalDevices: Map<WasiPseudoterminal, CharacterDeviceDriver> = new Map();
		if (stdio.in.kind === 'terminal') {
			this.fileDescriptors.add(this.getTerminalDevice(terminalDevices, stdio.in.terminal as WasiPseudoterminal).createStdioFileDescriptor(0));
		}
		if (stdio.out.kind === 'terminal') {
			this.fileDescriptors.add(this.getTerminalDevice(terminalDevices, stdio.out.terminal as WasiPseudoterminal).createStdioFileDescriptor(1));
		}
		if (stdio.err.kind === 'terminal') {
			this.fileDescriptors.add(this.getTerminalDevice(terminalDevices, stdio.err.terminal as WasiPseudoterminal).createStdioFileDescriptor(2));
		}
	}

	private getTerminalDevice(devices: Map<WasiPseudoterminal, CharacterDeviceDriver>, terminal: WasiPseudoterminal): CharacterDeviceDriver {
		let result = devices.get(terminal);
		if (result === undefined) {
			result = tdd.create(this.deviceDrivers.next(), terminal);
			devices.set(terminal, result);
			this.deviceDrivers.add(result);
		}
		return result;
	}

	private async handleFiles(stdio: $Stdio): Promise<void>{
		if (stdio.in.kind === 'file') {
			await this.handleFileDescriptor(stdio.in, 0);
		}
		if (stdio.out.kind === 'file') {
			await this.handleFileDescriptor(stdio.out, 1);
		}
		if (stdio.err.kind === 'file') {
			await this.handleFileDescriptor(stdio.err, 2);
		}
	}

	private async handleFileDescriptor(descriptor: StdioFileDescriptor, fd: 0 | 1 | 2): Promise<void> {
		const preOpened = Array.from(this.preOpenDirectories.entries());
		for (const entry of preOpened) {
			const mountPoint = entry[0];
			if (mountPoint[mountPoint.length - 1] !== '/') {
				entry[0] = mountPoint + '/';
			}
		}
		preOpened.sort((a, b) => b[0].length - a[0].length);
		for (const preOpenEntry of preOpened) {
			const mountPoint = preOpenEntry[0];
			if (descriptor.path.startsWith(mountPoint)) {
				const driver = preOpenEntry[1].driver;
				const fileDescriptor = await driver.createStdioFileDescriptor(
					Lookupflags.none,
					descriptor.path.substring(mountPoint.length),
					descriptor.oflags,
					undefined,
					descriptor.fdflags,
					fd
				);
				this.fileDescriptors.add(fileDescriptor);
				break;
			}
		}
	}

	private async handlePipes(stdio: $Stdio): Promise<void> {
		if (stdio.in.kind === 'pipe') {
			this._stdin = new StdioStream(StreamMode.writeable);
		}
		if (stdio.out.kind === 'pipe') {
			this._stdout = new StdioStream(StreamMode.readable);
		}
		if (stdio.err.kind === 'pipe') {
			this._stderr = new StdioStream(StreamMode.readable);
		}
		if (this._stdin === undefined && this._stdout === undefined && this._stderr === undefined) {
			return;
		}
		const pipeDevice = pdd.create(this.deviceDrivers.next(), this._stdin as StdioStream | undefined, this._stdout as StdioStream | undefined, this._stderr as StdioStream | undefined);
		if (this._stdin !== undefined) {
			this.fileDescriptors.add(pipeDevice.createStdioFileDescriptor(0));
		}
		if (this._stdout !== undefined) {
			this.fileDescriptors.add(pipeDevice.createStdioFileDescriptor(1));
		}
		if (this._stderr !== undefined) {
			this.fileDescriptors.add(pipeDevice.createStdioFileDescriptor(2));
		}
		this.deviceDrivers.add(pipeDevice);
	}
}
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/// <reference path="../../typings/webAssemblyCommon.d.ts" />

import RAL from './ral';
import { Event, EventEmitter, Uri, WorkspaceFolder, workspace } from 'vscode';

import { MapDirEntry, Options, StdioConsoleDescriptor, StdioDescriptor, StdioFileDescriptor } from './api';
import { ptr, size, u32 } from './baseTypes';
import { FileSystemDeviceDriver } from './deviceDriver';
import { FileDescriptors } from './fileDescriptor';
import * as vscfs from './vscodeFileSystemDriver';
import * as vrfs from './virtualRootFS';
import * as tdd from './terminalDriver';
import * as pdd from './pipeDriver';
import { DeviceWasiService, ProcessWasiService, EnvironmentWasiService, WasiService, Clock, ClockWasiService, WasiOptions } from './service';
import WasiKernel, { DeviceDrivers } from './kernel';
import { Errno, Lookupflags, exitcode } from './wasi';
import { CharacterDeviceDriver } from './deviceDriver';
import { WasmPseudoterminal } from './terminal';

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
	onData: Event<Uint8Array>;
}


class DestroyError extends Error {
	constructor() {
		super('Pipe got destroyed');
	}
}

abstract class StdioStream implements Writable {

	private static BufferSize = 16384;

	protected chunks: Uint8Array[];
	protected fillLevel: number;

	private _targetFillLevel: number;
	private _awaitFillLevel: (() => void) | undefined;
	private _awaitFillLevelReject: ((err: Error) => void) | undefined;

	constructor() {
		this.chunks = [];
		this.fillLevel = 0;
		this._targetFillLevel = StdioStream.BufferSize;
	}

	public async write(chunk: Uint8Array): Promise<void> {
		// We have enough space
		if (this.fillLevel + chunk.byteLength <= StdioStream.BufferSize) {
			this.chunks.push(chunk);
			this.fillLevel += chunk.byteLength;
			this.signalData();
			return;
		}
		// What for the necessary space.
		const targetFillLevel = Math.max(0, StdioStream.BufferSize - chunk.byteLength);
		try {
			await this.awaitFillLevel(targetFillLevel);
			if (this.fillLevel > targetFillLevel) {
				throw new Error(`Invalid state: fillLevel should be <= ${targetFillLevel}`);
			}
			this.chunks.push(chunk);
			this.fillLevel += chunk.byteLength;
			this.signalData();
			return;
		} catch (error) {
			if (error instanceof DestroyError) {
				return;
			}
			throw error;
		}
	}

	public async destroy(): Promise<void> {
		this.chunks = [];
		this.fillLevel = 0;
		this._targetFillLevel = StdioStream.BufferSize;
		this._awaitFillLevel = undefined;
		if (this._awaitFillLevelReject !== undefined) {
			this._awaitFillLevelReject(new DestroyError());
			this._awaitFillLevelReject = undefined;
		}
	}

	private awaitFillLevel(targetFillLevel: number): Promise<void> {
		this._targetFillLevel = targetFillLevel;
		return new Promise<void>((resolve, reject) => {
			this._awaitFillLevel = resolve;
			this._awaitFillLevelReject = reject;
		});
	}

	protected signalSpace(): void {
		if (this._awaitFillLevel === undefined) {
			return;
		}
		// Not enough space.
		if (this.fillLevel > this._targetFillLevel) {
			return;
		}
		this._awaitFillLevel();
		this._awaitFillLevel = undefined;
		this._targetFillLevel = StdioStream.BufferSize;
	}

	protected abstract signalData(): void;

}

class StdinStream extends StdioStream implements Writable {

	private readonly encoding: 'utf-8';
	private readonly encoder: RAL.TextEncoder;

	private _awaitData: (() => void) | undefined;
	private _awaitDataReject: ((err: Error) => void) | undefined;

	constructor(encoding?: 'utf-8') {
		super();
		this.encoding = encoding ?? 'utf-8';
		this.encoder = RAL().TextEncoder.create(this.encoding);
	}

	public async write(chunk: Uint8Array | string): Promise<void> {
		return super.write(typeof chunk === 'string' ? this.encoder.encode(chunk) : chunk);
	}

	public async read(maxBytes: size): Promise<Uint8Array> {
		if (this.chunks.length === 0) {
			try {
				await this.awaitData();
			} catch (error) {
				if (error instanceof DestroyError) {
					return new Uint8Array(0);
				}
				throw error;
			}
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

	public async destroy(): Promise<void> {
		if (this._awaitDataReject !== undefined) {
			this._awaitDataReject(new DestroyError());
			this._awaitDataReject = undefined;
		}
		return super.destroy();
	}

	private awaitData(): Promise<void> {
		return new Promise<void>((resolve) => {
			this._awaitData = resolve;
		});
	}

	protected signalData(): void {
		if (this._awaitData === undefined) {
			return;
		}
		this._awaitData();
		this._awaitData = undefined;
	}
}

class StdoutStream extends StdioStream implements Readable {

	private readonly _onData = new EventEmitter<Uint8Array>();

	constructor() {
		super();
		this._onData = new EventEmitter();

	}

	public get onData(): Event<Uint8Array> {
		return this._onData.event;
	}

	public destroy(): Promise<void> {
		if (this.chunks.length > 0) {
			for (const chunk of this.chunks) {
				this._onData.fire(chunk);
			}
		}
		return super.destroy();
	}

	protected signalData(): void {
		RAL().timer.setImmediate(() => this.triggerData());
	}

	triggerData() {
		if (this.chunks.length === 0) {
			return;
		}
		const chunk = this.chunks.shift()!;
		this.fillLevel -= chunk.byteLength;
		this._onData.fire(chunk);
		this.signalSpace();
		if (this.chunks.length > 0) {
			RAL().timer.setImmediate(() => this.triggerData());
		}
	}
}

namespace MapDir {
	export function mapWorkspaceFolders(value: Options['mapDir'] | undefined): boolean {
		return value !== undefined && (value === true || (value as { folders: boolean; entries: MapDirEntry[] }).folders === true);
	}
	export function getMapEntries(value: Options['mapDir'] | undefined): MapDirEntry[] | undefined {
		if (value === undefined || value === true) {
			return undefined;
		}
		if (Array.isArray(value)) {
			return value;
		}
		return (value as { folders: boolean; entries: MapDirEntry[] }).entries;
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
	private readonly preOpenDirectories: Map<string, FileSystemDeviceDriver>;
	private virtualRootFileSystem: vrfs.VirtualRootFileSystemDeviceDriver | undefined;

	private _stdin: StdinStream | undefined;
	private _stdout: StdoutStream | undefined;
	private _stderr: StdoutStream | undefined;

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

		// Map directories
		const mapWorkspaceFolders = MapDir.mapWorkspaceFolders(this.options.mapDir);
		const mapEntries = MapDir.getMapEntries(this.options.mapDir);
		if (mapWorkspaceFolders) {
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
		}

		if (mapEntries !== undefined) {
			for (const entry of mapEntries) {
				if (!MapDirEntry.is(entry)) {
					continue;
				}
				this.mapDirEntry(entry);
			}
		}

		let needsRootFs = false;
		for (const mountPoint of this.preOpenDirectories.keys()) {
			if (mountPoint === '/') {
				if (this.preOpenDirectories.size > 1) {
					throw new Error(`Cannot mount root directory when other directories are mounted as well.`);
				}
			} else {
				needsRootFs = true;
			}
		}
		if (needsRootFs) {
			const mountPoints: Map<string, FileSystemDeviceDriver> = new Map(Array.from(this.preOpenDirectories.entries()));
			this.virtualRootFileSystem = vrfs.create(this.deviceDrivers.next(), mountPoints);
			this.preOpenDirectories.set('/', this.virtualRootFileSystem);
			this.deviceDrivers.add(this.virtualRootFileSystem);
		}

		const args: undefined | string[] = this.options.args !== undefined ? [] : undefined;
		if (this.options.args !== undefined && args !== undefined) {
			const path = RAL().path;
			const uriToMountPoint: [string, string][] = [];
			for (const [mountPoint, driver] of this.preOpenDirectories) {
				let vsc_uri = driver.uri.toString(true);
				if (!vsc_uri.endsWith(path.sep)) {
					vsc_uri += path.sep;
				}
				uriToMountPoint.push([vsc_uri, mountPoint]);
			}
			for (const arg of this.options.args) {
				if (typeof arg === 'string') {
					args.push(arg);
				} else if (arg instanceof Uri) {
					const arg_str = arg.toString(true);
					for (const [uri, mountPoint] of uriToMountPoint) {
						if (arg_str.startsWith(uri)) {
							args.push(path.join(mountPoint, arg_str.substring(uri.length)));
						}
					}
				} else {
					throw new Error('Invalid argument type');
				}
			}
		}

		// Setup stdio file descriptors
		const con: StdioConsoleDescriptor = { kind: 'console' };
		const stdio: $Stdio = Object.assign({ in: con, out: con, err: con}, this.options.stdio);
		await this.handleConsole(stdio);
		await this.handleTerminal(stdio);
		await this.handleFiles(stdio);
		await this.handlePipes(stdio);

		const options: WasiOptions = Object.assign({}, (delete Object.assign({}, this.options).args), { args });

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
						DeviceWasiService.create(this.deviceDrivers, this.fileDescriptors, clock, this.virtualRootFileSystem, options),
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
				DeviceWasiService.create(this.deviceDrivers, this.fileDescriptors, clock, this.virtualRootFileSystem, this.options),
				this.processService
			);
			const result = this.startMain(wasiService);
			this.state = 'running';
			return result;
		});
	}

	public abstract terminate(): Promise<number>;

	protected async destroyStreams(): Promise<void> {
		if (this._stdin !== undefined) {
			await this._stdin.destroy();
			this._stdin = undefined;
		}
		if (this._stdout !== undefined) {
			await this._stdout.destroy();
			this._stdout = undefined;
		}
		if (this._stderr !== undefined) {
			await this._stderr.destroy();
			this._stderr = undefined;
		}
	}

	protected abstract startMain(wasiService: WasiService): Promise<void>;

	protected abstract startThread(wasiService: WasiService, tid: u32, start_arg: ptr): Promise<void>;

	protected abstract threadEnded(tid: u32): Promise<void>;

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
		this.preOpenDirectories.set(entry.mountPoint, deviceDriver);
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
		const terminalDevices: Map<WasmPseudoterminal, CharacterDeviceDriver> = new Map();
		if (stdio.in.kind === 'terminal') {
			this.fileDescriptors.add(this.getTerminalDevice(terminalDevices, stdio.in.terminal as WasmPseudoterminal).createStdioFileDescriptor(0));
		}
		if (stdio.out.kind === 'terminal') {
			this.fileDescriptors.add(this.getTerminalDevice(terminalDevices, stdio.out.terminal as WasmPseudoterminal).createStdioFileDescriptor(1));
		}
		if (stdio.err.kind === 'terminal') {
			this.fileDescriptors.add(this.getTerminalDevice(terminalDevices, stdio.err.terminal as WasmPseudoterminal).createStdioFileDescriptor(2));
		}
	}

	private getTerminalDevice(devices: Map<WasmPseudoterminal, CharacterDeviceDriver>, terminal: WasmPseudoterminal): CharacterDeviceDriver {
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
				const driver = preOpenEntry[1];
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
			this._stdin = new StdinStream(this.options.encoding);
		}
		if (stdio.out.kind === 'pipe') {
			this._stdout = new StdoutStream();
		}
		if (stdio.err.kind === 'pipe') {
			this._stderr = new StdoutStream();
		}
		if (this._stdin === undefined && this._stdout === undefined && this._stderr === undefined) {
			return;
		}
		const pipeDevice = pdd.create(this.deviceDrivers.next(), this._stdin as StdinStream | undefined, this._stdout as StdoutStream | undefined, this._stderr as StdoutStream | undefined);
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
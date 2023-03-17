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

type $StdioDescriptor = StdioDescriptor | 'console';
type $Stdio = {
	in: $StdioDescriptor;
	out: $StdioDescriptor;
	err: $StdioDescriptor;
};

export interface Writable {
	write(chunk: Uint8Array | string): Promise<void>;
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
	private readonly terminalDevices: Map<WasiPseudoterminal, CharacterDeviceDriver>;

	private _stdin: Writable | null;

	constructor(programName: string, options: Options = {}) {
		this.programName = programName;
		this.options = options;
		this.deviceDrivers = WasiKernel.deviceDrivers;
		this.threadIdCounter = 2;
		this.fileDescriptors = new FileDescriptors();
		this.preOpenDirectories = new Map();
		this.terminalDevices = new Map();
		this.state = 'created';
		this._stdin = null;
	}

	get stdin(): Writable | null {
		return this._stdin;
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
		await this.handleStdio(stdio.in, 0);
		await this.handleStdio(stdio.out, 1);
		await this.handleStdio(stdio.err, 2);

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

	private async handleStdio(descriptor: $StdioDescriptor, fd: 0 | 1 | 2): Promise<void> {
		if (descriptor === 'console') {
			this.fileDescriptors.add(WasiKernel.console.createStdioFileDescriptor(fd));
		} else if (descriptor === 'pipe') {

		} else if (descriptor.kind === 'terminal') {
			if (!WasiPseudoterminal.is(descriptor.terminal)) {
				throw new Error('Terminal must be an WASI pseudo terminal created using the WASI Core facade.');
			}
			let terminalDevice = this.terminalDevices.get(descriptor.terminal);
			if (terminalDevice === undefined) {
				terminalDevice = tdd.create(this.deviceDrivers.next(), descriptor.terminal);
				this.terminalDevices.set(descriptor.terminal, terminalDevice);
				this.deviceDrivers.add(terminalDevice);
			}
			this.fileDescriptors.add(terminalDevice.createStdioFileDescriptor(fd));
		} else if (descriptor.kind === 'file') {
			await this.handleStdioFileDescriptor(descriptor, fd);
		}
	}

	private async handleStdioFileDescriptor(descriptor: StdioFileDescriptor, fd: 0 | 1 | 2): Promise<void> {
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

	private async handlePipeDescriptor(fd: 0 | 1 | 2): Promise<void> {
	}

	protected createStdinStream(): Writable & { read: (maxBytes: size) => Promise<Uint8Array> } {
		const options = this.options;
		return new class {
			private buffer: Uint8Array = new Uint8Array(16384);
			private writeIndex: number = 0;
			private encoder: RAL.TextEncoder = RAL().TextEncoder.create(options.encoding);
			private spaceNeeded: number = 0;
			private _awaitSpace: (() => void) | undefined = undefined;
			private _awaitData: (() => void) | undefined = undefined;

			public write(chunk: Uint8Array | string): Promise<void> {
				if (typeof chunk === 'string') {
					chunk = this.encoder.encode(chunk);
				}
				// We have enough space
				if (this.writeIndex + chunk.length <= this.buffer.length) {
					this.buffer.set(chunk, this.writeIndex);
					this.writeIndex += chunk.length;
					return Promise.resolve();
				} else if (this.writeIndex === 0) {
					// We don't have enough space and the buffer is empty
					this.buffer = chunk;
					return Promise.resolve();
				}
				const spaceNeeded = Math.min(this.buffer.length, chunk.length);
			}
			public async read(maxBytes: size): Promise<Uint8Array> {
				if (this.writeIndex === 0) {
					await this.awaitData();
				}
				if (this.writeIndex === 0) {
					throw new Error('Invalid state: no bytes available after awaiting data');
				}
				const toRead = Math.min(this.writeIndex, maxBytes);
				const result = new Uint8Array(toRead);
				result.set(this.buffer.subarray(0, toRead));
				this.buffer.copyWithin(0, toRead, this.writeIndex);
				this.writeIndex -= toRead;
				this.signalSpace();
				return result;
			}

			private awaitSpace(spaceNeeded: number): Promise<void> {
				this.spaceNeeded = spaceNeeded;
				return new Promise<void>((resolve) => {
					this._awaitSpace = resolve;
				});
			}

			private signalSpace(): void {
				if (this._awaitSpace === undefined) {
					return;
				}
				if (this.writeIndex !== 0 && this.spaceNeeded > this.buffer.length - this.writeIndex) {
					// Not enough space
					return;
				}
				this._awaitSpace();
				this._awaitSpace = undefined;
				this.spaceNeeded = 0;
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
		};
	}
}
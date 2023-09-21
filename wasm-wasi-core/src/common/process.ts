/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/// <reference path="../../typings/webAssemblyCommon.d.ts" />

import RAL from './ral';
import { LogOutputChannel, Uri, WorkspaceFolder, window, workspace } from 'vscode';

import type {
	ExtensionLocationDescriptor, MemoryFileSystemDescriptor, MountPointDescriptor, ProcessOptions, StdioConsoleDescriptor, Stdio,
	StdioFileDescriptor, VSCodeFileSystemDescriptor, WorkspaceFolderDescriptor, Readable, Writable, MountPointOptions, RootFileSystemOptions,
	WasmPseudoterminal
} from './api';
import type { ptr, u32 } from './baseTypes';
import type { FileSystemDeviceDriver } from './deviceDriver';
import { FileDescriptors } from './fileDescriptor';
import * as vrfs from './rootFileSystemDriver';
import * as tdd from './terminalDriver';
import * as pdd from './pipeDriver';
import { DeviceWasiService, ProcessWasiService, EnvironmentWasiService, WasiService, Clock, ClockWasiService, EnvironmentOptions } from './service';
import WasiKernel, { DeviceDrivers } from './kernel';
import { Errno, Lookupflags, exitcode } from './wasi';
import { CharacterDeviceDriver } from './deviceDriver';
import { WritableStream, ReadableStream } from './streams';
import { WasmRootFileSystemImpl } from './fileSystem';

type $Stdio = {
	in: NonNullable<Stdio['in']> | { kind: 'console' };
	out: NonNullable<Stdio['out']>;
	err: NonNullable<Stdio['err']>;
};

namespace MapDirDescriptor {
	export function getDescriptors(descriptors: MountPointDescriptor[] | undefined) : { workspaceFolders: WorkspaceFolderDescriptor | undefined; extensions: ExtensionLocationDescriptor[]; vscodeFileSystems: VSCodeFileSystemDescriptor[]; memoryFileSystems: MemoryFileSystemDescriptor[]} {
		let workspaceFolders: WorkspaceFolderDescriptor | undefined;
		const extensions: ExtensionLocationDescriptor[] = [];
		const vscodeFileSystems: VSCodeFileSystemDescriptor[] = [];
		const memoryFileSystems: MemoryFileSystemDescriptor[] = [];
		if (descriptors === undefined) {
			return { workspaceFolders, extensions, vscodeFileSystems, memoryFileSystems };
		}
		for (const descriptor of descriptors) {
			if (descriptor.kind === 'workspaceFolder') {
				workspaceFolders = descriptor;
			} else if (descriptor.kind === 'extensionLocation') {
				extensions.push(descriptor);
			} else if (descriptor.kind === 'vscodeFileSystem') {
				vscodeFileSystems.push(descriptor);
			} else if (descriptor.kind === 'memoryFileSystem') {
				memoryFileSystems.push(descriptor);
			}
		}
		return { workspaceFolders, extensions, vscodeFileSystems, memoryFileSystems };
	}
}

namespace MountPointOptions {
	export function is(value: any): value is MountPointOptions {
		const candidate = value as MountPointOptions;
		return candidate && Array.isArray(candidate.mountPoints);
	}
}

namespace RootFileSystemOptions {
	export function is(value: any): value is { rootFileSystem: WasmRootFileSystemImpl } {
		const candidate = value as RootFileSystemOptions;
		return candidate && candidate.rootFileSystem instanceof WasmRootFileSystemImpl;
	}
}

let $channel: LogOutputChannel | undefined;
function channel(): LogOutputChannel {
	if ($channel === undefined) {
		$channel = window.createOutputChannel('Wasm Core', { log: true });
	}
	return $channel;
}

export abstract class WasiProcess {

	private _state: 'created' | 'initialized' | 'running' | 'exiting' | 'exited';
	private readonly programName: string;
	protected readonly options: Omit<ProcessOptions, 'trace'> & { trace: LogOutputChannel | undefined };
	private localDeviceDrivers: DeviceDrivers;
	private resolveCallback: ((value: number) => void) | undefined;
	private threadIdCounter: number;
	private readonly fileDescriptors: FileDescriptors;
	private environmentService!: EnvironmentWasiService;
	private processService!: ProcessWasiService;
	private readonly preOpenDirectories: Map<string, FileSystemDeviceDriver>;
	private virtualRootFileSystem: vrfs.RootFileSystemDeviceDriver | undefined;

	private _stdin: WritableStream | undefined;
	private _stdout: ReadableStream | undefined;
	private _stderr: ReadableStream | undefined;

	constructor(programName: string, options: ProcessOptions = {}) {
		this.programName = programName;
		let opt = Object.assign({}, options);
		delete opt.trace;
		if (options.trace === true) {
			this.options = Object.assign({}, opt, { trace: channel() });
		} else {
			this.options = Object.assign({}, opt, { trace: undefined });
		}
		this.threadIdCounter = 2;
		this.localDeviceDrivers = WasiKernel.createLocalDeviceDrivers();
		this.fileDescriptors = new FileDescriptors();
		this.preOpenDirectories = new Map();
		this._state = 'created';
		this._stdin = undefined;
		this._stdout = undefined;
		this._stderr = undefined;
	}

	public get stdin(): Writable | undefined {
		return this._stdin;
	}

	public get stdout(): Readable | undefined {
		return this._stdout;
	}

	public get stderr(): Readable | undefined {
		return this._stderr;
	}

	protected get state(): typeof this._state {
		return this._state;
	}

	public async initialize(): Promise<void> {
		if (this._state !== 'created') {
			throw new Error('WasiProcess already initialized or running');
		}

		if (MountPointOptions.is(this.options)) {
			const { workspaceFolders, extensions, vscodeFileSystems, memoryFileSystems } = MapDirDescriptor.getDescriptors(this.options.mountPoints);
			if (workspaceFolders !== undefined) {
				const folders = workspace.workspaceFolders;
				if (folders !== undefined) {
					if (folders.length === 1) {
						await this.mapWorkspaceFolder(folders[0], true);
					} else {
						for (const folder of folders) {
							await this.mapWorkspaceFolder(folder, false);
						}
					}
				}
			}
			if (extensions.length > 0) {
				for (const descriptor of extensions) {
					const extensionFS = await WasiKernel.getOrCreateFileSystemByDescriptor(this.localDeviceDrivers, descriptor);
					this.preOpenDirectories.set(descriptor.mountPoint, extensionFS);
				}
			}
			if (vscodeFileSystems.length > 0) {
				for (const descriptor of vscodeFileSystems) {
					const fs = await WasiKernel.getOrCreateFileSystemByDescriptor(this.localDeviceDrivers, descriptor);
					this.preOpenDirectories.set(descriptor.mountPoint, fs);
				}
			}
			if (memoryFileSystems.length > 0) {
				for (const descriptor of memoryFileSystems) {
					const dd = await WasiKernel.getOrCreateFileSystemByDescriptor(this.localDeviceDrivers, descriptor);
					this.preOpenDirectories.set(descriptor.mountPoint, dd);
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
				this.virtualRootFileSystem = vrfs.create(WasiKernel.nextDeviceId(), this.fileDescriptors, mountPoints);
				this.preOpenDirectories.set('/', this.virtualRootFileSystem);
				this.localDeviceDrivers.add(this.virtualRootFileSystem);
			}
		} else if (RootFileSystemOptions.is(this.options)) {
			const devices = this.options.rootFileSystem.getDeviceDrivers();
			const preOpens = this.options.rootFileSystem.getPreOpenDirectories();
			this.virtualRootFileSystem = this.options.rootFileSystem.getVirtualRootFileSystem();
			for (const entry of preOpens) {
				this.preOpenDirectories.set(entry[0], entry[1]);
			}
			for (const device of devices) {
				this.localDeviceDrivers.add(device);
			}
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
					let mapped: boolean = false;
					for (const [uri, mountPoint] of uriToMountPoint) {
						if (arg_str.startsWith(uri)) {
							args.push(path.join(mountPoint, arg_str.substring(uri.length)));
							mapped = true;
							break;
						}
					}
					if (!mapped) {
						throw new Error(`Could not map argument ${arg_str} to a mount point.`);
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

		const noArgsOptions = Object.assign({}, this.options);
		delete noArgsOptions.args;
		const options: EnvironmentOptions = Object.assign({}, noArgsOptions, { args });

		this.environmentService = EnvironmentWasiService.create(
			this.fileDescriptors, this.programName,
			this.preOpenDirectories.entries(), options
		);
		this.processService = {
			proc_exit: async (_memory, exitCode: exitcode) => {
				this._state = 'exiting';
				await this.procExit();
				this.resolveRunPromise(exitCode);
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
						DeviceWasiService.create(this.localDeviceDrivers, this.fileDescriptors, clock, this.virtualRootFileSystem, options),
						this.processService
					);
					await this.startThread(wasiService, tid, start_args);
					return Promise.resolve(tid);
				} catch (error) {
					return Promise.resolve(-1);
				}
			}
		};
		this._state = 'initialized';
	}

	public async run(): Promise<number> {
		if (this._state !== 'initialized') {
			throw new Error('WasiProcess is not initialized');
		}
		return new Promise<number>(async (resolve, reject) => {
			this.resolveCallback = resolve;
			const clock: Clock = Clock.create();
			const wasiService: WasiService = Object.assign({},
				this.environmentService,
				ClockWasiService.create(clock),
				DeviceWasiService.create(this.localDeviceDrivers, this.fileDescriptors, clock, this.virtualRootFileSystem, this.options),
				this.processService
			);
			this.startMain(wasiService).catch(reject);
			this._state = 'running';
		}).then((exitCode) => {
			this._state = 'exited';
			return exitCode;
		});
	}

	protected abstract procExit(): Promise<void>;

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

	protected async cleanupFileDescriptors(): Promise<void> {
		// Dispose any resources that are still allocated with a file descriptor
		for (const fd of this.fileDescriptors.values()) {
			if (fd.dispose !== undefined) {
				await fd.dispose();
			}
		}
	}

	protected resolveRunPromise(exitCode: exitcode): void {
		if (this.resolveCallback !== undefined) {
			this.resolveCallback(exitCode);
		}
	}

	protected abstract startMain(wasiService: WasiService): Promise<void>;

	protected abstract startThread(wasiService: WasiService, tid: u32, start_arg: ptr): Promise<void>;

	protected abstract threadEnded(tid: u32): Promise<void>;

	private mapWorkspaceFolder(folder: WorkspaceFolder, single: boolean): Promise<void> {
		const path = RAL().path;
		const mountPoint: string = single
			? path.join(path.sep, 'workspace')
			: path.join(path.sep, 'workspaces', folder.name);

		return this.mapDirEntry(folder.uri, mountPoint);
	}

	private async mapDirEntry(vscode_fs: Uri, mountPoint: string): Promise<void> {
		const fs = await WasiKernel.getOrCreateFileSystemByDescriptor(this.localDeviceDrivers, { kind: 'vscodeFileSystem', uri: vscode_fs, mountPoint});
		this.preOpenDirectories.set(mountPoint, fs);
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
			result = tdd.create(WasiKernel.nextDeviceId(), terminal);
			devices.set(terminal, result);
			this.localDeviceDrivers.add(result);
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
					descriptor.openFlags,
					undefined,
					descriptor.openFlags,
					fd
				);
				this.fileDescriptors.add(fileDescriptor);
				break;
			}
		}
	}

	private async handlePipes(stdio: $Stdio): Promise<void> {
		if (stdio.in.kind === 'pipeIn') {
			this._stdin = (stdio.in.pipe as WritableStream) ?? new WritableStream(this.options.encoding);
		}
		if (stdio.out.kind === 'pipeOut') {
			this._stdout = (stdio.out.pipe as ReadableStream) ?? new ReadableStream();
		}
		if (stdio.err.kind === 'pipeOut') {
			this._stderr = (stdio.err.pipe as ReadableStream) ?? new ReadableStream();
		}
		if (this._stdin === undefined && this._stdout === undefined && this._stderr === undefined) {
			return;
		}
		const pipeDevice = pdd.create(WasiKernel.nextDeviceId(), this._stdin as WritableStream | undefined, this._stdout as ReadableStream | undefined, this._stderr as ReadableStream | undefined);
		if (this._stdin !== undefined) {
			this.fileDescriptors.add(pipeDevice.createStdioFileDescriptor(0));
		}
		if (this._stdout !== undefined) {
			this.fileDescriptors.add(pipeDevice.createStdioFileDescriptor(1));
		}
		if (this._stderr !== undefined) {
			this.fileDescriptors.add(pipeDevice.createStdioFileDescriptor(2));
		}
		this.localDeviceDrivers.add(pipeDevice);
	}
}
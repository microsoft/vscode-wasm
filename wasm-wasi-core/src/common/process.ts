/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Uri, WorkspaceFolder, workspace } from 'vscode';

import RAL from './ral';
import { ptr, u32 } from './baseTypes';
import { DeviceDriver, FileSystemDeviceDriver } from './deviceDriver';
import { FileDescriptors } from './fileDescriptor';
import * as vscfs from './vscodeFileSystemDriver';
import * as tdd from './terminalDriver';
import { DeviceWasiService, ProcessWasiService, EnvironmentWasiService, WasiService, Clock, ClockWasiService } from './service';
import WasiKernel, { DeviceDrivers } from './kernel';
import { Errno, exitcode, fd } from './wasi';
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

export abstract class WasiProcess {

	private readonly options: Options;
	private readonly deviceDrivers: DeviceDrivers;
	private resolveCallback: ((value: number) => void) | undefined;
	private threadIdCounter: number;
	private readonly fileDescriptors: FileDescriptors;
	private readonly environmentService: EnvironmentWasiService;
	private readonly processService: ProcessWasiService;
	private readonly preOpenDirectories: Map<string, DeviceDriver>;
	private terminalDevice: CharacterDeviceDriver | undefined;
	private readonly postPrestatDescriptors: StdioFileDescriptor[];

	constructor(programName: string, options: Options = {}) {
		this.options = options;
		this.deviceDrivers = WasiKernel.deviceDrivers;
		this.threadIdCounter = 2;
		this.fileDescriptors = new FileDescriptors();
		this.preOpenDirectories = new Map();
		this.postPrestatDescriptors = [];
		// Map directories
		if (options.mapDir === true) {
			const folders = workspace.workspaceFolders;
			if (folders !== undefined) {
				if (folders.length === 1) {
					this.mapWorkspaceFolder(folders[0], true);
				}
				for (const folder of folders) {
					this.mapWorkspaceFolder(folder, false);
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
		this.handleStdio(stdio.in, 0);
		this.handleStdio(stdio.out, 1);
		this.handleStdio(stdio.err, 2);

		this.environmentService = EnvironmentWasiService.create(this.fileDescriptors, programName, this.preOpenDirectories.entries(), options, { prestatDone: () => this.prestatDone() });
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
	}

	public async run(): Promise<number> {
		return new Promise(async (resolve) => {
			this.resolveCallback = resolve;
			const clock: Clock = Clock.create();
			const wasiService: WasiService = Object.assign({},
				this.environmentService,
				ClockWasiService.create(clock),
				DeviceWasiService.create(this.deviceDrivers, this.fileDescriptors, clock, this.options),
				this.processService
			);
			return this.startMain(wasiService);
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
		this.preOpenDirectories.set(entry.mountPoint, deviceDriver);
	}

	private handleStdio(descriptor: $StdioDescriptor, fd: 0 | 1 | 2): void {
		if (descriptor === 'console') {
			this.fileDescriptors.add(WasiKernel.console.createStdioFileDescriptor(fd));
		} else if (descriptor === 'pipe') {

		} else if (descriptor.kind === 'terminal') {
			if (!WasiPseudoterminal.is(descriptor.terminal)) {
				throw new Error('Terminal must be an WASI pseudo terminal created using the WASI Core facade.');
			}
			if (this.terminalDevice === undefined) {
				this.terminalDevice = tdd.create(this.deviceDrivers.next(), descriptor.terminal);
			}
			this.fileDescriptors.add(this.terminalDevice.createStdioFileDescriptor(fd));
		} else if (descriptor.kind === 'file') {
			this.postPrestatDescriptors.push(descriptor);
		}
	}

	private prestatDone(): void {
		if (this.postPrestatDescriptors.length === 0) {
			return;
		}
		for (const descriptor of this.postPrestatDescriptors) {
		}
	}
}
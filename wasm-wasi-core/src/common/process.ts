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
import { DeviceWasiService, ProcessWasiService, EnvironmentWasiService, WasiService } from './service';
import WasiKernel, { DeviceDrivers } from './kernel';
import { Errno, exitcode, fd } from './wasi';
import { MapDirEntry, Options, Stdio, StdioDescriptor } from './api';

namespace MapDirEntry {
	export function is(value: any): value is MapDirEntry {
		const candidate = value as MapDirEntry;
		return candidate && candidate.vscode_fs instanceof Uri && typeof candidate.mountPoint === 'string';
	}
}

type $StdioDescriptor = StdioDescriptor | 'console';
type $Stdio = {
	in: Stdio['in'] | 'console';
	out: Stdio['out'] | 'console';
	err: Stdio['err'] | 'console'
}

export abstract class WasiProcess {

	private readonly deviceDrivers: DeviceDrivers;
	private resolveCallback: ((value: number) => void) | undefined;
	private threadIdCounter: number;
	private readonly fileDescriptors: FileDescriptors;
	private readonly environmentService: EnvironmentWasiService;
	private readonly processService: ProcessWasiService;
	private readonly preOpenDirectories: Map<string, DeviceDriver>;

	constructor(programName: string, options: Options = {}) {
		this.deviceDrivers = WasiKernel.deviceDrivers;
		this.threadIdCounter = 2;
		this.fileDescriptors = new FileDescriptors();
		this.fileDescriptors.add(WasiKernel.console.createStdioFileDescriptor(1));
		this.fileDescriptors.add(WasiKernel.console.createStdioFileDescriptor(2));
		this.preOpenDirectories = new Map();
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

		const stdio: $Stdio = Object.assign({ in: 'console', out: 'console', err: 'console'}, options.stdio);
		if (stdio.in === 'console') {
		}



		this.environmentService = EnvironmentWasiService.create(this.fileDescriptors, programName, this.preOpenDirectories, options);
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
					const wasiService: WasiService = Object.assign({}, this.environmentService, DeviceWasiService.create(this.fileDescriptors), this.processService);
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
			const wasiService: WasiService = Object.assign({}, this.environmentService, DeviceWasiService.create(this.fileDescriptors), this.processService);
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

	private handleStdio(description: $StdioDescriptor, fd: 0 | 1 | 2): void {
		if (description === 'console') {
			this.fileDescriptors.add(WasiKernel.console.createStdioFileDescriptor(fd));
		} else if (description === 'pipe') {

		} else if (description.kind === 'terminal') {
			
		} else if (description.kind === 'file') {

		}
	}
}
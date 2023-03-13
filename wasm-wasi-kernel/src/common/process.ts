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
import { InstanceWasiService, Options, ProcessWasiService, SharedWasiService, WasiService } from './service';
import WasiKernel from './kernel';
import { Errno, exitcode } from './wasi';

export abstract class WasiProcess {

	private resolveCallback: ((value: number) => void) | undefined;
	private threadIdCounter: number;
	private readonly fileDescriptors: FileDescriptors;
	private readonly sharedService: SharedWasiService;
	private readonly processService: ProcessWasiService;
	private readonly preOpenDirectories: Map<string, DeviceDriver>;

	constructor(programName: string, options: Options = {}, mapWorkspaceFolders: boolean = true) {
		this.threadIdCounter = 2;
		this.fileDescriptors = new FileDescriptors();
		this.fileDescriptors.add(WasiKernel.console.createStdioFileDescriptor(0));
		this.fileDescriptors.add(WasiKernel.console.createStdioFileDescriptor(1));
		this.fileDescriptors.add(WasiKernel.console.createStdioFileDescriptor(2));
		this.preOpenDirectories = new Map();
		if (mapWorkspaceFolders) {
			const folders = workspace.workspaceFolders;
			if (folders !== undefined) {
				if (folders.length === 1) {
					this.mapWorkspaceFolder(folders[0], true);
				}
				for (const folder of folders) {
					this.mapWorkspaceFolder(folder, false);
				}
			}
		}
		this.sharedService = SharedWasiService.create(this.fileDescriptors, programName, this.preOpenDirectories, options);
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
					const wasiService: WasiService = Object.assign({}, this.sharedService, InstanceWasiService.create(this.fileDescriptors), this.processService);
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
			const wasiService: WasiService = Object.assign({}, this.sharedService, InstanceWasiService.create(this.fileDescriptors), this.processService);
			return this.startMain(wasiService);
		});
	}

	public abstract terminate(): Promise<number>;

	protected abstract startMain(wasiService: WasiService): Promise<void>;

	protected abstract startThread(wasiService: WasiService, tid: u32, start_arg: ptr): Promise<void>;

	protected abstract threadEnded(tid: u32): Promise<void>;

	private mapWorkspaceFolder(folder: WorkspaceFolder, single: boolean): void {
		const uri: Uri = folder.uri;
		let deviceDriver: FileSystemDeviceDriver;
		if (!WasiKernel.deviceDrivers.hasByUri(uri)) {
			deviceDriver = vscfs.create(WasiKernel.deviceDrivers.next(), folder.uri);
			WasiKernel.deviceDrivers.add(deviceDriver);
		} else {
			deviceDriver = WasiKernel.deviceDrivers.getByUri(uri) as FileSystemDeviceDriver;
		}

		const path = RAL().path;
		const mountPoint: string = single
			? path.join(path.sep, 'workspace')
			: path.join(path.sep, 'workspaces', folder.name);

		this.preOpenDirectories.set(mountPoint, deviceDriver);
	}

	protected doesImportMemory(module: WebAssembly.Module): boolean {
		const imports = WebAssembly.Module.imports(module);
		for (const item of imports) {
			if (item.kind === 'memory' && item.name === 'memory') {
				return true;
			}
		}
		return false;
	}
}
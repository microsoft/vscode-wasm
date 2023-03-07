/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Uri, WorkspaceFolder, workspace } from 'vscode';

import RAL from './ral';
import { DeviceDriver, DeviceDrivers, FileSystemDeviceDriver } from './deviceDriver';
import { FileDescriptors } from './fileDescriptor';
import * as vscfs from './vscodeFileSystemDriver';
import { InstanceWasiService, Options, SharedWasiService, WasiService } from './wasiService';
import { ptr, u32 } from './baseTypes';

export abstract class WasiProcess {

	private readonly deviceDrivers: DeviceDrivers;
	protected readonly baseUri: Uri;
	private readonly bits: SharedArrayBuffer | Uri;

	private threadIdCounter: number;
	private readonly fileDescriptors: FileDescriptors;
	private readonly sharedService: SharedWasiService;
	private readonly preOpenDirectories: Map<string, DeviceDriver>;

	constructor(deviceDrivers: DeviceDrivers, baseUri: Uri, programName: string, bits: SharedArrayBuffer | Uri, options: Options = {}, mapWorkspaceFolders: boolean = true) {
		this.deviceDrivers = deviceDrivers;
		this.baseUri = baseUri;
		this.bits = bits;

		this.threadIdCounter = 2;
		this.fileDescriptors = new FileDescriptors();
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
	}

	public async run(): Promise<number> {
		return new Promise(async (resolve) => {
			const wasiService: WasiService = Object.assign({}, this.sharedService, InstanceWasiService.create(this.deviceDrivers, this.fileDescriptors, async (exitCode) => {
				await this.terminate();
				resolve(exitCode);
			}, (start_args: ptr) => this.spawnThread(start_args)));
			return this.startMain(wasiService, this.bits);
		});
	}

	public abstract terminate(): Promise<number>;


	private async spawnThread(start_args: ptr): Promise<u32> {
		const tid = this.threadIdCounter++;
		const wasiService: WasiService = Object.assign({}, this.sharedService, InstanceWasiService.create(this.deviceDrivers, this.fileDescriptors, async (_exitCode) => {
			await this.threadEnded(tid);
		}, (start_args: ptr) => this.spawnThread(start_args)));
		await this.startThread(wasiService, this.bits, tid, start_args);
		return Promise.resolve(tid);
	}

	protected abstract startMain(wasiService: WasiService, bits: SharedArrayBuffer | Uri): Promise<void>;

	protected abstract startThread(wasiService: WasiService, bits: SharedArrayBuffer | Uri, tid: u32, start_arg: ptr): Promise<void>;

	protected abstract threadEnded(tid: u32): Promise<void>;

	private mapWorkspaceFolder(folder: WorkspaceFolder, single: boolean): void {
		const uri: Uri = folder.uri;
		let deviceDriver: FileSystemDeviceDriver;
		if (!this.deviceDrivers.hasByUri(uri)) {
			deviceDriver = vscfs.create(this.deviceDrivers.next(), folder.uri);
			this.deviceDrivers.add(deviceDriver);
		} else {
			deviceDriver = this.deviceDrivers.getByUri(uri) as FileSystemDeviceDriver;
		}

		const path = RAL().path;
		const mountPoint: string = single
			? path.join(path.sep, 'workspace')
			: path.join(path.sep, 'workspaces', folder.name);

		this.preOpenDirectories.set(mountPoint, deviceDriver);
	}
}
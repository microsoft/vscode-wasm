/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Uri, WorkspaceFolder, workspace } from 'vscode';
import { DeviceDrivers, FileSystemDeviceDriver } from './deviceDriver';
import * as vscfs from './vscodeFileSystemDriver'

export abstract class AbstractWasiProcess {

	private readonly deviceDrivers: DeviceDrivers;

	constructor(deviceDrivers: DeviceDrivers, mapWorkspaceFolders: boolean = true) {
		this.deviceDrivers = deviceDrivers;
		if (mapWorkspaceFolders) {
			const folders = workspace.workspaceFolders;
			if (folders !== undefined) {
				if (folders.length === 1) {
					const uri: Uri = folders[0].uri;

					uri: workspaceFolders[0].uri, mountPoint: path.posix.join(path.posix.sep, 'workspace')
				}
				for (folder of folders) {
					this._mapWorkspaceFolder(folder);
				}
			}
		}
	}

	private mapWorkspaceFolder(folder: WorkspaceFolder, single: boolean): void {
		const uri: Uri = folder.uri;
		let deviceDriver: FileSystemDeviceDriver;
		if (!this.deviceDrivers.hasByUri(uri)) {
			deviceDriver = vscfs.create(this.deviceDrivers.next(), folder.uri);
			this.deviceDrivers.add(deviceDriver);
		} else {
			deviceDriver = this.deviceDrivers.getByUri(uri) as FileSystemDeviceDriver;
		}

		const name: string = folder.name;
		const mountPoint: string = path.posix.join(path.posix.sep, 'workspaces', name);
		deviceDrivers.map(uri, mountPoint);
	}
}
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Uri } from 'vscode';

import { Errno, WasiError } from '../wasi';
import { DeviceDriverKind, DeviceId, FileSystemDeviceDriver, NoSysDeviceDriver } from '../deviceDriver';
import { FileDescriptor } from '../fileDescriptor';

export function create(deviceId: DeviceId, uri: Uri): FileSystemDeviceDriver {

	const result: object = Object.create(null);
	return Object.assign(result, NoSysDeviceDriver, {
		id: deviceId,
		uri: uri,
		kind: DeviceDriverKind.fileSystem as const,
		joinPath(): Uri | undefined {
			throw new WasiError(Errno.nosys);
		},
		createStdioFileDescriptor(): Promise<FileDescriptor> {
			throw new WasiError(Errno.nosys);
		}
	});
}
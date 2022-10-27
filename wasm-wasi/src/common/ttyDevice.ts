/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ApiClient } from '@vscode/sync-api-client';

import RAL from './ral';
import { size } from './baseTypes';
import { CharacterDeviceDriver, DeviceIds, FileDescriptor, NoSysDeviceDriver } from './deviceDriver';



export default function create(apiClient: ApiClient, textEncoder: RAL.TextEncoder, fileDescriptorId: { next(): number }): CharacterDeviceDriver {

	const deviceId = DeviceIds.next();

	return Object.assign({}, NoSysDeviceDriver, {
		id: deviceId,
		createStdioFileDescriptor(fd: 0 | 1 | 2): FileDescriptor {

		},
		fd_write(fileDescriptor: FileDescriptor, buffers: Uint8Array[]): size {
			const inode = getINode(fileDescriptor.inode);
			let buffer: Uint8Array;
			if (buffers.length === 1) {
				buffer = buffers[0];
			} else {
				const byteLength: number = buffers.reduce<number>((prev, current) => prev + current.length, 0);
				buffer = new Uint8Array(byteLength);
				let offset = 0;
				for (const item of buffers) {
					buffer.set(item, offset);
					offset = item.byteLength;
				}
			}
			apiClient.tty.write(inode.uri, buffer);
			return buffer.byteLength;
		}
	});
}
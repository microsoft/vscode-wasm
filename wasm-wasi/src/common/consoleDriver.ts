/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { URI } from 'vscode-uri';
import { ApiClient } from '@vscode/sync-api-client';

import RAL from './ral';
import { size } from './baseTypes';
import { fd, fdflags, filestat, Filetype, Rights, rights } from './wasiTypes';
import { BaseFileDescriptor, CharacterDeviceDriver, DeviceIds, FileDescriptor, NoSysDeviceDriver } from './deviceDriver';

class ConsoleFileDescriptor extends BaseFileDescriptor {
	constructor(deviceId: bigint, fd: fd, rights_base: rights, rights_inheriting: rights, fdflags: fdflags, inode: bigint) {
		super(deviceId, fd, Filetype.character_device, rights_base, rights_inheriting, fdflags, inode);
	}
}

export function create(apiClient: ApiClient, decoder: RAL.TextDecoder, _uri: URI): CharacterDeviceDriver {

	const deviceId = DeviceIds.next();
	let inodeCounter: bigint = 0n;

	function createConsoleFileDescriptor(fd: 0 | 1 | 2): ConsoleFileDescriptor {
		return new ConsoleFileDescriptor(deviceId, fd, Rights.CharacterDeviceBase, Rights.CharacterDeviceInheriting, 0, inodeCounter++);
	}

	return Object.assign({}, NoSysDeviceDriver, {
		id: deviceId,
		createStdioFileDescriptor(fd: 0 | 1 | 2): FileDescriptor {
			return createConsoleFileDescriptor(fd);
		},
		fd_fdstat_get(fileDescriptor: FileDescriptor, result: fdstat): void {
			result.fs_filetype = fileDescriptor.fileType;
			result.fs_flags = fileDescriptor.fdflags;
			result.fs_rights_base = fileDescriptor.rights_base;
			result.fs_rights_inheriting = fileDescriptor.rights_inheriting;
		},
		fd_filestat_get(fileDescriptor: FileDescriptor, result: filestat): void {
			result.dev = fileDescriptor.deviceId;
			result.ino = fileDescriptor.inode;
			result.filetype = Filetype.character_device;
			result.nlink = 0n;
			result.size = 101n;
			const now = BigInt(Date.now());
			result.atim = now;
			result.ctim = now;
			result.mtim = now;
		},
		fd_write(fileDescriptor: FileDescriptor, buffers: Uint8Array[]): size {
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
			if (fileDescriptor.fd === 2) {
				apiClient.console.error(decoder.decode(buffer));
			} else {
				apiClient.console.log(decoder.decode(buffer));
			}
			return buffer.byteLength;
		}
	});
}
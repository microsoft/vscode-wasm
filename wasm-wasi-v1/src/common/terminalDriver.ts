/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { URI } from 'vscode-uri';

import { ApiShape } from '@vscode/sync-api-client';

import { size } from './baseTypes';
import { fd, fdflags, fdstat, filestat, Filetype, Rights, rights } from './wasiTypes';
import { BaseFileDescriptor, CharacterDeviceDriver, DeviceIds, FileDescriptor, NoSysDeviceDriver } from './deviceDriver';

const TerminalBaseRights: rights = Rights.fd_read | Rights.fd_fdstat_set_flags | Rights.fd_write |
	Rights.fd_filestat_get | Rights.poll_fd_readwrite;

const TerminalInheritingRights = 0n;

class TerminalFileDescriptor extends BaseFileDescriptor {
	constructor(deviceId: bigint, fd: fd, rights_base: rights, rights_inheriting: rights, fdflags: fdflags, inode: bigint) {
		super(deviceId, fd, Filetype.character_device, rights_base, rights_inheriting, fdflags, inode);
	}

	public with(change: { fd: number }): FileDescriptor {
		return new TerminalFileDescriptor(this.deviceId, change.fd, this.rights_base, this.rights_inheriting, this.fdflags, this.inode);
	}
}

export function create(apiClient: ApiShape, uri: URI): CharacterDeviceDriver {

	const deviceId = DeviceIds.next();
	let inodeCounter: bigint = 0n;

	function createTerminalFileDescriptor(fd: 0 | 1 |2): TerminalFileDescriptor {
		return new TerminalFileDescriptor(deviceId, fd, TerminalBaseRights, TerminalInheritingRights, 0, inodeCounter++);
	}

	return Object.assign({}, NoSysDeviceDriver, {
		id: deviceId,
		createStdioFileDescriptor(fd: 0 | 1 | 2): FileDescriptor {
			return createTerminalFileDescriptor(fd);
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
		fd_read(_fileDescriptor: FileDescriptor, buffers: Uint8Array[]): size {
			if (buffers.length === 0) {
				return 0;
			}
			const maxBytesToRead = buffers.reduce<number>((prev, current) => prev + current.length, 0);
			const result = apiClient.tty.read(uri, maxBytesToRead);
			let offset = 0;
			let totalBytesRead = 0;
			for (const buffer of buffers) {
				const toCopy = Math.min(buffer.length, result.length - offset);
				buffer.set(result.subarray(offset, toCopy));
				offset += toCopy;
				totalBytesRead += toCopy;
				if (toCopy < buffer.length) {
					break;
				}
			}
			return totalBytesRead;
		},
		fd_write(_fileDescriptor: FileDescriptor, buffers: Uint8Array[]): size {
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
			apiClient.tty.write(uri, buffer);
			return buffer.byteLength;
		}
	});
}
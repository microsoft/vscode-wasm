/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { size } from './baseTypes';
import { fd, fdflags, fdstat, filestat, Filetype, Rights, rights } from './wasi';
import { CharacterDeviceDriver, DeviceDriverKind, DeviceId, NoSysDeviceDriver } from './deviceDriver';
import { BaseFileDescriptor, FileDescriptor } from './fileDescriptor';
import RAL from './ral';
import { Uri } from 'vscode';

const ConsoleBaseRights: rights = Rights.fd_read | Rights.fd_fdstat_set_flags | Rights.fd_write |
	Rights.fd_filestat_get | Rights.poll_fd_readwrite;

const ConsoleInheritingRights = 0n;

class ConsoleFileDescriptor extends BaseFileDescriptor {
	constructor(deviceId: bigint, fd: fd, rights_base: rights, rights_inheriting: rights, fdflags: fdflags, inode: bigint) {
		super(deviceId, fd, Filetype.character_device, rights_base, rights_inheriting, fdflags, inode);
	}

	public with(change: { fd: number }): FileDescriptor {
		return new ConsoleFileDescriptor(this.deviceId, change.fd, this.rights_base, this.rights_inheriting, this.fdflags, this.inode);
	}
}

export const uri: Uri = Uri.from({ scheme: 'wasi-console', authority: 'f36f1dd6-913a-417f-a53c-360730fde485' });
export function create(deviceId: DeviceId): CharacterDeviceDriver {

	let inodeCounter: bigint = 0n;
	const decoder = RAL().TextDecoder.create();

	function createConsoleFileDescriptor(fd: 0 | 1 | 2): ConsoleFileDescriptor {
		return new ConsoleFileDescriptor(deviceId, fd, ConsoleBaseRights, ConsoleInheritingRights, 0, inodeCounter++);
	}

	const deviceDriver: Pick<CharacterDeviceDriver, 'kind' | 'id' | 'uri' | 'createStdioFileDescriptor' | 'fd_fdstat_get' | 'fd_filestat_get' | 'fd_write'> = {
		kind: DeviceDriverKind.character,
		id: deviceId,
		uri: uri,
		createStdioFileDescriptor(fd: 0 | 1 | 2): FileDescriptor {
			return createConsoleFileDescriptor(fd);
		},
		fd_fdstat_get(fileDescriptor: FileDescriptor, result: fdstat): Promise<void> {
			result.fs_filetype = fileDescriptor.fileType;
			result.fs_flags = fileDescriptor.fdflags;
			result.fs_rights_base = fileDescriptor.rights_base;
			result.fs_rights_inheriting = fileDescriptor.rights_inheriting;
			return Promise.resolve();
		},
		fd_filestat_get(fileDescriptor: FileDescriptor, result: filestat): Promise<void> {
			result.dev = fileDescriptor.deviceId;
			result.ino = fileDescriptor.inode;
			result.filetype = Filetype.character_device;
			result.nlink = 0n;
			result.size = 101n;
			const now = BigInt(Date.now());
			result.atim = now;
			result.ctim = now;
			result.mtim = now;
			return Promise.resolve();
		},
		fd_write(_fileDescriptor: FileDescriptor, buffers: Uint8Array[]): Promise<size> {
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
			RAL().console.log(decoder.decode(buffer));
			return Promise.resolve(buffer.byteLength);
		}
	};

	return Object.assign({}, NoSysDeviceDriver, deviceDriver);
}
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { size } from './baseTypes';
import { Errno, fd, fdflags, fdstat, filestat, Filetype, Rights, rights, WasiError } from './wasi';
import { CharacterDeviceDriver, DeviceDriverKind, DeviceId, NoSysDeviceDriver } from './deviceDriver';
import { BaseFileDescriptor, FileDescriptor } from './fileDescriptor';
import { Uri } from 'vscode';

const PipeBaseRights: rights = Rights.fd_read | Rights.fd_fdstat_set_flags | Rights.fd_write |
	Rights.fd_filestat_get | Rights.poll_fd_readwrite;

const PipeInheritingRights = 0n;

class PipeFileDescriptor extends BaseFileDescriptor {
	constructor(deviceId: bigint, fd: fd, rights_base: rights, rights_inheriting: rights, fdflags: fdflags, inode: bigint) {
		super(deviceId, fd, Filetype.character_device, rights_base, rights_inheriting, fdflags, inode);
	}

	public with(change: { fd: number }): FileDescriptor {
		return new PipeFileDescriptor(this.deviceId, change.fd, this.rights_base, this.rights_inheriting, this.fdflags, this.inode);
	}
}

interface Stdin {
	read(maxBytesToRead: size): Promise<Uint8Array>;
}

interface Stdout {
	write(chunk: Uint8Array): Promise<void>;
}

export function create(deviceId: DeviceId, stdin: Stdin | undefined, stdout: Stdout | undefined, stderr: Stdout | undefined): CharacterDeviceDriver {

	let inodeCounter: bigint = 0n;

	function createPipeFileDescriptor(fd: 0 | 1 | 2): PipeFileDescriptor {
		return new PipeFileDescriptor(deviceId, fd, PipeBaseRights, PipeInheritingRights, 0, inodeCounter++);
	}

	const deviceDriver: Pick<CharacterDeviceDriver, 'kind' | 'id' | 'uri' | 'createStdioFileDescriptor' | 'fd_fdstat_get' | 'fd_filestat_get' | 'fd_read' | 'fd_write'> = {
		kind: DeviceDriverKind.character,
		id: deviceId,
		uri: Uri.from({ scheme: 'wasi-pipe', authority: deviceId.toString() }),
		createStdioFileDescriptor(fd: 0 | 1 | 2): FileDescriptor {
			if (fd === 0 && stdin !== undefined) {
				return createPipeFileDescriptor(fd);
			} else if (fd === 1 && stdout !== undefined) {
				return createPipeFileDescriptor(fd);
			} else if (fd === 2 && stderr !== undefined) {
				return createPipeFileDescriptor(fd);
			}
			throw new WasiError(Errno.badf);
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
	 	async fd_read(_fileDescriptor: FileDescriptor, buffers: Uint8Array[]): Promise<size> {
	 		if (buffers.length === 0) {
	 			return 0;
	 		}
			if (stdin === undefined) {
				throw new WasiError(Errno.badf);
			}

	 		const maxBytesToRead = buffers.reduce<number>((prev, current) => prev + current.length, 0);
	 		const result = await stdin.read(maxBytesToRead);
	 		let offset = 0;
	 		let totalBytesRead = 0;
	 		for (const buffer of buffers) {
	 			const toCopy = Math.min(buffer.length, result.length - offset);
	 			buffer.set(result.subarray(offset, offset + toCopy));
	 			offset += toCopy;
	 			totalBytesRead += toCopy;
	 			if (toCopy < buffer.length) {
	 				break;
	 			}
	 		}
	 		return totalBytesRead;
	 	},
	 	async fd_write(fileDescriptor: FileDescriptor, buffers: Uint8Array[]): Promise<size> {
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
			if (fileDescriptor.fd === 1 && stdout !== undefined) {
				await stdout.write(buffer);
				return Promise.resolve(buffer.byteLength);
			} else if (fileDescriptor.fd === 2 && stderr !== undefined) {
				await stderr.write(buffer);
				return Promise.resolve(buffer.byteLength);
			}
	 		throw new WasiError(Errno.badf);
	 	}
	 };

	return Object.assign({}, NoSysDeviceDriver, deviceDriver);
}
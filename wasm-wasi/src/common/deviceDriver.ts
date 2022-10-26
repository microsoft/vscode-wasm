/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { size } from '@vscode/sync-api-client';

import { ptr, u64 } from './baseTypes';
import {
	advise, dirent, Errno, errno, fd, fdflags, fdstat,filedelta, filesize, filestat, Filetype, filetype,
	fstflags, Literal, lookupflags, oflags, rights, timestamp, WasiError, whence
} from './wasiTypes';

export namespace DeviceIds {
	let deviceIdCounter: bigint = 1n;
	export const system = deviceIdCounter++;
	export function next(): bigint {
		return deviceIdCounter++;
	}
}

export interface FileDescriptor {

	/**
	 * The WASI file descriptor id
	 */
	readonly fd: fd;

	/**
	 * The file type
	 */
	readonly fileType: filetype;

	/**
	 * The base rights.
	 */
	readonly rights_base: rights;

	/**
	 * The inheriting rights
	 */
	readonly rights_inheriting: rights;

	/**
	 * The file descriptor flags.
	 */
	fdflags: fdflags;

	/**
	 * The inode the file descriptor is pointing to.
	 */
	readonly inode: bigint;

	/**
	 * Asserts the given base rights.

	 * @param right the rights to assert.
	 */
	assertBaseRight(right: rights): void;

	/**
	 * Asserts that the file descriptor points to a directory.
	 */
	assertIsDirectory(): void;
}

export type ReaddirEntry = { d_ino: bigint; d_type: filetype; d_name: Uint8Array };

export type DeviceDriver = {

	id: bigint;

	fd_advise(fileDescriptor: FileDescriptor, offset: filesize, length: filesize, advise: advise): void;
	fd_allocate(fileDescriptor: FileDescriptor, offset: filesize, len: filesize): void;
	fd_close(fileDescriptor: FileDescriptor): void;
	fd_datasync(fileDescriptor: FileDescriptor): void;
	fd_fdstat_get(fileDescriptor: FileDescriptor, result: fdstat): void;
	fd_fdstat_set_flags(fileDescriptor: FileDescriptor, fdflags: fdflags): void;
	fd_filestat_get(fileDescriptor: FileDescriptor, result: filestat): void;
	fd_filestat_set_size(fileDescriptor: FileDescriptor, size: filesize): void;
	fd_filestat_set_times(fileDescriptor: FileDescriptor, atim: timestamp, mtim: timestamp, fst_flags: fstflags): void;
	fd_pread(fileDescriptor: FileDescriptor, offset: number, bytesToRead: number): Uint8Array;
	fd_pwrite(fileDescriptor: FileDescriptor, offset: number, bytes: Uint8Array): size;
	fd_read(fileDescriptor: FileDescriptor, buffers: Uint8Array[]): size;
	fd_readdir(fileDescriptor: FileDescriptor): ReaddirEntry[];
	fd_seek(fileDescriptor: FileDescriptor, offset: filedelta, whence: whence): bigint;
	fd_sync(fileDescriptor: FileDescriptor): void;
	fd_tell(fileDescriptor: FileDescriptor): u64;
	fd_write(fileDescriptor: FileDescriptor, buffers: Uint8Array[]): size;

	path_create_directory(fileDescriptor: FileDescriptor, path: string): void;
	path_filestat_get(fileDescriptor: FileDescriptor, flags: lookupflags, path: string, result: filestat): void;
	path_filestat_set_times(fileDescriptor: FileDescriptor, flags: lookupflags, path: string, atim: timestamp, mtim: timestamp, fst_flags: fstflags): void;
	path_link(old_fd: FileDescriptor, old_flags: lookupflags, old_path: string, new_fd: FileDescriptor, new_path: string): void;
	path_open(fileDescriptor: FileDescriptor, dirflags: lookupflags, path: string, oflags: oflags, fs_rights_base: rights, fs_rights_inheriting: rights, fdflags: fdflags): FileDescriptor;
	path_readlink(fileDescriptor: FileDescriptor, path: string): string;
	path_remove_directory(fileDescriptor: FileDescriptor, path: string): void;
	path_rename(fileDescriptor: FileDescriptor, old_path: string, new_fileDescriptor: fd, new_path: string): void;
	path_symlink(old_path: string, fileDescriptor: FileDescriptor, new_path: string): void;
	path_unlink_file(fileDescriptor: FileDescriptor, path: string): void;
};

export const NoSysDeviceDriver: Omit<DeviceDriver, 'id'> = {
	fd_advise(): void {
		throw new WasiError(Errno.nosys);
	},
	fd_allocate(): void {
		throw new WasiError(Errno.nosys);
	},
	fd_close(): void {
		throw new WasiError(Errno.nosys);
	},
	fd_datasync(): void {
		throw new WasiError(Errno.nosys);
	},
	fd_fdstat_get(): void {
		throw new WasiError(Errno.nosys);
	},
	fd_fdstat_set_flags(): void {
		throw new WasiError(Errno.nosys);
	},
	fd_filestat_get(): void {
		throw new WasiError(Errno.nosys);
	},
	fd_filestat_set_size(): void {
		throw new WasiError(Errno.nosys);
	},
	fd_filestat_set_times(): void {
		throw new WasiError(Errno.nosys);
	},
	fd_pread(): Uint8Array {
		throw new WasiError(Errno.nosys);
	},
	fd_pwrite(): size {
		throw new WasiError(Errno.nosys);
	},
	fd_read(): size {
		throw new WasiError(Errno.nosys);
	},
	fd_readdir(): ReaddirEntry[] {
		throw new WasiError(Errno.nosys);
	},
	fd_seek(): bigint {
		throw new WasiError(Errno.nosys);
	},
	fd_sync(): void {
		throw new WasiError(Errno.nosys);
	},
	fd_tell(): u64 {
		throw new WasiError(Errno.nosys);
	},
	fd_write(): size {
		throw new WasiError(Errno.nosys);
	},
	path_create_directory(): void {
		throw new WasiError(Errno.nosys);
	},
	path_filestat_get(): void {
		throw new WasiError(Errno.nosys);
	},
	path_filestat_set_times(): void {
		throw new WasiError(Errno.nosys);
	},
	path_link(): void {
		throw new WasiError(Errno.nosys);
	},
	path_open(): FileDescriptor {
		throw new WasiError(Errno.nosys);
	},
	path_readlink(): string {
		throw new WasiError(Errno.nosys);
	},
	path_remove_directory(): errno {
		throw new WasiError(Errno.nosys);
	},
	path_rename(): void {
		throw new WasiError(Errno.nosys);
	},
	path_symlink(): void {
		throw new WasiError(Errno.nosys);
	},
	path_unlink_file(): void {
		throw new WasiError(Errno.nosys);
	}
};

export abstract class BaseFileDescriptor implements FileDescriptor {

	public readonly fd: fd;

	public readonly fileType: filetype;

	public readonly rights_base: rights;

	public readonly rights_inheriting: rights;

	public fdflags: fdflags;

	public readonly inode: bigint;

	constructor(fd: fd, fileType: filetype, rights_base: rights, rights_inheriting: rights, fdflags: fdflags, inode: bigint) {
		this.fd = fd;
		this.fileType = fileType;
		this.rights_base = rights_base;
		this.rights_inheriting = rights_inheriting;
		this.fdflags = fdflags;
		this.inode = inode;
	}

	public assertBaseRight(right: rights): void {
		if ((this.rights_base & right) === 0n) {
			throw new WasiError(Errno.perm);
		}
	}

	public assertIsDirectory(): void {
		if (this.fileType !== Filetype.directory) {
			throw new WasiError(Errno.notdir);
		}
	}
}
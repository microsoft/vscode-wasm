/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { size } from '@vscode/sync-api-client';

import { ptr } from './baseTypes';
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
	 * The inode id this file handle is pointing to.
	 */
	readonly inode: bigint;

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
	 * Asserts the given base rights.

	 * @param right the rights to assert.
	 */
	assertBaseRight(right: rights): void;

	/**
	 * Asserts that the file descriptor points to a directory.
	 */
	assertIsDirectory(): void;
}

export type DeviceDriver = {

	id: bigint;

	fd_advise(fd: FileDescriptor, offset: filesize, length: filesize, advise: advise): void;
	fd_allocate(fd: FileDescriptor, offset: filesize, len: filesize): void;
	fd_close(fd: FileDescriptor): void;
	fd_datasync(fd: FileDescriptor): void;
	fd_fdstat_get(fd: FileDescriptor, result: fdstat): void;
	fd_fdstat_set_flags(fd: FileDescriptor, fdflags: fdflags): void;
	fd_filestat_get(fd: FileDescriptor, result: filestat): void;
	fd_filestat_set_size(fd: FileDescriptor, size: filesize): void;
	fd_filestat_set_times(fd: FileDescriptor, atim: timestamp, mtim: timestamp, fst_flags: fstflags): void;
	fd_pread(fd: FileDescriptor, offset: number, bytesToRead: number): Uint8Array;
	fd_pwrite(fd: FileDescriptor, offset: number, bytes: Uint8Array): size;
	fd_read(fd: FileDescriptor, buffers: Uint8Array[]): size;
	fd_readdir(fd: FileDescriptor): Literal<dirent>[];
	fd_seek(fd: FileDescriptor, offset: filedelta, whence: whence, new_offset_ptr: ptr): void;
	fd_sync(fd: FileDescriptor): void;
	fd_tell(fd: FileDescriptor, offset_ptr: ptr): void;
	fd_write(fd: FileDescriptor, buffers: Uint8Array[]): size;

	path_create_directory(fd: FileDescriptor, path: string): void;
	path_filestat_get(fd: FileDescriptor, flags: lookupflags, path: string, result: filestat): void;
	path_filestat_set_times(fd: FileDescriptor, flags: lookupflags, path: string, atim: timestamp, mtim: timestamp, fst_flags: fstflags): void;
	path_link(old_fd: FileDescriptor, old_flags: lookupflags, old_path: string, new_fd: FileDescriptor, new_path: string): void;
	path_open(fd: FileDescriptor, dirflags: lookupflags, path: string, oflags: oflags, fs_rights_base: rights, fs_rights_inheriting: rights, fdflags: fdflags): FileDescriptor;
	path_readlink(fd: FileDescriptor, path: string): string;
	path_remove_directory(fd: FileDescriptor, path: string): void;
	path_rename(fd: FileDescriptor, old_path: string, new_fd: fd, new_path: string): void;
	path_symlink(old_path: string, fd: FileDescriptor, new_path: string): void;
	path_unlink_file(fd: FileDescriptor, path: string): void;
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
	fd_readdir(): Literal<dirent>[] {
		throw new WasiError(Errno.nosys);
	},
	fd_seek(): void {
		throw new WasiError(Errno.nosys);
	},
	fd_sync(): void {
		throw new WasiError(Errno.nosys);
	},
	fd_tell(): void {
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

	public readonly inode: bigint;

	public readonly fileType: filetype;

	public readonly rights_base: rights;

	public readonly rights_inheriting: rights;

	public fdflags: fdflags;

	constructor(fd: fd, inode: bigint, fileType: filetype, rights_base: rights, rights_inheriting: rights, fdflags: fdflags) {
		this.fd = fd;
		this.inode = inode;
		this.fileType = fileType;
		this.rights_base = rights_base;
		this.rights_inheriting = rights_inheriting;
		this.fdflags = fdflags;
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
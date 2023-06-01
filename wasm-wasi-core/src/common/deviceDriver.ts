/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Uri } from 'vscode';
import { size, u64 } from './baseTypes';
import { FdProvider, FileDescriptor } from './fileDescriptor';
import {
	advise, Errno, fd, fdflags, fdstat,filedelta, filesize, filestat, filetype,
	fstflags, lookupflags, oflags, rights, timestamp, WasiError, whence
} from './wasi';

export type DeviceId = bigint;

export type ReaddirEntry = { d_ino: bigint; d_type: filetype; d_name: string };

export enum DeviceDriverKind {
	character = 'character',
	fileSystem = 'fileSystem'
}

export interface DeviceDriver {

	/**
	 * The kind of device driver.
	 */
	readonly kind: DeviceDriverKind;

	// A VS Code URI to identify the device. This is for example the root URI
	// of a VS Code file system.
	readonly uri: Uri;

	// The unique device id.
	readonly id: DeviceId;

	fd_advise(fileDescriptor: FileDescriptor, offset: filesize, length: filesize, advise: advise): Promise<void>;
	fd_allocate(fileDescriptor: FileDescriptor, offset: filesize, len: filesize): Promise<void>;
	fd_close(fileDescriptor: FileDescriptor): Promise<void>;
	fd_datasync(fileDescriptor: FileDescriptor): Promise<void>;
	fd_fdstat_get(fileDescriptor: FileDescriptor, result: fdstat): Promise<void>;
	fd_fdstat_set_flags(fileDescriptor: FileDescriptor, fdflags: fdflags): Promise<void>;
	fd_filestat_get(fileDescriptor: FileDescriptor, result: filestat): Promise<void>;
	fd_filestat_set_size(fileDescriptor: FileDescriptor, size: filesize): Promise<void>;
	fd_filestat_set_times(fileDescriptor: FileDescriptor, atim: timestamp, mtim: timestamp, fst_flags: fstflags): Promise<void>;
	fd_pread(fileDescriptor: FileDescriptor, offset: filesize, buffers: Uint8Array[]): Promise<size>;
	fd_pwrite(fileDescriptor: FileDescriptor, offset: filesize, buffers: Uint8Array[]): Promise<size>;
	fd_read(fileDescriptor: FileDescriptor, buffers: Uint8Array[]): Promise<size>;
	fd_readdir(fileDescriptor: FileDescriptor): Promise<ReaddirEntry[]>;
	fd_seek(fileDescriptor: FileDescriptor, offset: filedelta, whence: whence): Promise<bigint>;
	fd_renumber(fileDescriptor: FileDescriptor, to: fd): Promise<void>;
	fd_sync(fileDescriptor: FileDescriptor): Promise<void>;
	fd_tell(fileDescriptor: FileDescriptor): Promise<u64>;
	fd_write(fileDescriptor: FileDescriptor, buffers: Uint8Array[]): Promise<size>;

	path_create_directory(fileDescriptor: FileDescriptor, path: string): Promise<void>;
	path_filestat_get(fileDescriptor: FileDescriptor, flags: lookupflags, path: string, result: filestat): Promise<void>;
	path_filestat_set_times(fileDescriptor: FileDescriptor, flags: lookupflags, path: string, atim: timestamp, mtim: timestamp, fst_flags: fstflags): Promise<void>;
	path_link(old_fd: FileDescriptor, old_flags: lookupflags, old_path: string, new_fd: FileDescriptor, new_path: string): Promise<void>;
	path_open(fileDescriptor: FileDescriptor, dirflags: lookupflags, path: string, oflags: oflags, fs_rights_base: rights, fs_rights_inheriting: rights, fdflags: fdflags, fdProvider: FdProvider): Promise<FileDescriptor>;
	path_readlink(fileDescriptor: FileDescriptor, path: string): Promise<string>;
	path_remove_directory(fileDescriptor: FileDescriptor, path: string): Promise<void>;
	path_rename(oldFileDescriptor: FileDescriptor, old_path: string, newFileDescriptor: FileDescriptor, new_path: string): Promise<void>;
	path_symlink(old_path: string, fileDescriptor: FileDescriptor, new_path: string): Promise<void>;
	path_unlink_file(fileDescriptor: FileDescriptor, path: string): Promise<void>;

	fd_create_prestat_fd(fd: fd): Promise<FileDescriptor>;
	fd_bytesAvailable(fileDescriptor: FileDescriptor): Promise<filesize>;
}

export interface FileSystemDeviceDriver extends DeviceDriver {
	kind: DeviceDriverKind.fileSystem;
	joinPath( ...pathSegments: string[]): Uri | undefined;
	createStdioFileDescriptor(dirflags: lookupflags | undefined, path: string, oflags: oflags | undefined, fs_rights_base: rights | undefined, fdflags: fdflags | undefined, fd: 0 | 1 | 2): Promise<FileDescriptor>;
}

export namespace FileSystemDeviceDriver {
	export function is(value: DeviceDriver): value is FileSystemDeviceDriver {
		const candidate: FileSystemDeviceDriver = value as FileSystemDeviceDriver;
		return candidate.kind === DeviceDriverKind.fileSystem;
	}
}

export interface CharacterDeviceDriver extends DeviceDriver {
	kind: DeviceDriverKind.character;
	createStdioFileDescriptor(fd: 0 | 1 | 2): FileDescriptor;
}

export interface ReadonlyFileSystemDeviceDriver extends Pick<
FileSystemDeviceDriver, 'kind' | 'joinPath' | 'createStdioFileDescriptor' | 'uri' | 'id' |
'fd_advise' | 'fd_close' | 'fd_fdstat_get' | 'fd_filestat_get' | 'fd_pread' | 'fd_read' | 'fd_readdir' | 'fd_seek' |
'fd_renumber' | 'fd_tell' | 'path_filestat_get' | 'path_open' | 'path_readlink' | 'fd_create_prestat_fd' | 'fd_bytesAvailable'
> {
	kind: DeviceDriverKind.fileSystem;
}

export const NoSysDeviceDriver: Omit<DeviceDriver, 'id' | 'uri' | 'kind'> = {
	fd_advise(): Promise<void> {
		throw new WasiError(Errno.nosys);
	},
	fd_allocate(): Promise<void> {
		throw new WasiError(Errno.nosys);
	},
	fd_close(): Promise<void> {
		throw new WasiError(Errno.nosys);
	},
	fd_datasync(): Promise<void> {
		throw new WasiError(Errno.nosys);
	},
	fd_fdstat_get(): Promise<void> {
		throw new WasiError(Errno.nosys);
	},
	fd_fdstat_set_flags(): Promise<void> {
		throw new WasiError(Errno.nosys);
	},
	fd_filestat_get(): Promise<void> {
		throw new WasiError(Errno.nosys);
	},
	fd_filestat_set_size(): Promise<void> {
		throw new WasiError(Errno.nosys);
	},
	fd_filestat_set_times(): Promise<void> {
		throw new WasiError(Errno.nosys);
	},
	fd_pread(): Promise<size> {
		throw new WasiError(Errno.nosys);
	},
	fd_pwrite(): Promise<size> {
		throw new WasiError(Errno.nosys);
	},
	fd_read(): Promise<size> {
		throw new WasiError(Errno.nosys);
	},
	fd_readdir(): Promise<ReaddirEntry[]> {
		throw new WasiError(Errno.nosys);
	},
	fd_seek(): Promise<bigint> {
		throw new WasiError(Errno.nosys);
	},
	fd_renumber(): Promise<void> {
		throw new WasiError(Errno.nosys);
	},
	fd_sync(): Promise<void> {
		throw new WasiError(Errno.nosys);
	},
	fd_tell(): Promise<u64> {
		throw new WasiError(Errno.nosys);
	},
	fd_write(): Promise<size> {
		throw new WasiError(Errno.nosys);
	},
	path_create_directory(): Promise<void> {
		throw new WasiError(Errno.nosys);
	},
	path_filestat_get(): Promise<void> {
		throw new WasiError(Errno.nosys);
	},
	path_filestat_set_times(): Promise<void> {
		throw new WasiError(Errno.nosys);
	},
	path_link(): Promise<void> {
		throw new WasiError(Errno.nosys);
	},
	path_open(): Promise<FileDescriptor> {
		throw new WasiError(Errno.nosys);
	},
	path_readlink(): Promise<string> {
		throw new WasiError(Errno.nosys);
	},
	path_remove_directory(): Promise<void> {
		throw new WasiError(Errno.nosys);
	},
	path_rename(): Promise<void> {
		throw new WasiError(Errno.nosys);
	},
	path_symlink(): Promise<void> {
		throw new WasiError(Errno.nosys);
	},
	path_unlink_file(): Promise<void> {
		throw new WasiError(Errno.nosys);
	},
	fd_create_prestat_fd(): Promise<FileDescriptor> {
		throw new WasiError(Errno.nosys);
	},
	fd_bytesAvailable(): Promise<filesize> {
		throw new WasiError(Errno.nosys);
	}
};

export const WritePermDeniedDeviceDriver: Pick<DeviceDriver,
'fd_allocate' | 'fd_datasync' | 'fd_fdstat_set_flags' | 'fd_filestat_set_size' | 'fd_filestat_set_times' | 'fd_pwrite' |
'fd_renumber' | 'fd_sync' | 'fd_write' | 'path_create_directory' | 'path_filestat_set_times' | 'path_link' | 'path_remove_directory' |
'path_rename' | 'path_symlink' | 'path_unlink_file'
> = {
	fd_allocate(): Promise<void> {
		throw new WasiError(Errno.perm);
	},
	fd_datasync(): Promise<void> {
		throw new WasiError(Errno.perm);
	},
	fd_fdstat_set_flags(): Promise<void> {
		throw new WasiError(Errno.perm);
	},
	fd_filestat_set_size(): Promise<void> {
		throw new WasiError(Errno.perm);
	},
	fd_filestat_set_times(): Promise<void> {
		throw new WasiError(Errno.perm);
	},
	fd_pwrite(): Promise<size> {
		throw new WasiError(Errno.perm);
	},
	fd_renumber(): Promise<void> {
		throw new WasiError(Errno.perm);
	},
	fd_sync(): Promise<void> {
		throw new WasiError(Errno.perm);
	},
	fd_write(): Promise<size> {
		throw new WasiError(Errno.perm);
	},
	path_create_directory(): Promise<void> {
		throw new WasiError(Errno.perm);
	},
	path_filestat_set_times(): Promise<void> {
		throw new WasiError(Errno.perm);
	},
	path_link(): Promise<void> {
		throw new WasiError(Errno.perm);
	},
	path_remove_directory(): Promise<void> {
		throw new WasiError(Errno.perm);
	},
	path_rename(): Promise<void> {
		throw new WasiError(Errno.perm);
	},
	path_symlink(): Promise<void> {
		throw new WasiError(Errno.perm);
	},
	path_unlink_file(): Promise<void> {
		throw new WasiError(Errno.nosys);
	}
};
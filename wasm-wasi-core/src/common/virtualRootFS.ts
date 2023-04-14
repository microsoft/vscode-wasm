/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Uri } from 'vscode';
import { DeviceId, FileSystemDeviceDriver, NoSysDeviceDriver, ReaddirEntry } from './deviceDriver';
import { BaseFileDescriptor, FdProvider, FileDescriptor } from './fileDescriptor';
import { WasiError, Filetype, fdstat, filestat, fstflags, lookupflags, oflags, rights, fdflags, fd, Rights } from './wasi';
import { Errno } from './wasi';

const DirectoryBaseRights: rights = Rights.fd_fdstat_set_flags | Rights.path_create_directory |
		Rights.path_create_file | Rights.path_link_source | Rights.path_link_target | Rights.path_open |
		Rights.fd_readdir | Rights.path_readlink | Rights.path_rename_source | Rights.path_rename_target |
		Rights.path_filestat_get | Rights.path_filestat_set_size | Rights.path_filestat_set_times |
		Rights.fd_filestat_get | Rights.fd_filestat_set_times | Rights.path_remove_directory | Rights.path_unlink_file |
		Rights.path_symlink;

const FileBaseRights: rights = Rights.fd_datasync | Rights.fd_read | Rights.fd_seek | Rights.fd_fdstat_set_flags |
		Rights.fd_sync | Rights.fd_tell | Rights.fd_write | Rights.fd_advise | Rights.fd_allocate | Rights.fd_filestat_get |
		Rights.fd_filestat_set_size | Rights.fd_filestat_set_times | Rights.poll_fd_readwrite;

const DirectoryInheritingRights: rights = DirectoryBaseRights | FileBaseRights;

class DirectoryFileDescriptor extends BaseFileDescriptor {

	constructor(deviceId: bigint, fd: fd, rights_base: rights, rights_inheriting: rights, fdflags: fdflags, inode: bigint) {
		super(deviceId, fd, Filetype.directory, rights_base, rights_inheriting, fdflags, inode);
	}

	public with(change: { fd: number }): FileDescriptor {
		return new DirectoryFileDescriptor(this.deviceId, change.fd, this.rights_base, this.rights_inheriting, this.fdflags, this.inode);
	}
}

export function create(deviceId: DeviceId, preOpenDirectories: Map<string, { driver: FileSystemDeviceDriver; fileDescriptor: FileDescriptor | undefined }>): FileSystemDeviceDriver {


	let $atim: bigint = BigInt(Date.now()) * 1000000n;
	let $mtim: bigint = $atim;
	let $ctim: bigint = $atim;

	let $inodeCounter: bigint = 1n;
	let $inodes = new Map<string, bigint>();
	function inode(path: string): bigint {
		let result = $inodes.get(path);
		if (!result) {
			result = $inodeCounter++;
			$inodes.set(path, result);
		}
		return result;
	}

	let $rootFd: FileDescriptor | undefined;
	function assertRootDescriptor(fileDescriptor: FileDescriptor): asserts fileDescriptor is FileDescriptor {
		if (!$rootFd) {
			$rootFd = preOpenDirectories.get('/')!.fileDescriptor!;
		}
		if ($rootFd.deviceId !== fileDescriptor.deviceId || $rootFd.inode !== fileDescriptor.inode) {
			throw new WasiError(Errno.badf);
		}
	}

	function assertDirectoryDescriptor(fileDescriptor: FileDescriptor): asserts fileDescriptor is FileDescriptor & { readonly fileType: typeof Filetype.directory } {
		if (fileDescriptor.fileType !== Filetype.directory) {
			throw new WasiError(Errno.badf);
		}
	}

	function createRootDescriptor(fd: fd): FileDescriptor {
		return new DirectoryFileDescriptor(deviceId, fd, DirectoryBaseRights, DirectoryInheritingRights, 0, inode('/'));
	}

	const $this = {
		id: deviceId,
		uri: Uri.from( { scheme: 'wasi-root', path: '/'} ),

		createStdioFileDescriptor(): Promise<FileDescriptor> {
			throw new Error(`Virtual root FS can't provide stdio file descriptors`);
		},
		fd_close(_fileDescriptor: FileDescriptor): Promise<void> {
			return Promise.resolve();
		},
		fd_create_prestat_fd(fd: fd): Promise<FileDescriptor> {
			return Promise.resolve(createRootDescriptor(fd));
		},
		fd_fdstat_get(fileDescriptor: FileDescriptor, result: fdstat): Promise<void> {
			result.fs_filetype = fileDescriptor.fileType;
			result.fs_flags = fileDescriptor.fdflags;
			result.fs_rights_base = fileDescriptor.rights_base;
			result.fs_rights_inheriting = fileDescriptor.rights_inheriting;
			return Promise.resolve();
		},
		fd_fdstat_set_flags(fileDescriptor: FileDescriptor, fdflags: number): Promise<void> {
			fileDescriptor.fdflags = fdflags;
			return Promise.resolve();
		},
		fd_filestat_get(fileDescriptor: FileDescriptor, result: filestat): Promise<void> {
			assertRootDescriptor(fileDescriptor);
			result.dev = fileDescriptor.deviceId;
			result.ino = fileDescriptor.inode;
			result.filetype = fileDescriptor.fileType;
			result.nlink = 1n;
			result.size = BigInt(preOpenDirectories.size - 1);
			result.atim = $atim;
			result.mtim = $mtim;
			result.ctim = $ctim;
			return Promise.resolve();
		},
		fd_filestat_set_times(_fileDescriptor: FileDescriptor, atim: bigint, mtim: bigint, _fst_flags: fstflags): Promise<void> {
			$atim = atim;
			$mtim = mtim;
			return Promise.resolve();
		},
		async fd_readdir(fileDescriptor: FileDescriptor): Promise<ReaddirEntry[]> {
			assertDirectoryDescriptor(fileDescriptor);
			assertRootDescriptor(fileDescriptor);

			const result: ReaddirEntry[] = [];
			for (const [mountPoint, { fileDescriptor }] of preOpenDirectories) {
				if (mountPoint === '/') {
					continue;
				}
				result.push({ d_name: mountPoint, d_type: fileDescriptor!.fileType, d_ino: inode(mountPoint) });
			}
			return result;
		},
		async path_filestat_get(rootFileDescriptor: FileDescriptor, flags: lookupflags, path: string, result: filestat): Promise<void> {
			assertRootDescriptor(rootFileDescriptor);
			if (path === '.' || path === '..') {
				return this.fd_filestat_get(rootFileDescriptor, result);
			}
			const { driver, fileDescriptor } = preOpenDirectories.get(path)!;
			if (driver === undefined || fileDescriptor === undefined) {
				throw new WasiError(Errno.noent);
			}
			return driver.path_filestat_get(fileDescriptor, flags, '.' , result);
		},
		async path_open(parentDescriptor: FileDescriptor, dirflags: lookupflags, path: string, oflags: oflags, fs_rights_base: rights, fs_rights_inheriting: rights, fdflags: fdflags, fdProvider: FdProvider): Promise<FileDescriptor> {
			assertRootDescriptor(parentDescriptor);
			if (path === '.' || path === '/') {
				return createRootDescriptor(fdProvider.next());
			}

			const { driver, fileDescriptor } = preOpenDirectories.get(path)!;
			if (driver === undefined || fileDescriptor === undefined) {
				throw new WasiError(Errno.noent);
			}
			return driver.path_open(fileDescriptor, dirflags, '.', oflags, fs_rights_base, fs_rights_inheriting, fdflags, fdProvider);
		},
	};

	return Object.assign({}, NoSysDeviceDriver, $this);
}
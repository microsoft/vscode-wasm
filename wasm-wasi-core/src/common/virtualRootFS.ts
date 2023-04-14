/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Uri } from 'vscode';
import { DeviceId, FileSystemDeviceDriver, NoSysDeviceDriver, ReaddirEntry } from './deviceDriver';
import { FdProvider, FileDescriptor } from './fileDescriptor';
import { WasiError, Filetype, fdstat, filestat, fstflags, lookupflags, oflags, rights, fdflags } from './wasi';
import { Errno } from './wasi';

export function create(deviceId: DeviceId, preOpenDirectories: Map<string, { driver: FileSystemDeviceDriver; fileDescriptor: FileDescriptor | undefined }>): FileSystemDeviceDriver {

	function assertDirectoryDescriptor(fileDescriptor: FileDescriptor): asserts fileDescriptor is FileDescriptor & { readonly fileType: typeof Filetype.directory } {
		if (!(fileDescriptor.fileType !== Filetype.directory)) {
			throw new WasiError(Errno.badf);
		}
	}

	let $rootFd: FileDescriptor | undefined;
	function rootFd(): FileDescriptor {
		if (!$rootFd) {
			$rootFd = preOpenDirectories.get('/')!.fileDescriptor!;
		}
		return $rootFd;
	}

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

	let $atim: bigint, $mtim: bigint, $ctim: bigint = BigInt(Date.now()) * 1000000n;

	const $this = {
		id: deviceId,
		uri: Uri.from( { scheme: 'wasi-root', path: '/'} ),

		createStdioFileDescriptor(): Promise<FileDescriptor> {
			throw new Error(`Virtual root FS can't provide stdio file descriptors`);
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
			if (fileDescriptor !== rootFd()) {
				throw new WasiError(Errno.badf);
			}
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
			if (fileDescriptor !== rootFd()) {
				throw new WasiError(Errno.badf);
			}

			const result: ReaddirEntry[] = [];
			for (const [mountPoint, { fileDescriptor }] of preOpenDirectories) {
				if (mountPoint === '/') {
					continue;
				}
				result.push({ d_name: mountPoint, d_type: fileDescriptor!.fileType, d_ino: inode(mountPoint) });
			}
			return result;
		},
		async path_open(parentDescriptor: FileDescriptor, dirflags: lookupflags, path: string, oflags: oflags, fs_rights_base: rights, fs_rights_inheriting: rights, fdflags: fdflags, fdProvider: FdProvider): Promise<FileDescriptor> {
			if (parentDescriptor !== rootFd()) {
				throw new WasiError(Errno.badf);
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
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

export interface DeviceDriver {

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
	fd_prestat_get(fd: fd): Promise<[string, FileDescriptor] | undefined>;
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

	fd_bytesAvailable(fileDescriptor: FileDescriptor): Promise<filesize>;
}

export interface FileSystemDeviceDriver extends DeviceDriver {
	createStdioFileDescriptor(fd: 0 | 1 | 2, fdflags: fdflags, path: string): FileDescriptor;
}

export interface CharacterDeviceDriver extends DeviceDriver {
	createStdioFileDescriptor(fd: 0 | 1 | 2): FileDescriptor;
}

export const NoSysDeviceDriver: Omit<Omit<DeviceDriver, 'id'>, 'uri'> = {
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
	fd_prestat_get(): Promise<undefined> {
		return Promise.resolve(undefined);
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
	fd_bytesAvailable(): Promise<filesize> {
		throw new WasiError(Errno.nosys);
	}
};

export class DeviceDrivers {

	private readonly devices: Map<DeviceId, DeviceDriver>;
	private readonly devicesByUri: Map<string, DeviceDriver>;

	constructor() {
		this.devices = new Map();
		this.devicesByUri = new Map();
	}

	public next(): DeviceId {
		return BigInt(this.devices.size + 1);
	}

	public add(driver: DeviceDriver): void {
		this.devices.set(driver.id, driver);
		this.devicesByUri.set(driver.uri.toString(true), driver);
	}

	public has (id: DeviceId): boolean {
		return this.devices.has(id);
	}

	public hasByUri(uri: Uri): boolean {
		return this.devicesByUri.has(uri.toString(true));
	}

	public get(id: DeviceId): DeviceDriver {
		const driver = this.devices.get(id);
		if (driver === undefined) {
			throw new WasiError(Errno.nxio);
		}
		return driver;
	}

	public getByUri(uri: Uri): DeviceDriver {
		const driver = this.devicesByUri.get(uri.toString(true));
		if (driver === undefined) {
			throw new WasiError(Errno.nxio);
		}
		return driver;
	}

	public remove(id: DeviceId): void {
		const driver = this.devices.get(id);
		if (driver === undefined) {
			throw new WasiError(Errno.nxio);
		}
		this.devices.delete(id);
		this.devicesByUri.delete(driver.uri.toString(true));
	}

	public removeByUri(uri: Uri): void {
		const key = uri.toString(true);
		const driver = this.devicesByUri.get(key);
		if (driver === undefined) {
			throw new WasiError(Errno.nxio);
		}
		this.devices.delete(driver.id);
		this.devicesByUri.delete(key);
	}
}
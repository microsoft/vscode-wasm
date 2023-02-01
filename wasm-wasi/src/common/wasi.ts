/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { URI } from 'vscode-uri';
import { ApiShape, FileSystemError, RPCError } from '@vscode/sync-api-client';

import RAL from './ral';

import { cstring, ptr, size, u32, u64, u8 } from './baseTypes';
import {
	fd, errno, Errno, lookupflags, oflags, rights, fdflags, dircookie, Rights,
	filesize, advise, filedelta, whence, Ciovec, Iovec, clockid, timestamp, Clockid,
	fstflags, Prestat, exitcode, Subscription, WasiError, Eventtype, Event, event,
	Subclockflags, Literal, subscription, riflags, siflags, sdflags, Dirent,
	args_sizes_get, args_get, environ_sizes_get, environ_get, clock_res_get, clock_time_get, fd_advise,
	fd_allocate, fd_close, fd_datasync, fd_fdstat_get, fd_fdstat_set_flags, fd_filestat_get, fd_filestat_set_size,
	fd_filestat_set_times, fd_pread, fd_prestat_dir_name, fd_prestat_get, fd_pwrite, fd_read, fd_readdir,
	fd_seek, fd_sync, fd_tell, fd_write, path_create_directory, path_filestat_get, path_filestat_set_times,
	path_link, path_open, path_readlink, path_remove_directory, path_rename, path_symlink, path_unlink_file,
	poll_oneoff, proc_exit, random_get, sched_yield, sock_accept, sock_recv, sock_send, sock_shutdown, Fdstat, Filestat, dirent, ciovec, iovec, fdstat, filestat, Whence, prestat
} from './wasiTypes';
import { BigInts, code2Wasi } from './converter';
import { CharacterDeviceDriver, DeviceDriver, DeviceId, FileDescriptor, FileSystemDeviceDriver, ReaddirEntry } from './deviceDriver';
import * as vscfs from './vscodeFileSystemDriver';
import * as ConsoleDriver from './consoleDriver';
import * as TerminalDriver from './terminalDriver';

namespace WebAssembly {

	interface Global {
		value: any;
		valueOf(): any;
	}
	interface Table {
		readonly length: number;
		get(index: number): any;
		grow(delta: number, value?: any): number;
		set(index: number, value?: any): void;
	}
	interface Memory {
		readonly buffer: ArrayBuffer;
		grow(delta: number): number;
	}
	type ExportValue = Function | Global | Memory | Table;

	export interface Instance {
		readonly exports: Record<string, ExportValue>;
	}

	export interface $Instance {
		readonly exports: {
			memory: Memory;
		} & Record<string, ExportValue>;
	}
}

export interface WASI {

	/**
	 * Initialize the WASI interface with a web assembly instance.
	 *
	 * @param instance The WebAssembly instance.
	 */
	initialize(instance: WebAssembly.Instance): void;

	args_sizes_get: args_sizes_get;
	args_get: args_get;

	environ_sizes_get: environ_sizes_get;
	environ_get: environ_get;

	clock_res_get: clock_res_get;
	clock_time_get: clock_time_get;

	fd_advise: fd_advise;
	fd_allocate: fd_allocate;
	fd_close: fd_close;
	fd_datasync: fd_datasync;
	fd_fdstat_get: fd_fdstat_get;
	fd_fdstat_set_flags: fd_fdstat_set_flags;
	fd_filestat_get: fd_filestat_get;
	fd_filestat_set_size:fd_filestat_set_size;
	fd_filestat_set_times: fd_filestat_set_times;
	fd_pread: fd_pread;
	fd_prestat_get: fd_prestat_get;
	fd_prestat_dir_name: fd_prestat_dir_name;
	fd_pwrite: fd_pwrite;
	fd_read: fd_read;
	fd_readdir: fd_readdir;
	fd_seek: fd_seek;
	fd_sync: fd_sync;
	fd_tell: fd_tell;
	fd_write: fd_write;

	path_create_directory: path_create_directory;
	path_filestat_get: path_filestat_get;
	path_filestat_set_times: path_filestat_set_times;
	path_link: path_link;
	path_open: path_open;
	path_readlink: path_readlink;
	path_remove_directory: path_remove_directory;
	path_rename: path_rename;
	path_symlink: path_symlink;
	path_unlink_file: path_unlink_file;

	poll_oneoff: poll_oneoff;

	proc_exit: proc_exit;

	sched_yield: sched_yield;

	random_get: random_get;

	sock_accept: sock_accept;
	sock_recv: sock_recv;
	sock_send: sock_send;
	sock_shutdown: sock_shutdown;
}

export interface Environment {
	[key: string]: string;
}

export type DeviceDescription = {
	kind: 'fileSystem';
	uri: URI;
	mountPoint: string;
} | {
	kind: 'terminal';
	uri: URI;
}  | {
	kind: 'console';
	uri: URI;
}| {
	kind: 'custom';
	uri: URI;
	factory: (apiClient: ApiShape, encoder: RAL.TextEncoder, decoder: RAL.TextDecoder, fileDescriptorId: { next(): number }) => DeviceDriver;
};

export type FileDescriptorDescription = {
	kind: 'fileSystem';
	uri: URI;
	path: string;
} | {
	kind: 'terminal';
	uri: URI;
} | {
	kind: 'console';
	uri: URI;
};

export type Options = {

	/**
	 * The encoding to use.
	 */
	encoding?: string;

	/**
	 * Command line arguments accessible in the WASM.
	 */
	args?: string [];

	/**
	 * The environment accessible in the WASM.
	 */
	env?: Environment;
};

export namespace WASI {

	/**
	 * Creates a new WASI implementation.

	 * @param programName The program name (used as argv[0]).
	 * @param apiClient The API client.
	 * @param exitHandler The handler called when the execution exists.
	 * @param devices The device to use
	 * @param stdio The stdio configuration
	 * @param options Additional options.
	 * @returns The WASI implementation instance.
	 */
	export function create(programName: string, apiClient: ApiShape, exitHandler: (rval: number) => void, devices: DeviceDescription[], stdio: { stdin: FileDescriptorDescription; stdout: FileDescriptorDescription; stderr: FileDescriptorDescription }, options: Options = {}): WASI {
		let instance: WebAssembly.$Instance;

		const thread_start = RAL().clock.realtime();
		const fileDescriptors: Map<fd, FileDescriptor> = new Map();
		let fileDescriptorCounter: number = 0;
		let fileDescriptorMode: 'init' | 'running' = 'init';
		const fileDescriptorId = {
			next(): number {
				if (fileDescriptorMode === 'init') {
					throw new WasiError(Errno.inval);
				}
				return fileDescriptorCounter++;
			}
		};
		const encoder: RAL.TextEncoder = RAL().TextEncoder.create(options?.encoding);
		const decoder: RAL.TextDecoder = RAL().TextDecoder.create(options?.encoding);

		const deviceDrivers: Map<DeviceId, DeviceDriver> = new Map();
		let uri2Driver: Map<string, DeviceDriver> | undefined = new Map();
		const preStatProviders: DeviceDriver[] = [];
		const preStatDirnames: Map<fd, string> = new Map();

		// Add the standard console driver;
		const consoleUri: URI = URI.from({ scheme: 'console', authority: 'developerTools'});
		const consoleDriver = ConsoleDriver.create(apiClient, consoleUri, decoder);
		deviceDrivers.set(consoleDriver.id, consoleDriver);
		uri2Driver.set(consoleUri.toString(true), consoleDriver);

		for (const device of devices) {
			let driver: DeviceDriver | undefined;
			switch (device.kind) {
				case 'fileSystem':
					driver = vscfs.create(apiClient, encoder, fileDescriptorId, device.uri, device.mountPoint);
					break;
				case 'terminal':
					driver = TerminalDriver.create(apiClient, device.uri);
					break;
				case 'console':
					// We always have a console driver;
					break;
				case 'custom':
					driver = device.factory(apiClient, encoder, decoder, fileDescriptorId);
					break;
			}
			if (driver !== undefined) {
				deviceDrivers.set(driver.id, driver);
				uri2Driver.set(device.uri.toString(true), driver);
				preStatProviders.push(driver);
			}
		}

		function createStdio(fd: 0 | 1 | 2, description: FileDescriptorDescription): FileDescriptor {
			let result: FileDescriptor;
			if (description.kind === 'fileSystem') {
				const driver = uri2Driver!.get(description.uri.toString(true)) as (FileSystemDeviceDriver | undefined);
				if (driver === undefined) {
					throw new Error(`No filesystem found for stdio descriptor: [${description.uri.toString(true)},${description.path}]`);
				}
				result = driver.createStdioFileDescriptor(fd, 0, description.path);
			} else if (description.kind === 'terminal') {
				let driver = uri2Driver!.get(description.uri.toString(true)) as (CharacterDeviceDriver | undefined);
				if (driver === undefined) {
					driver = TerminalDriver.create(apiClient, description.uri);
					deviceDrivers.set(driver.id, driver);
					uri2Driver!.set(description.uri.toString(true), driver);
					preStatProviders.push(driver);
				}
				result = driver.createStdioFileDescriptor(fd);
			} else if (description.kind === 'console') {
				let driver = uri2Driver!.get(description.uri.toString(true)) as CharacterDeviceDriver;
				if (driver === undefined) {
					driver = ConsoleDriver.create(apiClient, description.uri, decoder);
					deviceDrivers.set(driver.id, driver);
					uri2Driver!.set(description.uri.toString(true), driver);
					preStatProviders.push(driver);
				}
				result = driver.createStdioFileDescriptor(fd);
			} else {
				result = consoleDriver.createStdioFileDescriptor(fd);
			}
			fileDescriptors.set(fd, result);
			return result;
		}

		createStdio(0, stdio.stdin);
		createStdio(1, stdio.stdin);
		createStdio(2, stdio.stdin);
		uri2Driver = undefined;

		const directoryEntries: Map<fd, ReaddirEntry[]> = new Map();

		const wasi: WASI = {
			initialize: (inst: WebAssembly.Instance): void => {
				instance = inst as WebAssembly.$Instance;
			},
			args_sizes_get: (argvCount_ptr: ptr<u32>, argvBufSize_ptr: ptr<u32>): errno => {
				let count = 0;
				let size = 0;
				function processValue(str: string): void {
					const value = `${str}\0`;
					size += encoder.encode(value).byteLength;
					count++;
				}
				processValue(programName);
				for (const arg of options.args ?? []) {
					processValue(arg);
				}
				const memory = memoryView();
				memory.setUint32(argvCount_ptr, count, true);
				memory.setUint32(argvBufSize_ptr, size, true);
				return Errno.success;
			},
			args_get: (argv_ptr: ptr<u32[]>, argvBuf_ptr: ptr<cstring>): errno => {
				const memory = memoryView();
				const memoryBytes = new Uint8Array(memoryRaw());
				let entryOffset = argv_ptr;
				let valueOffset = argvBuf_ptr;

				function processValue(str: string): void {
					const data = encoder.encode(`${str}\0`);
					memory.setUint32(entryOffset, valueOffset, true);
					entryOffset += 4;
					memoryBytes.set(data, valueOffset);
					valueOffset += data.byteLength;
				}
				processValue(programName);
				for (const arg of options.args ?? []) {
					processValue(arg);
				}
				return Errno.success;
			},
			clock_res_get: (id: clockid, timestamp_ptr: ptr): errno => {
				const memory = memoryView();
				switch (id) {
					case Clockid.realtime:
					case Clockid.monotonic:
					case Clockid.process_cputime_id:
					case Clockid.thread_cputime_id:
						memory.setBigUint64(timestamp_ptr, 1n, true);
						return Errno.success;
					default:
						memory.setBigUint64(timestamp_ptr, 0n, true);
						return Errno.inval;
				}
			},
			clock_time_get: (id: clockid, precision: timestamp, timestamp_ptr: ptr<u64>): errno => {
				const time: bigint = now(id, precision);
				memoryView().setBigUint64(timestamp_ptr, time, true);
				return Errno.success;
			},
			environ_sizes_get: (environCount_ptr: ptr<u32>, environBufSize_ptr: ptr<u32>): errno => {
				let count = 0;
				let size = 0;
				for (const entry of Object.entries(options.env ?? {})) {
					const value = `${entry[0]}=${entry[1]}\0`;
					size += encoder.encode(value).byteLength;
					count++;
				}
				const memory = memoryView();
				memory.setUint32(environCount_ptr, count, true);
				memory.setUint32(environBufSize_ptr, size, true);
				return Errno.success;
			},
			environ_get: (environ_ptr: ptr<u32>, environBuf_ptr: ptr<cstring>): errno => {
				const memory = memoryView();
				const memoryBytes = new Uint8Array(memoryRaw());
				let entryOffset = environ_ptr;
				let valueOffset = environBuf_ptr;
				for (const entry of Object.entries(options.env ?? {})) {
					const data = encoder.encode(`${entry[0]}=${entry[1]}\0`);
					memory.setUint32(entryOffset, valueOffset, true);
					entryOffset += 4;
					memoryBytes.set(data, valueOffset);
					valueOffset += data.byteLength;
				}
				return Errno.success;
			},
			fd_advise: (fd: fd, offset: filesize, length: filesize, advise: advise): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.fd_advise);

					getDeviceDriver(fileDescriptor).fd_advise(fileDescriptor, offset, length, advise);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_allocate: (fd: fd, offset: filesize, len: filesize): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.fd_allocate);

					getDeviceDriver(fileDescriptor).fd_allocate(fileDescriptor, offset, len);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_close: (fd: fd): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);

					getDeviceDriver(fileDescriptor).fd_close(fileDescriptor);
					fileDescriptors.delete(fileDescriptor.fd);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_datasync: (fd: fd): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.fd_datasync);

					getDeviceDriver(fileDescriptor).fd_datasync(fileDescriptor);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_fdstat_get: (fd: fd, fdstat_ptr: ptr<fdstat>): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);

					getDeviceDriver(fileDescriptor).fd_fdstat_get(fileDescriptor, Fdstat.create(fdstat_ptr, memoryView()));
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_fdstat_set_flags: (fd: fd, fdflags: fdflags): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.fd_fdstat_set_flags);

					getDeviceDriver(fileDescriptor).fd_fdstat_set_flags(fileDescriptor, fdflags);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_filestat_get: (fd: fd, filestat_ptr: ptr<filestat>): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.fd_filestat_get);

					getDeviceDriver(fileDescriptor).fd_filestat_get(fileDescriptor, Filestat.create(filestat_ptr, memoryView()));
					return Errno.success;
				} catch (error) {
					return handleError(error, Errno.perm);
				}
			},
			fd_filestat_set_size: (fd: fd, size: filesize): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.fd_filestat_set_size);

					getDeviceDriver(fileDescriptor).fd_filestat_set_size(fileDescriptor, size);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_filestat_set_times: (fd: fd, atim: timestamp, mtim: timestamp, fst_flags: fstflags): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.fd_filestat_set_times);

					getDeviceDriver(fileDescriptor).fd_filestat_set_times(fileDescriptor, atim, mtim, fst_flags);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_pread: (fd: fd, iovs_ptr: ptr<iovec>, iovs_len: u32, offset: filesize, bytesRead_ptr: ptr<u32>): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.fd_read | Rights.fd_seek);

					const buffers = read_iovs(iovs_ptr, iovs_len);
					const bytesRead = getDeviceDriver(fileDescriptor).fd_pread(fileDescriptor, offset, buffers);
					memoryView().setUint32(bytesRead_ptr, bytesRead, true);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_prestat_get: (fd: fd, bufPtr: ptr<prestat>): errno => {
				try {
					while (true) {
						if (preStatProviders.length === 0) {
							fileDescriptorCounter = fd;
							fileDescriptorMode = 'running';
							return Errno.badf;
						}
						const current = preStatProviders[0];
						const result = current.fd_prestat_get(fd);
						// The current provider doesn't have predefined directories anymore.
						if (result === undefined) {
							preStatProviders.shift();
						} else {
							const [mountPoint, fileDescriptor] = result;
							fileDescriptors.set(fileDescriptor.fd, fileDescriptor);
							preStatDirnames.set(fileDescriptor.fd, mountPoint);
							const memory = memoryView();
							const prestat = Prestat.create(bufPtr, memory);
							prestat.len = encoder.encode(mountPoint).byteLength;
							return Errno.success;
						}
					}
				} catch(error) {
					return handleError(error);
				}
			},
			fd_prestat_dir_name: (fd: fd, pathPtr: ptr<u8[]>, pathLen: size): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					const dirname = preStatDirnames.get(fileDescriptor.fd);
					if (dirname === undefined) {
						return Errno.badf;
					}
					const bytes = encoder.encode(dirname);
					if (bytes.byteLength !== pathLen) {
						Errno.badmsg;
					}
					const memory = new Uint8Array(memoryRaw(), pathPtr);
					memory.set(bytes);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_pwrite: (fd: fd, ciovs_ptr: ptr<ciovec>, ciovs_len: u32, offset: filesize, bytesWritten_ptr: ptr<u32>): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.fd_write | Rights.fd_seek);

					const buffers = read_ciovs(ciovs_ptr, ciovs_len);
					const bytesWritten = getDeviceDriver(fileDescriptor).fd_pwrite(fileDescriptor, offset, buffers);
					memoryView().setUint32(bytesWritten_ptr, bytesWritten, true);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_read: (fd: fd, iovs_ptr: ptr<iovec>, iovs_len: u32, bytesRead_ptr: ptr<u32>): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.fd_read);

					const buffers = read_iovs(iovs_ptr, iovs_len);
					const bytesRead = getDeviceDriver(fileDescriptor).fd_read(fileDescriptor, buffers);
					memoryView().setUint32(bytesRead_ptr, bytesRead, true);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_readdir: (fd: fd, buf_ptr: ptr<dirent>, buf_len: size, cookie: dircookie, buf_used_ptr: ptr<u32>): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.fd_readdir);
					fileDescriptor.assertIsDirectory();

					const driver = getDeviceDriver(fileDescriptor);
					const memory = memoryView();
					const raw = memoryRaw();

					// We have a cookie > 0 but no directory entries. So return end  of list
					// todo@dirkb this is actually specified different. According to the spec if
					// the used buffer size is less than the provided buffer size then no
					// additional readdir call should happen. However at least under Rust we
					// receive another call.
					//
					// Also unclear whether we have to include '.' and '..'
					//
					// See also https://github.com/WebAssembly/wasi-filesystem/issues/3
					if (cookie !== 0n && !directoryEntries.has(fileDescriptor.fd)) {
						memory.setUint32(buf_used_ptr, 0, true);
						return Errno.success;
					}
					if (cookie === 0n) {
						directoryEntries.set(fileDescriptor.fd, driver.fd_readdir(fileDescriptor));
					}
					const entries: ReaddirEntry[] | undefined = directoryEntries.get(fileDescriptor.fd);
					if (entries === undefined) {
						throw new WasiError(Errno.badmsg);
					}
					let i = Number(cookie);
					let ptr: ptr = buf_ptr;
					let spaceLeft = buf_len;
					for (; i < entries.length && spaceLeft >= Dirent.size; i++) {
						const entry = entries[i];
						const name = entry.d_name;
						const nameBytes = encoder.encode(name);
						const dirent: dirent = Dirent.create(ptr, memory);
						dirent.d_next = BigInt(i + 1);
						dirent.d_ino = entry.d_ino;
						dirent.d_type = entry.d_type;
						dirent.d_namlen = nameBytes.byteLength;
						spaceLeft -= Dirent.size;
						const spaceForName = Math.min(spaceLeft, nameBytes.byteLength);
						(new Uint8Array(raw, ptr + Dirent.size, spaceForName)).set(nameBytes.subarray(0, spaceForName));
						ptr += Dirent.size + spaceForName;
						spaceLeft -= spaceForName;
					}
					if (i === entries.length) {
						memory.setUint32(buf_used_ptr, ptr - buf_ptr, true);
						directoryEntries.delete(fileDescriptor.fd);
					} else {
						memory.setUint32(buf_used_ptr, buf_len, true);
					}
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_seek: (fd: fd, offset: filedelta, whence: whence, new_offset_ptr: ptr<u64>): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					if (whence === Whence.cur && offset === 0n && !fileDescriptor.containsBaseRights(Rights.fd_seek) && !fileDescriptor.containsBaseRights(Rights.fd_tell)) {
						throw new WasiError(Errno.perm);
					} else {
						fileDescriptor.assertBaseRights(Rights.fd_seek);
					}

					const newOffset = getDeviceDriver(fileDescriptor).fd_seek(fileDescriptor, offset, whence);
					memoryView().setBigUint64(new_offset_ptr, BigInt(newOffset), true);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_sync: (fd: fd): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.fd_sync);

					getDeviceDriver(fileDescriptor).fd_sync(fileDescriptor);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_tell: (fd: fd, offset_ptr: ptr<u64>): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.fd_tell | Rights.fd_seek);

					const offset = getDeviceDriver(fileDescriptor).fd_tell(fileDescriptor);
					memoryView().setBigUint64(offset_ptr, BigInt(offset), true);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_write: (fd: fd, ciovs_ptr: ptr<ciovec>, ciovs_len: u32, bytesWritten_ptr: ptr<u32>): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.fd_write);

					const buffers = read_ciovs(ciovs_ptr, ciovs_len);
					const bytesWritten = getDeviceDriver(fileDescriptor).fd_write(fileDescriptor, buffers);
					memoryView().setUint32(bytesWritten_ptr, bytesWritten, true);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			path_create_directory: (fd: fd, path_ptr: ptr<u8[]>, path_len: size): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.path_create_directory);
					fileDescriptor.assertIsDirectory();

					const path = decoder.decode(new Uint8Array(memoryRaw(), path_ptr, path_len));
					getDeviceDriver(fileDescriptor).path_create_directory(fileDescriptor, path);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			path_filestat_get: (fd: fd, flags: lookupflags, path_ptr: ptr<u8[]>, path_len: size, filestat_ptr: ptr): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.path_filestat_get);
					fileDescriptor.assertIsDirectory();

					const path = decoder.decode(new Uint8Array(memoryRaw(), path_ptr, path_len));
					getDeviceDriver(fileDescriptor).path_filestat_get(fileDescriptor, flags, path, Filestat.create(filestat_ptr, memoryView()));
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			path_filestat_set_times: (fd: fd, flags: lookupflags, path_ptr: ptr<u8[]>, path_len: size, atim: timestamp, mtim: timestamp, fst_flags: fstflags): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.path_filestat_set_times);
					fileDescriptor.assertIsDirectory();

					const path = decoder.decode(new Uint8Array(memoryRaw(), path_ptr, path_len));
					getDeviceDriver(fileDescriptor).path_filestat_set_times(fileDescriptor, flags, path, atim, mtim, fst_flags);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			path_link: (old_fd: fd, old_flags: lookupflags, old_path_ptr: ptr<u8[]>, old_path_len: size, new_fd: fd, new_path_ptr: ptr<u8[]>, new_path_len: size): errno => {
				try {
					const oldFileDescriptor = getFileDescriptor(old_fd);
					oldFileDescriptor.assertBaseRights(Rights.path_link_source);
					oldFileDescriptor.assertIsDirectory();

					const newFileDescriptor = getFileDescriptor(new_fd);
					newFileDescriptor.assertBaseRights(Rights.path_link_target);
					newFileDescriptor.assertIsDirectory();

					if (oldFileDescriptor.deviceId !== newFileDescriptor.deviceId) {
						// currently we have no support to link across devices
						return Errno.nosys;
					}

					const memory = memoryRaw();
					const oldPath = decoder.decode(new Uint8Array(memory, old_path_ptr, old_path_len));
					const newPath = decoder.decode(new Uint8Array(memory, new_path_ptr, new_path_len));
					getDeviceDriver(oldFileDescriptor).path_link(oldFileDescriptor, old_flags, oldPath, newFileDescriptor, newPath);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			path_open: (fd: fd, dirflags: lookupflags, path_ptr: ptr<u8[]>, path_len: size, oflags: oflags, fs_rights_base: rights, fs_rights_inheriting: rights, fdflags: fdflags, fd_ptr: ptr<fd>): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.path_open);
					fileDescriptor.assertFdflags(fdflags);
					fileDescriptor.assertOflags(oflags);

					const path = decoder.decode(new Uint8Array(memoryRaw(), path_ptr, path_len));
					const result = getDeviceDriver(fileDescriptor).path_open(fileDescriptor, dirflags, path, oflags, fs_rights_base, fs_rights_inheriting, fdflags);
					fileDescriptors.set(result.fd, result);
					memoryView().setUint32(fd_ptr, result.fd, true);
					return Errno.success;
				} catch(error) {
					return handleError(error);
				}
			},
			path_readlink: (fd: fd, path_ptr: ptr<u8[]>, path_len: size, buf_ptr: ptr, buf_len: size, result_size_ptr: ptr<u32>): errno => {
				// VS Code has no support to follow a symlink.
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.path_readlink);
					fileDescriptor.assertIsDirectory();

					const memory = memoryRaw();
					const path = decoder.decode(new Uint8Array(memory, path_ptr, path_len));
					const result = encoder.encode(getDeviceDriver(fileDescriptor).path_readlink(fileDescriptor, path));
					if (result.byteLength > buf_len) {
						return Errno.inval;
					}

					new Uint8Array(memory, buf_ptr, buf_len).set(result);
					memoryView().setUint32(result_size_ptr, result.byteLength, true);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			path_remove_directory: (fd: fd, path_ptr: ptr<u8[]>, path_len: size): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.path_remove_directory);
					fileDescriptor.assertIsDirectory();

					const path = decoder.decode(new Uint8Array(memoryRaw(), path_ptr, path_len));
					getDeviceDriver(fileDescriptor).path_remove_directory(fileDescriptor, path);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			path_rename: (old_fd: fd, old_path_ptr: ptr<u8[]>, old_path_len: size, new_fd: fd, new_path_ptr: ptr<u8[]>, new_path_len: size): errno => {
				try {
					const oldFileDescriptor = getFileDescriptor(old_fd);
					oldFileDescriptor.assertBaseRights(Rights.path_rename_source);
					oldFileDescriptor.assertIsDirectory();

					const newFileDescriptor = getFileDescriptor(new_fd);
					newFileDescriptor.assertBaseRights(Rights.path_rename_target);
					newFileDescriptor.assertIsDirectory();

					const memory = memoryRaw();
					const oldPath = decoder.decode(new Uint8Array(memory, old_path_ptr, old_path_len));
					const newPath = decoder.decode(new Uint8Array(memory, new_path_ptr, new_path_len));
					getDeviceDriver(oldFileDescriptor).path_rename(oldFileDescriptor, oldPath, newFileDescriptor, newPath);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			path_symlink: (old_path_ptr: ptr<u8[]>, old_path_len: size, fd: fd, new_path_ptr: ptr<u8[]>, new_path_len: size): errno => {
				// VS Code has no support to create a symlink.
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.path_symlink);
					fileDescriptor.assertIsDirectory();

					const memory = memoryRaw();
					const oldPath = decoder.decode(new Uint8Array(memory, old_path_ptr, old_path_len));
					const newPath = decoder.decode(new Uint8Array(memory, new_path_ptr, new_path_len));
					getDeviceDriver(fileDescriptor).path_symlink(oldPath, fileDescriptor, newPath);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			path_unlink_file: (fd: fd, path_ptr: ptr<u8[]>, path_len: size): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.path_unlink_file);
					fileDescriptor.assertIsDirectory();

					const path = decoder.decode(new Uint8Array(memoryRaw(), path_ptr, path_len));
					getDeviceDriver(fileDescriptor).path_unlink_file(fileDescriptor, path);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			poll_oneoff: (input: ptr<subscription>, output: ptr<event[]>, subscriptions: size, result_size_ptr: ptr<u32>): errno => {
				try {
					const memory = memoryView();
					let { events, needsTimeOut, timeout } = handleSubscriptions(memory, input, subscriptions);
					if (needsTimeOut && timeout !== undefined && timeout !== 0n) {
						// Timeout is in ns but sleep API is in ms.
						apiClient.timer.sleep(BigInts.asNumber(timeout / 1000000n));
						// Reread the events. Timer will not change however the rest could have.
						events = handleSubscriptions(memory, input, subscriptions).events;
					}
					let event_offset = output;
					for (const item of events) {
						const event = Event.create(event_offset, memory);
						event.userdata = item.userdata;
						event.type = item.type;
						event.error = item.error;
						event.fd_readwrite.nbytes = item.fd_readwrite.nbytes;
						event.fd_readwrite.flags = item.fd_readwrite.flags;
						event_offset += Event.size;
					}
					memory.setUint32(result_size_ptr, events.length, true);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			proc_exit: (rval: exitcode) => {
				exitHandler(rval);
			},
			sched_yield: (): errno => {
				return Errno.nosys;
			},
			random_get: (buf: ptr<u8[]>, buf_len: size): errno => {
				const random = RAL().crypto.randomGet(buf_len);
				new Uint8Array(memoryRaw(), buf, buf_len).set(random);
				return Errno.success;
			},
			sock_accept: (_fd: fd, _flags: fdflags, _result_fd_ptr: ptr<u32>): errno => {
				return Errno.nosys;
			},
			sock_recv: (_fd: fd, _ri_data_ptr: ptr, _ri_data_len: u32, _ri_flags: riflags, _ro_datalen_ptr: ptr, _roflags_ptr: ptr): errno => {
				return Errno.nosys;
			},
			sock_send: (_fd: fd, _si_data_ptr: ptr, _si_data_len: u32, _si_flags: siflags, _si_datalen_ptr: ptr): errno => {
				return Errno.nosys;
			},
			sock_shutdown: (_fd: fd, _sdflags: sdflags): errno => {
				return Errno.nosys;
			}
		};

		function now(id: clockid, _precision: timestamp): bigint {
			switch(id) {
				case Clockid.realtime:
					return RAL().clock.realtime();
				case Clockid.monotonic:
					return RAL().clock.monotonic();
				case Clockid.process_cputime_id:
				case Clockid.thread_cputime_id:
					return RAL().clock.monotonic() - thread_start;
				default:
					throw new WasiError(Errno.inval);
			}
		}

		function memoryView(): DataView {
			if (instance === undefined) {
				throw new Error(`WASI layer is not initialized. Missing WebAssembly instance.`);
			}
			return new DataView(instance.exports.memory.buffer);
		}

		function memoryRaw(): ArrayBuffer {
			if (instance === undefined) {
				throw new Error(`WASI layer is not initialized. Missing WebAssembly instance.`);
			}
			return instance.exports.memory.buffer;
		}

		function handleSubscriptions(memory: DataView, input: ptr, subscriptions: size) {
			let subscription_offset: ptr = input;
			const events: Literal<event>[] = [];
			let timeout: bigint | undefined;
			let needsTimeOut = false;
			for (let i = 0; i < subscriptions; i++) {
				const subscription = Subscription.create(subscription_offset, memory);
				const u = subscription.u;
				switch (u.type) {
					case Eventtype.clock:
						const clockResult = handleClockSubscription(subscription);
						timeout = clockResult.timeout;
						events.push(clockResult.event);
						break;
					case Eventtype.fd_read:
						const readEvent = handleReadSubscription(subscription);
						events.push(readEvent);
						if (readEvent.error !== Errno.success || readEvent.fd_readwrite.nbytes === 0n) {
							needsTimeOut = true;
						}
						break;
					case Eventtype.fd_write:
						const writeEvent = handleWriteSubscription(subscription);
						events.push(writeEvent);
						if (writeEvent.error !== Errno.success) {
							needsTimeOut = true;
						}
						break;
				}
				subscription_offset += Subscription.size;
			}
			return { events, needsTimeOut, timeout };
		}

		function handleClockSubscription(subscription: subscription): { event: Literal<event>; timeout: bigint } {
			const result: Literal<event> = {
				userdata: subscription.userdata,
				type: Eventtype.clock,
				error: Errno.success,
				fd_readwrite: {
					nbytes: 0n,
					flags: 0
				}
			};
			const clock = subscription.u.clock;
			// Timeout is in ns.
			let timeout: bigint;
			if ((clock.flags & Subclockflags.subscription_clock_abstime) !== 0) {
				const time = now(Clockid.realtime, 0n);
				timeout = BigInt(Math.max(0, BigInts.asNumber(time - clock.timeout)));
			} else {
				timeout  = clock.timeout;
			}
			return { event: result, timeout };
		}

		function handleReadSubscription(subscription: subscription): Literal<event> {
			const fd = subscription.u.fd_read.file_descriptor;
			try {
				const fileDescriptor = getFileDescriptor(fd);
				if (!fileDescriptor.containsBaseRights(Rights.poll_fd_readwrite) && !fileDescriptor.containsBaseRights(Rights.fd_read)) {
					throw new WasiError(Errno.perm);
				}

				const available = getDeviceDriver(fileDescriptor).fd_bytesAvailable(fileDescriptor);
				return {
					userdata: subscription.userdata,
					type: Eventtype.fd_read,
					error: Errno.success,
					fd_readwrite: {
						nbytes: available,
						flags: 0
					}
				};
			} catch (error) {
				return {
					userdata: subscription.userdata,
					type: Eventtype.fd_read,
					error: handleError(error),
					fd_readwrite: {
						nbytes: 0n,
						flags: 0
					}
				};
			}
		}

		function handleWriteSubscription(subscription: subscription): Literal<event> {
			const fd = subscription.u.fd_write.file_descriptor;
			try {
				const fileDescriptor = getFileDescriptor(fd);
				if (!fileDescriptor.containsBaseRights(Rights.poll_fd_readwrite) && !fileDescriptor.containsBaseRights(Rights.fd_write)) {
					throw new WasiError(Errno.perm);
				}
				return {
					userdata: subscription.userdata,
					type: Eventtype.fd_write,
					error: Errno.success,
					fd_readwrite: {
						nbytes: 0n,
						flags: 0
					}
				};
			} catch (error) {
				return {
					userdata: subscription.userdata,
					type: Eventtype.fd_write,
					error: handleError(error),
					fd_readwrite: {
						nbytes: 0n,
						flags: 0
					}
				};
			}
		}

		function handleError(error: any, def: errno = Errno.badf): errno {
			if (error instanceof WasiError) {
				return error.errno;
			} else if (error instanceof FileSystemError) {
				return code2Wasi.asErrno(error.code);
			} else if (error instanceof RPCError) {
				return code2Wasi.asErrno(error.errno);
			}
			return def;
		}

		function read_ciovs (iovs: ptr, iovsLen: u32): Uint8Array[] {
			const memory = memoryView();
			const rawMemory = memoryRaw();

			const buffers: Uint8Array[] = [];
			let ptr: ptr = iovs;
			for (let i = 0; i < iovsLen; i++) {
				const vec = Ciovec.create(ptr, memory);
				buffers.push(new Uint8Array(rawMemory, vec.buf, vec.buf_len));
				ptr += Ciovec.size;
			}
			return buffers;
		}

		function read_iovs (iovs: ptr, iovsLen: u32): Uint8Array[] {
			const memory = memoryView();
			const rawMemory = memoryRaw();

			const buffers: Uint8Array[] = [];
			let ptr: ptr = iovs;
			for (let i = 0; i < iovsLen; i++) {
				const vec = Iovec.create(ptr, memory);
				buffers.push(new Uint8Array(rawMemory, vec.buf, vec.buf_len));
				ptr += Iovec.size;
			}
			return buffers;
		}

		function getDeviceDriver(fileDescriptor: FileDescriptor): DeviceDriver {
			const result = deviceDrivers.get(fileDescriptor.deviceId);
			if (result === undefined) {
				throw new WasiError(Errno.badf);
			}
			return result;
		}

		function getFileDescriptor(fd: fd): FileDescriptor {
			const result = fileDescriptors.get(fd);
			if (result === undefined) {
				throw new WasiError(Errno.badf);
			}
			return result;
		}

		return wasi;
	}
}
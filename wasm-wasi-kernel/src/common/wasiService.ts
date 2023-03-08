/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';

import RAL from './ral';
import {
	advise,
	args_get, args_sizes_get, Ciovec, ciovec, Clockid, clockid, clock_res_get, clock_time_get, dircookie, Dirent, dirent, environ_get, environ_sizes_get, errno, Errno, Event, event, Eventtype, exitcode, fd, fdflags, Fdstat, fdstat, fd_advise, fd_allocate,
	fd_close, fd_datasync, fd_fdstat_get, fd_fdstat_set_flags, fd_filestat_get, fd_filestat_set_size, fd_filestat_set_times, fd_pread,
	fd_prestat_dir_name, fd_prestat_get, fd_pwrite, fd_read, fd_readdir, fd_renumber, fd_seek, fd_sync, fd_tell, fd_write, filedelta, filesize, Filestat, filestat, fstflags, Iovec, iovec, Literal, lookupflags, oflags, path_create_directory,
	path_filestat_get, path_filestat_set_times, path_link, path_open, path_readlink, path_remove_directory, path_rename, path_symlink, path_unlink_file,
	poll_oneoff, Prestat, prestat, proc_exit, random_get, riflags, rights, Rights, sched_yield, sdflags, siflags, sock_accept, Subclockflags, Subscription, subscription, thread_spawn, timestamp, WasiError, Whence, whence
} from './wasi';
import { Offsets } from './connection';
import { WasiFunction, WasiFunctions, WasiFunctionSignature } from './wasiMeta';
import { byte, bytes, cstring, ptr, size, u32, u64 } from './baseTypes';
import { FileDescriptor, FileDescriptors } from './fileDescriptor';
import { DeviceDriver, ReaddirEntry } from './deviceDriver';
import { BigInts, code2Wasi } from './converter';
import WasiKernel from './wasiKernel';

export interface Environment {
	[key: string]: string;
}

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

export interface SharedWasiService {
	args_sizes_get: args_sizes_get.ServiceSignature;
	args_get: args_get.ServiceSignature;
	environ_sizes_get: environ_sizes_get.ServiceSignature;
	environ_get: environ_get.ServiceSignature;
	fd_prestat_get: fd_prestat_get.ServiceSignature;
	fd_prestat_dir_name: fd_prestat_dir_name.ServiceSignature;
}

export namespace SharedWasiService {
	export function create(fileDescriptors: FileDescriptors, programName: string, preStats: Map<string, DeviceDriver>, options: Options = {}): SharedWasiService {

		const encoder: RAL.TextEncoder = RAL().TextEncoder.create(options?.encoding);
		const preStatDirnames: Map<fd, string> = new Map();

		const result: SharedWasiService = {
			args_sizes_get: (memory: ArrayBuffer, argvCount_ptr: ptr<u32>, argvBufSize_ptr: ptr<u32>): Promise<errno> => {
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
				const view = new DataView(memory);
				view.setUint32(argvCount_ptr, count, true);
				view.setUint32(argvBufSize_ptr, size, true);
				return Promise.resolve(Errno.success);
			},
			args_get: (memory: ArrayBuffer, argv_ptr: ptr<u32[]>, argvBuf_ptr: ptr<cstring>): Promise<errno> => {
				const memoryView = new DataView(memory);
				const memoryBytes = new Uint8Array(memory);
				let entryOffset = argv_ptr;
				let valueOffset = argvBuf_ptr;

				function processValue(str: string): void {
					const data = encoder.encode(`${str}\0`);
					memoryView.setUint32(entryOffset, valueOffset, true);
					entryOffset += 4;
					memoryBytes.set(data, valueOffset);
					valueOffset += data.byteLength;
				}
				processValue(programName);
				for (const arg of options.args ?? []) {
					processValue(arg);
				}
				return Promise.resolve(Errno.success);
			},
			environ_sizes_get: (memory: ArrayBuffer, environCount_ptr: ptr<u32>, environBufSize_ptr: ptr<u32>): Promise<errno> => {
				let count = 0;
				let size = 0;
				for (const entry of Object.entries(options.env ?? {})) {
					const value = `${entry[0]}=${entry[1]}\0`;
					size += encoder.encode(value).byteLength;
					count++;
				}
				const view = new DataView(memory);
				view.setUint32(environCount_ptr, count, true);
				view.setUint32(environBufSize_ptr, size, true);
				return Promise.resolve(Errno.success);
			},
			environ_get: (memory: ArrayBuffer, environ_ptr: ptr<u32>, environBuf_ptr: ptr<cstring>): Promise<errno> => {
				const view = new DataView(memory);
				const bytes = new Uint8Array(memory);
				let entryOffset = environ_ptr;
				let valueOffset = environBuf_ptr;
				for (const entry of Object.entries(options.env ?? {})) {
					const data = encoder.encode(`${entry[0]}=${entry[1]}\0`);
					view.setUint32(entryOffset, valueOffset, true);
					entryOffset += 4;
					bytes.set(data, valueOffset);
					valueOffset += data.byteLength;
				}
				return Promise.resolve(Errno.success);
			},
			fd_prestat_get: async (memory: ArrayBuffer, fd: fd, bufPtr: ptr<prestat>): Promise<errno> => {
				try {
					const next = preStats.entries().next();
					if (next.done === true) {
						fileDescriptors.switchToRunning(fd);
						return Errno.badf;
					}
					const [ mountPoint, deviceDriver ] = next.value;
					const fileDescriptor = await deviceDriver.fd_create_prestat_fd(fd);
					fileDescriptors.add(fileDescriptor);
					preStatDirnames.set(fileDescriptor.fd, mountPoint);
					const view = new DataView(memory);
					const prestat = Prestat.create(bufPtr, view);
					prestat.len = encoder.encode(mountPoint).byteLength;
					return Errno.success;
				} catch(error) {
					return handleError(error);
				}
			},
			fd_prestat_dir_name: (memory: ArrayBuffer, fd: fd, pathPtr: ptr<byte[]>, pathLen: size): Promise<errno> => {
				try {
					const fileDescriptor = fileDescriptors.get(fd);
					const dirname = preStatDirnames.get(fileDescriptor.fd);
					if (dirname === undefined) {
						return Promise.resolve(Errno.badf);
					}
					const bytes = encoder.encode(dirname);
					if (bytes.byteLength !== pathLen) {
						Errno.badmsg;
					}
					const raw = new Uint8Array(memory, pathPtr);
					raw.set(bytes);
					return Promise.resolve(Errno.success);
				} catch (error) {
					return Promise.resolve(handleError(error));
				}
			}
		};

		function handleError(error: any, def: errno = Errno.badf): errno {
			if (error instanceof WasiError) {
				return error.errno;
			} else if (error instanceof vscode.FileSystemError) {
				return code2Wasi.asErrno(error.code);
			}
			return def;
		}

		return result;
	}
}

interface InstanceWasiService {
	clock_res_get: clock_res_get.ServiceSignature;
	clock_time_get: clock_time_get.ServiceSignature;
	fd_advise: fd_advise.ServiceSignature;
	fd_allocate: fd_allocate.ServiceSignature;
	fd_close: fd_close.ServiceSignature;
	fd_datasync: fd_datasync.ServiceSignature;
	fd_fdstat_get: fd_fdstat_get.ServiceSignature;
	fd_fdstat_set_flags: fd_fdstat_set_flags.ServiceSignature;
	fd_filestat_get: fd_filestat_get.ServiceSignature;
	fd_filestat_set_size: fd_filestat_set_size.ServiceSignature;
	fd_filestat_set_times: fd_filestat_set_times.ServiceSignature;
	fd_pread: fd_pread.ServiceSignature;
	fd_pwrite: fd_pwrite.ServiceSignature;
	fd_read: fd_read.ServiceSignature;
	fd_readdir: fd_readdir.ServiceSignature;
	fd_seek: fd_seek.ServiceSignature;
	fd_renumber: fd_renumber.ServiceSignature;
	fd_sync: fd_sync.ServiceSignature;
	fd_tell: fd_tell.ServiceSignature;
	fd_write: fd_write.ServiceSignature;
	path_create_directory: path_create_directory.ServiceSignature;
	path_filestat_get: path_filestat_get.ServiceSignature;
	path_filestat_set_times: path_filestat_set_times.ServiceSignature;
	path_link: path_link.ServiceSignature;
	path_open: path_open.ServiceSignature;
	path_readlink: path_readlink.ServiceSignature;
	path_remove_directory: path_remove_directory.ServiceSignature;
	path_rename: path_rename.ServiceSignature;
	path_symlink: path_symlink.ServiceSignature;
	path_unlink_file: path_unlink_file.ServiceSignature;
	poll_oneoff: poll_oneoff.ServiceSignature;
	proc_exit: proc_exit.ServiceSignature;
	sched_yield: sched_yield.ServiceSignature;
	random_get: random_get.ServiceSignature;
	sock_accept: sock_accept.ServiceSignature;
	sock_shutdown: sock_accept.ServiceSignature;
	'thread-spawn': thread_spawn.ServiceSignature;

	[name: string]: (memory: ArrayBuffer, ...args: (number & bigint)[]) => Promise<errno>;
}

export interface WasiService extends InstanceWasiService, SharedWasiService {
}

export namespace InstanceWasiService {
	export function create(fileDescriptors: FileDescriptors, exitHandler: (rval: number) => void, threadSpawnHandler: (start_args_ptr: ptr) => Promise<u32>, options: Options = {}): InstanceWasiService {

		const thread_start = RAL().clock.realtime();

		const directoryEntries: Map<fd, ReaddirEntry[]> = new Map();

		const encoder: RAL.TextEncoder = RAL().TextEncoder.create(options?.encoding);
		const decoder: RAL.TextDecoder = RAL().TextDecoder.create(options?.encoding);

		const result: InstanceWasiService = {
			clock_res_get: (memory: ArrayBuffer, id: clockid, timestamp_ptr: ptr): Promise<errno> => {
				const view = new DataView(memory);
				switch (id) {
					case Clockid.realtime:
					case Clockid.monotonic:
					case Clockid.process_cputime_id:
					case Clockid.thread_cputime_id:
						view.setBigUint64(timestamp_ptr, 1n, true);
						return Promise.resolve(Errno.success);
					default:
						view.setBigUint64(timestamp_ptr, 0n, true);
						return Promise.resolve(Errno.inval);
				}
			},
			clock_time_get: (memory: ArrayBuffer, id: clockid, precision: timestamp, timestamp_ptr: ptr<u64>): Promise<errno> => {
				const time: bigint = now(id, precision);
				const view = new DataView(memory);
				view.setBigUint64(timestamp_ptr, time, true);
				return Promise.resolve(Errno.success);
			},
			fd_advise: async (_memory: ArrayBuffer, fd: fd, offset: filesize, length: filesize, advise: advise): Promise<errno> => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.fd_advise);

					await getDeviceDriver(fileDescriptor).fd_advise(fileDescriptor, offset, length, advise);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_allocate: async (_memory: ArrayBuffer, fd: fd, offset: filesize, len: filesize): Promise<errno> => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.fd_allocate);

					await getDeviceDriver(fileDescriptor).fd_allocate(fileDescriptor, offset, len);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_close: async (_memory: ArrayBuffer, fd: fd): Promise<errno> => {
				try {
					const fileDescriptor = getFileDescriptor(fd);

					await getDeviceDriver(fileDescriptor).fd_close(fileDescriptor);
					fileDescriptors.delete(fileDescriptor);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_datasync: async (_memory: ArrayBuffer, fd: fd): Promise<errno> => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.fd_datasync);

					await getDeviceDriver(fileDescriptor).fd_datasync(fileDescriptor);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_fdstat_get: async (memory: ArrayBuffer, fd: fd, fdstat_ptr: ptr<fdstat>): Promise<errno> => {
				try {
					const fileDescriptor = getFileDescriptor(fd);

					await getDeviceDriver(fileDescriptor).fd_fdstat_get(fileDescriptor, Fdstat.create(fdstat_ptr, new DataView(memory)));
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_fdstat_set_flags: async (_memory: ArrayBuffer, fd: fd, fdflags: fdflags): Promise<errno> => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.fd_fdstat_set_flags);

					await getDeviceDriver(fileDescriptor).fd_fdstat_set_flags(fileDescriptor, fdflags);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_filestat_get: async (memory: ArrayBuffer, fd: fd, filestat_ptr: ptr<filestat>): Promise<errno> => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.fd_filestat_get);

					await getDeviceDriver(fileDescriptor).fd_filestat_get(fileDescriptor, Filestat.create(filestat_ptr, new DataView(memory)));
					return Errno.success;
				} catch (error) {
					return handleError(error, Errno.perm);
				}
			},
			fd_filestat_set_size: async (_memory: ArrayBuffer, fd: fd, size: filesize): Promise<errno> => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.fd_filestat_set_size);

					await getDeviceDriver(fileDescriptor).fd_filestat_set_size(fileDescriptor, size);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_filestat_set_times: async (_memory: ArrayBuffer, fd: fd, atim: timestamp, mtim: timestamp, fst_flags: fstflags): Promise<errno> => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.fd_filestat_set_times);

					await getDeviceDriver(fileDescriptor).fd_filestat_set_times(fileDescriptor, atim, mtim, fst_flags);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_pread: async (memory: ArrayBuffer, fd: fd, iovs_ptr: ptr<iovec>, iovs_len: u32, offset: filesize, bytesRead_ptr: ptr<u32>): Promise<errno> => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.fd_read | Rights.fd_seek);

					const view = new DataView(memory);
					const buffers = read_iovs(memory, iovs_ptr, iovs_len);
					const bytesRead = await getDeviceDriver(fileDescriptor).fd_pread(fileDescriptor, offset, buffers);
					view.setUint32(bytesRead_ptr, bytesRead, true);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_pwrite: async (memory: ArrayBuffer, fd: fd, ciovs_ptr: ptr<ciovec>, ciovs_len: u32, offset: filesize, bytesWritten_ptr: ptr<u32>): Promise<errno> => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.fd_write | Rights.fd_seek);

					const view = new DataView(memory);
					const buffers = read_ciovs(memory, ciovs_ptr, ciovs_len);
					const bytesWritten = await getDeviceDriver(fileDescriptor).fd_pwrite(fileDescriptor, offset, buffers);
					view.setUint32(bytesWritten_ptr, bytesWritten, true);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_read: async (memory: ArrayBuffer, fd: fd, iovs_ptr: ptr<iovec>, iovs_len: u32, bytesRead_ptr: ptr<u32>): Promise<errno> => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.fd_read);

					const view = new DataView(memory);
					const buffers = read_iovs(memory, iovs_ptr, iovs_len);
					const bytesRead = await getDeviceDriver(fileDescriptor).fd_read(fileDescriptor, buffers);
					view.setUint32(bytesRead_ptr, bytesRead, true);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_readdir: async (memory: ArrayBuffer, fd: fd, buf_ptr: ptr<dirent>, buf_len: size, cookie: dircookie, buf_used_ptr: ptr<u32>): Promise<errno> => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.fd_readdir);
					fileDescriptor.assertIsDirectory();

					const driver = getDeviceDriver(fileDescriptor);
					const view = new DataView(memory);
					const raw = new Uint8Array(memory);

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
						view.setUint32(buf_used_ptr, 0, true);
						return Errno.success;
					}
					if (cookie === 0n) {
						directoryEntries.set(fileDescriptor.fd, await driver.fd_readdir(fileDescriptor));
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
						const dirent: dirent = Dirent.create(ptr, view);
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
						view.setUint32(buf_used_ptr, ptr - buf_ptr, true);
						directoryEntries.delete(fileDescriptor.fd);
					} else {
						view.setUint32(buf_used_ptr, buf_len, true);
					}
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_seek: async (memory: ArrayBuffer, fd: fd, offset: filedelta, whence: whence, new_offset_ptr: ptr<u64>): Promise<errno> => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					if (whence === Whence.cur && offset === 0n && !fileDescriptor.containsBaseRights(Rights.fd_seek) && !fileDescriptor.containsBaseRights(Rights.fd_tell)) {
						throw new WasiError(Errno.perm);
					} else {
						fileDescriptor.assertBaseRights(Rights.fd_seek);
					}

					const view = new DataView(memory);
					const newOffset = await getDeviceDriver(fileDescriptor).fd_seek(fileDescriptor, offset, whence);
					view.setBigUint64(new_offset_ptr, BigInt(newOffset), true);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_renumber: (_memory: ArrayBuffer, fd: fd, to: fd): Promise<errno> => {
				try {
					if (fd < fileDescriptors.firstRealFileDescriptor || to < fileDescriptors.firstRealFileDescriptor) {
						return Promise.resolve(Errno.notsup);
					}
					if ((fileDescriptors.has(to))) {
						return Promise.resolve(Errno.badf);
					}
					const fileDescriptor = getFileDescriptor(fd);
					const toFileDescriptor = fileDescriptor.with({ fd: to });
					fileDescriptors.delete(fileDescriptor);
					fileDescriptors.add(toFileDescriptor);
					return Promise.resolve(Errno.success);
				} catch (error) {
					return Promise.resolve(handleError(error));
				}
			},
			fd_sync: async (_memory: ArrayBuffer, fd: fd): Promise<errno> => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.fd_sync);

					await getDeviceDriver(fileDescriptor).fd_sync(fileDescriptor);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_tell: async (memory: ArrayBuffer, fd: fd, offset_ptr: ptr<u64>): Promise<errno> => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.fd_tell | Rights.fd_seek);

					const view = new DataView(memory);
					const offset = await getDeviceDriver(fileDescriptor).fd_tell(fileDescriptor);
					view.setBigUint64(offset_ptr, BigInt(offset), true);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_write: async (memory: ArrayBuffer, fd: fd, ciovs_ptr: ptr<ciovec>, ciovs_len: u32, bytesWritten_ptr: ptr<u32>): Promise<errno> => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.fd_write);

					const view = new DataView(memory);
					const buffers = read_ciovs(memory, ciovs_ptr, ciovs_len);
					const bytesWritten = await getDeviceDriver(fileDescriptor).fd_write(fileDescriptor, buffers);
					view.setUint32(bytesWritten_ptr, bytesWritten, true);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			path_create_directory: async (memory: ArrayBuffer, fd: fd, path_ptr: ptr<bytes>, path_len: size): Promise<errno> => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.path_create_directory);
					fileDescriptor.assertIsDirectory();

					const path = decoder.decode(new Uint8Array(memory, path_ptr, path_len));
					await getDeviceDriver(fileDescriptor).path_create_directory(fileDescriptor, path);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			path_filestat_get: async (memory: ArrayBuffer, fd: fd, flags: lookupflags, path_ptr: ptr<bytes>, path_len: size, filestat_ptr: ptr): Promise<errno> => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.path_filestat_get);
					fileDescriptor.assertIsDirectory();

					const path = decoder.decode(new Uint8Array(memory, path_ptr, path_len));
					await getDeviceDriver(fileDescriptor).path_filestat_get(fileDescriptor, flags, path, Filestat.create(filestat_ptr, new DataView(memory)));
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			path_filestat_set_times: async (memory: ArrayBuffer, fd: fd, flags: lookupflags, path_ptr: ptr<bytes>, path_len: size, atim: timestamp, mtim: timestamp, fst_flags: fstflags): Promise<errno> => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.path_filestat_set_times);
					fileDescriptor.assertIsDirectory();

					const path = decoder.decode(new Uint8Array(memory, path_ptr, path_len));
					await getDeviceDriver(fileDescriptor).path_filestat_set_times(fileDescriptor, flags, path, atim, mtim, fst_flags);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			path_link: async (memory: ArrayBuffer, old_fd: fd, old_flags: lookupflags, old_path_ptr: ptr<bytes>, old_path_len: size, new_fd: fd, new_path_ptr: ptr<bytes>, new_path_len: size): Promise<errno> => {
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

					const oldPath = decoder.decode(new Uint8Array(memory, old_path_ptr, old_path_len));
					const newPath = decoder.decode(new Uint8Array(memory, new_path_ptr, new_path_len));
					await getDeviceDriver(oldFileDescriptor).path_link(oldFileDescriptor, old_flags, oldPath, newFileDescriptor, newPath);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			path_open: async (memory: ArrayBuffer, fd: fd, dirflags: lookupflags, path_ptr: ptr<bytes>, path_len: size, oflags: oflags, fs_rights_base: rights, fs_rights_inheriting: rights, fdflags: fdflags, fd_ptr: ptr<fd>): Promise<errno> => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.path_open);
					fileDescriptor.assertFdflags(fdflags);
					fileDescriptor.assertOflags(oflags);

					const path = decoder.decode(new Uint8Array(memory, path_ptr, path_len));
					const result = await getDeviceDriver(fileDescriptor).path_open(fileDescriptor, dirflags, path, oflags, fs_rights_base, fs_rights_inheriting, fdflags, fileDescriptors);
					fileDescriptors.add(result);
					const view = new DataView(memory);
					view.setUint32(fd_ptr, result.fd, true);
					return Errno.success;
				} catch(error) {
					return handleError(error);
				}
			},
			path_readlink: async (memory: ArrayBuffer, fd: fd, path_ptr: ptr<bytes>, path_len: size, buf_ptr: ptr, buf_len: size, result_size_ptr: ptr<u32>): Promise<errno> => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.path_readlink);
					fileDescriptor.assertIsDirectory();

					const path = decoder.decode(new Uint8Array(memory, path_ptr, path_len));
					const target = encoder.encode(await getDeviceDriver(fileDescriptor).path_readlink(fileDescriptor, path));
					if (target.byteLength > buf_len) {
						return Errno.inval;
					}
					new Uint8Array(memory, buf_ptr, buf_len).set(target);
					new DataView(memory).setUint32(result_size_ptr, target.byteLength, true);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			path_remove_directory: async (memory: ArrayBuffer, fd: fd, path_ptr: ptr<bytes>, path_len: size): Promise<errno> => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.path_remove_directory);
					fileDescriptor.assertIsDirectory();

					const path = decoder.decode(new Uint8Array(memory, path_ptr, path_len));
					await getDeviceDriver(fileDescriptor).path_remove_directory(fileDescriptor, path);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			path_rename: async (memory: ArrayBuffer, old_fd: fd, old_path_ptr: ptr<bytes>, old_path_len: size, new_fd: fd, new_path_ptr: ptr<bytes>, new_path_len: size): Promise<errno> => {
				try {
					const oldFileDescriptor = getFileDescriptor(old_fd);
					oldFileDescriptor.assertBaseRights(Rights.path_rename_source);
					oldFileDescriptor.assertIsDirectory();

					const newFileDescriptor = getFileDescriptor(new_fd);
					newFileDescriptor.assertBaseRights(Rights.path_rename_target);
					newFileDescriptor.assertIsDirectory();

					const oldPath = decoder.decode(new Uint8Array(memory, old_path_ptr, old_path_len));
					const newPath = decoder.decode(new Uint8Array(memory, new_path_ptr, new_path_len));
					await getDeviceDriver(oldFileDescriptor).path_rename(oldFileDescriptor, oldPath, newFileDescriptor, newPath);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			path_symlink: async (memory: ArrayBuffer, old_path_ptr: ptr<bytes>, old_path_len: size, fd: fd, new_path_ptr: ptr<bytes>, new_path_len: size): Promise<errno> => {
				// VS Code has no support to create a symlink.
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.path_symlink);
					fileDescriptor.assertIsDirectory();

					const oldPath = decoder.decode(new Uint8Array(memory, old_path_ptr, old_path_len));
					const newPath = decoder.decode(new Uint8Array(memory, new_path_ptr, new_path_len));
					await getDeviceDriver(fileDescriptor).path_symlink(oldPath, fileDescriptor, newPath);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			path_unlink_file: async (memory: ArrayBuffer, fd: fd, path_ptr: ptr<bytes>, path_len: size): Promise<errno> => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRights(Rights.path_unlink_file);
					fileDescriptor.assertIsDirectory();

					const path = decoder.decode(new Uint8Array(memory, path_ptr, path_len));
					await getDeviceDriver(fileDescriptor).path_unlink_file(fileDescriptor, path);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			poll_oneoff: async (memory: ArrayBuffer, input: ptr<subscription>, output: ptr<event[]>, subscriptions: size, result_size_ptr: ptr<u32>): Promise<errno> => {
				try {
					const view = new DataView(memory);
					let { events, needsTimeOut, timeout } = await handleSubscriptions(view, input, subscriptions);
					if (needsTimeOut && timeout !== undefined && timeout !== 0n) {
						// Timeout is in ns but sleep API is in ms.
						await new Promise((resolve) => {
							RAL().timer.setTimeout(resolve, BigInts.asNumber(timeout! / 1000000n));
						});
						// Reread the events. Timer will not change however the rest could have.
						events = (await handleSubscriptions(view, input, subscriptions)).events;
					}
					let event_offset = output;
					for (const item of events) {
						const event = Event.create(event_offset, view);
						event.userdata = item.userdata;
						event.type = item.type;
						event.error = item.error;
						event.fd_readwrite.nbytes = item.fd_readwrite.nbytes;
						event.fd_readwrite.flags = item.fd_readwrite.flags;
						event_offset += Event.size;
					}
					view.setUint32(result_size_ptr, events.length, true);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			proc_exit: (_memory: ArrayBuffer, rval: exitcode): Promise<errno> => {
				exitHandler(rval);
				return Promise.resolve(Errno.success);
			},
			sched_yield: (): Promise<errno> => {
				return Promise.resolve(Errno.success);
			},
			random_get: (memory: ArrayBuffer, buf: ptr<bytes>, buf_len: size): Promise<errno> => {
				const random = RAL().crypto.randomGet(buf_len);
				new Uint8Array(memory, buf, buf_len).set(random);
				return Promise.resolve(Errno.success);
			},
			sock_accept: (_memory: ArrayBuffer, _fd: fd, _flags: fdflags, _result_fd_ptr: ptr<u32>): Promise<errno> => {
				return Promise.resolve(Errno.nosys);
			},
			sock_recv: (_memory: ArrayBuffer, _fd: fd, _ri_data_ptr: ptr, _ri_data_len: u32, _ri_flags: riflags, _ro_datalen_ptr: ptr, _roflags_ptr: ptr): Promise<errno> => {
				return Promise.resolve(Errno.nosys);
			},
			sock_send: (_memory: ArrayBuffer, _fd: fd, _si_data_ptr: ptr, _si_data_len: u32, _si_flags: siflags, _si_datalen_ptr: ptr): Promise<errno> => {
				return Promise.resolve(Errno.nosys);
			},
			sock_shutdown: (_memory: ArrayBuffer, _fd: fd, _sdflags: sdflags): Promise<errno> => {
				return Promise.resolve(Errno.nosys);
			},
			'thread-spawn': async (_memory: ArrayBuffer, start_args_ptr: ptr): Promise<errno> => {
				try {
					await threadSpawnHandler(start_args_ptr);
					return Promise.resolve(Errno.success);
				} catch (error) {
					return Promise.resolve(handleError(error));
				}
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

		async function handleSubscriptions(memory: DataView, input: ptr, subscriptions: size) {
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
						const readEvent = await handleReadSubscription(subscription);
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

		async function handleReadSubscription(subscription: subscription): Promise<Literal<event>> {
			const fd = subscription.u.fd_read.file_descriptor;
			try {
				const fileDescriptor = getFileDescriptor(fd);
				if (!fileDescriptor.containsBaseRights(Rights.poll_fd_readwrite) && !fileDescriptor.containsBaseRights(Rights.fd_read)) {
					throw new WasiError(Errno.perm);
				}

				const available = await getDeviceDriver(fileDescriptor).fd_bytesAvailable(fileDescriptor);
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
			} else if (error instanceof vscode.FileSystemError) {
				return code2Wasi.asErrno(error.code);
			}
			return def;
		}

		function read_ciovs (memory: ArrayBuffer, iovs: ptr, iovsLen: u32): Uint8Array[] {
			const view = new DataView(memory);

			const buffers: Uint8Array[] = [];
			let ptr: ptr = iovs;
			for (let i = 0; i < iovsLen; i++) {
				const vec = Ciovec.create(ptr, view);
				buffers.push(new Uint8Array(memory, vec.buf, vec.buf_len));
				ptr += Ciovec.size;
			}
			return buffers;
		}

		function read_iovs (memory: ArrayBuffer, iovs: ptr, iovsLen: u32): Uint8Array[] {
			const view = new DataView(memory);

			const buffers: Uint8Array[] = [];
			let ptr: ptr = iovs;
			for (let i = 0; i < iovsLen; i++) {
				const vec = Iovec.create(ptr, view);
				buffers.push(new Uint8Array(memory, vec.buf, vec.buf_len));
				ptr += Iovec.size;
			}
			return buffers;
		}

		function getDeviceDriver(fileDescriptor: FileDescriptor): DeviceDriver {
			return WasiKernel.deviceDrivers.get(fileDescriptor.deviceId);
		}

		function getFileDescriptor(fd: fd): FileDescriptor {
			const result = fileDescriptors.get(fd);
			if (result === undefined) {
				throw new WasiError(Errno.badf);
			}
			return result;
		}

		return result;
	}
}

export interface StartMainMessage {
	readonly method: 'startMain';
	readonly bits: SharedArrayBuffer | vscode.Uri;
}

export interface StartThreadMessage {
	readonly method: 'startThread';
	readonly bits: SharedArrayBuffer | vscode.Uri;
	readonly tid: u32;
	readonly start_arg: ptr;
}

export interface WorkerReadyMessage {
	readonly method: 'workerReady';
}
export namespace WorkerReadyMessage {
	export function is(message: WasiCallMessage | WorkerReadyMessage): message is WorkerReadyMessage {
		const candidate = message as WorkerReadyMessage;
		return candidate && candidate.method === 'workerReady';
	}
}

export type WasiCallMessage = [SharedArrayBuffer, SharedArrayBuffer];
export namespace WasiCallMessage {
	export function is(message: WasiCallMessage | WorkerReadyMessage): message is WasiCallMessage {
		return Array.isArray(message) && message.length === 2 && message[0] instanceof SharedArrayBuffer && message[1] instanceof SharedArrayBuffer;
	}
}

export abstract class ServiceConnection {

	private readonly wasiService: WasiService;

	constructor(wasiService: WasiService) {
		this.wasiService = wasiService;
	}

	public abstract onWorkerReady(): Promise<void>;

	protected async handleMessage(buffers: [SharedArrayBuffer, SharedArrayBuffer]): Promise<void> {
		const [paramBuffer, wasmMemory] = buffers;
		const paramView = new DataView(paramBuffer);
		try {

			const method = paramView.getUint32(Offsets.method_index, true);
			const func: WasiFunction = WasiFunctions.functionAt(method);
			if (func === undefined) {
				throw new WasiError(Errno.inval);
			}
			const params = this.getParams(func.signature, paramBuffer);
			const result = await this.wasiService[func.name](wasmMemory, ...params);
			paramView.setUint16(Offsets.errno_index, result, true);
		} catch (err) {
			if (err instanceof WasiError) {
				paramView.setUint16(Offsets.errno_index, err.errno, true);
			} else {
				paramView.setUint16(Offsets.errno_index, Errno.inval, true);
			}
		}

		const sync = new Int32Array(paramBuffer, 0, 1);
		Atomics.store(sync, 0, 1);
		Atomics.notify(sync, 0);
	}

	private getParams(signature: WasiFunctionSignature, paramBuffer: SharedArrayBuffer): (number & bigint)[] {
		const paramView = new DataView(paramBuffer);
		const params: (number | bigint)[] = [];
		let offset = Offsets.header_size;
		for (let i = 0; i < signature.params.length; i++) {
			const param = signature.params[i];
			params.push(param.read(paramView, offset));
			offset += param.size;
		}
		return params as (number & bigint)[];
	}
}
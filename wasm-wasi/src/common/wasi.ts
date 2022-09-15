/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { URI } from 'vscode-uri';
import { ApiClient, FileSystemError, RPCError } from '@vscode/sync-api-client';

import RAL from './ral';
const paths = RAL().path;

import { ptr, size, u32 } from './baseTypes';
import {
	fd, errno, Errno, lookupflags, oflags, rights, fdflags, dircookie, filetype, Rights,
	filesize, advise, filedelta, whence, Filestat, Ciovec, Iovec, Filetype, clockid, timestamp, Clockid,
	Fdstat, fstflags, Prestat, exitcode, Oflags, Subscription, WasiError, Eventtype, Event, event,
	Subclockflags, Literal, subscription, Fdflags, riflags, siflags, sdflags,
	args_sizes_get, args_get, environ_sizes_get, environ_get, clock_res_get, clock_time_get, fd_advise,
	fd_allocate, fd_close, fd_datasync, fd_fdstat_get, fd_fdstat_set_flags, fd_filestat_get, fd_filestat_set_size,
	fd_filestat_set_times, fd_pread, fd_prestat_dir_name, fd_prestat_get, fd_pwrite, fd_read, fd_readdir,
	fd_seek, fd_sync, fd_tell, fd_write, path_create_directory, path_filestat_get, path_filestat_set_times,
	path_link, path_open, path_readlink, path_remove_directory, path_rename, path_symlink, path_unlink_file,
	poll_oneoff, proc_exit, random_get, sched_yield, sock_accept, sock_recv, sock_send, sock_shutdown
} from './wasiTypes';
import { BigInts, code2Wasi } from './converter';
import { DeviceIds, FileDescriptor, FileSystem } from './fileSystem';

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



interface IOComponent {
}

class Stdin implements IOComponent {

	private readonly apiClient: ApiClient;
	private rest: Uint8Array | undefined;

	public constructor(apiClient: ApiClient) {
		this.apiClient = apiClient;
	}

	public get fd() {
		return 0;
	}

	/**
	 * Reads from stdin. Depending on the mode the terminal is in this
	 * reads a line or a single character.
	 */
	public read(buffers: Uint8Array[]): size {
		let bytesRead: size = 0;
		if (this.rest !== undefined) {
			bytesRead += this.storeInBuffers(buffers, this.rest);
			return bytesRead;
		}
		const result = this.apiClient.vscode.terminal.read();
		bytesRead += this.storeInBuffers(buffers, result);
		return bytesRead;
	}

	private storeInBuffers(buffers: Uint8Array[], value: Uint8Array): size {
		let bytesRead: size = 0;
		let current: Uint8Array | undefined = value;
		for (let i = 0; i < buffers.length && current !== undefined; i++) {
			const buffer = buffers[i];
			if (current.byteLength <= buffer.byteLength) {
				buffer.set(current);
				bytesRead += value.byteLength;
				current = undefined;
			} else {
				buffer.set(current.subarray(0, buffer.byteLength));
				current = current.subarray(buffer.byteLength);
				bytesRead += buffer.byteLength;
			}
		}
		if (current !== undefined) {
			this.rest = new Uint8Array(current);
		}
		return bytesRead;
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

export type Options = {

	/**
	 * Directory mappings
	 */
	mapDir: {
		name: string;
		uri: URI;
	}[];

	/**
	 * The encoding to use.
	 */
	encoding?: string;

	/**
	 * Command line arguments accessible in the WASM.
	 */
	argv?: string [];

	/**
	 * The environment accessible in the WASM.
	 */
	env?: Environment;
};

export namespace WASI {

	export function create(_name: string, apiClient: ApiClient, exitHandler: (rval: number) => void, options: Options): WASI {
		let instance: WebAssembly.$Instance;

		const thread_start = RAL().clock.realtime();
		const fileDescriptors: Map<fd, FileDescriptor> = new Map();
		const encoder: RAL.TextEncoder = RAL().TextEncoder.create(options?.encoding);
		const decoder: RAL.TextDecoder = RAL().TextDecoder.create(options?.encoding);
		const stdin = new Stdin(apiClient);
		const fileSystem = FileSystem.create(apiClient, { memoryView: memoryView, memoryRaw: memoryRaw }, encoder);
		fileDescriptors.set(fileSystem.stdin.fd, fileSystem.stdin);
		fileDescriptors.set(fileSystem.stdout.fd, fileSystem.stdout);
		fileDescriptors.set(fileSystem.stderr.fd, fileSystem.stderr);

		for (const entry of options.mapDir) {
			const fileDescriptor = fileSystem.createPreOpenedFileDescriptor(
				entry.name, entry.uri, Filetype.directory,
				{ base: Rights.All, inheriting: Rights.All }, Fdflags.sync
			);
			fileDescriptors.set(fileDescriptor.fd, fileDescriptor);
		}

		const wasi: WASI = {
			initialize: (inst: WebAssembly.Instance): void => {
				instance = inst as WebAssembly.$Instance;
			},
			args_sizes_get: (argvCount_ptr: ptr, argvBufSize_ptr: ptr): errno => {
				const memory = memoryView();
				let count = 0;
				let size = 0;
				for (const arg of options.argv ?? []) {
					const value = `${arg}\0`;
					size += encoder.encode(value).byteLength;
					count++;
				}
				memory.setUint32(argvCount_ptr, count, true);
				memory.setUint32(argvBufSize_ptr, size, true);
				return Errno.success;
			},
			args_get: (argv_ptr: ptr, argvBuf_ptr: ptr): errno => {
				const memory = memoryView();
				const memoryBytes = new Uint8Array(memoryRaw());
				let entryOffset = argv_ptr;
				let valueOffset = argvBuf_ptr;
				for (const arg of options.argv ?? []) {
					const data = encoder.encode(`${arg}\0`);
					memory.setUint32(entryOffset, valueOffset, true);
					entryOffset += 4;
					memoryBytes.set(data, valueOffset);
					valueOffset += data.byteLength;
				}
				return Errno.success;
			},
			clock_res_get: (id: clockid, timestamp_ptr: ptr): errno => {
				const memory = memoryView();
				switch (id) {
					case Clockid.realtime:
						memory.setBigUint64(timestamp_ptr, 1n, true);
						return Errno.success;
					case Clockid.monotonic:
						memory.setBigUint64(timestamp_ptr, 1n, true);
						return Errno.success;
					default:
						memory.setBigUint64(timestamp_ptr, 0n, true);
						return Errno.inval;
				}
			},
			clock_time_get: (id: clockid, precision: timestamp, timestamp_ptr: ptr): errno => {
				const time: bigint = now(id, precision);
				const memory = memoryView();
				memory.setBigUint64(timestamp_ptr, time, true);
				return Errno.success;
			},
			environ_sizes_get: (environCount_ptr: ptr, environBufSize_ptr: ptr): errno => {
				const memory = memoryView();
				let count = 0;
				let size = 0;
				for (const entry of Object.entries(options.env ?? {})) {
					const value = `${entry[0]}=${entry[1]}\0`;
					size += encoder.encode(value).byteLength;
					count++;
				}
				memory.setUint32(environCount_ptr, count, true);
				memory.setUint32(environBufSize_ptr, size, true);
				return Errno.success;
			},
			environ_get: (environ_ptr: ptr, environBuf_ptr: ptr): errno => {
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
			fd_advise: (fd: fd, _offset: filesize, _length: filesize, _advise: advise): errno => {
				try {
					const fileHandle = getFileDescriptor(fd);
					fileHandle.assertBaseRight(Rights.fd_advise);

					// We don't have advisory in VS Code. So treat it as successful.
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_allocate: (fd: fd, offset: filesize, len: filesize): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRight(Rights.fd_allocate);
					fileSystem.allocate(fileDescriptor, offset, len);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_close: (fd: fd): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileSystem.releaseFileDescriptor(fileDescriptor);
					fileDescriptors.delete(fileDescriptor.fd);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_datasync: (fd: fd): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRight(Rights.fd_datasync);
					fileSystem.sync(fileDescriptor);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_fdstat_get: (fd: fd, fdstat_ptr: ptr): errno => {
				// This is not available under VS Code.
				try {
					const fileDescriptor = getFileDescriptor(fd);
					const memory = memoryView();
					if (fileDescriptor.isStd()) {
						const fdstat = Fdstat.create(fdstat_ptr, memory);
						fdstat.fs_filetype = Filetype.character_device;
						fdstat.fs_flags = 0;
						if (fileDescriptor.isStdin()) {
							fdstat.fs_rights_base = Rights.StdinBase;
							fdstat.fs_rights_inheriting = Rights.StdinInheriting;
						} else {
							fdstat.fs_rights_base = Rights.StdoutBase;
							fdstat.fs_rights_inheriting = Rights.StdoutInheriting;
						}
						return Errno.success;
					}
					fileSystem.fdstat(fileDescriptor, fdstat_ptr);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_fdstat_set_flags: (fd: fd, fdflags: fdflags): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRight(Rights.fd_fdstat_set_flags);
					fileDescriptor.fdflags = fdflags;
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_filestat_get: (fd: fd, filestat_ptr: ptr): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					const memory = memoryView();
					if (fileDescriptor.isStd()) {
						const fileStat = Filestat.create(filestat_ptr, memory);
						fileStat.dev = DeviceIds.system;
						fileStat.ino = fileDescriptor.inode;
						fileStat.filetype = Filetype.character_device;
						fileStat.nlink = 0n;
						fileStat.size = 101n;
						const now = BigInt(Date.now());
						fileStat.atim = now;
						fileStat.ctim = now;
						fileStat.mtim = now;
						return Errno.success;
					}
					fileDescriptor.assertBaseRight(Rights.fd_filestat_get);
					fileSystem.stat(fileDescriptor, filestat_ptr);
					return Errno.success;
				} catch (error) {
					return handleError(error, Errno.perm);
				}
			},
			fd_filestat_set_size: (fd: fd, size: filesize): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRight(Rights.fd_filestat_set_size);
					fileSystem.setSize(fileDescriptor, size);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_filestat_set_times: (fd: fd, _atim: timestamp, _mtim: timestamp, _fst_flags: fstflags): errno => {
				try {
					const fileHandle = getFileDescriptor(fd);
					fileHandle.assertBaseRight(Rights.fd_filestat_set_times);
					// todo@dirkb
					// For new we do nothing. We could cache the timestamp in memory
					// But we would loose them during reload. We could also store them
					// in local storage
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_pread: (fd: fd, iovs_ptr: ptr, iovs_len: u32, offset: filesize, bytesRead_ptr: ptr): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRight(Rights.fd_read);
					const buffers = read_iovs(iovs_ptr, iovs_len);
					let bytesRead = 0;
					for (const buffer of buffers) {
						const result = fileSystem.pread(fileDescriptor, BigInts.asNumber(offset), buffer.byteLength);
						bytesRead = bytesRead + result.byteLength;
						buffer.set(result);
					}
					memoryView().setUint32(bytesRead_ptr, bytesRead, true);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_prestat_get: (fd: fd, bufPtr: ptr): errno => {
				try {
					const fileDescriptor = fileDescriptors.get(fd);
					if (fileDescriptor === undefined || !fileDescriptor.preOpened) {
						return Errno.badf;
					}
					const memory = memoryView();
					const prestat = Prestat.create(bufPtr, memory);
					prestat.len = encoder.encode(fileDescriptor.path).byteLength;
					return Errno.success;
				} catch(error) {
					return handleError(error);
				}
			},
			fd_prestat_dir_name: (fd: fd, pathPtr: ptr, pathLen: size): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					const memory = new Uint8Array(memoryRaw(), pathPtr);
					const bytes = encoder.encode(fileDescriptor.path);
					if (bytes.byteLength !== pathLen) {
						Errno.badmsg;
					}
					memory.set(bytes);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_pwrite: (fd: fd, ciovs_ptr: ptr, ciovs_len: u32, offset: filesize, bytesWritten_ptr: ptr): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRight(Rights.fd_write);
					const buffers = read_ciovs(ciovs_ptr, ciovs_len);
					let bytesWritten = 0;
					for (const buffer of buffers) {
						bytesWritten += fileSystem.pwrite(fileDescriptor, BigInts.asNumber(offset), buffer);
					}
					memoryView().setUint32(bytesWritten_ptr, bytesWritten, true);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_read: (fd: fd, iovs_ptr: ptr, iovs_len: u32, bytesRead_ptr: ptr): errno => {
				try {
					const memory = memoryView();
					const fileDescriptor = getFileDescriptor(fd);
					if (fileDescriptor.isStdin()) {
						let bytesRead = 0;
						const buffers = read_iovs(iovs_ptr, iovs_len);
						bytesRead += stdin.read(buffers);
						memory.setUint32(bytesRead_ptr, bytesRead, true);
						return Errno.success;
					}
					fileDescriptor.assertBaseRight(Rights.fd_read);
					const buffers = read_iovs(iovs_ptr, iovs_len);
					let bytesRead = 0;
					for (const buffer of buffers) {
						const result = fileSystem.read(fileDescriptor, buffer.byteLength);
						bytesRead += result.byteLength;
						buffer.set(result);
					}
					memory.setUint32(bytesRead_ptr, bytesRead, true);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_readdir: (fd: fd, buf_ptr: ptr, buf_len: size, cookie: dircookie, buf_used_ptr: ptr): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRight(Rights.fd_readdir);
					if (fileDescriptor.fileType !== Filetype.directory) {
						return Errno.notdir;
					}
					fileSystem.readdir(fileDescriptor, buf_ptr, buf_len, cookie, buf_used_ptr);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_seek: (fd: fd, offset: filedelta, whence: whence, new_offset_ptr: ptr): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					if (fileDescriptor.isStd()) {
						return Errno.success;
					}
					fileDescriptor.assertBaseRight(Rights.fd_seek);
					const newOffset = fileSystem.seek(fileDescriptor, offset, whence);
					memoryView().setBigUint64(new_offset_ptr, BigInt(newOffset), true);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_sync: (fd: fd): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRight(Rights.fd_sync);
					fileSystem.sync(fileDescriptor);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_tell: (fd: fd, offset_ptr: ptr): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRight(Rights.fd_tell);
					const offset = fileSystem.tell(fileDescriptor);
					const memory = memoryView();
					memory.setBigUint64(offset_ptr, BigInt(offset), true);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_write: (fd: fd, ciovs_ptr: ptr, ciovs_len: u32, bytesWritten_ptr: ptr): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					if (fileDescriptor.isStdout() || fileDescriptor.isStderr()) {
						let written = 0;
						const buffers = read_ciovs(ciovs_ptr, ciovs_len);
						for (const buffer of buffers) {
							apiClient.vscode.terminal.write(buffer);
							written += buffer.length;
						}
						const memory = memoryView();
						memory.setUint32(bytesWritten_ptr, written, true);
						return Errno.success;
					}
					fileDescriptor.assertBaseRight(Rights.fd_write);

					const buffers = read_ciovs(ciovs_ptr, ciovs_len);
					const bytesWritten: size = fileSystem.write(fileDescriptor, buffers);
					const memory = memoryView();
					memory.setUint32(bytesWritten_ptr, bytesWritten, true);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			path_create_directory: (fd: fd, path_ptr: ptr, path_len: size): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRight(Rights.path_create_directory);
					fileDescriptor.assertIsDirectory();

					const memory = memoryRaw();
					const name = decoder.decode(new Uint8Array(memory, path_ptr, path_len));
					fileSystem.createDirectory(fileDescriptor, name);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			path_filestat_get: (fd: fd, _flags: lookupflags, path_ptr: ptr, path_len: size, filestat_ptr: ptr): errno => {
				// VS Code has not support to follow sym links.
				// So we ignore lookupflags for now
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRight(Rights.path_filestat_get);
					fileDescriptor.assertIsDirectory();

					const memory = memoryRaw();
					const name = decoder.decode(new Uint8Array(memory, path_ptr, path_len));
					fileSystem.path_stat(fileDescriptor, name, filestat_ptr);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			path_filestat_set_times: (fd: fd, _flags: lookupflags, _path_ptr: ptr, _path_len: size, _atim: timestamp, _mtim: timestamp, _fst_flags: fstflags): errno => {
				// VS Code has not support to follow sym links.
				// So we ignore lookupflags for now
				try {
					const fileHandle = getFileDescriptor(fd);
					fileHandle.assertBaseRight(Rights.path_filestat_set_times);
					fileHandle.assertIsDirectory();

					// todo@dirkb
					// For now we do nothing. We could cache the timestamp in memory
					// But we would loose them during reload. We could also store them
					// in local storage
					return Errno.nosys;
				} catch (error) {
					return handleError(error);
				}
			},
			path_link: (old_fd: fd, _old_flags: lookupflags, _old_path_ptr: ptr, _old_path_len: size, new_fd: fd, _new_path_ptr: ptr, _new_path_len: size): errno => {
				// VS Code has not support to create sym links.
				try {
					const oldFileHandle = getFileDescriptor(old_fd);
					oldFileHandle.assertBaseRight(Rights.path_link_source);
					oldFileHandle.assertIsDirectory();

					const newFileHandle = getFileDescriptor(new_fd);
					newFileHandle.assertBaseRight(Rights.path_link_target);
					newFileHandle.assertIsDirectory();

					// todo@dirkb
					// For now we do nothing. If we need to implement this we need
					// support from the VS Code API.
					return Errno.nosys;
				} catch (error) {
					return handleError(error);
				}
			},
			path_open: (fd: fd, _dirflags: lookupflags, path: ptr, pathLen: size, oflags: oflags, fs_rights_base: rights, fs_rights_inheriting: rights, fdflags: fdflags, fd_ptr: ptr): errno => {
				try {
					const parentDescriptor = getFileDescriptor(fd);
					parentDescriptor.assertBaseRight(Rights.path_open);

					const memory = memoryView();
					const name = decoder.decode(new Uint8Array(memoryRaw(), path, pathLen));

					let filetype: filetype | undefined = fileSystem.path_filetype(parentDescriptor, name);
					const entryExists: boolean = filetype !== undefined;
					if (entryExists) {
						if (Oflags.exclOn(oflags)) {
							return Errno.exist;
						} else if (Oflags.directoryOn(oflags) && filetype !== Filetype.directory) {
							return Errno.notdir;
						}
					} else {
						// Entry does not exist;
						if (Oflags.creatOff(oflags)) {
							return Errno.noent;
						}
					}
					let createFile: boolean = false;
					if (Oflags.creatOn(oflags) && !entryExists) {
						// Ensure parent handle is directory
						parentDescriptor.assertIsDirectory();
						const dirname = paths.dirname(name);
						// The name has a directory part. Ensure that the directory exists
						if (dirname !== '.') {
							const dirFiletype = fileSystem.path_filetype(parentDescriptor, dirname);
							if (dirFiletype === undefined || dirFiletype !== Filetype.directory) {
								return Errno.noent;
							}
						}
						filetype = Filetype.regular_file;
						createFile = true;
					} else {
						if (filetype === undefined) {
							return Errno.noent;
						}
					}
					// Currently VS Code doesn't offer a generic API to open a file
					// or a directory. Since we were able to stat the file we create
					// a file descriptor for it and lazy get the file content on read.
					const base = filetype === Filetype.directory
						? fs_rights_base | Rights.DirectoryBase
						: filetype === Filetype.regular_file
							? fs_rights_base | Rights.FileBase
							: fs_rights_base;
					const inheriting = Filetype.directory
						? fs_rights_inheriting | Rights.DirectoryInheriting
						: filetype === Filetype.regular_file
							? fs_rights_inheriting | Rights.FileInheriting
							: fs_rights_inheriting;
					const fileDescriptor = fileSystem.createFileDescriptor(
						parentDescriptor, name,
						filetype, { base: base, inheriting: inheriting }, fdflags,
					);
					fileDescriptors.set(fileDescriptor.fd, fileDescriptor);
					memory.setUint32(fd_ptr, fileDescriptor.fd, true);
					if (createFile || Oflags.truncOn(oflags)) {
						fileSystem.createOrTruncate(fileDescriptor);
					}
					return Errno.success;
				} catch(error) {
					return handleError(error);
				}
			},
			path_readlink: (fd: fd, _path_ptr: ptr, _path_len: size, _buf: ptr, _buf_len: size, _result_size_ptr: ptr): errno => {
				// VS Code has no support to follow a symlink.
				try {
					const fileHandle = getFileDescriptor(fd);
					fileHandle.assertBaseRight(Rights.path_readlink);
					fileHandle.assertIsDirectory();

					// const name = $decoder.decode(new Uint8Array(memoryRaw(), path_ptr, path_len));
					// const realUri = getRealUri(fileHandle, name);
					// todo@dirkb
					// For now we do nothing. If we need to implement this we need
					// support from the VS Code API.
					return Errno.noent;
				} catch (error) {
					return handleError(error);
				}
			},
			path_remove_directory: (fd: fd, path_ptr: ptr, path_len: size): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRight(Rights.path_remove_directory);
					fileDescriptor.assertIsDirectory();

					const memory = memoryRaw();
					const name = decoder.decode(new Uint8Array(memory, path_ptr, path_len));
					fileSystem.path_remove_directory(fileDescriptor, name);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			path_rename: (old_fd: fd, old_path_ptr: ptr, old_path_len: size, new_fd: fd, new_path_ptr: ptr, new_path_len: size): errno => {
				try {
					const oldFileDescriptor = getFileDescriptor(old_fd);
					oldFileDescriptor.assertBaseRight(Rights.path_rename_source);
					oldFileDescriptor.assertIsDirectory();

					const newFileDescriptor = getFileDescriptor(new_fd);
					newFileDescriptor.assertBaseRight(Rights.path_rename_target);
					newFileDescriptor.assertIsDirectory();

					const memory = memoryRaw();
					const oldName = decoder.decode(new Uint8Array(memory, old_path_ptr, old_path_len));
					const newName = decoder.decode(new Uint8Array(memory, new_path_ptr, new_path_len));
					fileSystem.path_rename(oldFileDescriptor, oldName, newFileDescriptor, newName);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			path_symlink: (_old_path_ptr: ptr, _old_path_len: size, fd: fd, _new_path_ptr: ptr, _new_path_len: size): errno => {
				// VS Code has no support to create a symlink.
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRight(Rights.path_symlink);
					fileDescriptor.assertIsDirectory();
					return Errno.nosys;
				} catch (error) {
					return handleError(error);
				}
			},
			path_unlink_file: (fd: fd, path_ptr: ptr, path_len: size): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRight(Rights.path_unlink_file);
					fileDescriptor.assertIsDirectory();

					const memory = memoryRaw();
					const name = decoder.decode(new Uint8Array(memory, path_ptr, path_len));

					const filetype = fileSystem.path_filetype(fileDescriptor, name);
					if (filetype === undefined) {
						return Errno.noent;
					}
					if (filetype === Filetype.directory) {
						return Errno.isdir;
					}
					fileSystem.path_unlink_file(fileDescriptor, name);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			poll_oneoff: (input: ptr, output: ptr, subscriptions: size, result_size_ptr: ptr): errno => {
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
			random_get: (buf: ptr, buf_len: size): errno => {
				const random = RAL().crypto.randomGet(buf_len);
				const memory = memoryRaw();
				new Uint8Array(memory, buf, buf_len).set(random);
				return Errno.success;
			},
			sock_accept: (_fd: fd, _flags: fdflags, _result_fd_ptr: ptr): errno => {
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
				fileDescriptor.assertBaseRight(Rights.fd_read);
				const available = fileSystem.bytesAvailable(fileDescriptor);
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
				const fileHandle = getFileDescriptor(fd);
				fileHandle.assertBaseRight(Rights.fd_write);
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
			const buffer = memoryRaw();

			const buffers: Uint8Array[] = [];
			let ptr: ptr = iovs;
			for (let i = 0; i < iovsLen; i++) {
				const vec = Ciovec.create(ptr, memory);
				buffers.push(new Uint8Array(buffer, vec.buf, vec.buf_len));
				ptr += Ciovec.size;
			}
			return buffers;
		}

		function read_iovs (iovs: ptr, iovsLen: u32): Uint8Array[] {
			const memory = memoryView();
			const buffer = memoryRaw();

			const buffers: Uint8Array[] = [];
			let ptr: ptr = iovs;
			for (let i = 0; i < iovsLen; i++) {
				const vec = Iovec.create(ptr, memory);
				buffers.push(new Uint8Array(buffer, vec.buf, vec.buf_len));
				ptr += Iovec.size;
			}
			return buffers;
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
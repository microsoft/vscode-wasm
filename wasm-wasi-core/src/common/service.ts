/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';

import RAL from './ral';
import {
	advise,
	args_get, args_sizes_get, Ciovec, ciovec, Clockid, clockid, clock_res_get, clock_time_get, dircookie, Dirent, dirent, environ_get, environ_sizes_get, errno,
	Errno, Event, event, Eventtype, exitcode, fd, fdflags, Fdstat, fdstat, fd_advise, fd_allocate, fd_close, fd_datasync, fd_fdstat_get, fd_fdstat_set_flags,
	fd_filestat_get, fd_filestat_set_size, fd_filestat_set_times, fd_pread, fd_prestat_dir_name, fd_prestat_get, fd_pwrite, fd_read, fd_readdir, fd_renumber,
	fd_seek, fd_sync, fd_tell, fd_write, filedelta, filesize, Filestat, filestat, fstflags, Iovec, iovec, Literal, lookupflags, oflags, path_create_directory,
	path_filestat_get, path_filestat_set_times, path_link, path_open, path_readlink, path_remove_directory, path_rename, path_symlink, path_unlink_file,
	poll_oneoff, Prestat, prestat, proc_exit, random_get, riflags, rights, Rights, sched_yield, sdflags, siflags, sock_accept, Subclockflags, Subscription,
	subscription, thread_spawn, timestamp, WasiError, Whence, whence, thread_exit, tid, Preopentype, sock_shutdown
} from './wasi';
import { Offsets, TraceMessage, TraceSummaryMessage, WasiCallMessage, WorkerDoneMessage, WorkerMessage, WorkerReadyMessage } from './connection';
import { WasiFunction, WasiFunctions, WasiFunctionSignature } from './wasiMeta';
import { byte, bytes, cstring, ptr, size, u32, u64 } from './baseTypes';
import { FileDescriptor, FileDescriptors } from './fileDescriptor';
import { DeviceDriver, FileSystemDeviceDriver, ReaddirEntry } from './deviceDriver';
import { BigInts, code2Wasi } from './converter';
import { ProcessOptions } from './api';
import { DeviceDrivers } from './kernel';
import { RootFileSystemDeviceDriver } from './rootFileSystemDriver';
import { CapturedPromise } from './promises';

export abstract class ServiceConnection {

	private readonly wasiService: WasiService;
	private readonly logChannel: vscode.LogOutputChannel | undefined;

	private readonly _workerReady: CapturedPromise<void>;

	private readonly _workerDone: CapturedPromise<void>;

	constructor(wasiService: WasiService, logChannel?: vscode.LogOutputChannel | undefined) {
		this.wasiService = wasiService;
		this.logChannel = logChannel;
		this._workerReady = CapturedPromise.create<void>();
		this._workerDone = CapturedPromise.create<void>();
	}

	public workerReady(): Promise<void> {
		return this._workerReady.promise;
	}

	public workerDone(): Promise<void> {
		return this._workerDone.promise;
	}

	protected async handleMessage(message: WorkerMessage): Promise<void> {
		if (WasiCallMessage.is(message)) {
			try {
				await this.handleWasiCallMessage(message);
			} catch (error) {
				RAL().console.error(error);
			}
		} else if (WorkerReadyMessage.is(message)) {
			this._workerReady.resolve();
		} else if (WorkerDoneMessage.is(message)) {
			this._workerDone.resolve();
		} else if (this.logChannel !== undefined) {
			if (TraceMessage.is(message)) {
				const timeTaken = message.timeTaken;
				const final = `${message.message} (${timeTaken}ms)`;
				if (timeTaken > 10) {
					this.logChannel.error(final);
				} else if (timeTaken > 5) {
					this.logChannel.warn(final);
				} else {
					this.logChannel.info(final);
				}
			} else if (TraceSummaryMessage.is(message)) {
				if (message.summary.length === 0) {
					return;
				}
				this.logChannel.info(`Call summary:\n\t${message.summary.join('\n\t')}`);
			}
		}
	}

	private async handleWasiCallMessage(message: WasiCallMessage): Promise<void> {
		const [paramBuffer, wasmMemory] = message;
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

export interface EnvironmentWasiService {
	args_sizes_get: args_sizes_get.ServiceSignature;
	args_get: args_get.ServiceSignature;
	environ_sizes_get: environ_sizes_get.ServiceSignature;
	environ_get: environ_get.ServiceSignature;
	fd_prestat_get: fd_prestat_get.ServiceSignature;
	fd_prestat_dir_name: fd_prestat_dir_name.ServiceSignature;
	[name: string]: (memory: ArrayBuffer, ...args: (number & bigint)[]) => Promise<errno | tid>;
}

export interface ClockWasiService {
	clock_res_get: clock_res_get.ServiceSignature;
	clock_time_get: clock_time_get.ServiceSignature;
	[name: string]: (memory: ArrayBuffer, ...args: (number & bigint)[]) => Promise<errno | tid>;
}

interface DeviceWasiService {
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
	sched_yield: sched_yield.ServiceSignature;
	random_get: random_get.ServiceSignature;
	sock_accept: sock_accept.ServiceSignature;
	sock_shutdown: sock_shutdown.ServiceSignature;
	[name: string]: (memory: ArrayBuffer, ...args: (number & bigint)[]) => Promise<errno | tid>;
}

export interface ProcessWasiService {
	proc_exit: proc_exit.ServiceSignature;
	thread_exit: thread_exit.ServiceSignature;
	'thread-spawn': thread_spawn.ServiceSignature;
	[name: string]: (memory: ArrayBuffer, ...args: (number & bigint)[]) => Promise<errno | tid>;
}

export interface WasiService extends EnvironmentWasiService, ClockWasiService, DeviceWasiService, ProcessWasiService {
}

export interface FileSystemService extends Pick<EnvironmentWasiService, 'fd_prestat_get' | 'fd_prestat_dir_name'>, DeviceWasiService {
}

export interface EnvironmentOptions extends Omit<ProcessOptions, 'args' | 'trace'> {
	args?: string[];
}

export namespace EnvironmentWasiService {
	export function create(fileDescriptors: FileDescriptors, programName: string, preStats: IterableIterator<[string, DeviceDriver]>, options: EnvironmentOptions): EnvironmentWasiService {

		const $encoder: RAL.TextEncoder = RAL().TextEncoder.create(options?.encoding);
		const $preStatDirnames: Map<fd, string> = new Map();

		const result: EnvironmentWasiService = {
			args_sizes_get: (memory: ArrayBuffer, argvCount_ptr: ptr<u32>, argvBufSize_ptr: ptr<u32>): Promise<errno> => {
				let count = 0;
				let size = 0;
				function processValue(str: string): void {
					const value = `${str}\0`;
					size += $encoder.encode(value).byteLength;
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
					const data = $encoder.encode(`${str}\0`);
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
					size += $encoder.encode(value).byteLength;
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
					const data = $encoder.encode(`${entry[0]}=${entry[1]}\0`);
					view.setUint32(entryOffset, valueOffset, true);
					entryOffset += 4;
					bytes.set(data, valueOffset);
					valueOffset += data.byteLength;
				}
				return Promise.resolve(Errno.success);
			},
			fd_prestat_get: async (memory: ArrayBuffer, fd: fd, bufPtr: ptr<prestat>): Promise<errno> => {
				try {
					const next = preStats.next();
					if (next.done === true) {
						fileDescriptors.switchToRunning(fd);
						return Errno.badf;
					}
					const [ mountPoint, driver ] = next.value;
					const fileDescriptor = await driver.fd_create_prestat_fd(fd);
					fileDescriptors.add(fileDescriptor);
					fileDescriptors.setRoot(driver, fileDescriptor);
					$preStatDirnames.set(fileDescriptor.fd, mountPoint);
					const view = new DataView(memory);
					const prestat = Prestat.create(view, bufPtr);
					prestat.preopentype = Preopentype.dir;
					prestat.len = $encoder.encode(mountPoint).byteLength;
					return Errno.success;
				} catch(error) {
					return handleError(error);
				}
			},
			fd_prestat_dir_name: (memory: ArrayBuffer, fd: fd, pathPtr: ptr<byte[]>, pathLen: size): Promise<errno> => {
				try {
					const fileDescriptor = fileDescriptors.get(fd);
					const dirname = $preStatDirnames.get(fileDescriptor.fd);
					if (dirname === undefined) {
						return Promise.resolve(Errno.badf);
					}
					const bytes = $encoder.encode(dirname);
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

export interface Clock {
	now(id: clockid, _precision: timestamp): bigint;
}

export namespace Clock {
	export function create(): Clock {
		const thread_start = RAL().clock.realtime();
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
		return {
			now
		};
	}
}

export namespace ClockWasiService {
	export function create(clock: Clock): ClockWasiService {
		const $clock = clock;
		const result:ClockWasiService = {
			clock_res_get: (memory: ArrayBuffer, id: clockid, timestamp_ptr: ptr<u64>): Promise<errno> => {
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
				const time: bigint = $clock.now(id, precision);
				const view = new DataView(memory);
				view.setBigUint64(timestamp_ptr, time, true);
				return Promise.resolve(Errno.success);
			},
		};
		return result;
	}
}

export interface DeviceOptions extends Pick<ProcessOptions, 'encoding'> {
}

export namespace DeviceWasiService {
	export function create(deviceDrivers: DeviceDrivers, fileDescriptors: FileDescriptors, clock: Clock, virtualRootFileSystem: RootFileSystemDeviceDriver | undefined, options: DeviceOptions): DeviceWasiService {

		const $directoryEntries: Map<fd, ReaddirEntry[]> = new Map();
		const $clock: Clock = clock;

		const $encoder: RAL.TextEncoder = RAL().TextEncoder.create(options?.encoding);
		const $decoder: RAL.TextDecoder = RAL().TextDecoder.create(options?.encoding);
		const $path = RAL().path;

		const result: DeviceWasiService = {
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
				const fileDescriptor = getFileDescriptor(fd);
				try {

					await getDeviceDriver(fileDescriptor).fd_close(fileDescriptor);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				} finally {
					fileDescriptors.delete(fileDescriptor);
					if (fileDescriptor.dispose !== undefined) {
						await fileDescriptor.dispose();
					}
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

					await getDeviceDriver(fileDescriptor).fd_fdstat_get(fileDescriptor, Fdstat.create(new DataView(memory), fdstat_ptr));
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

					await getDeviceDriver(fileDescriptor).fd_filestat_get(fileDescriptor, Filestat.create(new DataView(memory), filestat_ptr));
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

					// We have a cookie > 0 but no directory entries. So return end  of list
					// todo@dirkb this is actually specified different. According to the spec if
					// the used buffer size is less than the provided buffer size then no
					// additional readdir call should happen. However at least under Rust we
					// receive another call.
					//
					// Also unclear whether we have to include '.' and '..'
					//
					// See also https://github.com/WebAssembly/wasi-filesystem/issues/3
					if (cookie !== 0n && !$directoryEntries.has(fileDescriptor.fd)) {
						view.setUint32(buf_used_ptr, 0, true);
						return Errno.success;
					}
					if (cookie === 0n) {
						$directoryEntries.set(fileDescriptor.fd, await driver.fd_readdir(fileDescriptor));
					}
					const entries: ReaddirEntry[] | undefined = $directoryEntries.get(fileDescriptor.fd);
					if (entries === undefined) {
						throw new WasiError(Errno.badmsg);
					}
					let i = Number(cookie);
					let ptr: ptr = buf_ptr;
					let spaceLeft = buf_len;
					for (; i < entries.length && spaceLeft >= Dirent.size; i++) {
						const entry = entries[i];
						const name = entry.d_name;
						const nameBytes = $encoder.encode(name);
						const dirent: dirent = Dirent.create(view, ptr);
						dirent.d_next = BigInt(i + 1);
						dirent.d_ino = entry.d_ino;
						dirent.d_type = entry.d_type;
						dirent.d_namlen = nameBytes.byteLength;
						spaceLeft -= Dirent.size;
						const spaceForName = Math.min(spaceLeft, nameBytes.byteLength);
						(new Uint8Array(memory, ptr + Dirent.size, spaceForName)).set(nameBytes.subarray(0, spaceForName));
						ptr += Dirent.size + spaceForName;
						spaceLeft -= spaceForName;
					}
					if (i === entries.length) {
						view.setUint32(buf_used_ptr, ptr - buf_ptr, true);
						$directoryEntries.delete(fileDescriptor.fd);
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
					const parentFileDescriptor = getFileDescriptor(fd);
					parentFileDescriptor.assertBaseRights(Rights.path_create_directory);
					parentFileDescriptor.assertIsDirectory();

					const [deviceDriver, fileDescriptor, path] = getDeviceDriverWithPath(parentFileDescriptor, $decoder.decode(new Uint8Array(memory, path_ptr, path_len)));
					if (fileDescriptor !== parentFileDescriptor) {
						fileDescriptor.assertBaseRights(Rights.path_create_directory);
						fileDescriptor.assertIsDirectory();
					}
					await deviceDriver.path_create_directory(fileDescriptor, path);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			path_filestat_get: async (memory: ArrayBuffer, fd: fd, flags: lookupflags, path_ptr: ptr<bytes>, path_len: size, filestat_ptr: ptr): Promise<errno> => {
				try {
					const parentFileDescriptor = getFileDescriptor(fd);
					parentFileDescriptor.assertBaseRights(Rights.path_filestat_get);
					parentFileDescriptor.assertIsDirectory();

					const [deviceDriver, fileDescriptor, path] = getDeviceDriverWithPath(parentFileDescriptor, $decoder.decode(new Uint8Array(memory, path_ptr, path_len)));
					if (fileDescriptor !== parentFileDescriptor) {
						fileDescriptor.assertBaseRights(Rights.path_filestat_get);
						fileDescriptor.assertIsDirectory();
					}
					await deviceDriver.path_filestat_get(fileDescriptor, flags, path, Filestat.create(new DataView(memory), filestat_ptr));
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			path_filestat_set_times: async (memory: ArrayBuffer, fd: fd, flags: lookupflags, path_ptr: ptr<bytes>, path_len: size, atim: timestamp, mtim: timestamp, fst_flags: fstflags): Promise<errno> => {
				try {
					const parentFileDescriptor = getFileDescriptor(fd);
					parentFileDescriptor.assertBaseRights(Rights.path_filestat_set_times);
					parentFileDescriptor.assertIsDirectory();

					const [deviceDriver, fileDescriptor, path] = getDeviceDriverWithPath(parentFileDescriptor, $decoder.decode(new Uint8Array(memory, path_ptr, path_len)));
					if (fileDescriptor !== parentFileDescriptor) {
						fileDescriptor.assertBaseRights(Rights.path_filestat_get);
						fileDescriptor.assertIsDirectory();
					}
					await deviceDriver.path_filestat_set_times(fileDescriptor, flags, path, atim, mtim, fst_flags);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			path_link: async (memory: ArrayBuffer, old_fd: fd, old_flags: lookupflags, old_path_ptr: ptr<bytes>, old_path_len: size, new_fd: fd, new_path_ptr: ptr<bytes>, new_path_len: size): Promise<errno> => {
				try {
					const oldParentFileDescriptor = getFileDescriptor(old_fd);
					oldParentFileDescriptor.assertBaseRights(Rights.path_link_source);
					oldParentFileDescriptor.assertIsDirectory();

					const newParentFileDescriptor = getFileDescriptor(new_fd);
					newParentFileDescriptor.assertBaseRights(Rights.path_link_target);
					newParentFileDescriptor.assertIsDirectory();

					if (oldParentFileDescriptor.deviceId !== newParentFileDescriptor.deviceId) {
						// currently we have no support to link across devices
						return Errno.nosys;
					}

					const [oldDeviceDriver, oldFileDescriptor, oldPath] = getDeviceDriverWithPath(oldParentFileDescriptor, $decoder.decode(new Uint8Array(memory, old_path_ptr, old_path_len)));
					const [newDeviceDriver, newFileDescriptor, newPath] = getDeviceDriverWithPath(newParentFileDescriptor, $decoder.decode(new Uint8Array(memory, new_path_ptr, new_path_len)));
					if (oldDeviceDriver !== newDeviceDriver || oldFileDescriptor.deviceId !== newFileDescriptor.deviceId) {
						// currently we have no support to link across devices
						return Errno.nosys;
					}
					if (oldFileDescriptor !== oldParentFileDescriptor) {
						oldFileDescriptor.assertBaseRights(Rights.path_link_source);
						oldFileDescriptor.assertIsDirectory();
					}
					if (newFileDescriptor !== newParentFileDescriptor) {
						newFileDescriptor.assertBaseRights(Rights.path_link_target);
						newFileDescriptor.assertIsDirectory();
					}
					await oldDeviceDriver.path_link(oldFileDescriptor, old_flags, oldPath, newFileDescriptor, newPath);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			path_open: async (memory: ArrayBuffer, fd: fd, dirflags: lookupflags, path_ptr: ptr<bytes>, path_len: size, oflags: oflags, fs_rights_base: rights, fs_rights_inheriting: rights, fdflags: fdflags, fd_ptr: ptr<fd>): Promise<errno> => {
				try {
					const parentFileDescriptor = getFileDescriptor(fd);
					parentFileDescriptor.assertBaseRights(Rights.path_open);
					parentFileDescriptor.assertFdflags(fdflags);
					parentFileDescriptor.assertOflags(oflags);

					const [deviceDriver, fileDescriptor, path] = getDeviceDriverWithPath(parentFileDescriptor, $decoder.decode(new Uint8Array(memory, path_ptr, path_len)));
					if (fileDescriptor !== parentFileDescriptor) {
						fileDescriptor.assertBaseRights(Rights.path_open);
						fileDescriptor.assertFdflags(fdflags);
						fileDescriptor.assertOflags(oflags);
					}
					const result = await deviceDriver.path_open(fileDescriptor, dirflags, path, oflags, fs_rights_base, fs_rights_inheriting, fdflags, fileDescriptors);
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
					const parentFileDescriptor = getFileDescriptor(fd);
					parentFileDescriptor.assertBaseRights(Rights.path_readlink);
					parentFileDescriptor.assertIsDirectory();

					const [deviceDriver, fileDescriptor, path] = getDeviceDriverWithPath(parentFileDescriptor, $decoder.decode(new Uint8Array(memory, path_ptr, path_len)));
					if (fileDescriptor !== parentFileDescriptor) {
						fileDescriptor.assertBaseRights(Rights.path_readlink);
						fileDescriptor.assertIsDirectory();
					}
					const target = $encoder.encode(await deviceDriver.path_readlink(fileDescriptor, path));
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
					const parentFileDescriptor = getFileDescriptor(fd);
					parentFileDescriptor.assertBaseRights(Rights.path_remove_directory);
					parentFileDescriptor.assertIsDirectory();

					const [deviceDriver, fileDescriptor, path] = getDeviceDriverWithPath(parentFileDescriptor, $decoder.decode(new Uint8Array(memory, path_ptr, path_len)));
					if (fileDescriptor !== parentFileDescriptor) {
						fileDescriptor.assertBaseRights(Rights.path_remove_directory);
						fileDescriptor.assertIsDirectory();
					}
					await deviceDriver.path_remove_directory(fileDescriptor, path);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			path_rename: async (memory: ArrayBuffer, old_fd: fd, old_path_ptr: ptr<bytes>, old_path_len: size, new_fd: fd, new_path_ptr: ptr<bytes>, new_path_len: size): Promise<errno> => {
				try {
					const oldParentFileDescriptor = getFileDescriptor(old_fd);
					oldParentFileDescriptor.assertBaseRights(Rights.path_rename_source);
					oldParentFileDescriptor.assertIsDirectory();

					const newParentFileDescriptor = getFileDescriptor(new_fd);
					newParentFileDescriptor.assertBaseRights(Rights.path_rename_target);
					newParentFileDescriptor.assertIsDirectory();

					const [oldDeviceDriver, oldFileDescriptor,oldPath] = getDeviceDriverWithPath(oldParentFileDescriptor, $decoder.decode(new Uint8Array(memory, old_path_ptr, old_path_len)));
					const [newDeviceDriver, newFileDescriptor, newPath] = getDeviceDriverWithPath(newParentFileDescriptor, $decoder.decode(new Uint8Array(memory, new_path_ptr, new_path_len)));
					if (oldDeviceDriver !== newDeviceDriver) {
						return Errno.nosys;
					}
					if (oldFileDescriptor !== oldParentFileDescriptor) {
						oldFileDescriptor.assertBaseRights(Rights.path_rename_source);
						oldFileDescriptor.assertIsDirectory();
					}
					if (newFileDescriptor !== newParentFileDescriptor) {
						newFileDescriptor.assertBaseRights(Rights.path_rename_target);
						newFileDescriptor.assertIsDirectory();
					}
					await oldDeviceDriver.path_rename(oldFileDescriptor, oldPath, newFileDescriptor, newPath);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			path_symlink: async (memory: ArrayBuffer, old_path_ptr: ptr<bytes>, old_path_len: size, fd: fd, new_path_ptr: ptr<bytes>, new_path_len: size): Promise<errno> => {
				// VS Code has no support to create a symlink.
				try {
					const parentFileDescriptor = getFileDescriptor(fd);
					parentFileDescriptor.assertBaseRights(Rights.path_symlink);
					parentFileDescriptor.assertIsDirectory();

					const [oldDeviceDriver, oldFileDescriptor, oldPath] = getDeviceDriverWithPath(parentFileDescriptor, $decoder.decode(new Uint8Array(memory, old_path_ptr, old_path_len)));
					const [newDeviceDriver, newFileDescriptor, newPath] = getDeviceDriverWithPath(parentFileDescriptor, $decoder.decode(new Uint8Array(memory, new_path_ptr, new_path_len)));
					if (oldDeviceDriver !== newDeviceDriver || oldFileDescriptor !== newFileDescriptor) {
						return Errno.nosys;
					}
					if (oldFileDescriptor !== parentFileDescriptor) {
						oldFileDescriptor.assertBaseRights(Rights.path_symlink);
						oldFileDescriptor.assertIsDirectory();
					}
					await oldDeviceDriver.path_symlink(oldPath, oldFileDescriptor, newPath);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			path_unlink_file: async (memory: ArrayBuffer, fd: fd, path_ptr: ptr<bytes>, path_len: size): Promise<errno> => {
				try {
					const parentFileDescriptor = getFileDescriptor(fd);
					parentFileDescriptor.assertBaseRights(Rights.path_unlink_file);
					parentFileDescriptor.assertIsDirectory();

					const [deviceDriver, fileDescriptor, path] = getDeviceDriverWithPath(parentFileDescriptor, $decoder.decode(new Uint8Array(memory, path_ptr, path_len)));
					if (fileDescriptor !== parentFileDescriptor) {
						fileDescriptor.assertBaseRights(Rights.path_unlink_file);
						fileDescriptor.assertIsDirectory();
					}
					await deviceDriver.path_unlink_file(fileDescriptor, path);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			poll_oneoff: async (memory: ArrayBuffer, input: ptr<subscription>, output: ptr<event[]>, subscriptions: size, result_size_ptr: ptr<u32>): Promise<errno> => {
				try {
					const view = new DataView(memory);
					let { events, timeout } = await handleSubscriptions(view, input, subscriptions);
					if (timeout !== undefined && timeout !== 0n) {
						// Timeout is in ns but sleep API is in ms.
						await new Promise((resolve) => {
							RAL().timer.setTimeout(resolve, BigInts.asNumber(timeout! / 1000000n));
						});
						// Reread the events. Timer will not change however the rest could have.
						events = (await handleSubscriptions(view, input, subscriptions)).events;
					}
					let event_offset = output;
					for (const item of events) {
						const event = Event.create(view, event_offset);
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
			proc_exit: async (_memory: ArrayBuffer, _rval: exitcode): Promise<errno> => {
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
			thread_exit: async (_memory: ArrayBuffer, _tid: u32): Promise<errno> => {
				return Promise.resolve(Errno.success);
			},
			'thread-spawn': async (_memory: ArrayBuffer, _start_args_ptr: ptr): Promise<errno> => {
				return Promise.resolve(Errno.nosys);
			}
		};

		async function handleSubscriptions(memory: DataView, input: ptr, subscriptions: size) {
			let subscription_offset: ptr = input;
			const events: Literal<event>[] = [];
			let timeout: bigint | undefined;
			for (let i = 0; i < subscriptions; i++) {
				const subscription = Subscription.create(memory, subscription_offset);
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
						break;
					case Eventtype.fd_write:
						const writeEvent = handleWriteSubscription(subscription);
						events.push(writeEvent);
						break;
				}
				subscription_offset += Subscription.size;
			}
			return { events, timeout };
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
				const time = $clock.now(Clockid.realtime, 0n);
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

		// Used when writing data
		function read_ciovs (memory: ArrayBuffer, iovs: ptr, iovsLen: u32): Uint8Array[] {
			const view = new DataView(memory);

			const buffers: Uint8Array[] = [];
			let ptr: ptr = iovs;
			for (let i = 0; i < iovsLen; i++) {
				const vec = Ciovec.create(view, ptr);
				// We need to copy the underlying memory since if it is a shared buffer
				// the WASM executable could already change it before we finally read it.
				const copy = new Uint8Array(vec.buf_len);
				copy.set(new Uint8Array(memory, vec.buf, vec.buf_len));
				buffers.push(copy);
				ptr += Ciovec.size;
			}
			return buffers;
		}

		// Used when reading data
		function read_iovs (memory: ArrayBuffer, iovs: ptr, iovsLen: u32): Uint8Array[] {
			const view = new DataView(memory);

			const buffers: Uint8Array[] = [];
			let ptr: ptr = iovs;
			for (let i = 0; i < iovsLen; i++) {
				const vec = Iovec.create(view, ptr);
				// We need a view onto the memory since we write the result into it.
				buffers.push(new Uint8Array(memory, vec.buf, vec.buf_len));
				ptr += Iovec.size;
			}
			return buffers;
		}

		function getDeviceDriver(fileDescriptor: FileDescriptor): DeviceDriver {
			return deviceDrivers.get(fileDescriptor.deviceId);
		}

		function getDeviceDriverWithPath(fileDescriptor: FileDescriptor, path: string): [DeviceDriver, FileDescriptor, string] {
			const result = deviceDrivers.get(fileDescriptor.deviceId);
			if (!$path.isAbsolute(path) && virtualRootFileSystem !== undefined && virtualRootFileSystem !== result && FileSystemDeviceDriver.is(result)) {
				path = $path.normalize(path);
				if (path.startsWith('..')) {
					const virtualPath = virtualRootFileSystem.makeVirtualPath(result, path);
					if (virtualPath === undefined) {
						throw new WasiError(Errno.noent);
					}
					const rootDescriptor = fileDescriptors.getRoot(virtualRootFileSystem);
					if (rootDescriptor === undefined) {
						throw new WasiError(Errno.noent);
					}
					return [virtualRootFileSystem, rootDescriptor, virtualPath];
				}
			}
			return [result, fileDescriptor, path];
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

export interface FileSystemService extends Pick<EnvironmentWasiService, 'fd_prestat_get' | 'fd_prestat_dir_name'>, DeviceWasiService {
}
export namespace FileSystemService {
	export function create(deviceDrivers: DeviceDrivers, fileDescriptors: FileDescriptors, virtualRootFileSystem: RootFileSystemDeviceDriver | undefined, preOpens: Map<string, FileSystemDeviceDriver>, options: DeviceOptions): FileSystemService {
		const clock = Clock.create();
		return Object.assign(
			{},
			EnvironmentWasiService.create(fileDescriptors, 'virtualRootFileSystem', preOpens.entries(), {}),
			DeviceWasiService.create(deviceDrivers, fileDescriptors, clock, virtualRootFileSystem, options)
		);
	}
}

export const NoSysWasiService: WasiService = {
	args_sizes_get: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	args_get: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	environ_sizes_get: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	environ_get: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	fd_prestat_get: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	fd_prestat_dir_name: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	clock_res_get: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	clock_time_get: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	fd_advise: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	fd_allocate: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	fd_close: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	fd_datasync: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	fd_fdstat_get: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	fd_fdstat_set_flags: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	fd_filestat_get: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	fd_filestat_set_size: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	fd_filestat_set_times: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	fd_pread: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	fd_pwrite: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	fd_read: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	fd_readdir: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	fd_seek: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	fd_renumber: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	fd_sync: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	fd_tell: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	fd_write: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	path_create_directory: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	path_filestat_get: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	path_filestat_set_times: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	path_link: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	path_open: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	path_readlink: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	path_remove_directory: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	path_rename: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	path_symlink: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	path_unlink_file: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	poll_oneoff: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	sched_yield: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	random_get: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	sock_accept: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	sock_shutdown: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	proc_exit: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	thread_exit: (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	},
	'thread-spawn': (): Promise<number> => {
		throw new WasiError(Errno.nosys);
	}
};
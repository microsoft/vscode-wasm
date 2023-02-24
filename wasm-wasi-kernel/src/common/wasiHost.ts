/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { cstring, ptr, size, u32, u64, u8 } from './baseTypes';
import {
	fd, errno, Errno, lookupflags, oflags, rights, fdflags, dircookie, filesize, advise, filedelta, whence, clockid, timestamp,
	fstflags, exitcode, WasiError, event, subscription, riflags, siflags, sdflags, args_sizes_get, dirent, ciovec, iovec, fdstat,
	filestat, prestat
} from './wasi';
import { ParamType, FunctionSignature, Signatures } from './wasiMeta';
import { Offsets } from './connection';


export abstract class HostConnection {

	private readonly timeout: number | undefined;

	constructor(timeout?: number) {
		this.timeout = timeout;
	}

	public call(signature: FunctionSignature, args: (number | bigint)[], wasmMemory: ArrayBuffer): errno {
		if (args.length !== signature.params.length) {
			throw new WasiError(Errno.inval);
		}
		const buffers = this.createCallArrays(signature, args, wasmMemory);
		const paramBuffer = buffers[0];

		const sync = new Int32Array(paramBuffer, Offsets.lock_index, 1);
		Atomics.store(sync, 0, 0);

		// Post the buffer to the WASM Kernel worker
		this.postMessage(buffers);

		// Wait for the answer
		const result = Atomics.wait(sync, 0, 0, this.timeout);
		switch (result) {
			case 'timed-out':
				return Errno.timedout;
			case 'not-equal':
				const value = Atomics.load(sync, 0);
				// If the value === 1 the service has already
				// provided the result. Otherwise we actually
				// don't know what happened :-(.
				if (value !== 1) {
					return Errno.nosys;
				}
		}

		const errno = new Uint16Array(paramBuffer, Offsets.errno_index, 1)[0];
		// If the wasmMemory is shared the WASM kernel did write the result
		// directly into the shared memory. So we are good to go.
		if (errno !== Errno.success || wasmMemory === buffers[1]) {
			return errno;
		}

		// Copy the results back into the WASM memory.
		const targetMemory = new Uint8Array(wasmMemory);
		const sourceMemory = new Uint8Array(buffers[1]);
		let result_ptr = 0;
		for (let i = 0; i < args.length; i++) {
			const param = signature.params[i];
			if (param.kind === ParamType.ptr) {
				targetMemory.set(sourceMemory.subarray(result_ptr, result_ptr + param.size), args[i] as number);
				result_ptr += param.size;
			}
		}
		return errno;
	}

	protected abstract postMessage(buffers: [SharedArrayBuffer, SharedArrayBuffer]): any;

	private createCallArrays(signature: FunctionSignature, args: (number | bigint)[], wasmMemory: ArrayBuffer): [SharedArrayBuffer, SharedArrayBuffer] {
		if (args.length !== signature.params.length) {
			throw new WasiError(Errno.inval);
		}
		// The WASM memory is shared so we can share it with the kernel thread.
		// So no need to copy data into yet another shared array.
		const paramBuffer = new SharedArrayBuffer(Offsets.header_size + signature.paramSize);
		const paramView = new DataView(paramBuffer);
		paramView.setUint32(Offsets.method_index, Signatures.getIndex(signature.name), true);
		if (wasmMemory instanceof SharedArrayBuffer) {
			let offset = Offsets.header_size;
			for (let i = 0; i < args.length; i++) {
				const param = signature.params[i];
				param.setter(paramView, offset, args[i] as (number & bigint));
				offset += param.size;
			}
			return [paramBuffer, wasmMemory];
		} else {
			const resultBuffer = new SharedArrayBuffer(signature.resultSize);
			let offset = Offsets.header_size;
			let result_ptr = 0;
			for (let i = 0; i < args.length; i++) {
				const param = signature.params[i];
				if (param.kind === ParamType.ptr) {
					param.setter(paramView, offset, result_ptr);
					result_ptr += param.dataSize;
				} else {
					param.setter(paramView, offset, args[i] as (number & bigint));
				}
				offset += param.size;
			}
			return [paramBuffer, resultBuffer];
		}
	}
}


export namespace WasiHost {
	export function create(connection: HostConnection): WASI {
		const wasi: WASI = {
			args_sizes_get: (argvCount_ptr: ptr<u32>, argvBufSize_ptr: ptr<u32>): errno => {
				return connection.call(args_sizes_get, [argvCount_ptr, argvBufSize_ptr], memory());
			},
			args_get: (argv_ptr: ptr<u32[]>, argvBuf_ptr: ptr<cstring>): errno => {
			},
			clock_res_get: (id: clockid, timestamp_ptr: ptr): errno => {
			},
			clock_time_get: (id: clockid, precision: timestamp, timestamp_ptr: ptr<u64>): errno => {
			},
			environ_sizes_get: (environCount_ptr: ptr<u32>, environBufSize_ptr: ptr<u32>): errno => {
			},
			environ_get: (environ_ptr: ptr<u32>, environBuf_ptr: ptr<cstring>): errno => {
			},
			fd_advise: (fd: fd, offset: filesize, length: filesize, advise: advise): errno => {
			},
			fd_allocate: (fd: fd, offset: filesize, len: filesize): errno => {
			},
			fd_close: (fd: fd): errno => {
			},
			fd_datasync: (fd: fd): errno => {
			},
			fd_fdstat_get: (fd: fd, fdstat_ptr: ptr<fdstat>): errno => {
			},
			fd_fdstat_set_flags: (fd: fd, fdflags: fdflags): errno => {
			},
			fd_filestat_get: (fd: fd, filestat_ptr: ptr<filestat>): errno => {
			},
			fd_filestat_set_size: (fd: fd, size: filesize): errno => {
			},
			fd_filestat_set_times: (fd: fd, atim: timestamp, mtim: timestamp, fst_flags: fstflags): errno => {
			},
			fd_pread: (fd: fd, iovs_ptr: ptr<iovec>, iovs_len: u32, offset: filesize, bytesRead_ptr: ptr<u32>): errno => {
			},
			fd_prestat_get: (fd: fd, bufPtr: ptr<prestat>): errno => {
			},
			fd_prestat_dir_name: (fd: fd, pathPtr: ptr<u8[]>, pathLen: size): errno => {
			},
			fd_pwrite: (fd: fd, ciovs_ptr: ptr<ciovec>, ciovs_len: u32, offset: filesize, bytesWritten_ptr: ptr<u32>): errno => {
			},
			fd_read: (fd: fd, iovs_ptr: ptr<iovec>, iovs_len: u32, bytesRead_ptr: ptr<u32>): errno => {
			},
			fd_readdir: (fd: fd, buf_ptr: ptr<dirent>, buf_len: size, cookie: dircookie, buf_used_ptr: ptr<u32>): errno => {
			},
			fd_seek: (fd: fd, offset: filedelta, whence: whence, new_offset_ptr: ptr<u64>): errno => {
			},
			fd_renumber: (fd: fd, to: fd): errno => {
			},
			fd_sync: (fd: fd): errno => {
			},
			fd_tell: (fd: fd, offset_ptr: ptr<u64>): errno => {
			},
			fd_write: (fd: fd, ciovs_ptr: ptr<ciovec>, ciovs_len: u32, bytesWritten_ptr: ptr<u32>): errno => {
			},
			path_create_directory: (fd: fd, path_ptr: ptr<u8[]>, path_len: size): errno => {
			},
			path_filestat_get: (fd: fd, flags: lookupflags, path_ptr: ptr<u8[]>, path_len: size, filestat_ptr: ptr): errno => {
			},
			path_filestat_set_times: (fd: fd, flags: lookupflags, path_ptr: ptr<u8[]>, path_len: size, atim: timestamp, mtim: timestamp, fst_flags: fstflags): errno => {
			},
			path_link: (old_fd: fd, old_flags: lookupflags, old_path_ptr: ptr<u8[]>, old_path_len: size, new_fd: fd, new_path_ptr: ptr<u8[]>, new_path_len: size): errno => {
			},
			path_open: (fd: fd, dirflags: lookupflags, path_ptr: ptr<u8[]>, path_len: size, oflags: oflags, fs_rights_base: rights, fs_rights_inheriting: rights, fdflags: fdflags, fd_ptr: ptr<fd>): errno => {
			},
			path_readlink: (fd: fd, path_ptr: ptr<u8[]>, path_len: size, buf_ptr: ptr, buf_len: size, result_size_ptr: ptr<u32>): errno => {
			},
			path_remove_directory: (fd: fd, path_ptr: ptr<u8[]>, path_len: size): errno => {
			},
			path_rename: (old_fd: fd, old_path_ptr: ptr<u8[]>, old_path_len: size, new_fd: fd, new_path_ptr: ptr<u8[]>, new_path_len: size): errno => {
			},
			path_symlink: (old_path_ptr: ptr<u8[]>, old_path_len: size, fd: fd, new_path_ptr: ptr<u8[]>, new_path_len: size): errno => {
			},
			path_unlink_file: (fd: fd, path_ptr: ptr<u8[]>, path_len: size): errno => {
			},
			poll_oneoff: (input: ptr<subscription>, output: ptr<event[]>, subscriptions: size, result_size_ptr: ptr<u32>): errno => {
			},
			proc_exit: (rval: exitcode) => {
			},
			sched_yield: (): errno => {
			},
			random_get: (buf: ptr<u8[]>, buf_len: size): errno => {
			},
			sock_accept: (_fd: fd, _flags: fdflags, _result_fd_ptr: ptr<u32>): errno => {
			},
			sock_recv: (_fd: fd, _ri_data_ptr: ptr, _ri_data_len: u32, _ri_flags: riflags, _ro_datalen_ptr: ptr, _roflags_ptr: ptr): errno => {
			},
			sock_send: (_fd: fd, _si_data_ptr: ptr, _si_data_len: u32, _si_flags: siflags, _si_datalen_ptr: ptr): errno => {
			},
			sock_shutdown: (_fd: fd, _sdflags: sdflags): errno => {
			},
			'thread-spawn': (_start_args_ptr: ptr<u32>): errno => {
			}
		};

		function memory(): ArrayBuffer {
			// if (instance === undefined) {
			// 	throw new Error(`WASI layer is not initialized. Missing WebAssembly instance.`);
			// }
			// return instance.exports.memory.buffer;
		}
	}
}
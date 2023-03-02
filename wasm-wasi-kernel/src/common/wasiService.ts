/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
	args_get, args_sizes_get, clock_res_get, clock_time_get, environ_get, environ_sizes_get, errno, Errno, fd_advise, fd_allocate,
	fd_close, fd_datasync, fd_fdstat_get, fd_fdstat_set_flags, fd_filestat_get, fd_filestat_set_size, fd_filestat_set_times, fd_pread,
	fd_prestat_dir_name, fd_prestat_get, fd_pwrite, fd_read, fd_readdir, fd_renumber, fd_seek, fd_sync, fd_tell, fd_write, path_create_directory,
	path_filestat_get, path_filestat_set_times, path_link, path_open, path_readlink, path_remove_directory, path_rename, path_symlink, path_unlink_file, poll_oneoff, proc_exit, random_get, sched_yield, sock_accept, thread_spawn, WasiError
} from './wasi';
import { Offsets } from './connection';
import { WasiFunction } from './wasiMeta';

export interface WasiService {
	args_sizes_get: args_sizes_get.ServiceSignature;
	args_get: args_get.ServiceSignature;
	clock_res_get: clock_res_get.ServiceSignature;
	clock_time_get: clock_time_get.ServiceSignature;
	environ_sizes_get: environ_sizes_get.ServiceSignature;
	environ_get: environ_get.ServiceSignature;
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
	fd_prestat_get: fd_prestat_get.ServiceSignature;
	fd_prestat_dir_name: fd_prestat_dir_name.ServiceSignature;
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


export abstract class ServiceConnection {

	private readonly wasiService: WasiService;

	constructor(wasiService: WasiService) {
		this.wasiService = wasiService;
	}

	protected async handleMessage(buffers: [SharedArrayBuffer, SharedArrayBuffer]): Promise<void> {
		const [paramBuffer, wasmMemory] = buffers;
		const paramView = new DataView(paramBuffer);
		try {

			const method = paramView.getUint32(Offsets.method_index, true);
			const signature = Signatures.signatureAt(method);
			if (signature === undefined) {
				throw new WasiError(Errno.inval);
			}
			const params = this.getParams(signature, paramBuffer);
			const result = await this.wasiService[signature.name](wasmMemory, ...params);
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

	private getParams(signature: WasiFunction, paramBuffer: SharedArrayBuffer): (number & bigint)[] {
		const paramView = new DataView(paramBuffer);
		const params: (number | bigint)[] = [];
		let offset = Offsets.header_size;
		for (let i = 0; i < signature.params.length; i++) {
			const param = signature.params[i];
			params.push(param.get(paramView, offset));
			offset += param.size;
		}
		return params as (number & bigint)[];
	}
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { cstring, ptr, size, u32, u8 } from './baseTypes';
import { advise, ciovec, clockid, dircookie, dirent, errno, event, exitcode, fd, fdflags, fdstat, filedelta, filesize, filestat, fstflags, iovec, lookupflags, oflags, prestat, riflags, rights, sdflags, siflags, subscription, timestamp, whence } from './wasiTypes';
import { WASI } from './wasi';
import { u64 } from '@vscode/sync-api-client';

export namespace DebugWrapper {
	export function create(wasi: WASI): WASI {
		return {
			initialize: (inst: any): void => {
				return wasi.initialize(inst);
			},
			args_sizes_get: (argvCount_ptr: ptr<u32>, argvBufSize_ptr: ptr<u32>): errno => {
				debugger;
				return wasi.args_sizes_get(argvCount_ptr, argvBufSize_ptr);
			},
			args_get: (argv_ptr: ptr<u32[]>, argvBuf_ptr: ptr<cstring>): errno => {
				debugger;
				return wasi.args_get(argv_ptr, argvBuf_ptr);
			},
			clock_res_get: (id: clockid, timestamp_ptr: ptr): errno => {
				debugger;
				return wasi.clock_res_get(id, timestamp_ptr);
			},
			clock_time_get: (id: clockid, precision: timestamp, timestamp_ptr: ptr<u64>): errno => {
				debugger;
				return wasi.clock_time_get(id, precision, timestamp_ptr);
			},
			environ_sizes_get: (environCount_ptr: ptr<u32>, environBufSize_ptr: ptr<u32>): errno => {
				debugger;
				return wasi.environ_sizes_get(environCount_ptr, environBufSize_ptr);
			},
			environ_get: (environ_ptr: ptr<u32>, environBuf_ptr: ptr<cstring>): errno => {
				debugger;
				return wasi.environ_get(environ_ptr, environBuf_ptr);
			},
			fd_advise: (fd: fd, offset: filesize, length: filesize, advise: advise): errno => {
				debugger;
				return wasi.fd_advise(fd, offset, length, advise);
			},
			fd_allocate: (fd: fd, offset: filesize, len: filesize): errno => {
				debugger;
				return wasi.fd_allocate(fd, offset, len);
			},
			fd_close: (fd: fd): errno => {
				debugger;
				return wasi.fd_close(fd);
			},
			fd_datasync: (fd: fd): errno => {
				debugger;
				return wasi.fd_datasync(fd);
			},
			fd_fdstat_get: (fd: fd, fdstat_ptr: ptr<fdstat>): errno => {
				debugger;
				return wasi.fd_fdstat_get(fd, fdstat_ptr);
			},
			fd_fdstat_set_flags: (fd: fd, fdflags: fdflags): errno => {
				debugger;
				return wasi.fd_fdstat_set_flags(fd, fdflags);
			},
			fd_filestat_get: (fd: fd, filestat_ptr: ptr<filestat>): errno => {
				debugger;
				return wasi.fd_filestat_get(fd, filestat_ptr);
			},
			fd_filestat_set_size: (fd: fd, size: filesize): errno => {
				debugger;
				return wasi.fd_filestat_set_size(fd, size);
			},
			fd_filestat_set_times: (fd: fd, atim: timestamp, mtim: timestamp, fst_flags: fstflags): errno => {
				debugger;
				return wasi.fd_filestat_set_times(fd, atim, mtim, fst_flags);
			},
			fd_pread: (fd: fd, iovs_ptr: ptr<iovec>, iovs_len: u32, offset: filesize, bytesRead_ptr: ptr<u32>): errno => {
				debugger;
				return wasi.fd_pread(fd, iovs_ptr, iovs_len, offset, bytesRead_ptr);
			},
			fd_prestat_get: (fd: fd, bufPtr: ptr<prestat>): errno => {
				debugger;
				return wasi.fd_prestat_get(fd, bufPtr);
			},
			fd_prestat_dir_name: (fd: fd, pathPtr: ptr<u8[]>, pathLen: size): errno => {
				debugger;
				return wasi.fd_prestat_dir_name(fd, pathPtr, pathLen);
			},
			fd_pwrite: (fd: fd, ciovs_ptr: ptr<ciovec>, ciovs_len: u32, offset: filesize, bytesWritten_ptr: ptr<u32>): errno => {
				debugger;
				return wasi.fd_pwrite(fd, ciovs_ptr, ciovs_len, offset, bytesWritten_ptr);
			},
			fd_read: (fd: fd, iovs_ptr: ptr<iovec>, iovs_len: u32, bytesRead_ptr: ptr<u32>): errno => {
				debugger;
				return wasi.fd_read(fd, iovs_ptr, iovs_len, bytesRead_ptr);
			},
			fd_readdir: (fd: fd, buf_ptr: ptr<dirent>, buf_len: size, cookie: dircookie, buf_used_ptr: ptr<u32>): errno => {
				debugger;
				return wasi.fd_readdir(fd, buf_ptr, buf_len, cookie, buf_used_ptr);
			},
			fd_seek: (fd: fd, offset: filedelta, whence: whence, new_offset_ptr: ptr<u64>): errno => {
				debugger;
				return wasi.fd_seek(fd, offset, whence, new_offset_ptr);
			},
			fd_renumber: (fd: fd, to: fd): errno => {
				debugger;
				return wasi.fd_renumber(fd, to);
			},
			fd_sync: (fd: fd): errno => {
				debugger;
				return wasi.fd_sync(fd);
			},
			fd_tell: (fd: fd, offset_ptr: ptr<u64>): errno => {
				debugger;
				return wasi.fd_tell(fd, offset_ptr);
			},
			fd_write: (fd: fd, ciovs_ptr: ptr<ciovec>, ciovs_len: u32, bytesWritten_ptr: ptr<u32>): errno => {
				debugger;
				return wasi.fd_write(fd, ciovs_ptr, ciovs_len, bytesWritten_ptr);
			},
			path_create_directory: (fd: fd, path_ptr: ptr<u8[]>, path_len: size): errno => {
				debugger;
				return wasi.path_create_directory(fd, path_ptr, path_len);
			},
			path_filestat_get: (fd: fd, flags: lookupflags, path_ptr: ptr<u8[]>, path_len: size, filestat_ptr: ptr): errno => {
				debugger;
				return wasi.path_filestat_get(fd, flags, path_ptr, path_len, filestat_ptr);
			},
			path_filestat_set_times: (fd: fd, flags: lookupflags, path_ptr: ptr<u8[]>, path_len: size, atim: timestamp, mtim: timestamp, fst_flags: fstflags): errno => {
				debugger;
				return wasi.path_filestat_set_times(fd, flags, path_ptr, path_len, atim, mtim, fst_flags);
			},
			path_link: (old_fd: fd, old_flags: lookupflags, old_path_ptr: ptr<u8[]>, old_path_len: size, new_fd: fd, new_path_ptr: ptr<u8[]>, new_path_len: size): errno => {
				debugger;
				return wasi.path_link(old_fd, old_flags, old_path_ptr, old_path_len, new_fd, new_path_ptr, new_path_len);
			},
			path_open: (fd: fd, dirflags: lookupflags, path_ptr: ptr<u8[]>, path_len: size, oflags: oflags, fs_rights_base: rights, fs_rights_inheriting: rights, fdflags: fdflags, fd_ptr: ptr<fd>): errno => {
				debugger;
				return wasi.path_open(fd, dirflags, path_ptr, path_len, oflags, fs_rights_base, fs_rights_inheriting, fdflags, fd_ptr);
			},
			path_readlink: (fd: fd, path_ptr: ptr<u8[]>, path_len: size, buf_ptr: ptr, buf_len: size, result_size_ptr: ptr<u32>): errno => {
				debugger;
				return wasi.path_readlink(fd, path_ptr, path_len, buf_ptr, buf_len, result_size_ptr);
			},
			path_remove_directory: (fd: fd, path_ptr: ptr<u8[]>, path_len: size): errno => {
				debugger;
				return wasi.path_remove_directory(fd, path_ptr, path_len);
			},
			path_rename: (old_fd: fd, old_path_ptr: ptr<u8[]>, old_path_len: size, new_fd: fd, new_path_ptr: ptr<u8[]>, new_path_len: size): errno => {
				debugger;
				return wasi.path_rename(old_fd, old_path_ptr, old_path_len, new_fd, new_path_ptr, new_path_len);
			},
			path_symlink: (old_path_ptr: ptr<u8[]>, old_path_len: size, fd: fd, new_path_ptr: ptr<u8[]>, new_path_len: size): errno => {
				debugger;
				return wasi.path_symlink(old_path_ptr, old_path_len, fd, new_path_ptr, new_path_len);
			},
			path_unlink_file: (fd: fd, path_ptr: ptr<u8[]>, path_len: size): errno => {
				debugger;
				return wasi.path_unlink_file(fd, path_ptr, path_len);
			},
			poll_oneoff: (input: ptr<subscription>, output: ptr<event[]>, subscriptions: size, result_size_ptr: ptr<u32>): errno => {
				debugger;
				return wasi.poll_oneoff(input, output, subscriptions, result_size_ptr);
			},
			proc_exit: (rval: exitcode) => {
				debugger;
				return wasi.proc_exit(rval);
			},
			sched_yield: (): errno => {
				debugger;
				return wasi.sched_yield();
			},
			random_get: (buf: ptr<u8[]>, buf_len: size): errno => {
				debugger;
				return wasi.random_get(buf, buf_len);
			},
			sock_accept: (fd: fd, flags: fdflags, result_fd_ptr: ptr<u32>): errno => {
				debugger;
				return wasi.sock_accept(fd, flags, result_fd_ptr);
			},
			sock_recv: (fd: fd, ri_data_ptr: ptr, ri_data_len: u32, ri_flags: riflags, ro_datalen_ptr: ptr, roflags_ptr: ptr): errno => {
				debugger;
				return wasi.sock_recv(fd, ri_data_ptr, ri_data_len, ri_flags, ro_datalen_ptr, roflags_ptr);
			},
			sock_send: (fd: fd, si_data_ptr: ptr, si_data_len: u32, si_flags: siflags, si_datalen_ptr: ptr): errno => {
				debugger;
				return wasi.sock_send(fd, si_data_ptr, si_data_len, si_flags, si_datalen_ptr);
			},
			sock_shutdown: (fd: fd, sdflags: sdflags): errno => {
				debugger;
				return wasi.sock_shutdown(fd, sdflags);
			},
			'thread-spawn': (start_args_ptr: ptr<u32>): errno => {
				debugger;
				return wasi['thread-spawn'](start_args_ptr);
			}
		};
	}
}

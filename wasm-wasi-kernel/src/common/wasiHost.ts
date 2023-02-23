/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

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
	fd_renumber: fd_renumber;
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

	'thread-spawn': thread_spawn;
}

export namespace WasiHost {

}
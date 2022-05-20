/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// @todo dirkb
// The constants come from https://github.com/WebAssembly/WASI/blob/main/phases/snapshot/docs.md
// We need to clarify how to license them. I was not able to find a license file
// in the https://github.com/WebAssembly/WASI repository

enum Rights {

	/**
	 * The right to invoke fd_datasync. If path_open is set, includes the right
	 * to invoke path_open with fdflags::dsync.
	 */
	fd_datasync = 1 << 0,

	/**
	 * The right to invoke fd_read and sock_recv. If rights::fd_seek is set,
	 * includes the right to invoke fd_pread.
	 */
	fd_read = 1 << 1,

	/**
	 * The right to invoke fd_seek. This flag implies rights::fd_tell.
	 */
	fd_seek = 1 << 2,

	/**
	 * The right to invoke fd_fdstat_set_flags.
	 */
	fd_fdstat_set_flags = 1 << 3,

	/**
	 * The right to invoke fd_sync. If path_open is set, includes the right to
	 * invoke path_open with fdflags::rsync and fdflags::dsync.
	 */
	fd_sync = 1 << 4,

	/**
	 * The right to invoke fd_seek in such a way that the file offset remains
	 * unaltered (i.e., whence::cur with offset zero), or to invoke fd_tell.
	 */
	fd_tell = 1 << 5,

	/**
	 * The right to invoke fd_write and sock_send. If rights::fd_seek is set,
	 * includes the right to invoke fd_pwrite.
	 */
	fd_write = 1 << 6,

	/**
	 * The right to invoke fd_advise.
	 */
	fd_advise = 1 << 7,

	/**
	 * The right to invoke fd_allocate.
	 */
	fd_allocate = 1 << 8,

	/**
	 * The right to invoke path_create_directory.
	 */
	path_create_directory = 1 << 9,

	/**
	 * If path_open is set, the right to invoke path_open with oflags::creat.
	 */
	path_create_file = 1 << 10,

	/**
	 * The right to invoke path_link with the file descriptor as the source
	 * directory.
	 */
	path_link_source = 1 << 11,

	/**
	 * The right to invoke path_link with the file descriptor as the target
	 * directory.
	 */
	path_link_target = 1 << 12,

	/**
	 * The right to invoke path_open.
	 */
	path_open = 1 << 13,

	/**
	 * The right to invoke fd_readdir.
	 */
	fd_readdir = 1 << 14,

	/**
	 * The right to invoke path_readlink.
	 */
	path_readlink = 1 << 15,

	/**
	 * The right to invoke path_rename with the file descriptor as the source
	 * directory.
	 */
	path_rename_source = 1 << 16,

	/**
	 * The right to invoke path_rename with the file descriptor as the target
	 * directory.
	 */
	path_rename_target = 1 << 17,

	/**
	 * The right to invoke path_filestat_get.
	 */
	path_filestat_get = 1 << 18,

	/**
	 * The right to change a file's size (there is no path_filestat_set_size).
	 * If path_open is set, includes the right to invoke path_open with
	 * oflags::trunc.
	 */
	path_filestat_set_size = 1 << 19,

	/**
	 * The right to invoke path_filestat_set_times.
	 */
	path_filestat_set_times = 1 << 20,

	/**
	 * The right to invoke fd_filestat_get.
	 */
	fd_filestat_get = 1 << 21,

	/**
	 * The right to invoke fd_filestat_set_size.
	 */
	fd_filestat_set_size = 1 << 22,

	/**
	 * The right to invoke fd_filestat_set_times.
	 */
	fd_filestat_set_times = 1 << 23,

	/**
	 * The right to invoke path_symlink.
	 */
	path_symlink = 1 << 24,

	/**
	 * The right to invoke path_remove_directory.
	 */
	path_remove_directory = 1 << 25,

	/**
	 * The right to invoke path_unlink_file.
	 */
	path_unlink_file = 1 << 26,

	/**
	 * If rights::fd_read is set, includes the right to invoke poll_oneoff to
	 * subscribe to eventtype::fd_read. If rights::fd_write is set, includes
	 * the right to invoke poll_oneoff to subscribe to eventtype::fd_write.
	 */
	poll_fd_readwrite = 1 << 27,

	/**
	 * The right to invoke sock_shutdown.
	 */
	sock_shutdown = 1 << 28,

	/**
	 * The right to invoke sock_accept.
	 */
	sock_accept = 1 << 29
}

export default Rights;
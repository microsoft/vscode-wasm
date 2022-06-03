/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// @todo dirkb
// The constants come from https://github.com/WebAssembly/WASI/blob/main/phases/snapshot/docs.md
// We need to clarify how to license them. I was not able to find a license file
// in the https://github.com/WebAssembly/WASI repository

import { ptr, size, u16, u32, u64, u8 } from './baseTypes';

export type wasi_file_handle = u32;

export type errno = u16;
export enum Errno {
	/**
	 * No error occurred. System call completed successfully.
	 */
	success = 0,

	/**
	 * Argument list too long.
	 */
	toobig = 1,

	/**
	 *  Permission denied.
	 */
	acces = 2,

	/**
	 * Address in use.
	 */
	addrinuse = 3,

	/**
	 * Address not available.
	 */
	addrnotavail = 4,

	/**
	 * Address family not supported.
	 */
	afnosupport = 5,

	/**
	 * Resource unavailable, or operation would block.
	 */
	again = 6,

	/**
	 * Connection already in progress.
	 */
	already = 7,

	/**
	 * Bad file descriptor.
	 */
	badf = 8,

	/**
	 * Bad message.
	 */
	badmsg = 9,

	/**
	 * Device or resource busy.
	 */
	busy = 10,

	/**
	 * Operation canceled.
	 */
	canceled = 11,

	/**
	 *  No child processes.
	 */
	child = 12,

	/**
	 * Connection aborted.
	 */
	connaborted = 13,

	/**
	 * Connection refused.
	 */
	connrefused = 14,

	/**
	 * Connection reset.
	 */
	connreset = 15,

	/**
	 * Resource deadlock would occur.
	 */
	deadlk = 16,

	/**
	 * Destination address required.
	 */
	destaddrreq = 17,

	/**
	 * Mathematics argument out of domain of function.
	 */
	dom = 18,

	/**
	 * Reserved.
	 */
	dquot = 19,

	/**
	 * File exists.
	 */
	exist = 20,

	/**
	 * Bad address.
	 */
	fault = 21,

	/**
	 * File too large.
	 */
	fbig = 22,

	/**
	 * Host is unreachable.
	 */
	hostunreach = 23,

	/**
	 * Identifier removed.
	 */
	idrm = 24,

	/**
	 * Illegal byte sequence.
	 */
	ilseq = 25,

	/**
	 * Operation in progress.
	 */
	inprogress = 26,

	/**
	 * Interrupted function.
	 */
	intr = 27,

	/**
	 * Invalid argument.
	 */
	inval = 28,

	/**
	 * I/O error.
	 */
	io = 29,

	/**
	 * Socket is connected.
	 */
	isconn = 30,

	/**
	 * Is a directory.
	 */
	isdir = 31,

	/**
	 * Too many levels of symbolic links.
	 */
	loop = 32,

	/**
	 * File descriptor value too large.
	 */
	mfile = 33,

	/**
	 * Too many links.
	 */
	mlink = 34,

	/**
	 * Message too large.
	 */
	msgsize = 35,

	/**
	 * Reserved.
	 */
	multihop = 36,

	/**
	 * Filename too long.
	 */
	nametoolong = 37,

	/**
	 * Network is down.
	 */
	netdown = 38,

	/**
	 * Connection aborted by network.
	 */
	netreset = 39,

	/**
	 * Network unreachable.
	 */
	netunreach = 40,

	/**
	 * Too many files open in system.
	 */
	nfile = 41,

	/**
	 * No buffer space available.
	 */
	nobufs = 42,

	/**
	 * No such device.
	 */
	nodev = 43,

	/**
	 * No such file or directory.
	 */
	noent = 44,

	/**
	 * Executable file format error.
	 */
	noexec = 45,

	/**
	 * No locks available.
	 */
	nolck = 46,

	/**
	 * Reserved.
	 */
	nolink = 47,

	/**
	 * Not enough space.
	 */
	nomem = 48,

	/**
	 * No message of the desired type.
	 */
	nomsg = 49,

	/**
	 * Protocol not available.
	 */
	noprotoopt = 50,

	/**
	 * No space left on device.
	 */
	nospc = 51,

	/**
	 * Function not supported.
	 */
	nosys = 52,

	/**
	 * The socket is not connected.
	 */
	notconn = 53,

	/**
	 * Not a directory or a symbolic link to a directory.
	 */
	notdir = 54,

	/**
	 * Directory not empty.
	 */
	notempty = 55,

	/**
	 * State not recoverable.
	 */
	notrecoverable = 56,

	/**
	 * Not a socket.
	 */
	notsock = 57,

	/**
	 * Not supported, or operation not supported on socket.
	 */
	notsup = 58,

	/**
	 * Inappropriate I/O control operation.
	 */
	notty = 59,

	/**
	 * No such device or address.
	 */
	nxio = 60,

	/**
	 * Value too large to be stored in data type.
	 */
	overflow = 61,

	/**
	 * Previous owner died.
	 */
	ownerdead = 62,

	/**
	 * Operation not permitted.
	 */
	perm = 63,

	/**
	 * Broken pipe.
	 */
	pipe = 64,

	/**
	 * Protocol error.
	 */
	proto = 65,

	/**
	 * Protocol not supported.
	 */
	protonosupport = 66,

	/**
	 * Protocol wrong type for socket.
	 */
	prototype = 67,

	/**
	 * Result too large.
	 */
	range = 68,

	/**
	 * Read-only file system.
	 */
	rofs = 69,

	/**
	 * Invalid seek.
	 */
	spipe = 70,

	/**
	 * No such process.
	 */
	srch = 71,

	/**
	 * Reserved.
	 */
	stale = 72,

	/**
	 * Connection timed out.
	 */
	timedout = 73,

	/**
	 * Text file busy.
	 */
	txtbsy = 74,

	/**
	 * Cross-device link.
	 */
	xdev = 75,

	/**
	 * Extension: Capabilities insufficient.
	 */
	notcapable = 76
}

export type rights = u64;
export enum Rights {

	/**
	 * The right to invoke fd_datasync. If path_open is set, includes the right
	 * to invoke path_open with fdflags::dsync.
	 */
	fd_datasync = 1 << 0, // 1

	/**
	 * The right to invoke fd_read and sock_recv. If rights::fd_seek is set,
	 * includes the right to invoke fd_pread.
	 */
	fd_read = 1 << 1, // 2

	/**
	 * The right to invoke fd_seek. This flag implies rights::fd_tell.
	 */
	fd_seek = 1 << 2, // 4

	/**
	 * The right to invoke fd_fdstat_set_flags.
	 */
	fd_fdstat_set_flags = 1 << 3, // 8

	/**
	 * The right to invoke fd_sync. If path_open is set, includes the right to
	 * invoke path_open with fdflags::rsync and fdflags::dsync.
	 */
	fd_sync = 1 << 4, // 16

	/**
	 * The right to invoke fd_seek in such a way that the file offset remains
	 * unaltered (i.e., whence::cur with offset zero), or to invoke fd_tell.
	 */
	fd_tell = 1 << 5, // 32

	/**
	 * The right to invoke fd_write and sock_send. If rights::fd_seek is set,
	 * includes the right to invoke fd_pwrite.
	 */
	fd_write = 1 << 6, // 64

	/**
	 * The right to invoke fd_advise.
	 */
	fd_advise = 1 << 7, // 128

	/**
	 * The right to invoke fd_allocate.
	 */
	fd_allocate = 1 << 8, // 256

	/**
	 * The right to invoke path_create_directory.
	 */
	path_create_directory = 1 << 9, // 512

	/**
	 * If path_open is set, the right to invoke path_open with oflags::creat.
	 */
	path_create_file = 1 << 10, // 1024

	/**
	 * The right to invoke path_link with the file descriptor as the source
	 * directory.
	 */
	path_link_source = 1 << 11, // 2048

	/**
	 * The right to invoke path_link with the file descriptor as the target
	 * directory.
	 */
	path_link_target = 1 << 12, // 4096

	/**
	 * The right to invoke path_open.
	 */
	path_open = 1 << 13, // 8192

	/**
	 * The right to invoke fd_readdir.
	 */
	fd_readdir = 1 << 14, // 16384

	/**
	 * The right to invoke path_readlink.
	 */
	path_readlink = 1 << 15, // 32768

	/**
	 * The right to invoke path_rename with the file descriptor as the source
	 * directory.
	 */
	path_rename_source = 1 << 16, // 65536

	/**
	 * The right to invoke path_rename with the file descriptor as the target
	 * directory.
	 */
	path_rename_target = 1 << 17, // 131072

	/**
	 * The right to invoke path_filestat_get.
	 */
	path_filestat_get = 1 << 18, // 262144

	/**
	 * The right to change a file's size (there is no path_filestat_set_size).
	 * If path_open is set, includes the right to invoke path_open with
	 * oflags::trunc.
	 */
	path_filestat_set_size = 1 << 19, // 524288

	/**
	 * The right to invoke path_filestat_set_times.
	 */
	path_filestat_set_times = 1 << 20, // 1048576

	/**
	 * The right to invoke fd_filestat_get.
	 */
	fd_filestat_get = 1 << 21, // 2097152

	/**
	 * The right to invoke fd_filestat_set_size.
	 */
	fd_filestat_set_size = 1 << 22, // 4194304

	/**
	 * The right to invoke fd_filestat_set_times.
	 */
	fd_filestat_set_times = 1 << 23, // 8388608

	/**
	 * The right to invoke path_symlink.
	 */
	path_symlink = 1 << 24, // 16777216

	/**
	 * The right to invoke path_remove_directory.
	 */
	path_remove_directory = 1 << 25, // 33554432

	/**
	 * The right to invoke path_unlink_file.
	 */
	path_unlink_file = 1 << 26, // 67108864

	/**
	 * If rights::fd_read is set, includes the right to invoke poll_oneoff to
	 * subscribe to eventtype::fd_read. If rights::fd_write is set, includes
	 * the right to invoke poll_oneoff to subscribe to eventtype::fd_write.
	 */
	poll_fd_readwrite = 1 << 27, // 134217728

	/**
	 * The right to invoke sock_shutdown.
	 */
	sock_shutdown = 1 << 28, // 268435456

	/**
	 * The right to invoke sock_accept.
	 */
	sock_accept = 1 << 29, // 536870912

	/**
	 * All rights
	 */
	All = fd_datasync | fd_read | fd_seek | fd_fdstat_set_flags | fd_sync |
		fd_tell | fd_write | fd_advise | fd_allocate | path_create_directory |
		path_create_file | path_link_source | path_link_target | path_open |
		fd_readdir | path_readlink | path_rename_source | path_rename_target |
		path_filestat_get | path_filestat_set_size | path_filestat_set_times |
		fd_filestat_get | fd_filestat_set_size | fd_filestat_set_times |
		path_symlink | path_remove_directory | path_unlink_file | poll_fd_readwrite |
		sock_shutdown | sock_accept,

	/**
	 * Base rights for block devices.
	 *
	 * Note: we don't have block devices in VS Code.
	 */
	BlockDeviceBase = 0,

	/**
	 * Inheriting rights for block devices.
	 *
	 * Note: we don't have block devices in VS Code.
	 */
	BlockDeviceInheriting = 0,

	/**
	 * Base rights for directories
	 */
	DirectoryBase = path_create_directory | path_create_file | path_open |
		fd_readdir | path_rename_source | path_rename_target | path_filestat_get |
		path_filestat_set_size | fd_filestat_get | path_remove_directory |
		path_unlink_file,

	/**
	 * Base rights for files
	 */
	FileBase = fd_read | fd_seek | fd_write | fd_filestat_get,

	/**
	 * Inheriting rights for directories
	 */
	DirectoryInheriting = DirectoryBase | FileBase,

	/**
	 * Inheriting rights for files
	 */
	FileInheriting = 0
}

export type dircookie = u64;

export type fdflags = u16;
export enum FdFlags {

	/**
	 * Append mode: Data written to the file is always appended to the file's
	 * end.
	 */
	append = 1 << 0,

	/**
	 * Write according to synchronized I/O data integrity completion. Only the
	 * data stored in the file is synchronized.
	 */
	dsync = 1 << 1,

	/**
	 * Non-blocking mode.
	 */
	nonblock = 1 << 2,

	/**
	 * Synchronized read I/O operations.
	 */
	rsync = 1 << 3,

	/**
	 * Write according to synchronized I/O file integrity completion. In
	 * addition to synchronizing the data stored in the file, the
	 * implementation may also synchronously update the file's metadata.
	 */
	sync = 1 << 4
}

export type lookupflags = u32;
export enum LookupFlags {
	/**
	 * As long as the resolved path corresponds to a symbolic link, it is
	 * expanded.
	 */
	symlink_follow = 1 << 0
}

export type oflags = u16;
export enum OFlags {

	/**
	 * Create file if it does not exist.
	 */
	creat = 1 << 0,

	/**
	 * Fail if not a directory.
	 */
	directory = 1 << 1,

	/**
	 * Fail if file already exists.
	 */
	excl = 1 << 2,

	/**
	 * Truncate file to size 0.
	 */
	trunc = 1 << 3
}

export type clockId = u32;
export enum ClockId {
	/**
	 * The clock measuring real time. Time value zero corresponds with
	 * 1970-01-01T00:00:00Z.
	 */
	realtime = 0,

	/**
	 * The store-wide monotonic clock, which is defined as a clock measuring
	 * real time, whose value cannot be adjusted and which cannot have negative
	 * clock jumps. The epoch of this clock is undefined. The absolute time
	 * value of this clock therefore has no meaning.
	 */
	monotonic = 1,

	/**
	 * The CPU-time clock associated with the current process.
	 */
	process_cputime_id = 2,

	/**
	 * The CPU-time clock associated with the current thread.
	 */
	thread_cputime_id = 3
}

export type preOpenType = u8;
export enum PreOpenType {

	/**
	 * A pre-opened directory.
	 */
	dir = 0
}

export type fileType = u8;
export enum FileType {

	/**
	 * The type of the file descriptor or file is unknown or is different from
	 * any of the other types specified.
	 */
	unknown = 0,

	/**
	 * The file descriptor or file refers to a block device inode.
	 */
	block_device = 1,

	/**
	 * The file descriptor or file refers to a character device inode.
	 */
	character_device = 2,

	/**
	 * The file descriptor or file refers to a directory inode.
	 */
	directory = 3,

	/**
	 * The file descriptor or file refers to a regular file inode.
	 */
	regular_file = 4,

	/**
	 * The file descriptor or file refers to a datagram socket.
	 */
	socket_dgram = 5,

	/**
	 * The file descriptor or file refers to a byte-stream socket.
	 */
	socket_stream = 6,

	/**
	 * The file refers to a symbolic link inode.
	 */
	symbolic_link = 7
}

export type fileSize = u64;

export type advise = u8;
/**
 * File or memory access pattern advisory information.
 */
export enum Advice {
	/**
	 * The application has no advice to give on its behavior with respect to
	 * the specified data.
	 */
	normal = 0,

	/**
	 * The application expects to access the specified data sequentially from
	 * lower offsets to higher offsets.
	 */
	sequential = 1,

	/**
	 * The application expects to access the specified data in a random order.
	 */
	random = 2,

	/**
	 * The application expects to access the specified data in the near future.
	 */
	willneed = 3,

	/**
	 * The application expects that it will not access the specified data in
	 * the near future.
	 */
	dontneed = 4,

	/**
	 *  The application expects to access the specified data once and then not
	 * reuse it thereafter.
	 */
	noreuse = 5
}


/**
 * The contents of a $prestat when type is `PreOpenType.dir`
 */
export type PreStartDir = {

	/**
	 * Sets the length of the pre opened directory name.
	 */
	set len(value: size);
};

export namespace PreStartDir {
	export function create(ptr: ptr, memory: DataView): PreStartDir {
		memory.setUint8(ptr, PreOpenType.dir);
		return {
			set len(value: size) {
				memory.setUint32(ptr + 4, value, true);
			}
		};
	}
}

/**
 * C IO vector
 */
export type Ciovec = {
	/**
	 * Pointer in memory where the data is stored
	 */
	get buf(): ptr;

	/**
	 * The length of the data.
	 */
	get bufLen(): u32;
};

export namespace Ciovec {
	export const size: 8 = 8;
	export function create(ptr: ptr, memory: DataView): Ciovec {
		return {
			get buf(): ptr {
				return memory.getUint32(ptr, true);
			},
			get bufLen(): u32 {
				return memory.getUint32(ptr + 4, true);
			}
		};
	}
}

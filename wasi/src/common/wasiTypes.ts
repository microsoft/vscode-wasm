/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// @todo dirkb
// The constants come from https://github.com/WebAssembly/WASI/blob/main/phases/snapshot/docs.md
// We need to clarify how to license them. I was not able to find a license file
// in the https://github.com/WebAssembly/WASI repository

import { ptr, size, u16, u32, u64, s64, u8 } from './baseTypes';

export type fd = u32;

export type exitcode = u32;

export type errno = u16;
export namespace Errno {
	/**
	 * No error occurred. System call completed successfully.
	 */
	export const success = 0;

	/**
	 * Argument list too long.
	 */
	export const toobig = 1;

	/**
	 *  Permission denied.
	 */
	export const acces = 2;

	/**
	 * Address in use.
	 */
	export const addrinuse = 3;

	/**
	 * Address not available.
	 */
	export const addrnotavail = 4;

	/**
	 * Address family not supported.
	 */
	export const afnosupport = 5;

	/**
	 * Resource unavailable, or operation would block.
	 */
	export const again = 6;

	/**
	 * Connection already in progress.
	 */
	export const already = 7;

	/**
	 * Bad file descriptor.
	 */
	export const badf = 8;

	/**
	 * Bad message.
	 */
	export const badmsg = 9;

	/**
	 * Device or resource busy.
	 */
	export const busy = 10;

	/**
	 * Operation canceled.
	 */
	export const canceled = 11;

	/**
	 *  No child processes.
	 */
	export const child = 12;

	/**
	 * Connection aborted.
	 */
	export const connaborted = 13;

	/**
	 * Connection refused.
	 */
	export const connrefused = 14;

	/**
	 * Connection reset.
	 */
	export const connreset = 15;

	/**
	 * Resource deadlock would occur.
	 */
	export const deadlk = 16;

	/**
	 * Destination address required.
	 */
	export const destaddrreq = 17;

	/**
	 * Mathematics argument out of domain of function.
	 */
	export const dom = 18;

	/**
	 * Reserved.
	 */
	export const dquot = 19;

	/**
	 * File exists.
	 */
	export const exist = 20;

	/**
	 * Bad address.
	 */
	export const fault = 21;

	/**
	 * File too large.
	 */
	export const fbig = 22;

	/**
	 * Host is unreachable.
	 */
	export const hostunreach = 23;

	/**
	 * Identifier removed.
	 */
	export const idrm = 24;

	/**
	 * Illegal byte sequence.
	 */
	export const ilseq = 25;

	/**
	 * Operation in progress.
	 */
	export const inprogress = 26;

	/**
	 * Interrupted function.
	 */
	export const intr = 27;

	/**
	 * Invalid argument.
	 */
	export const inval = 28;

	/**
	 * I/O error.
	 */
	export const io = 29;

	/**
	 * Socket is connected.
	 */
	export const isconn = 30;

	/**
	 * Is a directory.
	 */
	export const isdir = 31;

	/**
	 * Too many levels of symbolic links.
	 */
	export const loop = 32;

	/**
	 * File descriptor value too large.
	 */
	export const mfile = 33;

	/**
	 * Too many links.
	 */
	export const mlink = 34;

	/**
	 * Message too large.
	 */
	export const msgsize = 35;

	/**
	 * Reserved.
	 */
	export const multihop = 36;

	/**
	 * Filename too long.
	 */
	export const nametoolong = 37;

	/**
	 * Network is down.
	 */
	export const netdown = 38;

	/**
	 * Connection aborted by network.
	 */
	export const netreset = 39;

	/**
	 * Network unreachable.
	 */
	export const netunreach = 40;

	/**
	 * Too many files open in system.
	 */
	export const nfile = 41;

	/**
	 * No buffer space available.
	 */
	export const nobufs = 42;

	/**
	 * No such device.
	 */
	export const nodev = 43;

	/**
	 * No such file or directory.
	 */
	export const noent = 44;

	/**
	 * Executable file format error.
	 */
	export const noexec = 45;

	/**
	 * No locks available.
	 */
	export const nolck = 46;

	/**
	 * Reserved.
	 */
	export const nolink = 47;

	/**
	 * Not enough space.
	 */
	export const nomem = 48;

	/**
	 * No message of the desired type.
	 */
	export const nomsg = 49;

	/**
	 * Protocol not available.
	 */
	export const noprotoopt = 50;

	/**
	 * No space left on device.
	 */
	export const nospc = 51;

	/**
	 * Function not supported.
	 */
	export const nosys = 52;

	/**
	 * The socket is not connected.
	 */
	export const notconn = 53;

	/**
	 * Not a directory or a symbolic link to a directory.
	 */
	export const notdir = 54;

	/**
	 * Directory not empty.
	 */
	export const notempty = 55;

	/**
	 * State not recoverable.
	 */
	export const notrecoverable = 56;

	/**
	 * Not a socket.
	 */
	export const notsock = 57;

	/**
	 * Not supported, or operation not supported on socket.
	 */
	export const notsup = 58;

	/**
	 * Inappropriate I/O control operation.
	 */
	export const notty = 59;

	/**
	 * No such device or address.
	 */
	export const nxio = 60;

	/**
	 * Value too large to be stored in data type.
	 */
	export const overflow = 61;

	/**
	 * Previous owner died.
	 */
	export const ownerdead = 62;

	/**
	 * Operation not permitted.
	 */
	export const perm = 63;

	/**
	 * Broken pipe.
	 */
	export const pipe = 64;

	/**
	 * Protocol error.
	 */
	export const proto = 65;

	/**
	 * Protocol not supported.
	 */
	export const protonosupport = 66;

	/**
	 * Protocol wrong type for socket.
	 */
	export const prototype = 67;

	/**
	 * Result too large.
	 */
	export const range = 68;

	/**
	 * Read-only file system.
	 */
	export const rofs = 69;

	/**
	 * Invalid seek.
	 */
	export const spipe = 70;

	/**
	 * No such process.
	 */
	export const srch = 71;

	/**
	 * Reserved.
	 */
	export const stale = 72;

	/**
	 * Connection timed out.
	 */
	export const timedout = 73;

	/**
	 * Text file busy.
	 */
	export const txtbsy = 74;

	/**
	 * Cross-device link.
	 */
	export const xdev = 75;

	/**
	 * Extension: Capabilities insufficient.
	 */
	export const notcapable = 76;
}

export type rights = u64;
export namespace Rights {

	/**
	 * The right to invoke fd_datasync. If path_open is set, includes the right
	 * to invoke path_open with fdflags::dsync.
	 */
	export const fd_datasync = 1n << 0n; // 1

	/**
	 * The right to invoke fd_read and sock_recv. If rights::fd_seek is set,
	 * includes the right to invoke fd_pread.
	 */
	export const fd_read = 1n << 1n; // 2

	/**
	 * The right to invoke fd_seek. This flag implies rights::fd_tell.
	 */
	export const fd_seek = 1n << 2n; // 4

	/**
	 * The right to invoke fd_fdstat_set_flags.
	 */
	export const fd_fdstat_set_flags = 1n << 3n; // 8

	/**
	 * The right to invoke fd_sync. If path_open is set, includes the right to
	 * invoke path_open with fdflags::rsync and fdflags::dsync.
	 */
	export const fd_sync = 1n << 4n; // 16

	/**
	 * The right to invoke fd_seek in such a way that the file offset remains
	 * unaltered (i.e., whence::cur with offset zero), or to invoke fd_tell.
	 */
	export const fd_tell = 1n << 5n; // 32

	/**
	 * The right to invoke fd_write and sock_send. If rights::fd_seek is set,
	 * includes the right to invoke fd_pwrite.
	 */
	export const fd_write = 1n << 6n; // 64

	/**
	 * The right to invoke fd_advise.
	 */
	export const fd_advise = 1n << 7n; // 128

	/**
	 * The right to invoke fd_allocate.
	 */
	export const fd_allocate = 1n << 8n; // 256

	/**
	 * The right to invoke path_create_directory.
	 */
	export const path_create_directory = 1n << 9n; // 512

	/**
	 * If path_open is set, the right to invoke path_open with oflags::creat.
	 */
	export const path_create_file = 1n << 10n; // 1'024

	/**
	 * The right to invoke path_link with the file descriptor as the source
	 * directory.
	 */
	export const path_link_source = 1n << 11n; // 2'048

	/**
	 * The right to invoke path_link with the file descriptor as the target
	 * directory.
	 */
	export const path_link_target = 1n << 12n; // 4'096

	/**
	 * The right to invoke path_open.
	 */
	export const path_open = 1n << 13n; // 8'192

	/**
	 * The right to invoke fd_readdir.
	 */
	export const fd_readdir = 1n << 14n; // 16'384

	/**
	 * The right to invoke path_readlink.
	 */
	export const path_readlink = 1n << 15n; // 32'768

	/**
	 * The right to invoke path_rename with the file descriptor as the source
	 * directory.
	 */
	export const path_rename_source = 1n << 16n; // 65'536

	/**
	 * The right to invoke path_rename with the file descriptor as the target
	 * directory.
	 */
	export const path_rename_target = 1n << 17n; // 131'072

	/**
	 * The right to invoke path_filestat_get.
	 */
	export const path_filestat_get = 1n << 18n; // 262'144

	/**
	 * The right to change a file's size (there is no path_filestat_set_size).
	 * If path_open is set, includes the right to invoke path_open with
	 * oflags::trunc.
	 */
	export const path_filestat_set_size = 1n << 19n; // 524'288

	/**
	 * The right to invoke path_filestat_set_times.
	 */
	export const path_filestat_set_times = 1n << 20n; // 1'048'576

	/**
	 * The right to invoke fd_filestat_get.
	 */
	export const fd_filestat_get = 1n << 21n; // 2'097'152

	/**
	 * The right to invoke fd_filestat_set_size.
	 */
	export const fd_filestat_set_size = 1n << 22n; // 4'194'304

	/**
	 * The right to invoke fd_filestat_set_times.
	 */
	export const fd_filestat_set_times = 1n << 23n; // 8'388'608

	/**
	 * The right to invoke path_symlink.
	 */
	export const path_symlink = 1n << 24n; // 16'777'216

	/**
	 * The right to invoke path_remove_directory.
	 */
	export const path_remove_directory = 1n << 25n; // 33'554'432

	/**
	 * The right to invoke path_unlink_file.
	 */
	export const path_unlink_file = 1n << 26n; // 67'108'864

	/**
	 * If rights::fd_read is set, includes the right to invoke poll_oneoff to
	 * subscribe to eventtype::fd_read. If rights::fd_write is set, includes
	 * the right to invoke poll_oneoff to subscribe to eventtype::fd_write.
	 */
	export const poll_fd_readwrite = 1n << 27n; // 134'217'728

	/**
	 * The right to invoke sock_shutdown.
	 */
	export const sock_shutdown = 1n << 28n; // 268'435'456

	/**
	 * The right to invoke sock_accept.
	 */
	export const sock_accept = 1n << 29n; // 536'870'912

	/**
	 * All rights
	 */
	export const All = Rights.fd_advise | Rights.fd_allocate | Rights.fd_datasync | Rights.fd_fdstat_set_flags |
		Rights.fd_filestat_get | Rights.fd_filestat_set_size | Rights.fd_filestat_set_times | Rights.fd_read |
		Rights.fd_readdir | Rights.fd_seek | Rights.fd_sync | Rights.fd_tell | Rights.fd_write | Rights.path_create_directory |
		Rights.path_create_file | Rights.path_filestat_get | Rights.path_filestat_set_size | Rights.path_filestat_set_times |
		Rights.path_link_source | Rights.path_link_target | Rights.path_open | Rights.path_readlink | Rights.path_remove_directory |
		Rights.path_rename_source | Rights.path_rename_target | Rights.path_symlink | Rights.path_unlink_file | Rights.poll_fd_readwrite |
		Rights.sock_accept | Rights.sock_shutdown;

	/**
	 * Base rights for block devices.
	 *
	 * Note: we don't have block devices in VS Code.
	 */
	export const BlockDeviceBase = 0n;

	/**
	 * Inheriting rights for block devices.
	 *
	 * Note: we don't have block devices in VS Code.
	 */
	export const BlockDeviceInheriting = 0n;

	/**
	 * Base rights for directories managed in VS Code.
	 */
	export const DirectoryBase = path_create_directory | path_create_file |
		path_filestat_get | path_filestat_set_size | path_filestat_set_times |
		path_link_source | path_link_target | path_open | path_readlink |
		path_remove_directory | path_rename_source | path_rename_target |
		path_symlink | path_unlink_file | fd_readdir;

	/**
	 * Base rights for files managed in VS Code.
	 */
	export const FileBase = fd_read | fd_seek | fd_write | fd_filestat_get |
		fd_advise | fd_allocate | fd_datasync | fd_fdstat_set_flags |
		fd_filestat_set_size | fd_filestat_set_times | fd_sync | fd_tell;

	/**
	 * Inheriting rights for directories
	 */
	export const DirectoryInheriting = DirectoryBase | FileBase;

	/**
	 * Inheriting rights for files
	 */
	export const FileInheriting = 0n;

	/**
	 * Base rights for character devices
	 */
	export const CharacterDeviceBase = fd_read | fd_fdstat_set_flags | fd_write |
		fd_filestat_get | poll_fd_readwrite;

	/**
	 * Inheriting rights for character devices
	 */
	export const CharacterDeviceInheriting = 0n;

	/**
	 * Base rights for stdin
	 */
	export const StdinBase = fd_read | fd_filestat_get | poll_fd_readwrite;

	/**
	 * Inheriting rights for stdout / stderr
	 */
	export const StdinInheriting = 0n;

	/**
	 * Base rights for stdout / stderr
	 */
	export const StdoutBase = fd_fdstat_set_flags | fd_write |
		fd_filestat_get | poll_fd_readwrite;

	/**
	 * Inheriting rights for stdout / stderr
	 */
	export const StdoutInheriting = 0n;
}

export type dircookie = u64;

export type fdflags = u16;
export namespace Fdflags {

	/**
	 * Append mode: Data written to the file is always appended to the file's
	 * end.
	 */
	export const append = 1 << 0;

	/**
	 * Write according to synchronized I/O data integrity completion. Only the
	 * data stored in the file is synchronized.
	 */
	export const dsync = 1 << 1;

	/**
	 * Non-blocking mode.
	 */
	export const nonblock = 1 << 2;

	/**
	 * Synchronized read I/O operations.
	 */
	export const rsync = 1 << 3;

	/**
	 * Write according to synchronized I/O file integrity completion. In
	 * addition to synchronizing the data stored in the file, the
	 * implementation may also synchronously update the file's metadata.
	 */
	export const sync = 1 << 4;
}

export type lookupflags = u32;
export namespace Lookupflags {
	/**
	 * As long as the resolved path corresponds to a symbolic link, it is
	 * expanded.
	 */
	export const symlink_follow = 1 << 0;
}

export type oflags = u16;
export namespace Oflags {

	/**
	 * Create file if it does not exist.
	 */
	export const creat = 1 << 0;

	/**
	 * Fail if not a directory.
	 */
	export const directory = 1 << 1;

	/**
	 * Fail if file already exists.
	 */
	export const excl = 1 << 2;

	/**
	 * Truncate file to size 0.
	 */
	export const trunc = 1 << 3;

	export function creatOn(value: oflags): boolean {
		return (value & creat) !== 0;
	}

	export function creatOff(value: oflags): boolean {
		return (value & creat) === 0;
	}

	export function directoryOn(value: oflags): boolean {
		return (value & directory) !== 0;
	}

	export function exclOn(value: oflags): boolean {
		return (value & excl) !== 0;
	}

	export function truncOn(value: oflags): boolean {
		return (value & trunc) !== 0;
	}
}

export type clockid = u32;
export namespace Clockid {
	/**
	 * The clock measuring real time. Time value zero corresponds with
	 * 1970-01-01T00:00:00Z.
	 */
	export const realtime = 0;

	/**
	 * The store-wide monotonic clock, which is defined as a clock measuring
	 * real time, whose value cannot be adjusted and which cannot have negative
	 * clock jumps. The epoch of this clock is undefined. The absolute time
	 * value of this clock therefore has no meaning.
	 */
	export const monotonic = 1;

	/**
	 * The CPU-time clock associated with the current process.
	 */
	export const process_cputime_id = 2;

	/**
	 * The CPU-time clock associated with the current thread.
	 */
	export const thread_cputime_id = 3;
}

export type preopentype = u8;
export namespace Preopentype {

	/**
	 * A pre-opened directory.
	 */
	export const dir = 0;
}

export type filetype = u8;
export namespace Filetype {

	/**
	 * The type of the file descriptor or file is unknown or is different from
	 * any of the other types specified.
	 */
	export const unknown = 0;

	/**
	 * The file descriptor or file refers to a block device inode.
	 */
	export const block_device = 1;

	/**
	 * The file descriptor or file refers to a character device inode.
	 */
	export const character_device = 2;

	/**
	 * The file descriptor or file refers to a directory inode.
	 */
	export const directory = 3;

	/**
	 * The file descriptor or file refers to a regular file inode.
	 */
	export const regular_file = 4;

	/**
	 * The file descriptor or file refers to a datagram socket.
	 */
	export const socket_dgram = 5;

	/**
	 * The file descriptor or file refers to a byte-stream socket.
	 */
	export const socket_stream = 6;

	/**
	 * The file refers to a symbolic link inode.
	 */
	export const symbolic_link = 7;
}

export type advise = u8;
/**
 * File or memory access pattern advisory information.
 */
export namespace Advice {
	/**
	 * The application has no advice to give on its behavior with respect to
	 * the specified data.
	 */
	export const normal = 0;

	/**
	 * The application expects to access the specified data sequentially from
	 * lower offsets to higher offsets.
	 */
	export const sequential = 1;

	/**
	 * The application expects to access the specified data in a random order.
	 */
	export const random = 2;

	/**
	 * The application expects to access the specified data in the near future.
	 */
	export const willneed = 3;

	/**
	 * The application expects that it will not access the specified data in
	 * the near future.
	 */
	export const dontneed = 4;

	/**
	 *  The application expects to access the specified data once and then not
	 * reuse it thereafter.
	 */
	export const noreuse = 5;
}

export type filesize = u64;
export type device = u64;
export type inode = u64;
export type linkcount = u64;
export type timestamp = u64;

export type filestat = {

	/**
	 * Device ID of device containing the file.
	 */
	set dev(value: device);

	/**
	 * File serial number.
	 */
	set ino(value: inode);

	/**
	 * File type.
	 */
	set filetype(value: filetype);

	/**
	 * Number of hard links to the file.
	 */
	set nlink(value: linkcount);

	/**
	 * For regular files, the file size in bytes. For symbolic links, the
	 * length in bytes of the pathname contained in the symbolic link.
	 */
	set size(value: filesize);

	/**
	 * Last data access timestamp.
	 */
	set atim(value: timestamp);

	/**
	 * Last data modification timestamp.
	 */
	set mtim(value: timestamp);

	/**
	 * Last file status change timestamp.
	 */
	set ctim(value: timestamp);
};

export namespace Filestat {
	/**
	 * The size in bytes.
	 */
	export const size = 64;

	const offsets = {
		dev: 0,
		ino: 8,
		filetype: 16,
		nlink: 24,
		size: 32,
		atim: 40,
		mtim: 48,
		ctim: 56
	};

	export function create(ptr: ptr, memory: DataView): filestat {
		return {
			set dev(value: device) { memory.setBigUint64(ptr + offsets.dev, value, true); },
			set ino(value: inode) { memory.setBigUint64(ptr + offsets.ino, value, true); },
			set filetype(value: filetype) { memory.setUint8(ptr + offsets.filetype, value); },
			set nlink(value: linkcount) { memory.setBigUint64(ptr + offsets.nlink, value, true); },
			set size(value: filesize) { memory.setBigUint64(ptr + offsets.size, value, true); },
			set atim(value: timestamp) { memory.setBigUint64(ptr + offsets.atim, value, true); },
			set mtim(value: timestamp) { memory.setBigUint64(ptr + offsets.mtim, value, true); },
			set ctim(value: timestamp) { memory.setBigUint64(ptr + offsets.ctim, value, true); }
		};
	}
}

/**
 * Relative offset within a file.
 */
export type filedelta = s64;

/**
 * The position relative to which to set the offset of the file descriptor.
 */
export type whence = u8;
export namespace Whence {
	/**
	 * Seek relative to start-of-file.
	 */
	export const set = 0;

	/**
	 * Seek relative to current position.
	 */
	export const cur = 1;

	/**
	 * Seek relative to end-of-file.
	 */
	export const end = 2;
}

export type fdstat = {

	/**
	 *  File type.
	 */
	set fs_filetype(value: filetype);

	/**
	 * File descriptor flags.
	 */
	set fs_flags(value: fdflags);

	/**
	 * Rights that apply to this file descriptor.
	 */
	set fs_rights_base(value: rights);

	/**
	 * Maximum set of rights that may be installed on new file descriptors
	 * that are created through this file descriptor, e.g., through path_open.
	 */
	set fs_rights_inheriting(value: rights);
};

export namespace Fdstat {
	/**
	 * The size in bytes.
	 */
	export const size = 24;

	export const alignment = 8;

	const offsets = {
		fs_filetype: 0,
		fs_flags: 2,
		fs_rights_base: 8,
		fs_rights_inheriting: 16
	};

	export function create(ptr: ptr, memory: DataView): fdstat {
		return {
			set fs_filetype(value: filetype) { memory.setUint8(ptr + offsets.fs_filetype, value); },
			set fs_flags(value: fdflags) { memory.setUint16(ptr + offsets.fs_flags, value, true); },
			set fs_rights_base(value: rights) { memory.setBigUint64(ptr + offsets.fs_rights_base, value, true); },
			set fs_rights_inheriting(value: rights) { memory.setBigUint64(ptr + offsets.fs_rights_inheriting, value, true); }
		};
	}
}

export type fstflags = u16;
export namespace Fstflags {

	/**
	 * Adjust the last data access timestamp to the value stored in
	 * filestat::atim.
	 */
	export const atim = 1 << 0;

	/**
	 * Adjust the last data access timestamp to the time of clock
	 * clockid::realtime.
	 */
	export const atim_now =  1 << 1;

	/**
	 * Adjust the last data modification timestamp to the value stored in
	 * filestat::mtim.
	 */
	export const mtim = 1 << 2;

	/**
	 * Adjust the last data modification timestamp to the time of clock
	 * clockid::realtime.
	 */
	export const mtim_now = 1 << 3;
}

/**
 * The contents of a $prestat when type is `PreOpenType.dir`
 */
export type prestat = {

	/**
	 * Sets the length of the pre opened directory name.
	 */
	set len(value: size);
};

export namespace Prestat {
	export function create(ptr: ptr, memory: DataView): prestat {
		memory.setUint8(ptr, Preopentype.dir);
		return {
			set len(value: size) {
				memory.setUint32(ptr + 4, value, true);
			}
		};
	}
}

/**
 * A region of memory for scatter/gather reads.
 */
export type iovec = {
	/**
	 * The address of the buffer to be filled.
	 */
	get buf(): ptr;

	/**
	 * The length of the buffer to be filled.
	 */
	get buf_len(): u32;
};

export namespace Iovec {

	/**
	 * The size in bytes.
	 */
	export const size = 8 as const;

	const offsets = {
		buf: 0,
		buf_len: 4,
	};

	export function create(ptr: ptr, memory: DataView): ciovec {
		return {
			get buf(): ptr {
				return memory.getUint32(ptr + offsets.buf, true);
			},
			get buf_len(): u32 {
				return memory.getUint32(ptr + offsets.buf_len, true);
			}
		};
	}
}

export type iovec_array = iovec[];

/**
 * A region of memory for scatter/gather writes.
 */
export type ciovec = {
	/**
	 * The address of the buffer to be written.
	 */
	get buf(): ptr;

	/**
	 * The length of the buffer to be written.
	 */
	get buf_len(): u32;
};

export namespace Ciovec {

	/**
	 * The size in bytes.
	 */
	export const size = 8 as const;

	const offsets = {
		buf: 0,
		buf_len: 4,
	};

	export function create(ptr: ptr, memory: DataView): ciovec {
		return {
			get buf(): ptr {
				return memory.getUint32(ptr + offsets.buf, true);
			},
			get buf_len(): u32 {
				return memory.getUint32(ptr + offsets.buf_len, true);
			}
		};
	}
}

export type ciovec_array = iovec[];

export type dirnamlen = u32;
export type dirent = {
	/**
	 * The offset of the next directory entry stored in this directory.
	 */
	set d_next(value: dircookie);

	/**
	 * The serial number of the file referred to by this directory entry.
	 */
	set d_ino(value: inode);

	/**
	 * The length of the name of the directory entry.
	 */
	set d_namlen(value: dirnamlen);

	/**
	 * The type of the file referred to by this directory entry.
	 */
	set d_type(value: filetype);
};

export namespace Dirent {
	export const size = 24 as const;

	const offsets = {
		d_next: 0,
		d_ino: 8,
		d_namlen: 16,
		d_type: 20
	};

	export function create(ptr: ptr, memory: DataView): dirent {
		return {
			set d_next(value: dircookie) { memory.setBigUint64(ptr + offsets.d_next, value, true); },
			set d_ino(value: inode) { memory.setBigUint64(ptr + offsets.d_ino, value, true); },
			set d_namlen(value: dirnamlen) { memory.setUint32(ptr + offsets.d_namlen, value, true); },
			set d_type(value: filetype) { memory.setUint8(ptr + offsets.d_type, value); }
		};
	}
}

/**
 * Type of a subscription to an event or its occurrence.
 */
export type eventtype = u8;
export namespace Eventtype {
	/**
	 * The time value of clock subscription_clock::id has reached timestamp
	 * subscription_clock::timeout.
	 */
	export const clock = 0;

	/**
	 * File descriptor subscription_fd_readwrite::file_descriptor has data
	 * available for reading. This event always triggers for regular files.
	 */
	export const fd_read = 1;

	/**
	 * File descriptor subscription_fd_readwrite::file_descriptor has capacity
	 * available for writing. This event always triggers for regular files.
	 */
	export const fd_write = 2;
}

/**
 * The state of the file descriptor subscribed to with eventtype::fd_read or
 * eventtype::fd_write.
 */
export type eventrwflags = u16;
export namespace Eventrwflags {
	/**
	 * The peer of this socket has closed or disconnected.
	 */
	export const fd_readwrite_hangup = 1 << 0;
}

/**
 * The contents of an event when type is eventtype::fd_read or
 * eventtype::fd_write.
 */
export type event_fd_readwrite = {
	/**
	 * The number of bytes available for reading or writing.
	 */
	set nbytes(value: filesize);

	/**
	 * The state of the file descriptor.
	 */
	set flags(value: eventrwflags);
};

export namespace Event_fd_readwrite {
	export const size = 16;

	export const alignment = 8;

	const offsets = {
		nbytes: 0,
		flags: 8
	};

	export function create(ptr: ptr, memory: DataView): event_fd_readwrite {
		return {
			set nbytes(value: filesize) { memory.setBigUint64(ptr + offsets.nbytes, value, true); },
			set flags(value: eventrwflags) { memory.setUint16(ptr + offsets.flags, value, true); }
		};
	}
}

/**
 * User-provided value that may be attached to objects that is retained when
 * extracted from the implementation.
 */
export type userdata = u64;

/**
 * An event that occurred.
 */
export type event = {
	/**
	 * User-provided value that got attached to subscription::userdata.
	 */
	set userdata(value: userdata);

	/**
	 *  If non-zero, an error that occurred while processing the subscription
	 * request.
	 */
	set error(value: errno);

	/**
	 * The type of event that occurred.
	 */
	set type(value: eventtype);

	/**
	 * The contents of the event, if it is an eventtype::fd_read or
	 * eventtype::fd_write. eventtype::clock events ignore this field.
	 */
	set fd_readwrite(value: event_fd_readwrite);
};
export namespace Event {

	export const size = 32;

	export const alignment = 8;

	const offsets = {
		userdata: 0,
		error: 8,
		type: 10,
		fd_readwrite: 16
	};

	export function create(ptr: ptr, memory: DataView): event {
		return {
			set userdata(value: userdata) { memory.setBigUint64(ptr + offsets.userdata, value, true); },
			set error(value: errno) { memory.setUint16(ptr + offsets.error, value, true); },
			set type(value: eventtype) { memory.setUint8(ptr + offsets.type, value); },
			set fd_readwrite(value: event_fd_readwrite) {
				const store = Event_fd_readwrite.create(ptr + offsets.fd_readwrite, memory);
				store.nbytes = value.nbytes;
				store.flags = value.flags;
			}
		};
	}
}

export type subclockflags = u16;
export namespace Subclockflags {
	/**
	 * If set, treat the timestamp provided in subscription_clock::timeout as an
	 * absolute timestamp of clock subscription_clock::id. If clear, treat the
	 * timestamp provided in subscription_clock::timeout relative to the current
	 * time value of clock subscription_clock::id.
	 */
	export const subscription_clock_abstime = 1 << 0;
}

/**
 * The contents of a subscription when type is eventtype::clock.
 */
export type subscription_clock = {
	/**
	 * The clock against which to compare the timestamp.
	 */
	get id(): clockid;

	/**
	 * The absolute or relative timestamp.
	 */
	get timeout(): timestamp;

	/**
	 * The amount of time that the implementation may wait additionally to
	 * coalesce with other events.
	 */
	get precision(): timestamp;

	/**
	 * Flags specifying whether the timeout is absolute or relative.
	 */
	get flags(): subclockflags;
};
export namespace Subscription_clock {
	export const size = 32;
	export const alignment = 8;
	const offsets = {
		id: 0,
		timeout: 8,
		precision: 16,
		flags: 24
	};
	export function create(ptr: ptr, memory: DataView): subscription_clock {
		return {
			get id(): clockid { return memory.getUint32(ptr + offsets.id, true); },
			get timeout(): timestamp { return memory.getBigUint64(ptr + offsets.timeout, true); },
			get precision(): timestamp { return memory.getBigUint64(ptr + offsets.precision, true); },
			get flags(): subclockflags { return memory.getUint16(ptr + offsets.flags, true); }
		};
	}
}

/**
 * The contents of a subscription when type is type is eventtype::fd_read
 * or eventtype::fd_write.
 */
export type subscription_fd_readwrite = {
	/**
	 * The file descriptor on which to wait for it to become ready for
	 * reading or writing.
	 */
	get file_descriptor(): fd;
};

export namespace Subscription_fd_readwrite {
	export const size = 4;
	export const alignment = 4;
	const offsets = {
		file_descriptor: 0
	};
	export function create(ptr: ptr, memory: DataView): subscription_fd_readwrite {
		return {
			get file_descriptor(): fd { return memory.getUint32(ptr + offsets.file_descriptor, true); }
		};
	}
}

export type subscription_u = {
	get clock(): subscription_clock;
	get fd_read(): subscription_fd_readwrite;
	get fd_write(): subscription_fd_readwrite;
};

export namespace Subscription_u {
	export const size = 40;
	export const alignment = 8;
	const offsets = {
		clock: 0,
		fd_read: 0,
		fd_write: 0
	};
	export function create(ptr: ptr, memory: DataView): subscription_u {
		return {
			get clock(): subscription_clock { return Subscription_clock.create(ptr + offsets.clock, memory); },
			get fd_read(): subscription_fd_readwrite { return Subscription_fd_readwrite.create(ptr + offsets.fd_read, memory); },
			get fd_write(): subscription_fd_readwrite { return Subscription_fd_readwrite.create(ptr + offsets.fd_write, memory); }
		};
	}
}

/**
 * Subscription to an event.
 */
export type subscription = {
	/**
	 * User-provided value that is attached to the subscription in the
	 * implementation and returned through event::userdata.
	 */
	get userdata(): userdata;

	/**
	 * The type of the event to which to subscribe, and its contents
	 */
	get u(): subscription_u;
};
export namespace Subscription {
	export const size = 48;
	export const alignment = 8;
	const offsets = {
		userdata: 0,
		u: 8,
	};
	export function create(ptr: ptr, memory: DataView): subscription {
		return {
			get userdata(): userdata { return memory.getBigUint64(ptr + offsets.userdata, true); },
			get u(): subscription_u { return Subscription_u.create(ptr + offsets.u, memory); }
		};
	}
}
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *
 * The TypeScript interfaces and type definitions together with their corresponding namespaces
 * are derived from the WASI specification hosted here:
 *
 * https://github.com/WebAssembly/WASI/blob/main/phases/snapshot/docs.md
 *--------------------------------------------------------------------------------------------*/

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

export class WasiError extends Error {
	public readonly errno: errno;
	constructor(errno: errno) {
		super();
		this.errno = errno;
	}
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
	get dev(): device;
	set dev(value: device);

	/**
	 * File serial number.
	 */
	get ino(): inode;
	set ino(value: inode);

	/**
	 * File type.
	 */
	get filetype(): filetype;
	set filetype(value: filetype);

	/**
	 * Number of hard links to the file.
	 */
	get nlink(): linkcount;
	set nlink(value: linkcount);

	/**
	 * For regular files, the file size in bytes. For symbolic links, the
	 * length in bytes of the pathname contained in the symbolic link.
	 */
	get size(): filesize;
	set size(value: filesize);

	/**
	 * Last data access timestamp.
	 */
	get atim(): timestamp;
	set atim(value: timestamp);

	/**
	 * Last data modification timestamp.
	 */
	get mtim(): timestamp;
	set mtim(value: timestamp);

	/**
	 * Last file status change timestamp.
	 */
	get ctim(): timestamp;
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
			get dev(): device { return memory.getBigUint64(ptr + offsets.dev, true); },
			set dev(value: device) { memory.setBigUint64(ptr + offsets.dev, value, true); },
			get ino(): inode { return memory.getBigUint64(ptr + offsets.ino, true); },
			set ino(value: inode) { memory.setBigUint64(ptr + offsets.ino, value, true); },
			get filetype(): filetype { return memory.getUint8(ptr + offsets.filetype); },
			set filetype(value: filetype) { memory.setUint8(ptr + offsets.filetype, value); },
			get nlink(): linkcount { return memory.getBigUint64(ptr + offsets.nlink, true); },
			set nlink(value: linkcount) { memory.setBigUint64(ptr + offsets.nlink, value, true); },
			get size(): filesize { return memory.getBigUint64(ptr + offsets.size, true); },
			set size(value: filesize) { memory.setBigUint64(ptr + offsets.size, value, true); },
			get atim(): timestamp { return memory.getBigUint64(ptr + offsets.atim, true); },
			set atim(value: timestamp) { memory.setBigUint64(ptr + offsets.atim, value, true); },
			get mtim(): timestamp { return memory.getBigUint64(ptr + offsets.mtim, true); },
			set mtim(value: timestamp) { memory.setBigUint64(ptr + offsets.mtim, value, true); },
			get ctim(): timestamp { return memory.getBigUint64(ptr + offsets.ctim, true); },
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
	get fs_filetype(): filetype;
	set fs_filetype(value: filetype);

	/**
	 * File descriptor flags.
	 */
	get fs_flags(): fdflags;
	set fs_flags(value: fdflags);

	/**
	 * Rights that apply to this file descriptor.
	 */
	get fs_rights_base(): rights;
	set fs_rights_base(value: rights);

	/**
	 * Maximum set of rights that may be installed on new file descriptors
	 * that are created through this file descriptor, e.g., through path_open.
	 */
	get fs_rights_inheriting(): rights;
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
			get fs_filetype(): filetype { return memory.getUint8(ptr + offsets.fs_filetype); },
			set fs_filetype(value: filetype) { memory.setUint8(ptr + offsets.fs_filetype, value); },
			get fs_flags(): fdflags { return memory.getUint16(ptr + offsets.fs_flags, true); },
			set fs_flags(value: fdflags) { memory.setUint16(ptr + offsets.fs_flags, value, true); },
			get fs_rights_base(): rights { return memory.getBigUint64(ptr + offsets.fs_rights_base, true); },
			set fs_rights_base(value: rights) { memory.setBigUint64(ptr + offsets.fs_rights_base, value, true); },
			get fs_rights_inheriting(): rights { return memory.getBigUint64(ptr + offsets.fs_rights_inheriting, true); },
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
	 * Gets the pre-open type.
	 */
	get preopentype(): preopentype;

	/**
	 * Gets the length of the pre opened directory name.
	 */
	get len(): size;

	/**
	 * Sets the length of the pre opened directory name.
	 */
	set len(value: size);
};

export namespace Prestat {
	/**
	 * The size in bytes.
	 */
	export const size = 8 as const;

	export const alignment = 4 as const;

	const offsets = {
		tag: 0,
		len: 4
	};
	export function create(ptr: ptr, memory: DataView): prestat {
		memory.setUint8(ptr, Preopentype.dir);
		return {
			get preopentype(): preopentype {
				return memory.getUint8(ptr + offsets.tag);
			},
			get len(): size {
				return memory.getUint32(ptr + offsets.len, true);
			},
			set len(value: size) {
				memory.setUint32(ptr + offsets.len, value, true);
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
	get fd_readwrite(): event_fd_readwrite;
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
			get fd_readwrite(): event_fd_readwrite {
				return Event_fd_readwrite.create(ptr + offsets.fd_readwrite, memory);
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
	 * The absolute or relative timestamp in ns.
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
	get type(): eventtype;
	get clock(): subscription_clock;
	get fd_read(): subscription_fd_readwrite;
	get fd_write(): subscription_fd_readwrite;
};

export namespace Subscription_u {
	export const size = 40;
	export const alignment = 8;
	export const tag_size = 1;

	// The first byte is the tag to decide whether we have a clock, read or
	// write poll. So the actual offset of the data struct starts at 8 since
	// we have an alignment of 8.
	const offsets = {
		type: 0,
		clock: 8,
		fd_read: 8,
		fd_write: 8
	};
	export function create(ptr: ptr, memory: DataView): subscription_u {
		return {
			get type(): eventtype { return memory.getUint8(ptr + offsets.type); },
			get clock(): subscription_clock {
				if (memory.getUint8(ptr + offsets.type) !== Eventtype.clock) {
					throw new WasiError(Errno.inval);
				}
				return Subscription_clock.create(ptr + offsets.clock, memory);
			},
			get fd_read(): subscription_fd_readwrite {
				if (memory.getUint8(ptr + offsets.type) !== Eventtype.fd_read) {
					throw new WasiError(Errno.inval);
				}
				return Subscription_fd_readwrite.create(ptr + offsets.fd_read, memory);
			},
			get fd_write(): subscription_fd_readwrite {
				if (memory.getUint8(ptr + offsets.type) !== Eventtype.fd_write) {
					throw new WasiError(Errno.inval);
				}
				return Subscription_fd_readwrite.create(ptr + offsets.fd_write, memory);
			}
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

export type Literal<T> = {
	[P in keyof T]: T[P];
};

/**
 * Flags provided to sock_recv.
 */
export type riflags = u16;

/**
 * Flags provided to sock_recv.
 */
export namespace Riflags {

	/**
	 * Returns the message without removing it from the socket's receive queue.
	 */
	export const recv_peek = 1 << 0;

	/**
	 * On byte-stream sockets, block until the full amount of data can be returned.
	 */
	export const recv_waitall = 1 << 1;
}

/**
 * Flags returned by sock_recv.
 */
export type roflags = u16;

export namespace Roflags {
	/**
	 * Returned by sock_recv: Message data has been truncated.
	 */
	export const recv_data_truncated = 1 << 0;
}

/**
 * Flags provided to sock_send. As there are currently no flags defined, it
 * must be set to zero.
 */
export type siflags = u16;

export namespace Siflags {
}

/**
 * Which channels on a socket to shut down.
 */
export type sdflags = u8;

export namespace Sdflags {
	/**
	 * Disables further receive operations.
	 */
	export const rd = 1 << 0;

	/**
	 * Disables further send operations.
	 */
	export const wr = 1 << 1;
}

/**
 * Return command-line argument data sizes.
 *
 * @param argvCount_ptr A memory location to store the number of args.
 * @param argvBufSize_ptr A memory location to store the needed buffer size.
 */
export type args_sizes_get = (argvCount_ptr: ptr, argvBufSize_ptr: ptr) => errno;

/**
 * Read command-line argument data. The size of the array should match that
 * returned by args_sizes_get. Each argument is expected to be \0 terminated.
 *
 * @params argv_ptr A memory location to store the argv value offsets
 * @params argvBuf_ptr A memory location to store the actual argv value.
 */
export type args_get = (argv_ptr: ptr, argvBuf_ptr: ptr) => errno;

/**
 * Return environment variable data sizes.
 *
 * @param environCount_ptr A memory location to store the number of vars.
 * @param environBufSize_ptr  A memory location to store the needed buffer size.
 */
export type environ_sizes_get = (environCount_ptr: ptr, environBufSize_ptr: ptr) => errno;

/**
 * Read environment variable data. The sizes of the buffers should match
 * that returned by environ_sizes_get. Key/value pairs are expected to
 * be joined with =s, and terminated with \0s.
 *
 * @params environ_ptr A memory location to store the env value offsets
 * @params environBuf_ptr A memory location to store the actual env value.
 */
export type environ_get = (environ_ptr: ptr, environBuf_ptr: ptr) => errno;

/**
 * Return the resolution of a clock. Implementations are required to provide
 * a non-zero value for supported clocks. For unsupported clocks, return
 * errno::inval. Note: This is similar to clock_getres in POSIX.
 *
 * @param id The clock for which to return the resolution.
 * @param timestamp_ptr A memory location to store the actual result.
 */
export type clock_res_get = (id: clockid, timestamp_ptr: ptr) => errno;

/**
 * Return the time value of a clock. Note: This is similar to clock_gettime
 * in POSIX.
 *
 * @param id The clock for which to return the time.
 * @param precision The maximum lag (exclusive) that the returned time
 * value may have, compared to its actual value.
 * @param timestamp_ptr: The time value of the clock.
 */
export type clock_time_get = (id: clockid, precision: timestamp, timestamp_ptr: ptr) => errno;

/**
 * Provide file advisory information on a file descriptor. Note: This is
 * similar to posix_fadvise in POSIX.
 *
 * @param fd The file descriptor.
 * @param offset The offset within the file to which the advisory applies.
 * @param length The length of the region to which the advisory applies.
 * @param advise The advice.
 */
export type fd_advise = (fd: fd, offset: filesize, length: filesize, advise: advise) => errno;

/**
 * Force the allocation of space in a file. Note: This is similar to
 * posix_fallocate in POSIX.
 *
 * @param fd The file descriptor.
 * @param offset The offset at which to start the allocation.
 * @param len The length of the area that is allocated.
 */
export type fd_allocate = (fd: fd, offset: filesize, len: filesize) => errno;

/**
 * Close a file descriptor. Note: This is similar to close in POSIX.
 *
 * @param fd The file descriptor.
 */
export type fd_close = (fd: fd) => errno;

/**
 * Synchronize the data of a file to disk. Note: This is similar to
 * fdatasync in POSIX.
 *
 * @param fd The file descriptor.
 */
export type fd_datasync = (fd: fd) => errno;

/**
 * Get the attributes of a file descriptor. Note: This returns similar
 * flags to fsync(fd, F_GETFL) in POSIX, as well as additional fields.
 *
 * @param fd The file descriptor.
 * @param fdstat_ptr A pointer to store the result.
 */
export type fd_fdstat_get = (fd: fd, fdstat_ptr: ptr) => errno;

/**
 * Adjust the flags associated with a file descriptor. Note: This is similar
 * to fcntl(fd, F_SETFL, flags) in POSIX.
 *
 * @param fd The file descriptor.
 * @param fdflags The desired values of the file descriptor flags.
 */
export type fd_fdstat_set_flags = (fd: fd, fdflags: fdflags) => errno;

/**
 * Return the attributes of an open file.
 *
 * @param fd The file descriptor.
 * @param filestat_ptr The buffer where the file's attributes are stored.
 */
export type fd_filestat_get = (fd: fd, filestat_ptr: ptr) => errno;

/**
 * Adjust the size of an open file. If this increases the file's size, the
 * extra bytes are filled with zeros. Note: This is similar to ftruncate in
 * POSIX.
 *
 * @param fd The file descriptor.
 * @param size: The desired file size.
 */
export type fd_filestat_set_size = (fd: fd, size: filesize) => errno;

/**
 * Adjust the timestamps of an open file or directory. Note: This is similar
 * to futimens in POSIX.
 *
 * @param fd The file descriptor.
 * @param atim The desired values of the data access timestamp.
 * @param mtim The desired values of the data modification timestamp.
 * @param fst_flags A bitmask indicating which timestamps to adjust.
 */
export type fd_filestat_set_times = (fd: fd, atim: timestamp, mtim: timestamp, fst_flags: fstflags) => errno;

/**
 * Read from a file descriptor, without using and updating the file
 * descriptor's offset. Note: This is similar to preadv in POSIX.
 *
 * @param fd The file descriptor.
 * @param iovs_ptr List of scatter/gather vectors in which to store data.
 * @param iovs_len The length of the iovs.
 * @param offset The offset within the file at which to read.
 * @param bytesRead_ptr A memory location to store the bytes read.
 */
export type fd_pread = (fd: fd, iovs_ptr: ptr, iovs_len: u32, offset: filesize, bytesRead_ptr: ptr) => errno;

/**
 * Return a description of the given preopened file descriptor.
 *
 * @param fd The file descriptor.
 * @param bufPtr A pointer to store the pre stat information.
 */
export type fd_prestat_get = (fd: fd, bufPtr: ptr) => errno;

/**
 * Return a description of the given preopened file descriptor.
 *
 * @param fd The file descriptor.
 * @param pathPtr A memory location to store the path name.
 * @param pathLen The length of the path.
 */
export type fd_prestat_dir_name = (fd: fd, pathPtr: ptr, pathLen: size) => errno;

/**
 * Write to a file descriptor, without using and updating the file
 * descriptor's offset. Note: This is similar to pwritev in POSIX.
 *
 * @param fd
 * @param ciovs_ptr List of scatter/gather vectors from which to retrieve data.
 * @param ciovs_len The length of the iovs.
 * @param offset The offset within the file at which to write.
 * @param bytesWritten_ptr A memory location to store the bytes written.
 */
export type fd_pwrite = (fd: fd, ciovs_ptr: ptr, ciovs_len: u32, offset: filesize, bytesWritten_ptr: ptr) => errno;

/**
 * Read from a file descriptor. Note: This is similar to readv in POSIX.
 *
 * @param fd The file descriptor.
 * @param iovs_ptr List of scatter/gather vectors in which to store data.
 * @param iovs_len The length of the iovs.
 * @param bytesRead_ptr A memory location to store the bytes read.
 */
export type fd_read = (fd: fd, iovs_ptr: ptr, iovs_len: u32, bytesRead_ptr: ptr) => errno;

/**
 * Read directory entries from a directory. When successful, the contents of
 * the output buffer consist of a sequence of directory entries. Each
 * directory entry consists of a dirent object, followed by dirent::d_namlen
 * bytes holding the name of the directory entry. This function fills the
 * output buffer as much as possible, potentially truncating the last
 * directory entry. This allows the caller to grow its read buffer size in
 * case it's too small to fit a single large directory entry, or skip the
 * oversized directory entry.
 *
 * @param fd The file descriptor.
 * @param buf_ptr The buffer where directory entries are stored.
 * @param buf_len The length of the buffer.
 * @param cookie The location within the directory to start reading.
 * @param buf_used_ptr The number of bytes stored in the read buffer.
 * If less than the size of the read buffer, the end of the directory has
 * been reached.
 */
export type fd_readdir = (fd: fd, buf_ptr: ptr, buf_len: size, cookie: dircookie, buf_used_ptr: ptr) => errno;

/**
 * Move the offset of a file descriptor. Note: This is similar to lseek in
 * POSIX.
 *
 * @param fd The file descriptor.
 * @param offset The number of bytes to move.
 * @param whence The base from which the offset is relative.
 * @param new_offset_ptr A memory location to store the new offset.
 */
export type fd_seek = (fd: fd, offset: filedelta, whence: whence, new_offset_ptr: ptr) => errno;

/**
 * Synchronize the data and metadata of a file to disk. Note: This is
 * similar to fsync in POSIX.
 *
 * @param fd The file descriptor.
 */
export type fd_sync = (fd: fd) => errno;

/**
 * Return the current offset of a file descriptor. Note: This is similar
 * to lseek(fd, 0, SEEK_CUR) in POSIX.
 *
 * @param fd The file descriptor.
 * @param offset_ptr A memory location to store the current offset of the
 * file descriptor, relative to the start of the file.
 */
export type fd_tell = (fd: fd, offset_ptr: ptr) => errno;

/**
 * Write to a file descriptor. Note: This is similar to writev in POSIX.
 *
 * @param fd The file descriptor.
 * @param ciovs_ptr List of scatter/gather vectors from which to retrieve data.
 * @param ciovs_len The length of the iovs.
 * @param bytesWritten_ptr A memory location to store the bytes written.
 */
export type fd_write = (fd: fd, ciovs_ptr: ptr, ciovs_len: u32, bytesWritten_ptr: ptr) => errno;

/**
 * Create a directory. Note: This is similar to mkdirat in POSIX.
 *
 * @param fd The file descriptor.
 * @param path_ptr A memory location that holds the path name.
 * @param path_len The length of the path
 */
export type path_create_directory = (fd: fd, path_ptr: ptr, path_len: size) => errno;

/**
 * Return the attributes of a file or directory. Note: This is similar to
 * stat in POSIX.
 *
 * @param fd The file descriptor.
 * @param flags Flags determining the method of how the path is resolved.
 * @param path_ptr A memory location that holds the path name.
 * @param path_len The length of the path
 * @param filestat_ptr A memory location to store the file stat.
 */
export type path_filestat_get = (fd: fd, flags: lookupflags, path_ptr: ptr, path_len: size, filestat_ptr: ptr) => errno;

/**
 * Adjust the timestamps of a file or directory. Note: This is similar to
 * utimensat in POSIX.
 *
 * @param fd The file descriptor.
 * @param flags Flags determining the method of how the path is resolved.
 * @param path_ptr A memory location that holds the path name.
 * @param path_len The length of the path.
 * @param atim The desired values of the data access timestamp.
 * @param mtim The desired values of the data modification timestamp.
 * @param fst_flags A bitmask indicating which timestamps to adjust.
 */
export type path_filestat_set_times = (fd: fd, flags: lookupflags, path_ptr: ptr, path_len: size, atim: timestamp, mtim: timestamp, fst_flags: fstflags) => errno;

/**
 * Create a hard link. Note: This is similar to linkat in POSIX.
 *
 * @param old_fd The file descriptor.
 * @param old_flags Flags determining the method of how the path is resolved.
 * @param old_path_ptr: A memory location that holds the source path from
 * which to link.
 * @param old_path_len: The length of the old path.
 * @param new_fd The working directory at which the resolution of the new
 * path starts.
 * @param new_path_ptr: A memory location that holds the destination path
 * at which to create the hard link.
 * @param new_path_len: The length of the new path.
 */
export type path_link = (old_fd: fd, old_flags: lookupflags, old_path_ptr: ptr, old_path_len: size, new_fd: fd, new_path_ptr: ptr, new_path_len: size) => errno;

/**
 * Open a file or directory. The returned file descriptor is not guaranteed
 * to be the lowest-numbered file descriptor not currently open; it is
 * randomized to prevent applications from depending on making assumptions
 * about indexes, since this is error-prone in multi-threaded contexts.
 * The returned file descriptor is guaranteed to be less than 2**31.
 * Note: This is similar to openat in POSIX.
 *
 * @param fd The file descriptor.
 * @param dirflags Flags determining the method of how the path is resolved.
 * @param path A memory location holding the relative path of the file or
 * directory to open, relative to the path_open::fd directory.
 * @param pathLen The path length.
 * @param oflags The method by which to open the file.
 * @param fs_rights_base The initial rights of the newly created file
 * descriptor. The implementation is allowed to return a file descriptor
 * with fewer rights than specified, if and only if those rights do not
 * apply to the type of file being opened. The base rights are rights that
 * will apply to operations using the file descriptor itself, while the
 * inheriting rights are rights that apply to file descriptors derived from
 * it.
 * @param fs_rights_inheriting Inheriting rights.
 * @param fdflags The fd flags.
 * @param fd_ptr A memory location to store the opened file descriptor.
 */
export type path_open = (fd: fd, dirflags: lookupflags, path: ptr, pathLen: size, oflags: oflags, fs_rights_base: rights, fs_rights_inheriting: rights, fdflags: fdflags, fd_ptr: ptr) => errno;

/**
 * Read the contents of a symbolic link. Note: This is similar to readlinkat
 * in POSIX.
 *
 * @param fd The file descriptor.
 * @param path_ptr A memory location that holds the path name.
 * @param path_len The length of the path.
 * @param buf The buffer to which to write the contents of the symbolic link.
 * @param buf_len The size of the buffer
 * @param result_size_ptr A memory location to store the number of bytes
 * placed in the buffer.
 */
export type path_readlink = (fd: fd, path_ptr: ptr, path_len: size, buf: ptr, buf_len: size, result_size_ptr: ptr) => errno;

/**
 * Remove a directory. Return errno::notempty if the directory is not empty.
 * Note: This is similar to unlinkat(fd, path, AT_REMOVEDIR) in POSIX.
 *
 * @param fd The file descriptor.
 * @param path_ptr  A memory location that holds the path name.
 * @param path_len The length of the path.
 */
export type path_remove_directory = (fd: fd, path_ptr: ptr, path_len: size) => errno;

/**
 * Rename a file or directory. Note: This is similar to renameat in POSIX.
 *
 * @param fd The file descriptor.
 * @param old_path_ptr: A memory location that holds the source path of the
 * file or directory to rename.
 * @param old_path_len: The length of the old path.
 * @param new_fd The working directory at which the resolution of the new
 * path starts.
 * @param new_path_ptr: A memory location that holds The destination path to
 * which to rename the file or directory.
 * @param new_path_len: The length of the new path.
 */
export type path_rename = (fd: fd, old_path_ptr: ptr, old_path_len: size, new_fd: fd, new_path_ptr: ptr, new_path_len: size) => errno;

/**
 * Create a symbolic link. Note: This is similar to symlinkat in POSIX.
 *
 * @param old_path_ptr: A memory location that holds the contents of the
 * symbolic link.
 * @param old_path_len: The length of the old path.
 * @param fd The file descriptor.
 * @param new_path_ptr A memory location that holds the destination path
 * at which to create the symbolic link.
 * @param new_path_len The length of the new path.
 */
export type path_symlink = (old_path_ptr: ptr, old_path_len: size, fd: fd, new_path_ptr: ptr, new_path_len: size) => errno;

/**
 * Unlink a file. Return errno::isdir if the path refers to a directory.
 * Note: This is similar to unlinkat(fd, path, 0) in POSIX.
 *
 * @param fd The file descriptor.
 * @param path_ptr  A memory location that holds the path name.
 * @param path_len The length of the path.
 */
export type path_unlink_file = (fd: fd, path_ptr: ptr, path_len: size) => errno;

/**
 * Concurrently poll for the occurrence of a set of events.
 *
 * @param input A memory location pointing to the events to which to subscribe.
 * @param output A memory location to store the events that have occurred.
 * @param subscriptions Both the number of subscriptions and events.
 * @param result_size_ptr The number of events stored.
 */
export type poll_oneoff = (input: ptr, output: ptr, subscriptions: size, result_size_ptr: ptr) => errno;

/**
 * Terminate the process normally. An exit code of 0 indicates successful
 * termination of the program. The meanings of other values is dependent on
 * the environment.
 *
 * @param rval The exit code returned by the process.
 */
export type proc_exit = (rval: exitcode) => void;

/**
 * Temporarily yield execution of the calling thread. Note: This is similar
 * to sched_yield in POSIX.
 */
export type sched_yield = () => errno;

/**
 * Write high-quality random data into a buffer. This function blocks when
 * the implementation is unable to immediately provide sufficient high-quality
 * random data. This function may execute slowly, so when large mounts of
 * random data are required, it's advisable to use this function to seed
 * a pseudo-random number generator, rather than to provide the random data
 * directly.
 *
 * @param buf The buffer to fill with random data.
 * @param buf_len The size of the buffer.
 */
export type random_get = (buf: ptr, buf_len: size) => errno;

/**
 * Accept a new incoming connection. Note: This is similar to accept in
 * POSIX.
 *
 * @param fd The listening socket.
 * @param flags The desired values of the file descriptor flags.
 * @param result_fd_ptr A memory location to store the new socket connection.
 */
export type sock_accept = (fd: fd, flags: fdflags, result_fd_ptr: ptr) => errno;

/**
 * Receive a message from a socket. Note: This is similar to recv in POSIX,
 * though it also supports reading the data into multiple buffers in the
 * manner of readv.
 *
 * @param fd The listening socket.
 * @param ri_data_ptr List of scatter/gather vectors in which to store data.
 * @param ri_data_len The length of the iovs.
 * @param ri_flags Message flags.
 * @param ro_datalen_ptr: A memory location to store the size of the returned
 * data
 * @param roflags_ptr: A memory location to store the return flags.
 */
export type sock_recv = (fd: fd, ri_data_ptr: ptr, ri_data_len: u32, ri_flags: riflags, ro_datalen_ptr: ptr, roflags_ptr: ptr) => errno;

/**
 * Send a message on a socket. Note: This is similar to send in POSIX,
 * though it also supports writing the data from multiple buffers in the
 * manner of writev.
 *
 * @param fd The socket to write to.
 * @param si_data_ptr List of scatter/gather vectors to which to retrieve
 * data.
 * @param si_data_len: The length of the ciovs.
 * @param si_flags Message flags.
 * @param si_datalen_ptr
 */
export type sock_send = (fd: fd, si_data_ptr: ptr, si_data_len: u32, si_flags: siflags, si_datalen_ptr: ptr) => errno;

/**
 * Shut down socket send and receive channels. Note: This is similar to shutdown
 * in POSIX.
 *
 * @param fd The socket to shut down.
 * @param sdflags Which channels on the socket to shut down.
 */
export type sock_shutdown = (fd: fd, sdflags: sdflags) => errno;
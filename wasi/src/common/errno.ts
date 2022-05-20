/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// @todo dirkb
// The constants come from https://github.com/WebAssembly/WASI/blob/main/phases/snapshot/docs.md
// We need to clarify how to license them. I was not able to find a license file
// in the https://github.com/WebAssembly/WASI repository
enum Errno {
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

export default Errno;
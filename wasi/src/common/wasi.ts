/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// @todo dirkb
// The constants come from https://github.com/WebAssembly/WASI/blob/main/phases/snapshot/docs.md
// We need to clarify how to license them. I was not able to find a license file
// in the https://github.com/WebAssembly/WASI repository

import RAL from './ral';

import { URI } from 'vscode-uri';
import { ApiClient, FileSystemError, FileType, RPCError, DTOs } from '@vscode/sync-api-client';

import { ptr, size, u32 } from './baseTypes';
import {
	fd, errno, Errno, lookupflags, oflags, rights, fdflags, dircookie, filetype, Rights,
	filesize, advise, filedelta, whence, Filestat, Whence, Ciovec, Iovec, Filetype, clockid, timestamp, Clockid,
	Fdstat, fstflags, Prestat, Dirent, dirent, exitcode, Oflags, Subscription, WasiError, Eventtype, Event, event,
	Subclockflags, Literal, subscription
} from './wasiTypes';
import { code2Wasi } from './converter';

// Same as Unix file descriptors
export const WASI_STDIN_FD = 0 as const;
export const WASI_STDOUT_FD = 1 as const;
export const WASI_STDERR_FD = 2 as const;

export interface Environment {
	[key: string]: string;
}

namespace WebAssembly {

	interface Global {
		value: any;
		valueOf(): any;
	}
	interface Table {
		readonly length: number;
		get(index: number): any;
		grow(delta: number, value?: any): number;
		set(index: number, value?: any): void;
	}
	interface Memory {
		readonly buffer: ArrayBuffer;
		grow(delta: number): number;
	}
	type ExportValue = Function | Global | Memory | Table;

	export interface Instance {
		readonly exports: Record<string, ExportValue>;
	}

	export interface $Instance {
		readonly exports: {
			memory: Memory;
		} & Record<string, ExportValue>;
	}
}
export interface WASI {

	initialize(instance: WebAssembly.Instance): void;

	/**
	 * Return command-line argument data sizes.
	 * @param argvCount_ptr A memory location to store the number of args.
	 * @param argvBufSize_ptr A memory location to store the needed buffer size.
	 */
	args_sizes_get(argvCount_ptr: ptr, argvBufSize_ptr: ptr): errno;

	/**
	 * Read command-line argument data. The size of the array should match that
	 * returned by args_sizes_get. Each argument is expected to be \0 terminated.
	 */
	args_get(argv_ptr: ptr, argvBuf_ptr: ptr): errno;

	/**
	 * Return environment variable data sizes.

	 * @param environCount_ptr A memory location to store the number of vars.
	 * @param environBufSize_ptr  A memory location to store the needed buffer size.
	 */
	environ_sizes_get(environCount_ptr: ptr, environBufSize_ptr: ptr): errno;

	/**
	 * Read environment variable data. The sizes of the buffers should match
	 * that returned by environ_sizes_get. Key/value pairs are expected to
	 * be joined with =s, and terminated with \0s.
	 */
	environ_get(environ_ptr: ptr, environBuf_ptr: ptr): errno;

	/**
	 * Return the resolution of a clock. Implementations are required to provide
	 * a non-zero value for supported clocks. For unsupported clocks, return
	 * errno::inval. Note: This is similar to clock_getres in POSIX.
	 */
	clock_res_get(id: clockid, timestamp_ptr: ptr): errno;

	/**
	 * Return the time value of a clock. Note: This is similar to clock_gettime
	 * in POSIX.
	 *
	 * @param id The clock for which to return the time.
	 * @param precision The maximum lag (exclusive) that the returned time
	 * value may have, compared to its actual value.
	 * @param timestamp_ptr: The time value of the clock.
	 */
	clock_time_get(id: clockid, precision: timestamp, timestamp_ptr: ptr): errno;

	/**
	 * Provide file advisory information on a file descriptor. Note: This is
	 * similar to posix_fadvise in POSIX.
	 *
	 * @param fd The file descriptor.
	 * @param offset The offset within the file to which the advisory applies.
	 * @param length The length of the region to which the advisory applies.
	 * @param advise The advice.
	 */
	fd_advise(fd: fd, offset: filesize, length: filesize, advise: advise): errno;

	/**
	 * Force the allocation of space in a file. Note: This is similar to
	 * posix_fallocate in POSIX.
	 *
	 * @param fd The file descriptor.
	 * @param offset The offset at which to start the allocation.
	 * @param len The length of the area that is allocated.
	 */
	fd_allocate(fd: fd, offset: filesize, len: filesize): errno;

	/**
	 * Close a file descriptor. Note: This is similar to close in POSIX.
	 * @param fd The file descriptor.
	 */
	fd_close(fd: fd): errno;

	/**
	 * Synchronize the data of a file to disk. Note: This is similar to
	 * fdatasync in POSIX.
	 *
	 * @param fd The file descriptor.
	 */
	fd_datasync(fd: fd): errno;

	/**
	 * Get the attributes of a file descriptor. Note: This returns similar
	 * flags to fsync(fd, F_GETFL) in POSIX, as well as additional fields.
	 *
	 * @param fd The file descriptor.
	 * @param fdstat_ptr A pointer to store the result.
	 */
	fd_fdstat_get(fd: fd, fdstat_ptr: ptr): errno;

	/**
	 * Adjust the flags associated with a file descriptor. Note: This is similar
	 * to fcntl(fd, F_SETFL, flags) in POSIX.
	 *
	 * @param fd The file descriptor.
	 * @param fdflags The desired values of the file descriptor flags.
	 */
	fd_fdstat_set_flags(fd: fd, fdflags: fdflags): errno;

	/**
	 * Return the attributes of an open file.
	 * @param fd The file descriptor.
	 * @param filestat_ptr The buffer where the file's attributes are stored.
	 */
	fd_filestat_get(fd: fd, filestat_ptr: ptr): errno;

	/**
	 * Adjust the size of an open file. If this increases the file's size, the
	 * extra bytes are filled with zeros. Note: This is similar to ftruncate in
	 * POSIX.
	 *
	 * @param fd The file descriptor.
	 * @param size: The desired file size.
	 */
	fd_filestat_set_size(fd: fd, size: filesize): errno;

	/**
	 * Adjust the timestamps of an open file or directory. Note: This is similar
	 * to futimens in POSIX.
	 *
	 * @param fd The file descriptor.
	 * @param atim The desired values of the data access timestamp.
	 * @param mtim The desired values of the data modification timestamp.
	 * @param fst_flags A bitmask indicating which timestamps to adjust.
	 */
	fd_filestat_set_times(fd: fd, atim: timestamp, mtim: timestamp, fst_flags: fstflags): errno;

	/**
	 * Read from a file descriptor, without using and updating the file
	 * descriptor's offset. Note: This is similar to preadv in POSIX.
	 * @param fd The file descriptor.
	 * @param iovs_ptr List of scatter/gather vectors in which to store data.
	 * @param iovs_len The length of the iovs.
	 * @param offset The offset within the file at which to read.
	 * @param bytesRead_ptr A memory location to store the bytes read.
	 */
	fd_pread(fd: fd, iovs_ptr: ptr, iovs_len: u32, offset: filesize, bytesRead_ptr: ptr): errno;

	/**
	 * Return a description of the given preopened file descriptor.
	 *
	 * @param fd The file descriptor.
	 * @param bufPtr A pointer to store the pre stat information.
	 */
	fd_prestat_get(fd: fd, bufPtr: ptr): errno;

	/**
	 * Return a description of the given preopened file descriptor.
	 *
	 * @param fd The file descriptor.
	 * @param pathPtr A memory location to store the path name.
	 * @param pathLen The length of the path.
	 */
	fd_prestat_dir_name(fd: fd, pathPtr: ptr, pathLen: size): errno;

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
	fd_pwrite(fd: fd, ciovs_ptr: ptr, ciovs_len: u32, offset: filesize, bytesWritten_ptr: ptr): errno;

	/**
	 * Read from a file descriptor. Note: This is similar to readv in POSIX.
	 *
	 * @param fd The file descriptor.
	 * @param iovs_ptr List of scatter/gather vectors in which to store data.
	 * @param iovs_len The length of the iovs.
	 * @param bytesRead_ptr A memory location to store the bytes read.
	 */
	fd_read(fd: fd, iovs_ptr: ptr, iovs_len: u32, bytesRead_ptr: ptr): errno;

	/**
	 * Read directory entries from a directory. When successful, the contents of
	 * the output buffer consist of a sequence of directory entries. Each
	 * directory entry consists of a dirent object, followed by dirent::d_namlen
	 * bytes holding the name of the directory entry. This function fills the
	 * output buffer as much as possible, potentially truncating the last
	 * directory entry. This allows the caller to grow its read buffer size in
	 * case it's too small to fit a single large directory entry, or skip the
	 * oversized directory entry.

	 * @param fd The file descriptor.
	 * @param buf_ptr The buffer where directory entries are stored.
	 * @param buf_len The length of the buffer.
	 * @param cookie The location within the directory to start reading.
	 * @param buf_used_ptr The number of bytes stored in the read buffer.
	 * If less than the size of the read buffer, the end of the directory has
	 * been reached.
	 */
	fd_readdir(fd: fd, buf_ptr: ptr, buf_len: size, cookie: dircookie, buf_used_ptr: ptr): errno;

	/**
	 * Move the offset of a file descriptor. Note: This is similar to lseek in
	 * POSIX.
	 * @param fd The file descriptor.
	 * @param offset The number of bytes to move.
	 * @param whence The base from which the offset is relative.
	 * @param new_offset_ptr A memory location to store the new offset.
	 */
	fd_seek(fd: fd, offset: filedelta, whence: whence, new_offset_ptr: ptr): errno;

	/**
	 * Synchronize the data and metadata of a file to disk. Note: This is
	 * similar to fsync in POSIX.
	 *
	 * @param fd The file descriptor.
	 */
	fd_sync(fd: fd): errno;

	/**
	 * Return the current offset of a file descriptor. Note: This is similar
	 * to lseek(fd, 0, SEEK_CUR) in POSIX.
	 *
	 * @param fd The file descriptor.
	 * @param offset_ptr A memory location to store the current offset of the
	 * file descriptor, relative to the start of the file.
	 */
	fd_tell(fd: fd, offset_ptr: ptr): errno;

	/**
	 * Write to a file descriptor. Note: This is similar to writev in POSIX.
	 *
	 * @param fd The file descriptor.
	 * @param ciovs_ptr List of scatter/gather vectors from which to retrieve data.
	 * @param ciovs_len The length of the iovs.
	 * @param bytesWritten_ptr A memory location to store the bytes written.
	 */
	fd_write(fd: fd, ciovs_ptr: ptr, ciovs_len: u32, bytesWritten_ptr: ptr): errno;

	/**
	 * Create a directory. Note: This is similar to mkdirat in POSIX.
	 * @param fd The file descriptor.
	 * @param path_ptr A memory location that holds the path name.
	 * @param path_len The length of the path
	 */
	path_create_directory(fd: fd, path_ptr: ptr, path_len: size): errno;

	/**
	 * Return the attributes of a file or directory. Note: This is similar to
	 * stat in POSIX.
	 * @param fd The file descriptor.
	 * @param flags Flags determining the method of how the path is resolved.
	 * @param path_ptr A memory location that holds the path name.
	 * @param path_len The length of the path
	 * @param filestat_ptr A memory location to store the file stat.
	 */
	path_filestat_get(fd: fd, flags: lookupflags, path_ptr: ptr, path_len: size, filestat_ptr: ptr): errno;

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
	path_filestat_set_times(fd: fd, flags: lookupflags, path_ptr: ptr, path_len: size, atim: timestamp, mtim: timestamp, fst_flags: fstflags): errno;

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
	path_link(old_fd: fd, old_flags: lookupflags, old_path_ptr: ptr, old_path_len: size, new_fd: fd, new_path_ptr: ptr, new_path_len: size): errno;

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
	path_open(fd: fd, dirflags: lookupflags, path: ptr, pathLen: size, oflags: oflags, fs_rights_base: rights, fs_rights_inheriting: rights, fdflags: fdflags, fd_ptr: ptr): errno;

	/**
	 * Read the contents of a symbolic link. Note: This is similar to readlinkat
	 * in POSIX.
	 * @param fd The file descriptor.
	 * @param path_ptr A memory location that holds the path name.
	 * @param path_len The length of the path.
	 * @param buf The buffer to which to write the contents of the symbolic link.
	 * @param buf_len The size of the buffer
	 * @param result_size_ptr A memory location to store the number of bytes
	 * placed in the buffer.
	 */
	path_readlink(fd: fd, path_ptr: ptr, path_len: size, buf: ptr, buf_len: size, result_size_ptr: ptr): errno;

	/**
	 * Remove a directory. Return errno::notempty if the directory is not empty.
	 * Note: This is similar to unlinkat(fd, path, AT_REMOVEDIR) in POSIX.
	 *
	 * @param fd The file descriptor.
	 * @param path_ptr  A memory location that holds the path name.
	 * @param path_len The length of the path.
	 */
	path_remove_directory(fd: fd, path_ptr: ptr, path_len: size): errno;

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
	path_rename(fd: fd, old_path_ptr: ptr, old_path_len: size, new_fd: fd, new_path_ptr: ptr, new_path_len: size): errno;

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
	path_symlink(old_path_ptr: ptr, old_path_len: size, fd: fd, new_path_ptr: ptr, new_path_len: size): errno;

	/**
	 * Unlink a file. Return errno::isdir if the path refers to a directory.
	 * Note: This is similar to unlinkat(fd, path, 0) in POSIX.
	 *
	 * @param fd The file descriptor.
	 * @param path_ptr  A memory location that holds the path name.
	 * @param path_len The length of the path.
	 */
	path_unlink_file(fd: fd, path_ptr: ptr, path_len: size): errno;

	/**
	 * Concurrently poll for the occurrence of a set of events.
	 *
	 * @param input A memory location pointing to the events to which to subscribe.
	 * @param output A memory location to store the events that have occurred.
	 * @param subscriptions Both the number of subscriptions and events.
	 * @param result_size_ptr The number of events stored.
	 */
	poll_oneoff(input: ptr, output: ptr, subscriptions: size, result_size_ptr: ptr): errno;

	/**
	 * Terminate the process normally. An exit code of 0 indicates successful
	 * termination of the program. The meanings of other values is dependent on
	 * the environment.
	 *
	 * @param rval The exit code returned by the process.
	 */
	proc_exit(rval: exitcode): void;

	/**
	 * Temporarily yield execution of the calling thread. Note: This is similar
	 * to sched_yield in POSIX.
	 */
	sched_yield(): errno;

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
	random_get(buf: ptr, buf_len: size): errno;

	/**
	 * Accept a new incoming connection. Note: This is similar to accept in
	 * POSIX.
	 * @param fd The listening socket.
	 * @param flags The desired values of the file descriptor flags.
	 * @param result_fd_ptr A memory location to store the new socket connection.
	 */
	sock_accept(fd: fd, flags: fdflags, result_fd_ptr: ptr): errno;
}

export type Options = {

	/**
	 * Directory mappings
	 */
	mapDir: {
		name: string;
		uri: URI;
	}[];

	/**
	 * The encoding to use.
	 */
	encoding?: string;

	/**
	 * Command line arguments accessible in the WASM.
	 */
	argv?: string [];

	/**
	 * The environment accessible in the WASM.
	 */
	env?: Environment;
};

namespace DeviceIds {
	let deviceIdCounter: bigint = 1n;

	export const system = deviceIdCounter++;
}

namespace FileHandles {
	let fileHandleCounter: number = 3;

	export function next(): number {
	// According to the spec these handles shouldn't monotonically increase.
	// But since these are not real file handles I keep it that way.
		return fileHandleCounter++;
	}
}

namespace BigInts {
	const MAX_VALUE_AS_BIGINT = BigInt(Number.MAX_VALUE);
	export function asNumber(value: bigint): number {
		if (value > MAX_VALUE_AS_BIGINT) {
			throw new WasiError(Errno.fbig);
		}
		return Number(value);
	}
}

class FileHandle {
	/**
	 * The WASI file handle
	 */
	public readonly fd: fd;

	/**
	 * The file type
	 */
	public readonly fileType: filetype;

	/**
	 * The path name.
	 */
	public readonly path: string;

	/**
	 * The rights associated with the file descriptor
	 */
	public readonly  rights: {
		/**
		 * The base rights.
		 */
		readonly base: rights;

		/**
		 * The inheriting rights
		 */
		readonly inheriting: rights;
	};

	/**
	 * The corresponding VS Code URI
	 */
	public readonly uri: URI;

	/**
	 * Whether this is a pre-opened directory.
	 */
	public readonly preOpened: boolean;

	constructor(fd: fd, fileType: filetype, path: string, rights: FileHandle['rights'], uri: URI, preOpened: boolean = false) {
		this.fd = fd;
		this.fileType = fileType;
		this.path = path;
		this.rights = rights;
		this.uri = uri;
		this.preOpened = preOpened;
	}

	public assertBaseRight(right: rights): void {
		if ((this.rights.base & right) === 0n) {
			throw new WasiError(Errno.perm);
		}
	}

	public assertIsDirectory(): void {
		if (this.fileType !== Filetype.directory) {
			throw new WasiError(Errno.notdir);
		}
	}
}


interface IOComponent {
}

class Stdin implements IOComponent {

	private readonly apiClient: ApiClient;
	private rest: Uint8Array | undefined;

	public constructor(apiClient: ApiClient) {
		this.apiClient = apiClient;
	}

	public get fd() {
		return WASI_STDIN_FD;
	}

	/**
	 * Reads from stdin. Depending on the mode the terminal is in this
	 * reads a line or a single character.
	 */
	public read(buffers: Uint8Array[]): size {
		let bytesRead: size = 0;
		if (this.rest !== undefined) {
			bytesRead += this.storeInBuffers(buffers, this.rest);
			return bytesRead;
		}
		const result = this.apiClient.terminal.read();
		bytesRead += this.storeInBuffers(buffers, result);
		return bytesRead;
	}

	private storeInBuffers(buffers: Uint8Array[], value: Uint8Array): size {
		let bytesRead: size = 0;
		let current: Uint8Array | undefined = value;
		for (let i = 0; i < buffers.length && current !== undefined; i++) {
			const buffer = buffers[i];
			if (current.byteLength <= buffer.byteLength) {
				buffer.set(current);
				bytesRead += value.byteLength;
				current = undefined;
			} else {
				buffer.set(current.subarray(0, buffer.byteLength));
				current = current.subarray(buffer.byteLength);
				bytesRead += buffer.byteLength;
			}
		}
		if (current !== undefined) {
			this.rest = new Uint8Array(current);
		}
		return bytesRead;
	}
}

class File implements IOComponent {

	/** VS Code state */
	private readonly apiClient: ApiClient;
	private readonly uri: URI;

	/** POSIX file system state */
	public readonly path: string;
	private _content: Uint8Array | undefined;
	private _cursor: number;
	private _fdFlags: fdflags;

	constructor(apiClient: ApiClient, uri: URI, path: string, content?: Uint8Array) {
		this.apiClient = apiClient;
		this.uri = uri;
		this.path = path;
		if (content instanceof Uint8Array) {
			this._content = content;
		}
		this._cursor = 0;
		this._fdFlags = 0;
	}

	private get content(): Uint8Array {
		if (this._content !== undefined) {
			return this._content;
		}
		this._content = this.apiClient.workspace.fileSystem.read(this.uri);
		return this._content;
	}

	public get cursor(): number {
		return this._cursor;
	}

	public bytesAvailable(): filesize {
		return BigInt(this.content.byteLength - this.cursor);
	}

	public alloc(_offset: filesize, _len: filesize): void {
		const offset = BigInts.asNumber(_offset);
		const len = BigInts.asNumber(_len);
		const content = this.content;

		if (offset > content.byteLength) {
			throw new WasiError(Errno.inval);
		}

		const newContent: Uint8Array = new Uint8Array(content.byteLength + len);
		newContent.set(content.subarray(0, offset), 0);
		newContent.set(content.subarray(offset), offset + len);
		this._content = newContent;

		return this.doWrite();
	}

	public pread(offset: number, bytesToRead: number): Uint8Array {
		const content = this.content;
		const realRead = Math.min(bytesToRead, content.byteLength - offset);
		return content.subarray(offset, offset + realRead);
	}

	public pwrite(offset: number, bytes: Uint8Array): size{
		let content = this.content;
		const total = offset + bytes.byteLength;
		// Make the file bigger
		if (total > content.byteLength) {
			const newContent = new Uint8Array(total);
			newContent.set(content);
			this._content = newContent;
			content = newContent;
		}
		content.set(bytes, offset);
		this.doWrite();
		return bytes.length;
	}

	public seek(offset: number, whence: whence): errno {
		switch(whence) {
			case Whence.set:
				this._cursor = offset;
				break;
			case Whence.cur:
				this._cursor = this._cursor + offset;
				break;
			case Whence.end:
				this._cursor = this.content.byteLength + offset;
				break;
		}
		return Errno.success;
	}

	public set fdflags(value: fdflags) {
		this._fdFlags = value;
	}

	public get fdflags(): fdflags {
		return this._fdFlags;
	}

	public setSize(_size: filesize): void {
		const size = BigInts.asNumber(_size);
		const content = this.content;
		if (content.byteLength === size) {
			return;
		} else if (content.byteLength < size) {
			const newContent = new Uint8Array(size);
			newContent.set(this.content);
			this._content = newContent;
		} else if (content.byteLength > size) {
			const newContent = new Uint8Array(size);
			newContent.set(this.content.subarray(0, size));
			this._content = newContent;
		}
		return this.doWrite();
	}

	public sync(): void {
		return this.doWrite();
	}

	public tell(): number {
		return this._cursor;
	}

	public read(bytesToRead: number): Uint8Array {
		const content = this.content;
		const realRead = Math.min(bytesToRead, content.byteLength - this._cursor);
		const result = content.subarray(this._cursor, this._cursor + realRead);
		this._cursor = this._cursor + realRead;
		return result;
	}

	public write(buffers: Uint8Array[]): size {
		let content = this.content;

		let bytesToWrite: size = 0;
		for (const bytes of buffers) {
			bytesToWrite += bytes.byteLength;
		}

		// Do we need to increase the buffer
		if (this._cursor + bytesToWrite > content.byteLength) {
			const newContent = new Uint8Array(this._cursor + bytesToWrite);
			newContent.set(content);
			this._content = newContent;
			content = newContent;
		}

		for (const bytes of buffers) {
			content.set(bytes, this._cursor);
			this._cursor += bytes.length;
		}

		return bytesToWrite;
	}

	private doWrite(): void {
		if (this._content === undefined) {
			return;
		}
		this.apiClient.workspace.fileSystem.write(this.uri, this._content);
	}
}

export namespace WASI {

	let $instance: WebAssembly.$Instance;

	let $encoder: RAL.TextEncoder;
	let $decoder: RAL.TextDecoder;

	let $apiClient: ApiClient;
	let $exitHandler: (rval: number) => void;
	let $options: Options;

	namespace Files {
		const $files: Map<string, FileInfo> = new Map();

		type FileInfo = {
			inode: bigint;
		} | {
			inode: bigint;
			file: File;
			refs: number;
		};

		namespace FileInfo {
			export function hasFile(fileInfo: FileInfo): fileInfo is { inode: bigint; file: File; refs: number } {
				const candidate = fileInfo as { inode: bigint; file?: File; refs?: number };
				return candidate.file !== undefined && candidate.refs !== undefined;
			}
		}

		let inodeCounter: bigint = 1n;

		export const stdinINode = inodeCounter++;
		export const stdoutINode = inodeCounter++;
		export const stderrINode = inodeCounter++;

		export function getINode(fileHandleOrPath: FileHandle | string): bigint {
			const filepath = typeof fileHandleOrPath === 'string' ? fileHandleOrPath : fileHandleOrPath.path;
			let fileInfo = $files.get(filepath);
			if (fileInfo !== undefined) {
				return fileInfo.inode;
			}
			fileInfo = { inode: inodeCounter++ };
			$files.set(filepath, fileInfo);
			return fileInfo.inode;
		}

		export function hasFile(fileHandle: FileHandle): boolean {
			const filepath = fileHandle.path;
			let fileInfo = $files.get(filepath);
			if (fileInfo === undefined) {
				return false;
			}
			return FileInfo.hasFile(fileInfo);
		}

		export function peekFile(fileHandle: FileHandle): File | undefined {
			const filepath = fileHandle.path;
			let fileInfo = $files.get(filepath);
			if (fileInfo === undefined) {
				return undefined;
			}
			return FileInfo.hasFile(fileInfo) ? fileInfo.file : undefined;
		}

		export function getOrCreateFile(fileHandle: FileHandle, content?: Uint8Array): File {
			const filepath = fileHandle.path;
			let fileInfo = $files.get(filepath);
			if (fileInfo === undefined) {
				fileInfo = { inode: inodeCounter++ };
				$files.set(filepath, fileInfo);
			}
			if (FileInfo.hasFile(fileInfo)) {
				fileInfo.refs++;
				return fileInfo.file;
			}
			const fullInfo: { inode: bigint; file?: File; refs?: number } = fileInfo;
			fullInfo.file = new File($apiClient, fileHandle.uri, filepath, content);
			fullInfo.refs = 1;
			return fullInfo.file;
		}

		export function releaseFile(fileHandle: FileHandle): void {
			const filepath = fileHandle.path;
			const fileInfo = $files.get(filepath);
			if (fileInfo === undefined) {
				throw new WasiError(Errno.badf);
			}
			if (!FileInfo.hasFile(fileInfo)) {
				return;
			}
			fileInfo.refs--;
			if (fileInfo.refs === 0) {
				// We can't delete the file info from the map since we need
				// to keep the inode stable.
				const fullInfo: { inode: bigint; file?: File; refs?: number } = fileInfo;
				fullInfo.file = undefined;
				fullInfo.refs = undefined;
			}
		}
	}


	let $stdin: Stdin;

	const $fileHandles: Map<fd, FileHandle> = new Map();
	const $directoryEntries: Map<fd, DTOs.DirectoryEntries> = new Map();

	export function create(_name: string, apiClient: ApiClient, exitHandler: (rval: number) => void, options: Options): WASI {
		$apiClient = apiClient;

		$encoder = RAL().TextEncoder.create(options?.encoding);
		$decoder = RAL().TextDecoder.create(options?.encoding);

		$exitHandler = exitHandler;
		$options = options;

		$stdin = new Stdin($apiClient);

		for (const entry of $options.mapDir) {
			const fileHandle = new FileHandle(
				FileHandles.next(),
				Filetype.directory, entry.name,
				{ base: Rights.All, inheriting: Rights.All },
				entry.uri,
				true
			);
			$fileHandles.set(fileHandle.fd, fileHandle);
		}

		return {
			initialize: initialize,
			args_sizes_get: args_sizes_get,
			args_get: args_get,
			environ_sizes_get: environ_sizes_get,
			environ_get: environ_get,
			clock_res_get: clock_res_get,
			clock_time_get: clock_time_get,
			fd_advise: fd_advise,
			fd_allocate: fd_allocate,
			fd_close: fd_close,
			fd_datasync: fd_datasync,
			fd_fdstat_get: fd_fdstat_get,
			fd_fdstat_set_flags: fd_fdstat_set_flags,
			fd_filestat_get: fd_filestat_get,
			fd_filestat_set_size: fd_filestat_set_size,
			fd_filestat_set_times: fd_filestat_set_times,
			fd_pread: fd_pread,
			fd_prestat_get: fd_prestat_get,
			fd_prestat_dir_name: fd_prestat_dir_name,
			fd_pwrite: fd_pwrite,
			fd_read: fd_read,
			fd_readdir: fd_readdir,
			fd_seek: fd_seek,
			fd_sync: fd_sync,
			fd_tell: fd_tell,
			fd_write: fd_write,
			path_create_directory: path_create_directory,
			path_filestat_get: path_filestat_get,
			path_filestat_set_times: path_filestat_set_times,
			path_link: path_link,
			path_open: path_open,
			path_readlink: path_readlink,
			path_remove_directory: path_remove_directory,
			path_rename: path_rename,
			path_symlink: path_symlink,
			path_unlink_file: path_unlink_file,
			poll_oneoff: poll_oneoff,
			proc_exit: proc_exit,
			sched_yield: sched_yield,
			random_get: random_get,
			sock_accept: sock_accept
		};
	}

	function initialize(instance: WebAssembly.Instance): void {
		$instance = instance as WebAssembly.$Instance;
	}

	function args_sizes_get(argvCount_ptr: ptr, argvBufSize_ptr: ptr): errno {
		const memory = memoryView();
		let count = 0;
		let size = 0;
		for (const arg of $options.argv ?? []) {
			const value = `${arg}\0`;
			size += $encoder.encode(value).byteLength;
			count++;
		}
		memory.setUint32(argvCount_ptr, count, true);
		memory.setUint32(argvBufSize_ptr, size, true);
		return Errno.success;
	}

	function args_get(argv_ptr: ptr, argvBuf_ptr: ptr): errno {
		const memory = memoryView();
		const memoryBytes = new Uint8Array(memoryRaw());
		let entryOffset = argv_ptr;
		let valueOffset = argvBuf_ptr;
		for (const arg of $options.argv ?? []) {
			const data = $encoder.encode(`${arg}\0`);
			memory.setUint32(entryOffset, valueOffset, true);
			entryOffset += 4;
			memoryBytes.set(data, valueOffset);
			valueOffset += data.byteLength;
		}
		return Errno.success;
	}

	function clock_res_get(id: clockid, timestamp_ptr: ptr): errno {
		const memory = memoryView();
		switch (id) {
			case Clockid.realtime:
				memory.setBigUint64(timestamp_ptr, 1n, true);
				return Errno.success;
			case Clockid.monotonic:
				memory.setBigUint64(timestamp_ptr, 1n, true);
				return Errno.success;
			default:
				memory.setBigUint64(timestamp_ptr, 0n, true);
				return Errno.inval;
		}
	}

	const $thread_start = RAL().clock.realtime();
	function clock_time_get(id: clockid, precision: timestamp, timestamp_ptr: ptr): errno {
		const time: bigint = now(id, precision);
		const memory = memoryView();
		memory.setBigUint64(timestamp_ptr, time, true);
		return Errno.success;
	}

	function now(id: clockid, _precision: timestamp): bigint {
		switch(id) {
			case Clockid.realtime:
				return RAL().clock.realtime();
			case Clockid.monotonic:
				return RAL().clock.monotonic();
			case Clockid.process_cputime_id:
			case Clockid.thread_cputime_id:
				return RAL().clock.monotonic() - $thread_start;
			default:
				throw new WasiError(Errno.inval);
		}
	}

	function environ_sizes_get(environCount_ptr: ptr, environBufSize_ptr: ptr): errno {
		const memory = memoryView();
		let count = 0;
		let size = 0;
		for (const entry of Object.entries($options.env ?? {})) {
			const value = `${entry[0]}=${entry[1]}\0`;
			size += $encoder.encode(value).byteLength;
			count++;
		}
		memory.setUint32(environCount_ptr, count, true);
		memory.setUint32(environBufSize_ptr, size, true);
		return Errno.success;
	}

	function environ_get(environ_ptr: ptr, environBuf_ptr: ptr): errno {
		const memory = memoryView();
		const memoryBytes = new Uint8Array(memoryRaw());
		let entryOffset = environ_ptr;
		let valueOffset = environBuf_ptr;
		for (const entry of Object.entries($options.env ?? {})) {
			const data = $encoder.encode(`${entry[0]}=${entry[1]}\0`);
			memory.setUint32(entryOffset, valueOffset, true);
			entryOffset += 4;
			memoryBytes.set(data, valueOffset);
			valueOffset += data.byteLength;
		}
		return Errno.success;
	}

	function fd_advise(fd: fd, _offset: filesize, _length: filesize, _advise: advise): errno {
		try {
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.fd_advise);

			// We don't have advisory in VS Code. So treat it as successful.
			return Errno.success;
		} catch (error) {
			return handleError(error);
		}
	}

	function fd_allocate(fd: fd, offset: filesize, len: filesize): errno {
		try {
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.fd_allocate);
			const file = Files.getOrCreateFile(fileHandle);
			file.alloc(offset, len);
			return Errno.success;
		} catch (error) {
			return handleError(error);
		}
	}

	function fd_close(fd: fd): errno {
		try {
			const fileHandle = getFileHandle(fd);
			// Release the file.
			Files.releaseFile(fileHandle);
			$fileHandles.delete(fileHandle.fd);
			return Errno.success;
		} catch (error) {
			return handleError(error);
		}
	}

	function fd_datasync(fd: fd): errno {
		try {
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.fd_datasync);

			const file = Files.peekFile(fileHandle);
			if (file === undefined) {
				return Errno.success;
			}
			file.sync();
			return Errno.success;
		} catch (error) {
			return handleError(error);
		}
	}

	function fd_fdstat_get(fd: fd, fdstat_ptr: ptr): errno {
		// This is not available under VS Code.
		try {
			if (fd === WASI_STDIN_FD || fd === WASI_STDOUT_FD || fd === WASI_STDERR_FD) {
				const memory = memoryView();
				const fdstat = Fdstat.create(fdstat_ptr, memory);
				fdstat.fs_filetype = Filetype.character_device;
				fdstat.fs_flags = 0;
				switch (fd) {
					case WASI_STDIN_FD:
						fdstat.fs_rights_base = Rights.StdinBase;
						fdstat.fs_rights_inheriting = Rights.StdinInheriting;
						break;
					case WASI_STDOUT_FD:
					case WASI_STDERR_FD:
						fdstat.fs_rights_base = Rights.StdoutBase;
						fdstat.fs_rights_inheriting = Rights.StdoutInheriting;
						break;
				}
				return Errno.success;
			}
			const fileHandle = getFileHandle(fd);
			const uri = fileHandle.uri;
			const vStat = $apiClient.workspace.fileSystem.stat(uri);
			if (typeof vStat === 'number') {
				return code2Wasi.asErrno(vStat);
			}
			const memory = memoryView();
			const fdstat = Fdstat.create(fdstat_ptr, memory);
			fdstat.fs_filetype = code2Wasi.asFileType(vStat.type);
			// No flags. We need to see if some of the tools we want to run
			// need some and we need to simulate them using local storage.
			fdstat.fs_flags = 0;
			if (vStat.type === FileType.File) {
				fdstat.fs_rights_base = Rights.FileBase;
				fdstat.fs_rights_inheriting = Rights.FileInheriting;
			} else if (vStat.type === FileType.Directory) {
				fdstat.fs_rights_base = Rights.DirectoryBase;
				fdstat.fs_rights_inheriting = Rights.DirectoryInheriting;
			} else {
				// Symbolic link and unknown
				fdstat.fs_rights_base = 0n;
				fdstat.fs_rights_inheriting = 0n;
			}
			return Errno.success;
		} catch (error) {
			return handleError(error);
		}
	}

	function fd_fdstat_set_flags(fd: fd, fdflags: fdflags): errno {
		try {
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.fd_fdstat_set_flags);
			const file = Files.getOrCreateFile(fileHandle);
			file.fdflags = fdflags;
			return Errno.success;
		} catch (error) {
			return handleError(error);
		}
	}

	function fd_filestat_get(fd: fd, filestat_ptr: ptr): errno {
		try {
			const memory = memoryView();
			if (fd === WASI_STDIN_FD || fd === WASI_STDOUT_FD || fd === WASI_STDERR_FD) {
				const fileStat = Filestat.create(filestat_ptr, memory);
				fileStat.dev = DeviceIds.system;
				switch(fd) {
					case WASI_STDIN_FD:
						fileStat.ino = Files.stdinINode;
						break;
					case WASI_STDOUT_FD:
						fileStat.ino = Files.stdoutINode;
						break;
					case WASI_STDERR_FD:
						fileStat.ino = Files.stderrINode;
						break;
				}
				fileStat.filetype = Filetype.character_device;
				fileStat.nlink = 0n;
				fileStat.size = 101n;
				const now = BigInt(Date.now());
				fileStat.atim = now;
				fileStat.ctim = now;
				fileStat.mtim = now;
				return Errno.success;
			}
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.fd_filestat_get);
			const vStat = $apiClient.workspace.fileSystem.stat(fileHandle.uri);
			if (typeof vStat === 'number') {
				return code2Wasi.asErrno(vStat);
			}
			const fileStat = Filestat.create(filestat_ptr, memory);
			fileStat.dev = DeviceIds.system;
			fileStat.ino = Files.getINode(fileHandle);
			fileStat.filetype = code2Wasi.asFileType(vStat.type);
			fileStat.nlink = 0n;
			fileStat.size = BigInt(vStat.size);
			fileStat.atim = BigInt(vStat.mtime);
			fileStat.ctim = BigInt(vStat.ctime);
			fileStat.mtim = BigInt(vStat.mtime);
			return Errno.success;
		} catch (error) {
			return handleError(error, Errno.perm);
		}
	}

	function fd_filestat_set_size(fd: fd, size: filesize): errno {
		try {
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.fd_filestat_set_size);
			const file = Files.getOrCreateFile(fileHandle);
			file.setSize(size);
			return Errno.success;
		} catch (error) {
			return handleError(error);
		}
	}

	function fd_filestat_set_times(fd: fd, _atim: timestamp, _mtim: timestamp, _fst_flags: fstflags): errno {
		try {
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.fd_filestat_set_times);
			// todo@dirkb
			// For new we do nothing. We could cache the timestamp in memory
			// But we would loose them during reload. We could also store them
			// in local storage
			return Errno.success;
		} catch (error) {
			return handleError(error);
		}
	}

	function fd_pread(fd: fd, iovs_ptr: ptr, iovs_len: u32, offset: filesize, bytesRead_ptr: ptr): errno {
		try {
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.fd_read);
			const file = Files.getOrCreateFile(fileHandle);
			const buffers = read_iovs(iovs_ptr, iovs_len);
			let bytesRead = 0;
			for (const buffer of buffers) {
				const result = file.pread(BigInts.asNumber(offset), buffer.byteLength);
				bytesRead = bytesRead + result.byteLength;
				buffer.set(result);
			}
			memoryView().setUint32(bytesRead_ptr, bytesRead, true);
			return Errno.success;
		} catch (error) {
			return handleError(error);
		}
	}

	function fd_prestat_get(fd: fd, bufPtr: ptr): errno {
		try {
			const fileHandleInfo = $fileHandles.get(fd);
			if (fileHandleInfo === undefined || !fileHandleInfo.preOpened) {
				return Errno.badf;
			}
			const memory = memoryView();
			const prestat = Prestat.create(bufPtr, memory);
			prestat.len = $encoder.encode(fileHandleInfo.path).byteLength;
			return Errno.success;
		} catch(error) {
			return handleError(error);
		}
	}

	function fd_prestat_dir_name(fd: fd, pathPtr: ptr, pathLen: size): errno {
		try {
			const fileHandle = getFileHandle(fd);
			const memory = new Uint8Array(memoryRaw(), pathPtr);
			const bytes = $encoder.encode(fileHandle.path);
			if (bytes.byteLength !== pathLen) {
				Errno.badmsg;
			}
			memory.set(bytes);
			return Errno.success;
		} catch (error) {
			return handleError(error);
		}
	}

	function fd_pwrite(fd: fd, ciovs_ptr: ptr, ciovs_len: u32, offset: filesize, bytesWritten_ptr: ptr): errno {
		try {
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.fd_write);
			const file = Files.getOrCreateFile(fileHandle);
			const buffers = read_ciovs(ciovs_ptr, ciovs_len);
			let bytesWritten = 0;
			for (const buffer of buffers) {
				bytesWritten += file.pwrite(BigInts.asNumber(offset), buffer);
			}
			memoryView().setUint32(bytesWritten_ptr, bytesWritten, true);
			return Errno.success;
		} catch (error) {
			return handleError(error);
		}
	}

	function fd_read(fd: fd, iovs_ptr: ptr, iovs_len: u32, bytesRead_ptr: ptr): errno {
		try {
			const memory = memoryView();
			if (fd === WASI_STDIN_FD) {
				let bytesRead = 0;
				const buffers = read_iovs(iovs_ptr, iovs_len);
				bytesRead += $stdin.read(buffers);
				memory.setUint32(bytesRead_ptr, bytesRead, true);
				return Errno.success;
			}
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.fd_read);
			let file = Files.peekFile(fileHandle);
			if (file === undefined) {
				const content = $apiClient.workspace.fileSystem.read(fileHandle.uri);
				if (typeof content === 'number') {
					return code2Wasi.asErrno(content);
				}
				file = Files.getOrCreateFile(fileHandle, content);
			}
			const buffers = read_iovs(iovs_ptr, iovs_len);
			let bytesRead = 0;
			for (const buffer of buffers) {
				const result = file.read(buffer.byteLength);
				bytesRead += result.byteLength;
				buffer.set(result);
			}
			memory.setUint32(bytesRead_ptr, bytesRead, true);
			return Errno.success;
		} catch (error) {
			return handleError(error);
		}
	}

	function fd_readdir(fd: fd, buf_ptr: ptr, buf_len: size, cookie: dircookie, buf_used_ptr: ptr): errno {
		try {
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.fd_readdir);
			if (fileHandle.fileType !== Filetype.directory) {
				return Errno.notdir;
			}
			const memory = memoryView();
			const raw = memoryRaw();
			// We have a cookie > 0 but no directory entries. So return end  of list
			// todo@dirkb this is actually specified different. According to the spec if
			// the used buffer size is less than the provided buffer size then no
			// additional readdir call should happen. However at least under Rust we
			// receive another call.
			//
			// Also unclear whether we have to include '.' and '..'
			//
			// See also https://github.com/WebAssembly/wasi-filesystem/issues/3
			if (cookie !== 0n && !$directoryEntries.has(fileHandle.fd)) {
				memory.setUint32(buf_used_ptr, 0, true);
				return Errno.success;
			}
			if (cookie === 0n) {
				const result = $apiClient.workspace.fileSystem.readDirectory(fileHandle.uri);
				if (typeof result === 'number') {
					return code2Wasi.asErrno(result);
				}
				$directoryEntries.set(fileHandle.fd, result);
			}
			const entries: DTOs.DirectoryEntries | undefined = $directoryEntries.get(fd);
			if (entries === undefined) {
				return Errno.badmsg;
			}
			let i = Number(cookie);
			let ptr: ptr = buf_ptr;
			let spaceLeft = buf_len;
			for (; i < entries.length && spaceLeft >= Dirent.size; i++) {
				const entry = entries[i];
				const filetype: filetype = code2Wasi.asFileType(entry[1]);
				const name = entry[0];
				const uri = getRealUri(fileHandle, name);
				const nameBytes = $encoder.encode(name);
				const dirent: dirent = Dirent.create(ptr, memory);
				dirent.d_next = BigInt(i + 1);
				dirent.d_ino = Files.getINode(RAL().path.join(fileHandle, name));
				dirent.d_type = filetype;
				dirent.d_namlen = nameBytes.byteLength;
				spaceLeft -= Dirent.size;
				const spaceForName = Math.min(spaceLeft, nameBytes.byteLength);
				(new Uint8Array(raw, ptr + Dirent.size, spaceForName)).set(nameBytes.subarray(0, spaceForName));
				ptr += Dirent.size + spaceForName;
				spaceLeft -= spaceForName;
			}
			if (i === entries.length) {
				memory.setUint32(buf_used_ptr, ptr - buf_ptr, true);
				$directoryEntries.delete(fileHandle.fd);
			} else {
				memory.setUint32(buf_used_ptr, buf_len, true);
			}
			return Errno.success;
		} catch (error) {
			return handleError(error);
		}
	}

	function fd_seek(fd: fd, _offset: filedelta, whence: whence, new_offset_ptr: ptr): errno {
		try {
			if (fd === WASI_STDIN_FD || fd === WASI_STDOUT_FD || fd === WASI_STDERR_FD) {
				return Errno.success;
			}
			const offset = Number(_offset);
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.fd_seek);
			const file = Files.getOrCreateFile(fileHandle);
			const result = file.seek(offset, whence);
			if (result !== Errno.success) {
				return result;
			}
			memoryView().setBigUint64(new_offset_ptr, BigInt(file.cursor), true);
			return Errno.success;
		} catch (error) {
			return handleError(error);
		}
	}

	function fd_sync(fd: fd): errno {
		try {
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.fd_sync);
			const file = Files.peekFile(fileHandle);
			if (file === undefined) {
				return Errno.success;
			}
			file.sync();
			return Errno.success;
		} catch (error) {
			return handleError(error);
		}
	}

	function fd_tell(fd: fd, offset_ptr: ptr): errno {
		try {
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.fd_tell);
			const file = Files.peekFile(fileHandle);
			const offset = file === undefined ? 0 : file.tell();
			const memory = memoryView();
			memory.setBigUint64(offset_ptr, BigInt(offset), true);
			return Errno.success;
		} catch (error) {
			return handleError(error);
		}
	}

	function fd_write(fd: fd, ciovs_ptr: ptr, ciovs_len: u32, bytesWritten_ptr: ptr): errno {
		try {
			if (fd === WASI_STDOUT_FD || fd === WASI_STDERR_FD) {
				let written = 0;
				const buffers = read_ciovs(ciovs_ptr, ciovs_len);
				for (const buffer of buffers) {
					$apiClient.terminal.write(buffer);
					written += buffer.length;
				}
				const memory = memoryView();
				memory.setUint32(bytesWritten_ptr, written, true);
				return Errno.success;
			}
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.fd_write);
			const file = Files.getOrCreateFile(fileHandle);
			const buffers = read_ciovs(ciovs_ptr, ciovs_len);
			const bytesWritten: size = file.write(buffers);
			const memory = memoryView();
			memory.setUint32(bytesWritten_ptr, bytesWritten, true);
			return Errno.success;
		} catch (error) {
			return handleError(error);
		}
	}

	function path_open(fd: fd, _dirflags: lookupflags, path: ptr, pathLen: size, oflags: oflags, fs_rights_base: rights, fs_rights_inheriting: rights, _fdflags: fdflags, fd_ptr: ptr): errno {
		try {
			const parentHandle = getFileHandle(fd);
			parentHandle.assertBaseRight(Rights.path_open);

			const memory = memoryView();
			const name = $decoder.decode(new Uint8Array(memoryRaw(), path, pathLen));
			const realUri = getRealUri(parentHandle, name);
			const stat = $apiClient.workspace.fileSystem.stat(realUri);
			const entryExists = typeof stat !== 'number';
			if (entryExists) {
				if (Oflags.exclOn(oflags)) {
					return Errno.exist;
				} else if (Oflags.directoryOn(oflags) && stat.type !== FileType.Directory) {
					return Errno.notdir;
				}
			} else {
				// Entry does not exist;
				if (Oflags.creatOff(oflags)) {
					return Errno.noent;
				}
			}
			let filetype: filetype;
			let createFile: boolean = false;
			if (Oflags.creatOn(oflags) && !entryExists) {
				// Ensure parent handle is directory
				parentHandle.assertIsDirectory();
				const dirname = RAL().path.dirname(name);
				// The name has a directory part. Ensure that the directory exists
				if (dirname !== '.') {
					const dirStat = $apiClient.workspace.fileSystem.stat(getRealUri(parentHandle, dirname));
					if (typeof dirStat === 'number' || dirStat.type !== FileType.Directory) {
						return Errno.noent;
					}
				}
				filetype = Filetype.regular_file;
				createFile = true;
			} else {
				if (typeof stat === 'number') {
					return code2Wasi.asErrno(stat);
				}
				filetype = code2Wasi.asFileType(stat.type);
			}
			// Currently VS Code doesn't offer a generic API to open a file
			// or a directory. Since we were able to stat the file we create
			// a file handle info for it and lazy get the file content on read.
			const base = filetype === Filetype.directory
				? fs_rights_base | Rights.DirectoryBase
				: filetype === Filetype.regular_file
					? fs_rights_base | Rights.FileBase
					: fs_rights_base;
			const inheriting = Filetype.directory
				? fs_rights_inheriting | Rights.DirectoryInheriting
				: filetype === Filetype.regular_file
					? fs_rights_inheriting | Rights.FileInheriting
					: fs_rights_inheriting;
			const fileHandle = new FileHandle(
				FileHandles.next(), filetype, name,
				{ base: base, inheriting: inheriting },
				realUri
			);
			$fileHandles.set(fileHandle.fd, fileHandle);
			memory.setUint32(fd_ptr, fileHandle.fd, true);
			if (createFile || Oflags.truncOn(oflags)) {
				const file = createFile ? Files.getOrCreateFile(fileHandle, new Uint8Array(0)) : Files.getOrCreateFile(fileHandle);
				file.write([new Uint8Array(0)]);
			}
			return Errno.success;
		} catch(error) {
			return handleError(error);
		}
	}

	function path_create_directory(fd: fd, path_ptr: ptr, path_len: size): errno {
		try {
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.path_create_directory);
			fileHandle.assertIsDirectory();

			const memory = memoryRaw();
			const name = $decoder.decode(new Uint8Array(memory, path_ptr, path_len));
			$apiClient.workspace.fileSystem.createDirectory(getRealUri(fileHandle, name));
			return Errno.success;
		} catch (error) {
			return handleError(error);
		}
	}

	function path_filestat_get(fd: fd, _flags: lookupflags, path_ptr: ptr, path_len: size, filestat_ptr: ptr): errno {
		// VS Code has not support to follow sym links.
		// So we ignore lookupflags for now
		try {
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.path_filestat_get);
			fileHandle.assertIsDirectory();

			const memory = memoryRaw();
			const name = $decoder.decode(new Uint8Array(memory, path_ptr, path_len));
			const uri = getRealUri(fileHandle, name);
			const vStat = $apiClient.workspace.fileSystem.stat(uri);
			if (typeof vStat === 'number') {
				return code2Wasi.asErrno(vStat);
			}
			const fileStat = Filestat.create(filestat_ptr, memoryView());
			fileStat.dev = DeviceIds.system;
			fileStat.ino = Files.getINode(fileHandle);
			fileStat.filetype = code2Wasi.asFileType(vStat.type);
			fileStat.nlink = 0n;
			fileStat.size = BigInt(vStat.size);
			fileStat.ctim = BigInt(vStat.ctime);
			fileStat.mtim = BigInt(vStat.mtime);
			fileStat.atim = BigInt(vStat.mtime);
			return Errno.success;
		} catch (error) {
			return handleError(error);
		}
	}

	function path_filestat_set_times(fd: fd, _flags: lookupflags, _path_ptr: ptr, _path_len: size, _atim: timestamp, _mtim: timestamp, _fst_flags: fstflags): errno {
		// VS Code has not support to follow sym links.
		// So we ignore lookupflags for now
		try {
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.path_filestat_set_times);
			fileHandle.assertIsDirectory();

			// todo@dirkb
			// For now we do nothing. We could cache the timestamp in memory
			// But we would loose them during reload. We could also store them
			// in local storage
			return Errno.nosys;
		} catch (error) {
			return handleError(error);
		}
	}

	function path_link(old_fd: fd, _old_flags: lookupflags, _old_path_ptr: ptr, _old_path_len: size, new_fd: fd, _new_path_ptr: ptr, _new_path_len: size): errno {
		// VS Code has not support to create sym links.
		try {
			const oldFileHandle = getFileHandle(old_fd);
			oldFileHandle.assertBaseRight(Rights.path_link_source);
			oldFileHandle.assertIsDirectory();

			const newFileHandle = getFileHandle(new_fd);
			newFileHandle.assertBaseRight(Rights.path_link_target);
			newFileHandle.assertIsDirectory();

			// todo@dirkb
			// For now we do nothing. If we need to implement this we need
			// support from the VS Code API.
			return Errno.nosys;
		} catch (error) {
			return handleError(error);
		}
	}

	function path_readlink(fd: fd, _path_ptr: ptr, _path_len: size, _buf: ptr, _buf_len: size, _result_size_ptr: ptr): errno {
		// VS Code has no support to follow a symlink.
		try {
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.path_readlink);
			fileHandle.assertIsDirectory();

			// const name = $decoder.decode(new Uint8Array(memoryRaw(), path_ptr, path_len));
			// const realUri = getRealUri(fileHandle, name);
			// todo@dirkb
			// For now we do nothing. If we need to implement this we need
			// support from the VS Code API.
			return Errno.noent;
		} catch (error) {
			return handleError(error);
		}
	}

	function path_remove_directory(fd: fd, path_ptr: ptr, path_len: size): errno {
		try {
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.path_remove_directory);
			fileHandle.assertIsDirectory();

			const memory = memoryRaw();
			const name = $decoder.decode(new Uint8Array(memory, path_ptr, path_len));
			const uri = getRealUri(fileHandle, name);

			$apiClient.workspace.fileSystem.delete(uri, { recursive: false, useTrash: true });
			return Errno.success;
		} catch (error) {
			return handleError(error);
		}
	}

	function path_rename(old_fd: fd, old_path_ptr: ptr, old_path_len: size, new_fd: fd, new_path_ptr: ptr, new_path_len: size): errno {
		try {
			const oldFileHandle = getFileHandle(old_fd);
			oldFileHandle.assertBaseRight(Rights.path_rename_source);
			oldFileHandle.assertIsDirectory();

			const newFileHandle = getFileHandle(new_fd);
			newFileHandle.assertBaseRight(Rights.path_rename_target);
			newFileHandle.assertIsDirectory();


			const memory = memoryRaw();
			const oldName = $decoder.decode(new Uint8Array(memory, old_path_ptr, old_path_len));
			const oldUri = getRealUri(oldFileHandle, oldName);

			const newName = $decoder.decode(new Uint8Array(memory, new_path_ptr, new_path_len));
			const newUri = getRealUri(newFileHandle, newName);

			$apiClient.workspace.fileSystem.rename(oldUri, newUri, { overwrite: false });
			return Errno.success;
		} catch (error) {
			return handleError(error);
		}
	}

	function path_symlink(_old_path_ptr: ptr, _old_path_len: size, fd: fd, _new_path_ptr: ptr, _new_path_len: size): errno {
		// VS Code has no support to create a symlink.
		try {
			const newFileHandle = getFileHandle(fd);
			newFileHandle.assertBaseRight(Rights.path_symlink);
			newFileHandle.assertIsDirectory();
			return Errno.nosys;
		} catch (error) {
			return handleError(error);
		}
	}

	function path_unlink_file(fd: fd, path_ptr: ptr, path_len: size): errno {
		try {
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.path_unlink_file);
			fileHandle.assertIsDirectory();

			const memory = memoryRaw();
			const name = $decoder.decode(new Uint8Array(memory, path_ptr, path_len));
			const uri = getRealUri(fileHandle, name);

			const vStat = $apiClient.workspace.fileSystem.stat(uri);
			if (typeof vStat === 'number') {
				return vStat;
			}
			if (vStat.type !== DTOs.FileType.File) {
				return Errno.isdir;
			}

			$apiClient.workspace.fileSystem.delete(uri, { recursive: false, useTrash: true });
			return Errno.success;
		} catch (error) {
			return handleError(error);
		}
	}

	function poll_oneoff(input: ptr, output: ptr, subscriptions: size, result_size_ptr: ptr): errno {
		try {
			const memory = memoryView();
			let { events, needsTimeOut, timeout } = handleSubscriptions(memory, input, subscriptions);
			if (needsTimeOut && timeout !== undefined && timeout !== 0n) {
				// Timeout is in ns but sleep API is in ms.
				$apiClient.timer.sleep(BigInts.asNumber(timeout / 1000000n));
				// Reread the events. Timer will not change however the rest could have.
				events = handleSubscriptions(memory, input, subscriptions).events;
			}
			let event_offset = output;
			for (const item of events) {
				const event = Event.create(event_offset, memory);
				event.userdata = item.userdata;
				event.type = item.type;
				event.error = item.error;
				event.fd_readwrite.nbytes = item.fd_readwrite.nbytes;
				event.fd_readwrite.flags = item.fd_readwrite.flags;
				event_offset += Event.size;
			}
			memory.setUint32(result_size_ptr, events.length, true);
			return Errno.success;
		} catch (error) {
			return handleError(error);
		}
	}

	function handleSubscriptions(memory: DataView, input: ptr, subscriptions: size) {
		let subscription_offset: ptr = input;
		const events: Literal<event>[] = [];
		let timeout: bigint | undefined;
		let needsTimeOut = false;
		for (let i = 0; i < subscriptions; i++) {
			const subscription = Subscription.create(subscription_offset, memory);
			const u = subscription.u;
			switch (u.type) {
				case Eventtype.clock:
					const clockResult = handleClockSubscription(subscription);
					timeout = clockResult.timeout;
					events.push(clockResult.event);
					break;
				case Eventtype.fd_read:
					const readEvent = handleReadSubscription(subscription);
					events.push(readEvent);
					if (readEvent.error !== Errno.success || readEvent.fd_readwrite.nbytes === 0n) {
						needsTimeOut = true;
					}
					break;
				case Eventtype.fd_write:
					const writeEvent = handleWriteSubscription(subscription);
					events.push(writeEvent);
					if (writeEvent.error !== Errno.success) {
						needsTimeOut = true;
					}
					break;
			}
			subscription_offset += Subscription.size;
		}
		return { events, needsTimeOut, timeout };
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
			const time = now(Clockid.realtime, 0n);
			timeout = BigInt(Math.max(0, BigInts.asNumber(time - clock.timeout)));
		} else {
			timeout  = clock.timeout;
		}
		return { event: result, timeout };
	}

	function handleReadSubscription(subscription: subscription): Literal<event> {
		const fd = subscription.u.fd_read.file_descriptor;
		try {
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.fd_read);
			const file = Files.getOrCreateFile(fileHandle);
			const available = file.bytesAvailable();
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
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.fd_write);
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

	function proc_exit(rval: exitcode) {
		$exitHandler(rval);
	}

	function sched_yield(): errno {
		return Errno.nosys;
	}

	function random_get(buf: ptr, buf_len: size): errno {
		const random = RAL().crypto.randomGet(buf_len);
		const memory = memoryRaw();
		new Uint8Array(memory, buf, buf_len).set(random);
		return Errno.success;
	}

	function sock_accept(_fd: fd, _flags: fdflags, _result_fd_ptr: ptr): errno {
		return Errno.nosys;
	}

	function handleError(error: any, def: errno = Errno.badf): errno {
		if (error instanceof WasiError) {
			return error.errno;
		} else if (error instanceof FileSystemError) {
			return code2Wasi.asErrno(error.code);
		} else if (error instanceof RPCError) {
			return code2Wasi.asErrno(error.errno);
		}
		return def;
	}

	function read_ciovs (iovs: ptr, iovsLen: u32): Uint8Array[] {
		const memory = memoryView();
		const buffer = memoryRaw();

		const buffers: Uint8Array[] = [];
		let ptr: ptr = iovs;
		for (let i = 0; i < iovsLen; i++) {
			const vec = Ciovec.create(ptr, memory);
			buffers.push(new Uint8Array(buffer, vec.buf, vec.buf_len));
			ptr += Ciovec.size;
		}
		return buffers;
	}

	function read_iovs (iovs: ptr, iovsLen: u32): Uint8Array[] {
		const memory = memoryView();
		const buffer = memoryRaw();

		const buffers: Uint8Array[] = [];
		let ptr: ptr = iovs;
		for (let i = 0; i < iovsLen; i++) {
			const vec = Iovec.create(ptr, memory);
			buffers.push(new Uint8Array(buffer, vec.buf, vec.buf_len));
			ptr += Iovec.size;
		}
		return buffers;
	}

	function memoryView(): DataView {
		if ($instance === undefined) {
			throw new Error(`WASI layer is not initialized. Missing WebAssembly instance.`);
		}
		return new DataView($instance.exports.memory.buffer);
	}

	function memoryRaw(): ArrayBuffer {
		if ($instance === undefined) {
			throw new Error(`WASI layer is not initialized. Missing WebAssembly instance.`);
		}
		return $instance.exports.memory.buffer;
	}

	function getFileHandle(fd: fd): FileHandle {
		const result = $fileHandles.get(fd);
		if (result === undefined) {
			throw new WasiError(Errno.badf);
		}
		return result;
	}

	function getRealUri(parentInfo: FileHandle, name: string): URI {
		const real = parentInfo.uri;
		if (name === '.') {
			return real;
		}
		return real.with({ path: `${real.path}/${name}`});
	}
}
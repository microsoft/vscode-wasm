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
import { ApiClient, FileType } from 'vscode-sync-api-client';

import { ptr, size, u32 } from './baseTypes';
import {
	wasi_file_handle, errno, Errno, lookupflags, oflags, rights, fdflags, dircookie, prestat, filetype, Rights,
	filesize, advise, filedelta, whence, Filestat, Whence, Ciovec, Iovec, Filetype, clockid, timestamp, Clockid,
	Fdstat, fstflags, Prestat
} from './wasiTypes';
import { code2Wasi } from './converter';

// Same as Unix file descriptors
export const WASI_STDIN_FD = 0 as const;
export const WASI_STDOUT_FD = 1 as const;
export const WASI_STDERR_FD = 2 as const;

export interface Environment {
	[key: string]: string;
}


/** Python requirement.
  "fd_pwrite"
  "fd_read"
  "fd_readdir"
  "fd_seek"
  "fd_sync"
  "fd_tell"
  "fd_write"
  "path_create_directory"
  "path_filestat_get"
  "path_filestat_set_times"
  "path_link"
  "path_open"
  "path_readlink"
  "path_remove_directory"
  "path_rename"
  "path_symlink"
  "path_unlink_file"
  "poll_oneoff"
  "proc_exit"
  "sched_yield"
  "random_get"
  "sock_accept"
*/

export interface WASI {
	initialize(memory: ArrayBuffer): void;

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
	fd_advise(fd: wasi_file_handle, offset: filesize, length: filesize, advise: advise): errno;

	/**
	 * Force the allocation of space in a file. Note: This is similar to
	 * posix_fallocate in POSIX.
	 *
	 * @param fd The file descriptor.
	 * @param offset The offset at which to start the allocation.
	 * @param len The length of the area that is allocated.
	 */
	fd_allocate(fd: wasi_file_handle, offset: filesize, len: filesize): errno;

	/**
	 * Close a file descriptor. Note: This is similar to close in POSIX.
	 * @param fd The file descriptor.
	 */
	fd_close(fd: wasi_file_handle): errno;

	/**
	 * Synchronize the data of a file to disk. Note: This is similar to
	 * fdatasync in POSIX.
	 *
	 * @param fd The file descriptor.
	 */
	fd_datasync(fd: wasi_file_handle): errno;

	/**
	 * Get the attributes of a file descriptor. Note: This returns similar
	 * flags to fsync(fd, F_GETFL) in POSIX, as well as additional fields.
	 *
	 * @param fd The file descriptor.
	 * @param fdstat_ptr A pointer to store the result.
	 */
	fd_fdstat_get(fd: wasi_file_handle, fdstat_ptr: ptr): errno;

	/**
	 * Adjust the flags associated with a file descriptor. Note: This is similar
	 * to fcntl(fd, F_SETFL, flags) in POSIX.
	 *
	 * @param fd The file descriptor.
	 * @param fdflags The desired values of the file descriptor flags.
	 */
	fd_fdstat_set_flags(fd: wasi_file_handle, fdflags: fdflags): errno;

	/**
	 * Return the attributes of an open file.
	 * @param fd The file descriptor.
	 * @param bufPtr The buffer where the file's attributes are stored.
	 */
	fd_filestat_get(fd: wasi_file_handle, bufPtr: ptr): errno;

	/**
	 * Adjust the size of an open file. If this increases the file's size, the
	 * extra bytes are filled with zeros. Note: This is similar to ftruncate in
	 * POSIX.
	 *
	 * @param fd The file descriptor.
	 * @param size: The desired file size.
	 */
	fd_filestat_set_size(fd: wasi_file_handle, size: filesize): errno;

	/**
	 * Adjust the timestamps of an open file or directory. Note: This is similar
	 * to futimens in POSIX.
	 *
	 * @param fd The file descriptor.
	 * @param atim The desired values of the data access timestamp.
	 * @param mtim The desired values of the data modification timestamp.
	 * @param fst_flags A bitmask indicating which timestamps to adjust.
	 */
	fd_filestat_set_times(fd: wasi_file_handle, atim: timestamp, mtim: timestamp, fst_flags: fstflags): errno;

	/**
	 * Read from a file descriptor, without using and updating the file
	 * descriptor's offset. Note: This is similar to preadv in POSIX.
	 * @param fd The file descriptor.
	 * @param iovs_ptr List of scatter/gather vectors in which to store data.
	 * @param iovs_len The length of the iovs.
	 * @param offset The offset within the file at which to read.
	 * @param bytesRead_ptr A memory location to store the bytes read.
	 */
	fd_pread(fd: wasi_file_handle, iovs_ptr: ptr, iovs_len: u32, offset: filesize, bytesRead_ptr: ptr): errno;

	/**
	 * Return a description of the given preopened file descriptor.
	 *
	 * @param fd The file descriptor.
	 * @param bufPtr A pointer to store the pre stat information.
	 */
	fd_prestat_get(fd: wasi_file_handle, bufPtr: ptr): errno;

	/**
	 * Return a description of the given preopened file descriptor.
	 *
	 * @param fd The file descriptor.
	 * @param pathPtr A memory location to store the path name.
	 * @param pathLen The lenght of the path.
	 */
	fd_prestat_dir_name(fd: wasi_file_handle, pathPtr: ptr, pathLen: size): errno;

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
	fd_pwrite(fd: wasi_file_handle, ciovs_ptr: ptr, ciovs_len: u32, offset: filesize, bytesWritten_ptr: ptr): errno;

	/**
	 * Read from a file descriptor. Note: This is similar to readv in POSIX.
	 *
	 * @param fd The file descriptor.
	 * @param iovs_ptr List of scatter/gather vectors in which to store data.
	 * @param iovs_len The length of the iovs.
	 * @param bytesRead_ptr A memory location to store the bytes read.
	 */
	fd_read(fd: wasi_file_handle, iovs_ptr: ptr, iovs_len: u32, bytesRead_ptr: ptr): errno;

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
	 * @param bufEndPtr The number of bytes stored in the read buffer.
	 * If less than the size of the read buffer, the end of the directory has
	 * been reached.
	 */
	fd_readdir(fd: wasi_file_handle, buf_ptr: ptr, buf_len: size, cookie: dircookie, bufEndPtr: ptr): errno;

	/**
	 * Move the offset of a file descriptor. Note: This is similar to lseek in
	 * POSIX.
	 * @param fd The file descriptor.
	 * @param offset The number of bytes to move.
	 * @param whence The base from which the offset is relative.
	 * @param newOffsetPtr A memory location to store the new offset.
	 */
	fd_seek(fd: wasi_file_handle, offset: filedelta, whence: whence, newOffsetPtr: ptr): errno;

	/**
	 * Write to a file descriptor. Note: This is similar to writev in POSIX.
	 *
	 * @param fd The file descriptor.
	 * @param ciovs_ptr List of scatter/gather vectors from which to retrieve data.
	 * @param ciovs_len The length of the iovs.
	 * @param bytesWritten_ptr A memory location to store the bytes written.
	 */
	fd_write(fd: wasi_file_handle, ciovs_ptr: ptr, ciovs_len: u32, bytesWritten_ptr: ptr): errno;

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
	path_open(fd: wasi_file_handle, dirflags: lookupflags, path: ptr, pathLen: size, oflags: oflags, fs_rights_base: rights, fs_rights_inheriting: rights, fdflags: fdflags, fd_ptr: ptr): errno;

	proc_exit(): errno;
}

export type Options = {

	/**
	 * The workspace folders
	 */
	workspaceFolders: {
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

namespace INodes {
	const mappings: Map<string, bigint> = new Map();
	let inodeCounter: bigint = 1n;

	export function get(uri: URI): bigint {
		let result = mappings.get(uri.toString());
		if (result === undefined) {
			result = inodeCounter++;
			mappings.set(uri.toString(), result);
		}
		return result;
	}
}

namespace DeviceIds {
	const deviceIds: Map<string, bigint> = new Map();
	let deviceIdCounter: bigint = 1n;

	export function get(uri: URI): bigint {
		const scheme = uri.scheme;
		let result = deviceIds.get(scheme);
		if (result === undefined) {
			result = deviceIdCounter++;
			deviceIds.set(scheme, result);
		}
		return result;
	}
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
	public readonly fd: wasi_file_handle;

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
	 * The real information in VS Code's file system.
	 */
	public readonly real: {
		/**
		 * Not all VS Code API is file descriptor based.
		 */
		fd: number | undefined;

		/**
		 * The corresponding VS Code URI
		 */
		uri: URI;
	};

	/**
	 * Whether this is a pre-opened directory.
	 */
	public readonly preOpened: boolean;

	constructor(fd: wasi_file_handle, fileType: filetype, path: string, rights: FileHandle['rights'], real: FileHandle['real'], preOpened: boolean = false) {
		this.fd = fd;
		this.fileType = fileType;
		this.path = path;
		this.rights = rights;
		this.real = real;
		this.preOpened = preOpened;
	}

	public assertBaseRight(right: rights): void {
		if ((this.rights.base & right) === 0n) {
			throw new WasiError(Errno.perm);
		}
	}
}

class File  {

	private readonly fileHandle: FileHandle;
	private _content: Uint8Array | undefined;
	private readonly contentProvider: ((uri: URI) => Uint8Array | number) | undefined;
	private readonly contentWriter: ((uri: URI, content: Uint8Array) => number);

	private cursor: number;
	private fdFlags: fdflags;

	constructor(fileHandle: FileHandle, content: Uint8Array | ((uri: URI) => Uint8Array | number), contentWriter: (uri: URI, content: Uint8Array) => number) {
		this.fileHandle = fileHandle;
		if (content instanceof Uint8Array) {
			this._content = content;
		} else {
			this.contentProvider = content;
		}
		this.contentWriter = contentWriter;
		this.cursor = 0;
		this.fdFlags = 0;
	}

	public get fd() {
		return this.fileHandle.fd;
	}

	private get content(): Uint8Array {
		if (this._content !== undefined) {
			return this._content;
		}
		if (this.contentProvider === undefined) {
			throw new WasiError(Errno.inval);
		}
		const content = this.contentProvider(this.fileHandle.real.uri);
		if (typeof content === 'number') {
			throw new WasiError(code2Wasi.asErrno(content));
		}
		if (content === undefined) {
			throw new WasiError(Errno.inval);
		}
		this._content = content;
		return this._content;
	}

	public seek(offset: number, whence: whence): errno {
		switch(whence) {
			case Whence.set:
				this.cursor = offset;
				break;
			case Whence.cur:
				this.cursor = this.cursor + offset;
				break;
			case Whence.end:
				if (this._content === undefined) {
					Errno.inval;
				}
				this.cursor = this.content.byteLength - offset;
				break;
		}
		return Errno.success;
	}

	public read(bytesToRead: number): Uint8Array {
		const content = this.content;
		const realRead = Math.min(bytesToRead, content.byteLength - this.cursor);
		const result = content.subarray(this.cursor, this.cursor + realRead);
		this.cursor = this.cursor + realRead;
		return result;
	}

	public pread(offset: number, bytesToRead: number): Uint8Array {
		const content = this.content;
		const realRead = Math.min(bytesToRead, content.byteLength - offset);
		return content.subarray(offset, offset + realRead);
	}

	public write(): errno {
		if (this._content === undefined) {
			return Errno.success;
		}
		return this.contentWriter(this.fileHandle.real.uri, this._content);
	}

	public pwrite(offset: number, bytes: Uint8Array): { errno: errno; bytesWritten: number } {
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
		return { errno: this.write(), bytesWritten: bytes.length };
	}

	public setFdFlags(fdflags: fdflags): void {
		this.fdFlags = fdflags;
	}

	public setSize(_size: filesize): errno {
		const size = BigInts.asNumber(_size);
		const content = this.content;
		if (content.byteLength === size) {
			return 0;
		} else if (content.byteLength < size) {
			const newContent = new Uint8Array(size);
			newContent.set(this.content);
			this._content = newContent;
		} else if (content.byteLength > size) {
			const newContent = new Uint8Array(size);
			newContent.set(this.content.subarray(0, size));
			this._content = newContent;
		}
		return this.contentWriter(this.fileHandle.real.uri, this.content);
	}
}


class WasiError extends Error {
	public readonly errno: errno;
	constructor(errno: errno) {
		super();
		this.errno = errno;
	}
}

export namespace WASI {

	let $memory: ArrayBuffer | undefined;
	let $memoryLength: number = -1;
	let $memoryView: DataView | undefined;

	let $encoder: RAL.TextEncoder;
	let $decoder: RAL.TextDecoder;

	let $name: string;
	let $apiClient: ApiClient;
	let $options: Options;

	const $fileHandles: Map<wasi_file_handle, FileHandle> = new Map();
	const $files: Map<wasi_file_handle, File> = new Map();

	export function create(name: string, apiClient: ApiClient, options: Options): WASI {
		$name = name;
		$apiClient = apiClient;

		$encoder = RAL().TextEncoder.create(options?.encoding);
		$decoder = RAL().TextDecoder.create(options?.encoding);

		$options = options;

		if ($options.workspaceFolders.length === 1) {
			const workspace = new FileHandle(FileHandles.next(), Filetype.directory, '/workspace', { base: Rights.DirectoryBase, inheriting: Rights.DirectoryInheriting}, { fd: undefined, uri: $options.workspaceFolders[0].uri }, true);
			$fileHandles.set(workspace.fd, workspace);
 		} else if ($options.workspaceFolders.length > 1) {
			for (const folder of $options.workspaceFolders) {
				const f = new FileHandle(FileHandles.next(), Filetype.directory, `/workspace/${folder.name}`, { base: Rights.DirectoryBase, inheriting: Rights.DirectoryInheriting}, {fd: undefined, uri: folder.uri }, true);
				$fileHandles.set(f.fd, f);
			}
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
			fd_write: fd_write,
			path_open: path_open,
			proc_exit: proc_exit
		};
	}

	function initialize(memory: ArrayBuffer): void {
		$memory = memory;
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
		let entryOffset = environBuf_ptr;
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

	function clock_res_get(id: clockid, timestamp_ptr: ptr): errno {
		const memory = memoryView();
		switch (id) {
			case Clockid.realtime:
				memory.setBigUint64(timestamp_ptr, 1n, true);
				return Errno.success;
			default:
				memory.setBigUint64(timestamp_ptr, 0n, true);
				return Errno.inval;
		}
	}

	function clock_time_get(id: clockid, precision: timestamp, timestamp_ptr: ptr): errno {
		if (id !== Clockid.realtime) {
			return Errno.inval;
		}
		const value = BigInt(Date.now());
		const memory = memoryView();
		memory.setBigUint64(timestamp_ptr, value, true);
		return Errno.success;
	}

	function fd_advise(fd: wasi_file_handle, offset: filesize, length: filesize, advise: advise): errno {
		try {
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.fd_advise);

			// We don't have advisory in VS Code. So treat it as successful.
			return Errno.success;
		} catch (error) {
			if (error instanceof WasiError) {
				return error.errno;
			}
			return Errno.badf;
		}
	}

	function fd_allocate(fd: wasi_file_handle, offset: filesize, len: filesize): errno {
		try {
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.fd_allocate);

			// Filled in by PR
			return Errno.success;
		} catch (error) {
			if (error instanceof WasiError) {
				return error.errno;
			}
			return Errno.badf;
		}
	}

	function fd_close(fd: wasi_file_handle): errno {
		try {
			const fileHandle = getFileHandle(fd);
			// Delete the file. Close doesn't flush.
			$files.delete(fd);
			$fileHandles.delete(fileHandle.fd);
			return Errno.success;
		} catch (error) {
			if (error instanceof WasiError) {
				return error.errno;
			}
			return Errno.perm;
		}
	}

	function fd_datasync(fd: wasi_file_handle): errno {
		try {
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.fd_datasync);

			const file = $files.get(fileHandle.fd);
			if (file === undefined) {
				return Errno.success;
			}
			return file.write();
		} catch (error) {
			if (error instanceof WasiError) {
				return error.errno;
			}
			return Errno.badf;
		}
	}

	function fd_fdstat_get(fd: wasi_file_handle, fdstat_ptr: ptr): errno {
		// This is not available under VS Code.
		try {
			const fileHandle = getFileHandle(fd);
			const uri = fileHandle.real.uri;
			const vStat = $apiClient.fileSystem.stat(uri);
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
			if (error instanceof WasiError) {
				return error.errno;
			}
			return Errno.badf;
		}
	}

	function fd_fdstat_set_flags(fd: wasi_file_handle, fdflags: fdflags): errno {
		try {
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.fd_fdstat_set_flags);
			const file = getOrCreateFile(fileHandle);
			file.setFdFlags(fdflags);
			return Errno.success;
		} catch (error) {
			if (error instanceof WasiError) {
				return error.errno;
			}
			return Errno.badf;
		}
	}

	function fd_filestat_get(fd: wasi_file_handle, bufPtr: ptr): errno {
		try {
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.fd_filestat_get);
			const uri = fileHandle.real.uri;
			const vStat = $apiClient.fileSystem.stat(uri);
			if (typeof vStat === 'number') {
				return code2Wasi.asErrno(vStat);
			}
			const memory = memoryView();
			const fileStat = Filestat.create(bufPtr, memory);
			fileStat.dev = DeviceIds.get(uri);
			fileStat.ino = INodes.get(uri);
			fileStat.filetype = code2Wasi.asFileType(vStat.type);
			fileStat.nlink = 0n;
			fileStat.size = BigInt(vStat.size);
			fileStat.ctim = BigInt(vStat.ctime);
			fileStat.mtim = BigInt(vStat.mtime);
			return Errno.success;
		} catch (error) {
			if (error instanceof WasiError) {
				return error.errno;
			}
			return Errno.perm;
		}
	}

	function fd_filestat_set_size(fd: wasi_file_handle, size: filesize): errno {
		try {
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.fd_filestat_set_size);
			const file = getOrCreateFile(fileHandle);
			return file.setSize(size);
		} catch (error) {
			if (error instanceof WasiError) {
				return error.errno;
			}
			return Errno.badf;
		}
	}

	function fd_filestat_set_times(fd: wasi_file_handle, atim: timestamp, mtim: timestamp, fst_flags: fstflags): errno {
		try {
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.fd_filestat_set_times);
			// todo@dirkb
			// For new we do nothing. We could cache the timestamp in memory
			// But we would loose them during reload. We could also store them
			// in local storage
			return Errno.success;
		} catch (error) {
			if (error instanceof WasiError) {
				return error.errno;
			}
			return Errno.badf;
		}
	}

	function fd_pread(fd: wasi_file_handle, iovs_ptr: ptr, iovs_len: u32, offset: filesize, bytesRead_ptr: ptr): errno {
		try {
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.fd_read);
			const file = getOrCreateFile(fileHandle);
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
			if (error instanceof WasiError) {
				return error.errno;
			}
			return Errno.badf;
		}
	}

	function fd_prestat_get(fd: wasi_file_handle, bufPtr: ptr): errno {
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
			if (error instanceof WasiError) {
				return error.errno;
			}
			return Errno.perm;
		}
	}

	function fd_prestat_dir_name(fd: wasi_file_handle, pathPtr: ptr, pathLen: size): errno {
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
			if (error instanceof WasiError) {
				return error.errno;
			}
			return Errno.perm;
		}
	}

	function fd_pwrite(fd: wasi_file_handle, ciovs_ptr: ptr, ciovs_len: u32, offset: filesize, bytesWritten_ptr: ptr): errno {
		try {
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.fd_write);
			const file = getOrCreateFile(fileHandle);
			const buffers = read_ciovs(ciovs_ptr, ciovs_len);
			let bytesWritten = 0;
			for (const buffer of buffers) {
				const result = file.pwrite(BigInts.asNumber(offset), buffer);
				if (result.errno !== Errno.success) {
					return result.errno;
				}
				bytesWritten += result.bytesWritten;
			}
			memoryView().setUint32(bytesWritten_ptr, bytesWritten, true);
			return Errno.success;
		} catch (error) {
			if (error instanceof WasiError) {
				return error.errno;
			}
			return Errno.perm;
		}
	}

	function fd_read(fd: wasi_file_handle, iovs_ptr: ptr, iovs_len: u32, bytesRead_ptr: ptr): errno {
		try {
			const memory = memoryView();
			if (fd === WASI_STDIN_FD) {
				let bytesRead = 0;
				const buffers = read_iovs(iovs_ptr, iovs_len);
				for (const buffer of buffers) {
					const result = $apiClient.terminal.read(buffer.byteLength);
					if (result === undefined) {
						memory.setUint32(bytesRead_ptr, 0, true);
						return Errno.inval;
					}
					bytesRead += result.byteLength;
					buffer.set(result);
				}
				memory.setUint32(bytesRead_ptr, bytesRead, true);
				return Errno.success;
			}
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.fd_read);
			let file = $files.get(fileHandle.fd);
			if (file === undefined) {
				const content = $apiClient.fileSystem.read(fileHandle.real.uri);
				if (typeof content === 'number') {
					return code2Wasi.asErrno(content);
				}
				file = getOrCreateFile(fileHandle, content);
			}
			const buffers = read_iovs(iovs_ptr, iovs_len);
			let bytesRead = 0;
			for (const buffer of buffers) {
				const result = file.read(buffer.byteLength);
				bytesRead = result.byteLength;
				buffer.set(result);
			}
			memory.setUint32(bytesRead_ptr, bytesRead, true);
			return Errno.success;
		} catch (error) {
			if (error instanceof WasiError) {
				return error.errno;
			}
			return Errno.perm;
		}
	}

	function fd_readdir(fd: wasi_file_handle, buf_ptr: ptr, buf_len: size, cookie: dircookie, bufEndPtr: ptr): errno {
		return Errno.success;
	}

	function fd_seek(fd: wasi_file_handle, _offset: filedelta, whence: whence, newOffsetPtr: ptr): errno {
		try {
			const offset = Number(_offset);
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.fd_seek);
			const file = getOrCreateFile(fileHandle);
			return file.seek(offset, whence);
		} catch (error) {
			if (error instanceof WasiError) {
				return error.errno;
			}
			return Errno.perm;
		}
	}

	function fd_write(fd: wasi_file_handle, ciovs_ptr: ptr, ciovs_len: u32, bytesWritten_ptr: ptr): errno {
		try {
			if (fd === WASI_STDOUT_FD) {
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
			return Errno.success;
		} catch (error) {
			if (error instanceof WasiError) {
				return error.errno;
			}
			return Errno.perm;
		}
	}

	function path_open(fd: wasi_file_handle, dirflags: lookupflags, path: ptr, pathLen: size, oflags: oflags, fs_rights_base: rights, fs_rights_inheriting: rights, fdflags: fdflags, fd_ptr: ptr): errno {
		try {
			const parentHandle = getFileHandle(fd);
			parentHandle.assertBaseRight(Rights.path_open);

			const memory = memoryView();
			const name = $decoder.decode(new Uint8Array(memoryRaw(), path, pathLen));
			const realUri = getRealUri(parentHandle, name);
			const stat = $apiClient.fileSystem.stat(realUri);
			if (typeof stat === 'number') {
				return code2Wasi.asErrno(stat);
			}
			const filetype = code2Wasi.asFileType(stat.type);
			// Currently VS Code doesn't offer a generic API to open a file
			// or a directory. Since we were able to stat the file we create
			// a file handle info for it and lazy get the file content on read.
			const fileHandleInfo = new FileHandle(
				FileHandles.next(), filetype, name,
				{ base: fs_rights_base, inheriting: fs_rights_inheriting },
				{ fd: undefined, uri: realUri }
			);
			$fileHandles.set(fileHandleInfo.fd, fileHandleInfo);
			memory.setUint32(fd_ptr, fileHandleInfo.fd, true);
			return Errno.success;
		} catch(error) {
			if (error instanceof WasiError) {
				return error.errno;
			}
			return Errno.perm;
		}
	}

	function proc_exit(): errno {
		return Errno.success;
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
		if ($memory === undefined) {
			throw new Error(`WASI layer is not initialized`);
		}
		if ($memoryView === undefined || $memoryLength === -1 || $memoryLength !== $memory.byteLength) {
			$memoryView = new DataView($memory);
			$memoryLength = $memory.byteLength;
		}
		return $memoryView;
	}

	function memoryRaw(): ArrayBuffer {
		if ($memory === undefined) {
			throw new Error(`WASI layer is not initialized`);
		}
		return $memory;
	}

	function getFileHandle(fd: wasi_file_handle): FileHandle {
		const result = $fileHandles.get(fd);
		if (result === undefined) {
			throw new WasiError(Errno.badf);
		}
		return result;
	}

	function getFile(fd: wasi_file_handle): File {
		const result = $files.get(fd);
		if (result === undefined) {
			throw new WasiError(Errno.badf);
		}
		return result;
	}

	function getOrCreateFile(fileHandle: FileHandle, content?: Uint8Array): File {
		let result = $files.get(fileHandle.fd);
		if (result === undefined) {
			result = new File(fileHandle, content !== undefined ? content : (uri) => $apiClient.fileSystem.read(uri), (uri, content) => $apiClient.fileSystem.write(uri, content));
			$files.set(result.fd, result);
		}
		return result;
	}

	function getRealUri(parentInfo: FileHandle, name: string): URI {
		const real = parentInfo.real.uri;
		return real.with({ path: `${real.path}/${name}`});
	}
}
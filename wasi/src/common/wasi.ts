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
import { ApiClient, FileType, Types } from 'vscode-sync-api-client';

import { ptr, size, u32 } from './baseTypes';
import {
	fd, errno, Errno, lookupflags, oflags, rights, fdflags, dircookie, prestat, filetype, Rights,
	filesize, advise, filedelta, whence, Filestat, Whence, Ciovec, Iovec, Filetype, clockid, timestamp, Clockid,
	Fdstat, fstflags, Prestat, Dirent, dirent, exitcode
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
  "path_remove_directory"
  "path_rename"
  "path_symlink"
  "path_unlink_file"
  "poll_oneoff"
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
	 * Terminate the process normally. An exit code of 0 indicates successful
	 * termination of the program. The meanings of other values is dependent on
	 * the environment.
	 *
	 * @param rval The exit code returned by the process.
	 */
	proc_exit(rval: exitcode): void;
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

	constructor(fd: fd, fileType: filetype, path: string, rights: FileHandle['rights'], real: FileHandle['real'], preOpened: boolean = false) {
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

	public assertIsDirectory(): void {
		if (this.fileType !== Filetype.directory) {
			throw new WasiError(Errno.notdir);
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

	public alloc(_offset: filesize, _len: filesize): errno {
		const offset = BigInts.asNumber(_offset);
		const len = BigInts.asNumber(_len);
		const content = this.content;

		if (offset > content.byteLength) {
			return Errno.inval;
		}

		const newContent: Uint8Array = new Uint8Array(content.byteLength + len);
		newContent.set(content.subarray(0, offset), 0);
		newContent.set(content.subarray(offset, content.byteLength), offset + len);
		this._content = newContent;

		return this.doWrite();
	}

	public pread(offset: number, bytesToRead: number): Uint8Array {
		const content = this.content;
		const realRead = Math.min(bytesToRead, content.byteLength - offset);
		return content.subarray(offset, offset + realRead);
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
		return { errno: this.doWrite(), bytesWritten: bytes.length };
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
		return this.doWrite();
	}

	public sync(): errno {
		return this.doWrite();
	}

	public tell(): number {
		return this.cursor;
	}

	public read(bytesToRead: number): Uint8Array {
		const content = this.content;
		const realRead = Math.min(bytesToRead, content.byteLength - this.cursor);
		const result = content.subarray(this.cursor, this.cursor + realRead);
		this.cursor = this.cursor + realRead;
		return result;
	}

	public write(buffers: Uint8Array[]): { errno: errno; bytesWritten: number } {
		let content = this.content;

		let bytesToWrite = 0;
		for (const bytes of buffers) {
			bytesToWrite += bytes.byteLength;
		}

		// Do we need to increase the buffer
		if (this.cursor + bytesToWrite > content.byteLength) {
			const newContent = new Uint8Array(this.cursor + bytesToWrite);
			newContent.set(content);
			this._content = newContent;
			content = newContent;
		}

		for (const bytes of buffers) {
			content.set(bytes, this.cursor);
			this.cursor += bytes.length;
		}

		return { errno: this.doWrite(), bytesWritten: bytesToWrite };
	}

	private doWrite(): errno {
		if (this._content === undefined) {
			return Errno.success;
		}
		return code2Wasi.asErrno(this.contentWriter(this.fileHandle.real.uri, this._content));
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

	const $fileHandles: Map<fd, FileHandle> = new Map();
	const $files: Map<fd, File> = new Map();
	const $directoryEntries: Map<fd, Types.DirectoryEntries> = new Map();

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

	function fd_advise(fd: fd, offset: filesize, length: filesize, advise: advise): errno {
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
			const file = getOrCreateFile(fileHandle);
			return file.alloc(offset, len);
		} catch (error) {
			return handleError(error);
		}
	}

	function fd_close(fd: fd): errno {
		try {
			const fileHandle = getFileHandle(fd);
			// Delete the file. Close doesn't flush.
			$files.delete(fd);
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

			const file = $files.get(fileHandle.fd);
			if (file === undefined) {
				return Errno.success;
			}
			return file.sync();
		} catch (error) {
			return handleError(error);
		}
	}

	function fd_fdstat_get(fd: fd, fdstat_ptr: ptr): errno {
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
			return handleError(error);
		}
	}

	function fd_fdstat_set_flags(fd: fd, fdflags: fdflags): errno {
		try {
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.fd_fdstat_set_flags);
			const file = getOrCreateFile(fileHandle);
			file.setFdFlags(fdflags);
			return Errno.success;
		} catch (error) {
			return handleError(error);
		}
	}

	function fd_filestat_get(fd: fd, filestat_ptr: ptr): errno {
		try {
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.fd_filestat_get);
			const uri = fileHandle.real.uri;
			const vStat = $apiClient.fileSystem.stat(uri);
			if (typeof vStat === 'number') {
				return code2Wasi.asErrno(vStat);
			}
			const memory = memoryView();
			const fileStat = Filestat.create(filestat_ptr, memory);
			fileStat.dev = DeviceIds.get(uri);
			fileStat.ino = INodes.get(uri);
			fileStat.filetype = code2Wasi.asFileType(vStat.type);
			fileStat.nlink = 0n;
			fileStat.size = BigInt(vStat.size);
			fileStat.ctim = BigInt(vStat.ctime);
			fileStat.mtim = BigInt(vStat.mtime);
			fileStat.atim = BigInt(vStat.mtime);
			return Errno.success;
		} catch (error) {
			return handleError(error, Errno.perm);
		}
	}

	function fd_filestat_set_size(fd: fd, size: filesize): errno {
		try {
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.fd_filestat_set_size);
			const file = getOrCreateFile(fileHandle);
			return file.setSize(size);
		} catch (error) {
			return handleError(error);
		}
	}

	function fd_filestat_set_times(fd: fd, atim: timestamp, mtim: timestamp, fst_flags: fstflags): errno {
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
			return handleError(error);
		}
	}

	function fd_read(fd: fd, iovs_ptr: ptr, iovs_len: u32, bytesRead_ptr: ptr): errno {
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
			// todo@dirkb this is actually speced different. According to the spec if
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
				const result = $apiClient.fileSystem.readDirectory(fileHandle.real.uri);
				if (typeof result === 'number') {
					return code2Wasi.asErrno(result);
				}
				$directoryEntries.set(fileHandle.fd, result);
			}
			const entries: Types.DirectoryEntries | undefined = $directoryEntries.get(fd);
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
				dirent.d_ino = INodes.get(uri);
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
			const check = new Uint8Array(raw, buf_ptr, buf_len);
			return Errno.success;
		} catch (error) {
			return handleError(error);
		}
	}

	function fd_seek(fd: fd, _offset: filedelta, whence: whence, new_offset_ptr: ptr): errno {
		try {
			const offset = Number(_offset);
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.fd_seek);
			const file = getOrCreateFile(fileHandle);
			return file.seek(offset, whence);
		} catch (error) {
			return handleError(error);
		}
	}

	function fd_sync(fd: fd): errno {
		try {
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.fd_sync);
			const file = $files.get(fileHandle.fd);
			if (file === undefined) {
				return Errno.success;
			}
			return file.sync();
		} catch (error) {
			return handleError(error);
		}
	}

	function fd_tell(fd: fd, offset_ptr: ptr): errno {
		try {
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.fd_sync);
			const file = $files.get(fileHandle.fd);
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
			const file = getOrCreateFile(fileHandle);
			const buffers = read_ciovs(ciovs_ptr, ciovs_len);
			const result = file.write(buffers);
			if (result.errno !== 0) {
				return result.errno;
			}
			const memory = memoryView();
			memory.setUint32(bytesWritten_ptr, result.bytesWritten, true);
			return Errno.success;
		} catch (error) {
			return handleError(error);
		}
	}

	function path_open(fd: fd, dirflags: lookupflags, path: ptr, pathLen: size, oflags: oflags, fs_rights_base: rights, fs_rights_inheriting: rights, fdflags: fdflags, fd_ptr: ptr): errno {
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
			const result = $apiClient.fileSystem.createDirectory(getRealUri(fileHandle, name));
			return code2Wasi.asErrno(result);
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
			const vStat = $apiClient.fileSystem.stat(uri);
			if (typeof vStat === 'number') {
				return code2Wasi.asErrno(vStat);
			}
			const fileStat = Filestat.create(filestat_ptr, memoryView());
			fileStat.dev = DeviceIds.get(uri);
			fileStat.ino = INodes.get(uri);
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

	function path_filestat_set_times(fd: fd, flags: lookupflags, path_ptr: ptr, path_len: size, atim: timestamp, mtim: timestamp, fst_flags: fstflags): errno {
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

	function path_link(old_fd: fd, old_flags: lookupflags, old_path_ptr: ptr, old_path_len: size, new_fd: fd, new_path_ptr: ptr, new_path_len: size): errno {
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

	function path_readlink(fd: fd, path_ptr: ptr, path_len: size, buf: ptr, buf_len: size, result_size_ptr: ptr): errno {
		// VS Code has no support to follow a symlink.
		try {
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.path_readlink);
			fileHandle.assertIsDirectory();

			// todo@dirkb
			// For now we do nothing. If we need to implement this we need
			// support from the VS Code API.
			return Errno.nosys;
		} catch (error) {
			return handleError(error);
		}
	}

	function path_remove_directory(fd: fd, path_ptr: ptr, path_len: size): errno {
		try {
			const fileHandle = getFileHandle(fd);
			fileHandle.assertBaseRight(Rights.path_readlink);
			fileHandle.assertIsDirectory();

			const memory = memoryRaw();
			const name = $decoder.decode(new Uint8Array(memory, path_ptr, path_len));
			const uri = getRealUri(fileHandle, name);

			const result = $apiClient.fileSystem.delete(uri, { recursive: false, useTrash: true });
			return code2Wasi.asErrno(result);
		} catch (error) {
			return handleError(error);
		}
	}

	function proc_exit(_rval: exitcode) {
	}

	function handleError(error: any, def: errno = Errno.badf): errno {
		if (error instanceof WasiError) {
			return error.errno;
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

	function getFileHandle(fd: fd): FileHandle {
		const result = $fileHandles.get(fd);
		if (result === undefined) {
			throw new WasiError(Errno.badf);
		}
		return result;
	}

	function getFile(fd: fd): File {
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
		if (name === '.') {
			return real;
		}
		return real.with({ path: `${real.path}/${name}`});
	}
}
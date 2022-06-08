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
	wasi_file_handle, errno, Errno, lookupflags, oflags, rights, fdflags, dircookie, PreStartDir, filetype, Rights,
	filesize, advise, filedelta, whence, filestat, iovec, ciovec, Filestat, Whence, Ciovec, Iovec, Filetype, clockid, timestamp, Clockid, Fdstat
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
  "fd_fdstat_set_flags"
  "fd_filestat_get"
  "fd_filestat_set_size"
  "fd_filestat_set_times"
  "fd_pread"
  "fd_prestat_get"
  "fd_prestat_dir_name"
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
	args_sizes_get(argvCount_ptr: ptr, argvBufSize_ptr: ptr): errno;
	args_get(argv_ptr: ptr, argvBuf_ptr: ptr): errno;
	environ_sizes_get(environCount_ptr: ptr, environBufSize_ptr: ptr): errno;
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
	fd_prestat_get(fd: wasi_file_handle, bufPtr: ptr): errno;
	fd_prestat_dir_name(fd: wasi_file_handle, pathPtr: ptr, pathLen: size): errno;
	fd_filestat_get(fd: wasi_file_handle, bufPtr: ptr): errno;
	path_open(fd: wasi_file_handle, dirflags: lookupflags, path: ptr, pathLen: size, oflags: oflags, fs_rights_base: rights, fs_rights_inheriting: rights, fdflags: fdflags, fd_ptr: ptr): errno;

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

	fd_readdir(fd: wasi_file_handle, buf_ptr: ptr, buf_len: size, cookie: dircookie, bufEndPtr: ptr): errno;
	fd_seek(fd: wasi_file_handle, offset: filedelta, whence: whence, newOffsetPtr: ptr): errno;
	fd_read(fd: wasi_file_handle, iovs_ptr: ptr, iovsLen: u32, bytesRead_ptr: ptr): errno;
	fd_write(fd: wasi_file_handle, iovs_ptr: ptr, iovsLen: u32, bytesWritten_ptr: ptr): errno;

	/**
	 * Close a file descriptor. Note: This is similar to close in POSIX.
	 * @param fd The file descriptor.
	 */
	fd_close(fd: wasi_file_handle): errno;
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

	public write(): errno {
		if (this._content === undefined) {
			return Errno.success;
		}
		return this.contentWriter(this.fileHandle.real.uri, this._content);
	}

	public setFdFlags(fdflags: fdflags): void {
		this.fdFlags = fdflags;
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
			fd_prestat_get: fd_prestat_get,
			fd_prestat_dir_name: fd_prestat_dir_name,
			fd_filestat_get: fd_filestat_get,
			path_open: path_open,
			fd_advise: fd_advise,
			fd_allocate: fd_allocate,
			fd_datasync: fd_datasync,
			fd_fdstat_get: fd_fdstat_get,
			fd_fdstat_set_flags: fd_fdstat_set_flags,
			fd_readdir: fd_readdir,
			fd_seek: fd_seek,
			fd_write: fd_write,
			fd_read: fd_read,
			fd_close: fd_close,
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

	function fd_prestat_get(fd: wasi_file_handle, bufPtr: ptr): errno {
		try {
			const fileHandleInfo = $fileHandles.get(fd);
			if (fileHandleInfo === undefined || !fileHandleInfo.preOpened) {
				return Errno.badf;
			}
			const memory = memoryView();
			const prestat = PreStartDir.create(bufPtr, memory);
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

	function fd_write(fd: wasi_file_handle, iovs_ptr: ptr, iovsLen: u32, bytesWritten_ptr: ptr): errno {
		try {
			if (fd === WASI_STDOUT_FD) {
				let written = 0;
				const buffers = read_ciovs(iovs_ptr, iovsLen);
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

	function fd_read(fd: wasi_file_handle, iovs_ptr: ptr, iovsLen: u32, bytesRead_ptr: ptr): errno {
		try {
			const memory = memoryView();
			if (fd === WASI_STDIN_FD) {
				let bytesRead = 0;
				const buffers = read_iovs(iovs_ptr, iovsLen);
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
			const buffers = read_iovs(iovs_ptr, iovsLen);
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
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// @todo dirkb
// The constants come from https://github.com/WebAssembly/WASI/blob/main/phases/snapshot/docs.md
// We need to clarify how to license them. I was not able to find a license file
// in the https://github.com/WebAssembly/WASI repository

import { URI } from 'vscode-uri';
import { ApiClient, FileSystemError, RPCError } from '@vscode/sync-api-client';

import RAL from './ral';
const paths = RAL().path;

import { ptr, size, u32 } from './baseTypes';
import {
	fd, errno, Errno, lookupflags, oflags, rights, fdflags, dircookie, filetype, Rights,
	filesize, advise, filedelta, whence, Filestat, Ciovec, Iovec, Filetype, clockid, timestamp, Clockid,
	Fdstat, fstflags, Prestat, exitcode, Oflags, Subscription, WasiError, Eventtype, Event, event,
	Subclockflags, Literal, subscription, Fdflags
} from './wasiTypes';
import { BigInts, code2Wasi } from './converter';
import { DeviceIds, FileDescriptor, FileSystem } from './fileSystem';

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

interface IOComponent {
}

class Stdin implements IOComponent {

	private readonly apiClient: ApiClient;
	private rest: Uint8Array | undefined;

	public constructor(apiClient: ApiClient) {
		this.apiClient = apiClient;
	}

	public get fd() {
		return 0;
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
		const result = this.apiClient.vscode.terminal.read();
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

export namespace WASI {

	export function create(_name: string, apiClient: ApiClient, exitHandler: (rval: number) => void, options: Options): WASI {
		let instance: WebAssembly.$Instance;

		const thread_start = RAL().clock.realtime();
		const fileDescriptors: Map<fd, FileDescriptor> = new Map();
		const encoder: RAL.TextEncoder = RAL().TextEncoder.create(options?.encoding);
		const decoder: RAL.TextDecoder = RAL().TextDecoder.create(options?.encoding);
		const stdin = new Stdin(apiClient);
		const fileSystem = FileSystem.create(apiClient, { memoryView: memoryView, memoryRaw: memoryRaw }, encoder);
		fileDescriptors.set(fileSystem.stdin.fd, fileSystem.stdin);
		fileDescriptors.set(fileSystem.stdout.fd, fileSystem.stdout);
		fileDescriptors.set(fileSystem.stderr.fd, fileSystem.stderr);

		for (const entry of options.mapDir) {
			const fileDescriptor = fileSystem.createPreOpenedFileDescriptor(
				entry.name, entry.uri, Filetype.directory,
				{ base: Rights.All, inheriting: Rights.All }, Fdflags.sync
			);
			fileDescriptors.set(fileDescriptor.fd, fileDescriptor);
		}

		const wasi: WASI = {
			initialize: (inst: WebAssembly.Instance): void => {
				instance = inst as WebAssembly.$Instance;
			},
			args_sizes_get: (argvCount_ptr: ptr, argvBufSize_ptr: ptr): errno => {
				const memory = memoryView();
				let count = 0;
				let size = 0;
				for (const arg of options.argv ?? []) {
					const value = `${arg}\0`;
					size += encoder.encode(value).byteLength;
					count++;
				}
				memory.setUint32(argvCount_ptr, count, true);
				memory.setUint32(argvBufSize_ptr, size, true);
				return Errno.success;
			},
			args_get: (argv_ptr: ptr, argvBuf_ptr: ptr): errno => {
				const memory = memoryView();
				const memoryBytes = new Uint8Array(memoryRaw());
				let entryOffset = argv_ptr;
				let valueOffset = argvBuf_ptr;
				for (const arg of options.argv ?? []) {
					const data = encoder.encode(`${arg}\0`);
					memory.setUint32(entryOffset, valueOffset, true);
					entryOffset += 4;
					memoryBytes.set(data, valueOffset);
					valueOffset += data.byteLength;
				}
				return Errno.success;
			},
			clock_res_get: (id: clockid, timestamp_ptr: ptr): errno => {
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
			},
			clock_time_get: (id: clockid, precision: timestamp, timestamp_ptr: ptr): errno => {
				const time: bigint = now(id, precision);
				const memory = memoryView();
				memory.setBigUint64(timestamp_ptr, time, true);
				return Errno.success;
			},
			environ_sizes_get: (environCount_ptr: ptr, environBufSize_ptr: ptr): errno => {
				const memory = memoryView();
				let count = 0;
				let size = 0;
				for (const entry of Object.entries(options.env ?? {})) {
					const value = `${entry[0]}=${entry[1]}\0`;
					size += encoder.encode(value).byteLength;
					count++;
				}
				memory.setUint32(environCount_ptr, count, true);
				memory.setUint32(environBufSize_ptr, size, true);
				return Errno.success;
			},
			environ_get: (environ_ptr: ptr, environBuf_ptr: ptr): errno => {
				const memory = memoryView();
				const memoryBytes = new Uint8Array(memoryRaw());
				let entryOffset = environ_ptr;
				let valueOffset = environBuf_ptr;
				for (const entry of Object.entries(options.env ?? {})) {
					const data = encoder.encode(`${entry[0]}=${entry[1]}\0`);
					memory.setUint32(entryOffset, valueOffset, true);
					entryOffset += 4;
					memoryBytes.set(data, valueOffset);
					valueOffset += data.byteLength;
				}
				return Errno.success;
			},
			fd_advise: (fd: fd, _offset: filesize, _length: filesize, _advise: advise): errno => {
				try {
					const fileHandle = getFileDescriptor(fd);
					fileHandle.assertBaseRight(Rights.fd_advise);

					// We don't have advisory in VS Code. So treat it as successful.
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_allocate: (fd: fd, offset: filesize, len: filesize): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRight(Rights.fd_allocate);
					fileSystem.allocate(fileDescriptor, offset, len);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_close: (fd: fd): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileSystem.releaseFileDescriptor(fileDescriptor);
					fileDescriptors.delete(fileDescriptor.fd);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_datasync: (fd: fd): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRight(Rights.fd_datasync);
					fileSystem.sync(fileDescriptor);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_fdstat_get: (fd: fd, fdstat_ptr: ptr): errno => {
				// This is not available under VS Code.
				try {
					const fileDescriptor = getFileDescriptor(fd);
					const memory = memoryView();
					if (fileDescriptor.isStd()) {
						const fdstat = Fdstat.create(fdstat_ptr, memory);
						fdstat.fs_filetype = Filetype.character_device;
						fdstat.fs_flags = 0;
						if (fileDescriptor.isStdin()) {
							fdstat.fs_rights_base = Rights.StdinBase;
							fdstat.fs_rights_inheriting = Rights.StdinInheriting;
						} else {
							fdstat.fs_rights_base = Rights.StdoutBase;
							fdstat.fs_rights_inheriting = Rights.StdoutInheriting;
						}
						return Errno.success;
					}
					fileSystem.fdstat(fileDescriptor, fdstat_ptr);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_fdstat_set_flags: (fd: fd, fdflags: fdflags): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRight(Rights.fd_fdstat_set_flags);
					fileDescriptor.fdflags = fdflags;
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_filestat_get: (fd: fd, filestat_ptr: ptr): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					const memory = memoryView();
					if (fileDescriptor.isStd()) {
						const fileStat = Filestat.create(filestat_ptr, memory);
						fileStat.dev = DeviceIds.system;
						fileStat.ino = fileDescriptor.inode;
						fileStat.filetype = Filetype.character_device;
						fileStat.nlink = 0n;
						fileStat.size = 101n;
						const now = BigInt(Date.now());
						fileStat.atim = now;
						fileStat.ctim = now;
						fileStat.mtim = now;
						return Errno.success;
					}
					fileDescriptor.assertBaseRight(Rights.fd_filestat_get);
					fileSystem.stat(fileDescriptor, filestat_ptr);
					return Errno.success;
				} catch (error) {
					return handleError(error, Errno.perm);
				}
			},
			fd_filestat_set_size: (fd: fd, size: filesize): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRight(Rights.fd_filestat_set_size);
					fileSystem.setSize(fileDescriptor, size);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_filestat_set_times: (fd: fd, _atim: timestamp, _mtim: timestamp, _fst_flags: fstflags): errno => {
				try {
					const fileHandle = getFileDescriptor(fd);
					fileHandle.assertBaseRight(Rights.fd_filestat_set_times);
					// todo@dirkb
					// For new we do nothing. We could cache the timestamp in memory
					// But we would loose them during reload. We could also store them
					// in local storage
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_pread: (fd: fd, iovs_ptr: ptr, iovs_len: u32, offset: filesize, bytesRead_ptr: ptr): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRight(Rights.fd_read);
					const buffers = read_iovs(iovs_ptr, iovs_len);
					let bytesRead = 0;
					for (const buffer of buffers) {
						const result = fileSystem.pread(fileDescriptor, BigInts.asNumber(offset), buffer.byteLength);
						bytesRead = bytesRead + result.byteLength;
						buffer.set(result);
					}
					memoryView().setUint32(bytesRead_ptr, bytesRead, true);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_prestat_get: (fd: fd, bufPtr: ptr): errno => {
				try {
					const fileDescriptor = fileDescriptors.get(fd);
					if (fileDescriptor === undefined || !fileDescriptor.preOpened) {
						return Errno.badf;
					}
					const memory = memoryView();
					const prestat = Prestat.create(bufPtr, memory);
					prestat.len = encoder.encode(fileDescriptor.path).byteLength;
					return Errno.success;
				} catch(error) {
					return handleError(error);
				}
			},
			fd_prestat_dir_name: (fd: fd, pathPtr: ptr, pathLen: size): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					const memory = new Uint8Array(memoryRaw(), pathPtr);
					const bytes = encoder.encode(fileDescriptor.path);
					if (bytes.byteLength !== pathLen) {
						Errno.badmsg;
					}
					memory.set(bytes);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_pwrite: (fd: fd, ciovs_ptr: ptr, ciovs_len: u32, offset: filesize, bytesWritten_ptr: ptr): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRight(Rights.fd_write);
					const buffers = read_ciovs(ciovs_ptr, ciovs_len);
					let bytesWritten = 0;
					for (const buffer of buffers) {
						bytesWritten += fileSystem.pwrite(fileDescriptor, BigInts.asNumber(offset), buffer);
					}
					memoryView().setUint32(bytesWritten_ptr, bytesWritten, true);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_read: (fd: fd, iovs_ptr: ptr, iovs_len: u32, bytesRead_ptr: ptr): errno => {
				try {
					const memory = memoryView();
					const fileDescriptor = getFileDescriptor(fd);
					if (fileDescriptor.isStdin()) {
						let bytesRead = 0;
						const buffers = read_iovs(iovs_ptr, iovs_len);
						bytesRead += stdin.read(buffers);
						memory.setUint32(bytesRead_ptr, bytesRead, true);
						return Errno.success;
					}
					fileDescriptor.assertBaseRight(Rights.fd_read);
					const buffers = read_iovs(iovs_ptr, iovs_len);
					let bytesRead = 0;
					for (const buffer of buffers) {
						const result = fileSystem.read(fileDescriptor, buffer.byteLength);
						bytesRead += result.byteLength;
						buffer.set(result);
					}
					memory.setUint32(bytesRead_ptr, bytesRead, true);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_readdir: (fd: fd, buf_ptr: ptr, buf_len: size, cookie: dircookie, buf_used_ptr: ptr): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRight(Rights.fd_readdir);
					if (fileDescriptor.fileType !== Filetype.directory) {
						return Errno.notdir;
					}
					fileSystem.readdir(fileDescriptor, buf_ptr, buf_len, cookie, buf_used_ptr);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_seek: (fd: fd, offset: filedelta, whence: whence, new_offset_ptr: ptr): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					if (fileDescriptor.isStd()) {
						return Errno.success;
					}
					fileDescriptor.assertBaseRight(Rights.fd_seek);
					const newOffset = fileSystem.seek(fileDescriptor, offset, whence);
					memoryView().setBigUint64(new_offset_ptr, BigInt(newOffset), true);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_sync: (fd: fd): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRight(Rights.fd_sync);
					fileSystem.sync(fileDescriptor);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_tell: (fd: fd, offset_ptr: ptr): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRight(Rights.fd_tell);
					const offset = fileSystem.tell(fileDescriptor);
					const memory = memoryView();
					memory.setBigUint64(offset_ptr, BigInt(offset), true);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			fd_write: (fd: fd, ciovs_ptr: ptr, ciovs_len: u32, bytesWritten_ptr: ptr): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					if (fileDescriptor.isStdout() || fileDescriptor.isStderr()) {
						let written = 0;
						const buffers = read_ciovs(ciovs_ptr, ciovs_len);
						for (const buffer of buffers) {
							apiClient.vscode.terminal.write(buffer);
							written += buffer.length;
						}
						const memory = memoryView();
						memory.setUint32(bytesWritten_ptr, written, true);
						return Errno.success;
					}
					fileDescriptor.assertBaseRight(Rights.fd_write);

					const buffers = read_ciovs(ciovs_ptr, ciovs_len);
					const bytesWritten: size = fileSystem.write(fileDescriptor, buffers);
					const memory = memoryView();
					memory.setUint32(bytesWritten_ptr, bytesWritten, true);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			path_create_directory: (fd: fd, path_ptr: ptr, path_len: size): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRight(Rights.path_create_directory);
					fileDescriptor.assertIsDirectory();

					const memory = memoryRaw();
					const name = decoder.decode(new Uint8Array(memory, path_ptr, path_len));
					fileSystem.createDirectory(fileDescriptor, name);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			path_filestat_get: (fd: fd, _flags: lookupflags, path_ptr: ptr, path_len: size, filestat_ptr: ptr): errno => {
				// VS Code has not support to follow sym links.
				// So we ignore lookupflags for now
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRight(Rights.path_filestat_get);
					fileDescriptor.assertIsDirectory();

					const memory = memoryRaw();
					const name = decoder.decode(new Uint8Array(memory, path_ptr, path_len));
					fileSystem.path_stat(fileDescriptor, name, filestat_ptr);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			path_filestat_set_times: (fd: fd, _flags: lookupflags, _path_ptr: ptr, _path_len: size, _atim: timestamp, _mtim: timestamp, _fst_flags: fstflags): errno => {
				// VS Code has not support to follow sym links.
				// So we ignore lookupflags for now
				try {
					const fileHandle = getFileDescriptor(fd);
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
			},
			path_link: (old_fd: fd, _old_flags: lookupflags, _old_path_ptr: ptr, _old_path_len: size, new_fd: fd, _new_path_ptr: ptr, _new_path_len: size): errno => {
				// VS Code has not support to create sym links.
				try {
					const oldFileHandle = getFileDescriptor(old_fd);
					oldFileHandle.assertBaseRight(Rights.path_link_source);
					oldFileHandle.assertIsDirectory();

					const newFileHandle = getFileDescriptor(new_fd);
					newFileHandle.assertBaseRight(Rights.path_link_target);
					newFileHandle.assertIsDirectory();

					// todo@dirkb
					// For now we do nothing. If we need to implement this we need
					// support from the VS Code API.
					return Errno.nosys;
				} catch (error) {
					return handleError(error);
				}
			},
			path_open: (fd: fd, _dirflags: lookupflags, path: ptr, pathLen: size, oflags: oflags, fs_rights_base: rights, fs_rights_inheriting: rights, fdflags: fdflags, fd_ptr: ptr): errno => {
				try {
					const parentDescriptor = getFileDescriptor(fd);
					parentDescriptor.assertBaseRight(Rights.path_open);

					const memory = memoryView();
					const name = decoder.decode(new Uint8Array(memoryRaw(), path, pathLen));

					let filetype: filetype | undefined = fileSystem.path_filetype(parentDescriptor, name);
					const entryExists: boolean = filetype !== undefined;
					if (entryExists) {
						if (Oflags.exclOn(oflags)) {
							return Errno.exist;
						} else if (Oflags.directoryOn(oflags) && filetype !== Filetype.directory) {
							return Errno.notdir;
						}
					} else {
						// Entry does not exist;
						if (Oflags.creatOff(oflags)) {
							return Errno.noent;
						}
					}
					let createFile: boolean = false;
					if (Oflags.creatOn(oflags) && !entryExists) {
						// Ensure parent handle is directory
						parentDescriptor.assertIsDirectory();
						const dirname = paths.dirname(name);
						// The name has a directory part. Ensure that the directory exists
						if (dirname !== '.') {
							const dirFiletype = fileSystem.path_filetype(parentDescriptor, dirname);
							if (dirFiletype === undefined || dirFiletype !== Filetype.directory) {
								return Errno.noent;
							}
						}
						filetype = Filetype.regular_file;
						createFile = true;
					} else {
						if (filetype === undefined) {
							return Errno.noent;
						}
					}
					// Currently VS Code doesn't offer a generic API to open a file
					// or a directory. Since we were able to stat the file we create
					// a file descriptor for it and lazy get the file content on read.
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
					const fileDescriptor = fileSystem.createFileDescriptor(
						parentDescriptor, name,
						filetype, { base: base, inheriting: inheriting }, fdflags,
					);
					fileDescriptors.set(fileDescriptor.fd, fileDescriptor);
					memory.setUint32(fd_ptr, fileDescriptor.fd, true);
					if (createFile || Oflags.truncOn(oflags)) {
						fileSystem.write(fileDescriptor, [new Uint8Array(0)]);
					}
					return Errno.success;
				} catch(error) {
					return handleError(error);
				}
			},
			path_readlink: (fd: fd, _path_ptr: ptr, _path_len: size, _buf: ptr, _buf_len: size, _result_size_ptr: ptr): errno => {
				// VS Code has no support to follow a symlink.
				try {
					const fileHandle = getFileDescriptor(fd);
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
			},
			path_remove_directory: (fd: fd, path_ptr: ptr, path_len: size): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRight(Rights.path_remove_directory);
					fileDescriptor.assertIsDirectory();

					const memory = memoryRaw();
					const name = decoder.decode(new Uint8Array(memory, path_ptr, path_len));
					fileSystem.path_remove_directory(fileDescriptor, name);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			path_rename: (old_fd: fd, old_path_ptr: ptr, old_path_len: size, new_fd: fd, new_path_ptr: ptr, new_path_len: size): errno => {
				try {
					const oldFileDescriptor = getFileDescriptor(old_fd);
					oldFileDescriptor.assertBaseRight(Rights.path_rename_source);
					oldFileDescriptor.assertIsDirectory();

					const newFileDescriptor = getFileDescriptor(new_fd);
					newFileDescriptor.assertBaseRight(Rights.path_rename_target);
					newFileDescriptor.assertIsDirectory();

					const memory = memoryRaw();
					const oldName = decoder.decode(new Uint8Array(memory, old_path_ptr, old_path_len));
					const newName = decoder.decode(new Uint8Array(memory, new_path_ptr, new_path_len));
					fileSystem.path_rename(oldFileDescriptor, oldName, newFileDescriptor, newName);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			path_symlink: (_old_path_ptr: ptr, _old_path_len: size, fd: fd, _new_path_ptr: ptr, _new_path_len: size): errno => {
				// VS Code has no support to create a symlink.
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRight(Rights.path_symlink);
					fileDescriptor.assertIsDirectory();
					return Errno.nosys;
				} catch (error) {
					return handleError(error);
				}
			},
			path_unlink_file: (fd: fd, path_ptr: ptr, path_len: size): errno => {
				try {
					const fileDescriptor = getFileDescriptor(fd);
					fileDescriptor.assertBaseRight(Rights.path_unlink_file);
					fileDescriptor.assertIsDirectory();

					const memory = memoryRaw();
					const name = decoder.decode(new Uint8Array(memory, path_ptr, path_len));

					const filetype = fileSystem.path_filetype(fileDescriptor, name);
					if (filetype === undefined) {
						return Errno.noent;
					}
					if (filetype === Filetype.directory) {
						return Errno.isdir;
					}
					fileSystem.path_unlink_file(fileDescriptor, name);
					return Errno.success;
				} catch (error) {
					return handleError(error);
				}
			},
			poll_oneoff: (input: ptr, output: ptr, subscriptions: size, result_size_ptr: ptr): errno => {
				try {
					const memory = memoryView();
					let { events, needsTimeOut, timeout } = handleSubscriptions(memory, input, subscriptions);
					if (needsTimeOut && timeout !== undefined && timeout !== 0n) {
						// Timeout is in ns but sleep API is in ms.
						apiClient.timer.sleep(BigInts.asNumber(timeout / 1000000n));
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
			},
			proc_exit: (rval: exitcode) => {
				exitHandler(rval);
			},
			sched_yield: (): errno => {
				return Errno.nosys;
			},
			random_get: (buf: ptr, buf_len: size): errno => {
				const random = RAL().crypto.randomGet(buf_len);
				const memory = memoryRaw();
				new Uint8Array(memory, buf, buf_len).set(random);
				return Errno.success;
			},
			sock_accept: (_fd: fd, _flags: fdflags, _result_fd_ptr: ptr): errno => {
				return Errno.nosys;
			}
		};

		function now(id: clockid, _precision: timestamp): bigint {
			switch(id) {
				case Clockid.realtime:
					return RAL().clock.realtime();
				case Clockid.monotonic:
					return RAL().clock.monotonic();
				case Clockid.process_cputime_id:
				case Clockid.thread_cputime_id:
					return RAL().clock.monotonic() - thread_start;
				default:
					throw new WasiError(Errno.inval);
			}
		}

		function memoryView(): DataView {
			if (instance === undefined) {
				throw new Error(`WASI layer is not initialized. Missing WebAssembly instance.`);
			}
			return new DataView(instance.exports.memory.buffer);
		}

		function memoryRaw(): ArrayBuffer {
			if (instance === undefined) {
				throw new Error(`WASI layer is not initialized. Missing WebAssembly instance.`);
			}
			return instance.exports.memory.buffer;
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
				const fileDescriptor = getFileDescriptor(fd);
				fileDescriptor.assertBaseRight(Rights.fd_read);
				const available = fileSystem.bytesAvailable(fileDescriptor);
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
				const fileHandle = getFileDescriptor(fd);
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

		function getFileDescriptor(fd: fd): FileDescriptor {
			const result = fileDescriptors.get(fd);
			if (result === undefined) {
				throw new WasiError(Errno.badf);
			}
			return result;
		}

		return wasi;
	}
}
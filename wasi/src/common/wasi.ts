/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// @todo dirkb
// The constants come from https://github.com/WebAssembly/WASI/blob/main/phases/snapshot/docs.md
// We need to clarify how to license them. I was not able to find a license file
// in the https://github.com/WebAssembly/WASI repository

import { ApiClient } from 'vscode-sync-api-client';

import RAL from './ral';
import Errno from './errno';

export type u8 = number;
export type u16 = number;
export type u32 = number;
export type u64 = number;
export type ptr<_size = u8> =  number;

export type size = u32;

export type wasi_file_handle = u32;

// Same as Unit file descriptors
export const WASI_STDIN_FD: 0 = 0;
export const WASI_STDOUT_FD: 1 = 1;
export const WASI_STDERR_FD: 2 = 2;

type errno = u16;
type rights = u64;
type dircookie = u64;

type fdflags = u16;
enum FdFlags {

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

type lookupflags = u32;
enum LookupFlags {
	/**
	 * As long as the resolved path corresponds to a symbolic link, it is expanded.
	 */
	symlink_follow = 1 << 0
}

type oflags = u16;
enum OFlags {
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

/**
 * C IO vector
 */
type Ciovec = {

	/**
	 * The size of a CioVec view in u8
	 */
	get $size(): u32;

	/**
	 * Pointer in memory where the data is stored
	 */
	get buf(): ptr;

	/**
	 * The length of the data.
	 */
	get bufLen(): u32;
};

namespace Ciovec {
	export function create(ptr: ptr, memory: DataView): Ciovec {
		return {
			get $size(): u32 {
				return 8;
			},
			get buf(): ptr {
				return memory.getUint32(ptr, true);
			},
			get bufLen(): u32 {
				return memory.getUint32(ptr + 4, true);
			}
		};
	}
}

export interface Environment {
	[key: string]: string;
}

export interface WASI {
	initialize(memory: ArrayBuffer): void;
	args_sizes_get(argvCount_ptr: ptr, argvBufSize_ptr: ptr): errno;
	args_get(argv_ptr: ptr, argvBuf_ptr: ptr): errno;
	environ_sizes_get(environCount_ptr: ptr, environBufSize_ptr: ptr): errno;
	environ_get(environ_ptr: ptr, environBuf_ptr: ptr): errno;
	path_open(fd: wasi_file_handle, dirflags: lookupflags, path: ptr, pathLen: size, oflags: oflags, fs_rights_base: rights, fs_rights_inheriting: rights, fdflags: fdflags, fd_ptr: ptr): errno;
	fd_readdir(fd: wasi_file_handle, buf_ptr: ptr, buf_len: size, cookie: dircookie, bufEndPtr: ptr): errno;
	fd_write(fd: wasi_file_handle, iovs_ptr: ptr, iovsLen: u32, bytesWritten_ptr: ptr): errno;
	fd_read(fd: wasi_file_handle, iovs_ptr: ptr, iovsLen: u32, bytesRead_ptr: ptr): errno;
	proc_exit(): errno;
}

export type Options = {
	/**
	 * Command line arguments accessible in the WASM.
	 */
	argv?: string [];

	/**
	 * The environment accessible in the WASM.
	 */
	env?: Environment;

	/**
	 * The encoding to use.
	 */
	encoding?: string;
};

export namespace WASI {

	let $memory: ArrayBuffer | undefined;
	let $memoryLength: number = -1;
	let $memoryView: DataView | undefined;

	let $encoder: RAL.TextEncoder;
	let $decoder: RAL.TextDecoder;

	let $name: string;
	let $apiClient: ApiClient;
	let $options: Options;

	export function create(name: string, apiClient: ApiClient, options?: Options): WASI {
		$name = name;
		$apiClient = apiClient;

		$encoder = RAL().TextEncoder.create(options?.encoding);
		$decoder = RAL().TextDecoder.create(options?.encoding);

		$options = options ?? { };

		return {
			initialize: initialize,
			args_sizes_get: args_sizes_get,
			args_get: args_get,
			environ_sizes_get: environ_sizes_get,
			environ_get: environ_get,
			path_open: path_open,
			fd_readdir: fd_readdir,
			fd_write: fd_write,
			fd_read: fd_read,
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

	function path_open(fd: wasi_file_handle, dirflags: lookupflags, path: ptr, pathLen: size, oflags: oflags, fs_rights_base: rights, fs_rights_inheriting: rights, fdflags: fdflags, fd_ptr: ptr): errno {
		return Errno.success;
	}

	function fd_readdir(fd: wasi_file_handle, buf_ptr: ptr, buf_len: size, cookie: dircookie, bufEndPtr: ptr): errno {
		return Errno.success;
	}

	function fd_write(fd: wasi_file_handle, iovs_ptr: ptr, iovsLen: u32, bytesWritten_ptr: ptr): errno {
		if (fd === WASI_STDOUT_FD) {
			let written = 0;
			const buffers = readIOvs(iovs_ptr, iovsLen);
			for (const buffer of buffers) {
				$apiClient.terminal.write(buffer);
				written += buffer.length;
			}
			const memory = memoryView();
			memory.setUint32(bytesWritten_ptr, written, true);
		}
		return Errno.success;
	}

	function fd_read(fd: wasi_file_handle, iovs_ptr: ptr, iovsLen: u32, bytesRead_ptr: ptr): errno {
		const memory = memoryView();
		if (fd === WASI_STDIN_FD) {
			let bytesRead = 0;
			const buffers = readIOvs(iovs_ptr, iovsLen);
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
		}
		return Errno.success;
	}

	function proc_exit(): errno {
		return Errno.success;
	}

	function readIOvs (iovs: ptr, iovsLen: u32): Uint8Array[] {
		const memory = memoryView();
		const buffer = memoryRaw();

		const buffers: Uint8Array[] = [];
		let ptr: ptr = iovs;
		for (let i = 0; i < iovsLen; i++) {
			const ciovec = Ciovec.create(ptr, memory);
			buffers.push(new Uint8Array(buffer, ciovec.buf, ciovec.bufLen));
			ptr += ciovec.$size;

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
}
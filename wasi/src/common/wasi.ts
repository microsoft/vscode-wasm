/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// @todo dirkb
// The constants come from https://github.com/WebAssembly/WASI/blob/main/phases/snapshot/docs.md
// We need to clarify how to license them. I was not able to find a license file
// in the https://github.com/WebAssembly/WASI repository

import RAL from './ral';

import { ApiClient } from 'vscode-sync-api-client';

import { ptr, size, u32 } from './baseTypes';
import {
	wasi_file_handle, Errno, errno, lookupflags, oflags, rights, fdflags, dircookie,
	PreStartDir, Ciovec, FileType
} from './wasiTypes';

// Same as Unix file descriptors
export const WASI_STDIN_FD: 0 = 0;
export const WASI_STDOUT_FD: 1 = 1;
export const WASI_STDERR_FD: 2 = 2;

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
	fd_prestat_get(fd: wasi_file_handle, bufPtr: ptr): errno;
	fd_prestat_dir_name(fd: wasi_file_handle, pathPtr: ptr, pathLen: size): errno;
	fd_readdir(fd: wasi_file_handle, buf_ptr: ptr, buf_len: size, cookie: dircookie, bufEndPtr: ptr): errno;
	fd_write(fd: wasi_file_handle, iovs_ptr: ptr, iovsLen: u32, bytesWritten_ptr: ptr): errno;
	fd_read(fd: wasi_file_handle, iovs_ptr: ptr, iovsLen: u32, bytesRead_ptr: ptr): errno;
	fd_close(fd: wasi_file_handle): errno;
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

type FileHandleInfo = {
	/**
	 * The WASI file handle
	 */
	fd: wasi_file_handle;

	/**
	 * The real file handle (e.g. the one from Node or VS Code)
	 */
	realFd: number;

	/**
	 * The path name.
	 */
	path: string;

	/**
	 * Whether this is a pre-opened directory.
	 */
	preOpened: boolean;

	/**
	 * The file type
	 */
	fileType: FileType;
};

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

	const $fileHandles: Map<wasi_file_handle, FileHandleInfo> = new Map();

	export function create(name: string, apiClient: ApiClient, options?: Options): WASI {
		$name = name;
		$apiClient = apiClient;

		$encoder = RAL().TextEncoder.create(options?.encoding);
		$decoder = RAL().TextDecoder.create(options?.encoding);

		$options = options ?? { };

		// Pre opened directories.
		$fileHandles.set(3, { fd: 3, realFd: -3, preOpened: true, fileType: FileType.directory, path: '.'});
		$fileHandles.set(4, { fd: 4, realFd: -4, preOpened: true,  fileType: FileType.directory, path: '/'});

		return {
			initialize: initialize,
			args_sizes_get: args_sizes_get,
			args_get: args_get,
			environ_sizes_get: environ_sizes_get,
			environ_get: environ_get,
			fd_prestat_get: fd_prestat_get,
			fd_prestat_dir_name: fd_prestat_dir_name,
			path_open: path_open,
			fd_readdir: fd_readdir,
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
			const fileHandleInfo = getFileHandleInfo(fd);
			const memory = new Uint8Array(memoryRaw(), pathPtr);
			const bytes = $encoder.encode(fileHandleInfo.path);
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

	function path_open(fd: wasi_file_handle, dirflags: lookupflags, path: ptr, pathLen: size, oflags: oflags, fs_rights_base: rights, fs_rights_inheriting: rights, fdflags: fdflags, fd_ptr: ptr): errno {
		try {
			const memory = memoryView();
			const name = $decoder.decode(new Uint8Array(memoryRaw(), path, pathLen));
			return Errno.success;
		} catch(error) {
			if (error instanceof WasiError) {
				return error.errno;
			}
			return Errno.perm;
		}
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

	function fd_close(fd: wasi_file_handle): errno {
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

	function getFileHandleInfo(fd: wasi_file_handle): FileHandleInfo {
		const result = $fileHandles.get(fd);
		if (result === undefined) {
			throw new WasiError(Errno.badf);
		}
		return result;
	}
}
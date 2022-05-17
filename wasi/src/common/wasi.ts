/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { EventEmitter, Terminal, window } from 'vscode';
import RAL from './ral';

export type u8 = number;
export type u16 = number;
export type u32 = number;
export type ptr<_size = u8> =  number;

export type Size = u32;
export type Errno = u16;

export type wasi_file_handle = u32;

export const WASI_ESUCCESS: 0 = 0;
export const WASI_EINVAL: 28 = 28;
export const WASI_EPERM: 63 = 63;

// Same as Unit file descriptors
export const WASI_STDIN_FD: 0 = 0;
export const WASI_STDOUT_FD: 1 = 1;
export const WASI_STDERR_FD: 2 = 2;

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
	args_sizes_get(argvCount_ptr: ptr, argvBufSize_ptr: ptr): Errno;
	args_get(argv_ptr: ptr, argvBuf_ptr: ptr): Errno;
	environ_sizes_get(environCount_ptr: ptr, environBufSize_ptr: ptr): Errno;
	environ_get(environ_ptr: ptr, environBuf_ptr: ptr): Errno;
	fd_write(fd: wasi_file_handle, iovs_ptr: ptr, iovsLen: u32, bytesWritten_ptr: ptr): Errno;
	fd_read(fd: wasi_file_handle, iovs_ptr: ptr, iovsLen: u32, bytesRead_ptr: ptr): Errno;
	proc_exit(): Errno;
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

	/**
	 * Terminal to use
	 */
	ptyWriteEmitter?: EventEmitter<string>;
};

const terminalRegExp = /(\r\n)|(\n)/gm;

export namespace WASI {

	let $memory: ArrayBuffer | undefined;
	let $memoryLength: number = -1;
	let $memoryView: DataView | undefined;

	let $encoder: RAL.TextEncoder;
	let $decoder: RAL.TextDecoder;

	let $name: string;
	let $options: Options;
	let $ptyWriteEmitter: EventEmitter<string>;

	export function create(name: string, options?: Options): WASI {
		$name = name;
		$encoder = RAL().TextEncoder.create(options?.encoding);
		$decoder = RAL().TextDecoder.create(options?.encoding);

		$options = options ?? { };

		if ($options.ptyWriteEmitter !== undefined) {
			$ptyWriteEmitter = $options.ptyWriteEmitter;
		} else {
			$ptyWriteEmitter = new EventEmitter<string>();
			const pty = {
				onDidWrite: $ptyWriteEmitter.event,
				open: () => {
					$ptyWriteEmitter.fire(`\x1b[31m${name}\x1b[0m\r\n\r\n`);
				},
				close: () => {
				},
				handleInput: (data: string) => {
					$ptyWriteEmitter.fire(data === '\r' ? '\r\n' : data);
				}
			};
			window.createTerminal({ name: name, pty: pty });
		}

		return {
			initialize: initialize,
			args_sizes_get: args_sizes_get,
			args_get: args_get,
			environ_sizes_get: environ_sizes_get,
			environ_get: environ_get,
			fd_write: fd_write,
			fd_read: fd_read,
			proc_exit: proc_exit
		};
	}

	function initialize(memory: ArrayBuffer): void {
		$memory = memory;
	}

	function args_sizes_get(argvCount_ptr: ptr, argvBufSize_ptr: ptr): Errno {
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
		return WASI_ESUCCESS;
	}

	function args_get(argv_ptr: ptr, argvBuf_ptr: ptr): Errno {
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
		return WASI_ESUCCESS;
	}

	function environ_sizes_get(environCount_ptr: ptr, environBufSize_ptr: ptr): Errno {
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
		return WASI_ESUCCESS;
	}

	function environ_get(environ_ptr: ptr, environBuf_ptr: ptr): Errno {
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
		return WASI_ESUCCESS;
	}

	function fd_write(fd: wasi_file_handle, iovs_ptr: ptr, iovsLen: u32, bytesWritten_ptr: ptr): Errno {
		if (fd === WASI_STDOUT_FD) {
			let written = 0;
			const buffers = readIOvs(iovs_ptr, iovsLen);
			for (const buffer of buffers) {
				const value = $decoder.decode(buffer).replace(terminalRegExp, (match, m1, m2) => {
					if (m1) {
						return m1;
					} else if (m2) {
						return '\r\n';
					} else {
						return match;
					}
				});
				$ptyWriteEmitter.fire(value);
				written += buffer.length;
			}
			const memory = memoryView();
			memory.setUint32(bytesWritten_ptr, written, true);
		}
		return WASI_ESUCCESS;
	}

	function fd_read(fd: wasi_file_handle, iovs_ptr: ptr, iovsLen: u32, bytesRead_ptr: ptr): Errno {
		if (fd === WASI_STDIN_FD) {
			// Currently we can't read from stdin. In the Web / and VS Code
			// reading is async which we can't map. In node we could
			// work around it using readSync but that doesn't work in all cases.
			const memory = memoryView();
			memory.setUint32(bytesRead_ptr, 0, true);
			return WASI_EINVAL;
		}
		return WASI_ESUCCESS;
	}

	function proc_exit(): Errno {
		return WASI_ESUCCESS;
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
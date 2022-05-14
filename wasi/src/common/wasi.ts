/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export type u8 = number;
export type u16 = number;
export type u32 = number;
export type ptr<_size = u8> =  number;

export type Size = u32;
export type Errno = u16;

export type wasi_file_handle = u32;

export const WASI_ESUCCESS: 0 = 0

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
}

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
		}
	}
}

class StdOut {

	private active: Uint8Array | undefined;
	private rest: Uint8Array[];

	constructor() {
		this.active = undefined;
		this.rest = [];
	}

	public write(buffer: Uint8Array): number {
		if (this.active === undefined) {
			this.active = buffer;
		} else {
			this.rest.push(buffer);
		}
		setImmediate(() => this.work());
		return buffer.length;
	}

	private work(): void {
		if (this.active === undefined) {
			this.active = this.rest.shift();
		}
		if (this.active === undefined) {
			return;
		}
		process.stdout.write(this.active);
		this.active = undefined;
		if (this.rest.length > 0) {
			setImmediate(() => this.work());
		}
	}
}

interface WASI {
	initialize(memory: ArrayBuffer): void;
	environ_sizes_get(environCount_ptr: ptr, environBufSize_ptr: ptr): Errno;
	environ_get(environ_ptr: ptr, environBuf_ptr: ptr): Errno;
	fd_write(fd: wasi_file_handle, iovs_ptr: ptr, iovsLen: u32, bytesWritten_ptr: ptr): Errno;
	proc_exit(): Errno;
}

namespace WASI {

	let $memory: ArrayBuffer | undefined;
	let $memoryLength: number = -1;
	let $memoryView: DataView | undefined;

	const $stdout = new StdOut();

	export function create(): WASI {
		return {
			initialize: initialize,
			environ_sizes_get: environ_sizes_get,
			environ_get: environ_get,
			fd_write: fd_write,
			proc_exit: proc_exit
		};
	}

	function initialize(memory: ArrayBuffer): void {
		$memory = memory;
	}

	function environ_sizes_get(environCount_ptr: ptr, environBufSize_ptr: ptr): Errno {
		const memory = memoryView();
		memory.setUint32(environCount_ptr, 0, true);
		memory.setUint32(environBufSize_ptr, 0, true);
		return WASI_ESUCCESS;
	}

	function environ_get(environ_ptr: ptr, environBuf_ptr: ptr): Errno {
		const memory = memoryView();
		memory.setUint32(environ_ptr, 0, true);
		memory.setUint32(environBuf_ptr, 0, true);
		return WASI_ESUCCESS;
	}

	function fd_write(fd: wasi_file_handle, iovs_ptr: ptr, iovsLen: u32, bytesWritten_ptr: ptr): Errno {
		if (fd === WASI_STDOUT_FD) {
			let written = 0;
			const buffers = readIOvs(iovs_ptr, iovsLen);
			for (const buffer of buffers) {
				$stdout.write(buffer);
				written += buffer.length;
			}
			const memory = memoryView();
			memory.setUint32(bytesWritten_ptr, written, true);
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
	};

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
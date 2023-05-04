/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RAL from './ral';
import { byte, bytes, cstring, ptr, size, u32, u64 } from './baseTypes';
import { Advise, Clockid, Errno, Fdflags, Fdstat, Filestat, Filetype, Fstflags, Lookupflags, Oflags, Prestat, Sdflags, Whence, advise, ciovec, clockid, dircookie, dirent, errno, event, exitcode, fd, fdflags, fdstat, filedelta, filesize, filestat, fstflags, iovec, lookupflags, oflags, prestat, rights, sdflags, subscription, timestamp, whence } from './wasi';

namespace wasi {
	export type Uint32 = { readonly $ptr: ptr; value: number };
	export type Uint32Array = { readonly $ptr: ptr;  size: number; get(index: number): number; set(index: number, value: number): void };

	export type Uint64 = { readonly $ptr: ptr; value: bigint };

	export type String = { readonly $ptr: ptr; byteLength: number };
	export type StringBuffer = { readonly $ptr: ptr; get value(): string };

	export type Bytes = { readonly $ptr: ptr; readonly byteLength: number };

	export type StructArray<T> = { readonly $ptr: ptr;  size: number; get(index: number): T };
}

export class Memory {

	private readonly raw: ArrayBuffer;
	private readonly dataView: DataView;
	private readonly decoder: RAL.TextDecoder;

	constructor(raw: ArrayBuffer) {
		this.raw = raw;
		this.dataView = new DataView(this.raw);
		this.decoder = RAL().TextDecoder.create();
	}

	public readUint32(ptr: ptr): u32 {
		return this.dataView.getUint32(ptr, true);
	}

	public readUint32Array(ptr: ptr<u32>, size: number): wasi.Uint32Array {
		const view = this.dataView;
		return {
			get $ptr(): ptr { return ptr; },
			get size(): number { return size; },
			get(index: number): number { return view.getUint32(ptr + index * Uint32Array.BYTES_PER_ELEMENT, true); },
			set(index: number, value: number) { view.setUint32(ptr + index * Uint32Array.BYTES_PER_ELEMENT, value, true); }
		};
	}

	public readUint64(ptr: ptr): u64 {
		return this.dataView.getBigUint64(ptr, true);
	}

	public readStruct<T>(ptr: ptr<T>, info: { size: number; create: (memory: DataView, ptr: ptr) => T }): T {
		return info.create(this.dataView, ptr);
	}

	public readString(ptr: ptr, len: number = -1): string {
		const length = len === -1 ? this.getStringLength(ptr) : len;
		if (length === -1) {
			throw new Error(`No null terminate character found`);
		}
		return this.decoder.decode((new Uint8Array(this.raw, ptr, length)).slice(0));
	}

	public readBytes(ptr: ptr, length: number): Uint8Array {
		return new Uint8Array(this.raw, ptr, length);
	}

	private getStringLength(start: ptr): number {
		const bytes = new Uint8Array(this.raw);
		let index = start;
		while (index < bytes.byteLength) {
			if (bytes[index] === 0) {
				return index - start;
			}
			index++;
		}
		return -1;
	}
}

export interface TraceMessage {
	[name: string]: (memory: ArrayBuffer, result: errno, ...args: (number & bigint)[]) => string;
}

export namespace TraceMessage {
	export function create(): TraceMessage {

		let argvCount: u32 = 0;
		let argvBufSize: u32 = 0;
		let environCount: u32 = 0;
		let environBufSize: u32 = 0;

		const preStats: Map<fd, string> = new Map();
		const fileDescriptors: Map<fd, string> = new Map();

		function getFileDescriptorPath(fd: fd): string {
			switch(fd) {
				case 0: return 'stdin';
				case 1: return 'stdout';
				case 2: return 'stderr';
				default: return fileDescriptors.get(fd) || `fd: ${fd}`;
			}
		}

		return {
			args_sizes_get: (_memory: ArrayBuffer, result: errno, argvCount_ptr: ptr<u32>, argvBufSize_ptr: ptr<u32>): string => {
				if (result === Errno.success) {
					const memory = new Memory(_memory);
					argvCount = memory.readUint32(argvCount_ptr);
					argvBufSize = memory.readUint32(argvBufSize_ptr);
					return `args_sizes_get() => [count: ${argvCount}, bufSize: ${argvBufSize}, result: ${Errno.toString(result)}]`;
				} else {
					return `args_sizes_get() => [result: ${Errno.toString(result)}]`;
				}
			},
			args_get: (_memory: ArrayBuffer, result: errno, argv_ptr: ptr<u32[]>, _argvBuf_ptr: ptr<cstring>): string => {
				if (result === Errno.success) {
					const memory = new Memory(_memory);
					const argv = memory.readUint32Array(argv_ptr, argvCount);
					const buffer: string[] = [`args_get() => [result: ${Errno.toString(result)}]`];
					for (let i = 0; i < argvCount; i++) {
						const valueStartOffset = argv.get(i);
						const arg = memory.readString(valueStartOffset);
						buffer.push(`\t${i}: ${arg}`);
					}
					return buffer.join('\n');
				} else {
					return `args_get() => [result: ${Errno.toString(result)}]`;
				}
			},
			environ_sizes_get: (_memory: ArrayBuffer, result: errno, environCount_ptr: ptr<u32>, environBufSize_ptr: ptr<u32>): string => {
				if (result === Errno.success) {
					const memory = new Memory(_memory);
					environCount = memory.readUint32(environCount_ptr);
					environBufSize = memory.readUint32(environBufSize_ptr);
					return `environ_sizes_get() => [envCount: ${environCount}, envBufSize: ${environBufSize}, result: ${Errno.toString(result)}]`;
				} else {
					return `environ_sizes_get() => [result: ${Errno.toString(result)}]`;
				}
			},
			environ_get: (_memory: ArrayBuffer, result: errno, environ_ptr: ptr<u32>, _environBuf_ptr: ptr<cstring>): string => {
				if (result === Errno.success) {
					const memory = new Memory(_memory);
					const environ = memory.readUint32Array(environ_ptr, environCount);
					const buffer: string[] = [`environ_get() => [result: ${Errno.toString(result)}]`];
					for (let i = 0; i < environCount; i++) {
						const valueStartOffset = environ.get(i);
						const env = memory.readString(valueStartOffset);
						buffer.push(`\t${i}: ${env}`);
					}
					return buffer.join('\n');
				} else {
					return `environ_get() => [result: ${Errno.toString(result)}]`;
				}
			},
			fd_prestat_get: (_memory: ArrayBuffer, result: errno, fd: fd, bufPtr: ptr<prestat>): string => {
				if (result === Errno.success) {
					const memory = new Memory(_memory);
					const prestat = memory.readStruct(bufPtr, Prestat);
					return `fd_prestat_get(fd: ${fd}) => [prestat: ${JSON.stringify(prestat, undefined, 0)}, result: ${Errno.toString(result)}]`;
				} else {
					return `fd_prestat_get(fd: ${fd}) => [result: ${Errno.toString(result)}]`;
				}
			},
			fd_prestat_dir_name: (_memory: ArrayBuffer, result: errno, fd: fd, pathPtr: ptr<byte[]>, pathLen: size): string => {
				if (result === Errno.success) {
					const memory = new Memory(_memory);
					const path = memory.readString(pathPtr, pathLen);
					preStats.set(fd, path);
					fileDescriptors.set(fd, path);
					return `fd_prestat_dir_name(fd: ${fd}) => [path: ${path}, result: ${Errno.toString(result)}]`;
				} else {
					return `fd_prestat_dir_name(fd: ${fd}) => [result: ${Errno.toString(result)}]`;
				}
			},
			clock_res_get: (_memory: ArrayBuffer, result: errno, id: clockid, timestamp_ptr: ptr<u64>): string => {
				if (result === Errno.success) {
					const memory = new Memory(_memory);
					return `clock_res_get(id: ${Clockid.toString(id)}) => [timestamp: ${memory.readUint64(timestamp_ptr)}, result: ${Errno.toString(result)}]`;
				} else {
					return `clock_res_get(id: ${Clockid.toString(id)}) => [result: ${Errno.toString(result)}]`;
				}
			},
			clock_time_get: (_memory: ArrayBuffer, result: errno, id: clockid, precision: timestamp, timestamp_ptr: ptr<u64>): string => {
				if (result === Errno.success) {
					const memory = new Memory(_memory);
					return `clock_time_get(id: ${Clockid.toString(id)}, precision: ${precision}) => [timestamp: ${memory.readUint64(timestamp_ptr)}, result: ${Errno.toString(result)}]`;
				} else {
					return `clock_time_get(id: ${Clockid.toString(id)}, precision: ${precision}) => [result: ${Errno.toString(result)}]`;
				}
			},
			fd_advise: (_memory: ArrayBuffer, result: errno, fd: fd, offset: filesize, length: filesize, advise: advise): string => {
				return `fd_advise(fd: ${fd} => ${getFileDescriptorPath(fd)}, offset: ${offset}, length: ${length}, advise: ${Advise.toString(advise)}) => [result: ${Errno.toString(result)}]`;
			},
			fd_allocate: (_memory: ArrayBuffer, result: errno, fd: fd, offset: filesize, len: filesize): string => {
				return `fd_allocate(fd: ${fd} => ${getFileDescriptorPath(fd)}, offset: ${offset}, len: ${len}) => [result: ${Errno.toString(result)}]`;
			},
			fd_close: (_memory: ArrayBuffer, result: errno, fd: fd): string => {
				const message = `fd_close(fd: ${fd} => ${getFileDescriptorPath(fd)}) => [result: ${Errno.toString(result)}]`;
				fileDescriptors.delete(fd);
				return message;
			},
			fd_datasync: (_memory: ArrayBuffer, result: errno, fd: fd): string => {
				return `fd_datasync(fd: ${fd} => ${getFileDescriptorPath(fd)}) => [result: ${Errno.toString(result)}]`;
			},
			fd_fdstat_get: (_memory: ArrayBuffer, result: errno, fd: fd, fdstat_ptr: ptr<fdstat>): string => {
				if (result === Errno.success) {
					const memory = new Memory(_memory);
					const fdstat = memory.readStruct(fdstat_ptr, Fdstat);
					return `fd_fdstat_get(fd: ${fd} => ${getFileDescriptorPath(fd)}) => [fdstat: ${Filetype.toString(fdstat.fs_filetype)}}, result: ${Errno.toString(result)}]`;
				} else {
					return `fd_fdstat_get(fd: ${fd} => ${getFileDescriptorPath(fd)}) => [result: ${Errno.toString(result)}]`;
				}
			},
			fd_fdstat_set_flags: (_memory: ArrayBuffer, result: errno, fd: fd, fdflags: fdflags): string => {
				return `fd_fdstat_set_flags(fd: ${fd} => ${getFileDescriptorPath(fd)}, fdflags: ${Fdflags.toString(fdflags)}) => [result: ${Errno.toString(result)}]`;
			},
			fd_filestat_get: (_memory: ArrayBuffer, result: errno, fd: fd, filestat_ptr: ptr<filestat>): string => {
				if (result === Errno.success) {
					const memory = new Memory(_memory);
					const filestat = memory.readStruct(filestat_ptr, Filestat);
					return `fd_filestat_get(fd: ${fd} => ${getFileDescriptorPath(fd)}) => [filestat: ${Filetype.toString(filestat.filetype)}, result: ${Errno.toString(result)}]`;
				} else {
					return `fd_filestat_get(fd: ${fd} => ${getFileDescriptorPath(fd)}) => [result: ${Errno.toString(result)}]`;
				}
			},
			fd_filestat_set_size: (_memory: ArrayBuffer, result: errno, fd: fd, size: filesize): string => {
				return `fd_filestat_set_size(fd: ${fd} => ${getFileDescriptorPath(fd)}, size: ${size}) => [result: ${Errno.toString(result)}]`;
			},
			fd_filestat_set_times: (_memory: ArrayBuffer, result: errno, fd: fd, atim: timestamp, mtim: timestamp, fst_flags: fstflags): string => {
				return `fd_filestat_set_times(fd: ${fd} => ${getFileDescriptorPath(fd)}, atim: ${atim}, mtim: ${mtim}, fst_flags: ${Fstflags.toString(fst_flags)}) => [result: ${Errno.toString(result)}]`;
			},
			fd_pread: (_memory: ArrayBuffer, result: errno, fd: fd, _iovs_ptr: ptr<iovec>, _iovs_len: u32, offset: filesize, bytesRead_ptr: ptr<u32>): string => {
				if (result === Errno.success) {
					const memory = new Memory(_memory);
					return `fd_pread(fd: ${fd} => ${getFileDescriptorPath(fd)}, offset: ${offset}) => [bytesRead: ${memory.readUint32(bytesRead_ptr)}, result: ${Errno.toString(result)}]`;
				} else {
					return `fd_pread(fd: ${fd} => ${getFileDescriptorPath(fd)}, offset: ${offset}) => [result: ${Errno.toString(result)}]`;
				}
			},
			fd_pwrite: (_memory: ArrayBuffer, result: errno, fd: fd, _ciovs_ptr: ptr<ciovec>, _ciovs_len: u32, offset: filesize, bytesWritten_ptr: ptr<u32>): string => {
				if (result === Errno.success) {
					const memory = new Memory(_memory);
					return `fd_pwrite(fd: ${fd} => ${getFileDescriptorPath(fd)}, offset: ${offset}) => [bytesWritten: ${memory.readUint32(bytesWritten_ptr)}, result: ${Errno.toString(result)}]`;
				} else {
					return `fd_pwrite(fd: ${fd} => ${getFileDescriptorPath(fd)}, offset: ${offset}) => [result: ${Errno.toString(result)}]`;
				}
			},
			fd_read: (_memory: ArrayBuffer, result: errno, fd: fd, _iovs_ptr: ptr<iovec>, _iovs_len: u32, bytesRead_ptr: ptr<u32>): string => {
				if (result === Errno.success) {
					const memory = new Memory(_memory);
					return `fd_read(fd: ${fd} => ${getFileDescriptorPath(fd)}) => [bytesRead: ${memory.readUint32(bytesRead_ptr)}, result: ${Errno.toString(result)}]`;
				} else {
					return `fd_read(fd: ${fd} => ${getFileDescriptorPath(fd)}) => [result: ${Errno.toString(result)}]`;
				}
			},
			fd_readdir: (_memory: ArrayBuffer, result: errno, fd: fd, _buf_ptr: ptr<dirent>, _buf_len: size, cookie: dircookie, buf_used_ptr: ptr<u32>): string => {
				if (result === Errno.success) {
					const memory = new Memory(_memory);
					return `fd_readdir(fd: ${fd} => ${getFileDescriptorPath(fd)}, cookie: ${cookie}) => [buf_used: ${memory.readUint32(buf_used_ptr)}, result: ${Errno.toString(result)}]`;
				} else {
					return `fd_readdir(fd: ${fd} => ${getFileDescriptorPath(fd)}, cookie: ${cookie}) => [result: ${Errno.toString(result)}]`;
				}
			},
			fd_seek: (_memory: ArrayBuffer, result: errno, fd: fd, offset: filedelta, whence: whence, new_offset_ptr: ptr<u64>): string => {
				if (result === Errno.success) {
					const memory = new Memory(_memory);
					return `fd_seek(fd: ${fd} => ${getFileDescriptorPath(fd)}, offset: ${offset}, whence: ${Whence.toString(whence)}) => [new_offset: ${memory.readUint64(new_offset_ptr)}, result: ${Errno.toString(result)}]`;
				} else {
					return `fd_seek(fd: ${fd} => ${getFileDescriptorPath(fd)}, offset: ${offset}, whence: ${Whence.toString(whence)}) => [result: ${Errno.toString(result)}]`;
				}
			},
			fd_renumber: (_memory: ArrayBuffer, result: errno, fd: fd, to: fd): string => {
				const message = `fd_renumber(fd: ${fd} => ${getFileDescriptorPath(fd)}, to: ${to}) => [result: ${Errno.toString(result)}]`;
				if (result === Errno.success) {
					fileDescriptors.set(to, fileDescriptors.get(fd)!);
					fileDescriptors.delete(fd);
				}
				return message;
			},
			fd_sync: (_memory: ArrayBuffer, result: errno, fd: fd): string => {
				return `fd_sync(fd: ${fd} => ${getFileDescriptorPath(fd)}) => [result: ${Errno.toString(result)}]`;
			},
			fd_tell: (_memory: ArrayBuffer, result: errno, fd: fd, offset_ptr: ptr<u64>): string => {
				if (result === Errno.success) {
					const memory = new Memory(_memory);
					return `fd_tell(fd: ${fd} => ${getFileDescriptorPath(fd)}) => [offset: ${memory.readUint64(offset_ptr)}, result: ${Errno.toString(result)}]`;
				} else {
					return `fd_tell(fd: ${fd} => ${getFileDescriptorPath(fd)}) => [result: ${Errno.toString(result)}]`;
				}
			},
			fd_write: (_memory: ArrayBuffer, result: errno, fd: fd, _ciovs_ptr: ptr<ciovec>, _ciovs_len: u32, bytesWritten_ptr: ptr<u32>): string => {
				if (result === Errno.success) {
					const memory = new Memory(_memory);
					return `fd_write(fd: ${fd} => ${getFileDescriptorPath(fd)}) => [bytesWritten: ${memory.readUint32(bytesWritten_ptr)}, result: ${Errno.toString(result)}]`;
				} else {
					return `fd_write(fd: ${fd} => ${fd === 1 || fd === 2 ? fd : fileDescriptors.get(fd)}) => [result: ${Errno.toString(result)}]`;
				}
			},
			path_create_directory: (_memory: ArrayBuffer, result: errno, fd: fd, path_ptr: ptr<bytes>, path_len: size): string => {
				const memory = new Memory(_memory);
				return `path_create_directory(fd: ${fd} => ${getFileDescriptorPath(fd)}, path: ${memory.readString(path_ptr, path_len)}) => [result: ${Errno.toString(result)}]`;
			},
			path_filestat_get: (_memory: ArrayBuffer, result: errno, fd: fd, flags: lookupflags, path_ptr: ptr<bytes>, path_len: size, filestat_ptr: ptr<filestat>): string => {
				const memory = new Memory(_memory);
				if (result === Errno.success) {
					const filestat = memory.readStruct(filestat_ptr, Filestat);
					return `path_filestat_get(fd: ${fd} => ${getFileDescriptorPath(fd)}, flags: ${Lookupflags.toString(flags)} path: ${memory.readString(path_ptr, path_len)}) => [filestat: ${Filetype.toString(filestat.filetype)} result: ${Errno.toString(result)}]`;
				} else {
					return `path_filestat_get(fd: ${fd} => ${getFileDescriptorPath(fd)}, flags: ${Lookupflags.toString(flags)} path: ${memory.readString(path_ptr, path_len)}) => [result: ${Errno.toString(result)}]`;
				}
			},
			path_filestat_set_times: (_memory: ArrayBuffer, result: errno, fd: fd, flags: lookupflags, path_ptr: ptr<bytes>, path_len: size, atim: timestamp, mtim: timestamp, fst_flags: fstflags): string => {
				const memory = new Memory(_memory);
				return `path_filestat_set_times(fd: ${fd} => ${getFileDescriptorPath(fd)}, flags: ${Lookupflags.toString(flags)} path: ${memory.readString(path_ptr, path_len)}, atim: ${atim}, mtim: ${mtim}, fst_flags: ${Fstflags.toString(fst_flags)}) => [result: ${Errno.toString(result)}]`;
			},
			path_link: (_memory: ArrayBuffer, result: errno, old_fd: fd, old_flags: lookupflags, old_path_ptr: ptr<bytes>, old_path_len: size, new_fd: fd, new_path_ptr: ptr<bytes>, new_path_len: size): string => {
				const memory = new Memory(_memory);
				return `path_link(old_fd: ${old_fd} => ${fileDescriptors.get(old_fd)}, old_flags: ${Lookupflags.toString(old_flags)}, old_path: ${memory.readString(old_path_ptr, old_path_len)}, new_fd: ${new_fd} => ${fileDescriptors.get(new_fd)}, new_path: ${memory.readString(new_path_ptr, new_path_len)}) => [result: ${Errno.toString(result)}]`;
			},
			path_open: (_memory: ArrayBuffer, result: errno, fd: fd, dirflags: lookupflags, path_ptr: ptr<bytes>, path_len: size, oflags: oflags, _fs_rights_base: rights, _fs_rights_inheriting: rights, fdflags: fdflags, fd_ptr: ptr<fd>): string => {
				const memory = new Memory(_memory);
				const path = memory.readString(path_ptr, path_len);
				if (result === Errno.success) {
					const resultFd = memory.readUint32(fd_ptr);
					const message = `path_open(fd: ${fd} => ${getFileDescriptorPath(fd)}, dirflags: ${Lookupflags.toString(dirflags)}, path: ${path}, oflags: ${Oflags.toString(oflags)}, fdflags: ${Fdflags.toString(fdflags)}) => [fd: ${resultFd}, result: ${Errno.toString(result)}]`;
					if (result === Errno.success) {
						const parentPath = fileDescriptors.get(fd);
						fileDescriptors.set(resultFd, parentPath !== undefined ? RAL().path.join(parentPath, path) : path);
					}
					return message;
				} else {
					return `path_open(fd: ${fd} => ${getFileDescriptorPath(fd)}, dirflags: ${Lookupflags.toString(dirflags)}, path: ${path}, oflags: ${Oflags.toString(oflags)}, fdflags: ${Fdflags.toString(fdflags)}) => [result: ${Errno.toString(result)}]`;
				}
			},
			path_readlink: (_memory: ArrayBuffer, result: errno, fd: fd, path_ptr: ptr<bytes>, path_len: size, buf_ptr: ptr, buf_len: size, result_size_ptr: ptr<u32>): string => {
				const memory = new Memory(_memory);
				if (result === Errno.success) {
					const resultSize = memory.readUint32(result_size_ptr);
					return `path_readlink(fd: ${fd} => ${getFileDescriptorPath(fd)}, path: ${memory.readString(path_ptr, path_len)}, buf_len: ${buf_len}) => [target: ${memory.readString(buf_ptr, resultSize)}, result: ${Errno.toString(result)}]`;
				} else {
					return `path_readlink(fd: ${fd} => ${getFileDescriptorPath(fd)}, path: ${memory.readString(path_ptr, path_len)}, buf_len: ${buf_len}) => [result: ${Errno.toString(result)}]`;
				}
			},
			path_remove_directory: (_memory: ArrayBuffer, result: errno, fd: fd, path_ptr: ptr<bytes>, path_len: size): string => {
				const memory = new Memory(_memory);
				return `path_remove_directory(fd: ${fd} => ${getFileDescriptorPath(fd)}, path: ${memory.readString(path_ptr, path_len)}) => [result: ${Errno.toString(result)}]`;
			},
			path_rename: (_memory: ArrayBuffer, result: errno, old_fd: fd, old_path_ptr: ptr<bytes>, old_path_len: size, new_fd: fd, new_path_ptr: ptr<bytes>, new_path_len: size): string => {
				const memory = new Memory(_memory);
				return `path_rename(old_fd: ${old_fd} => ${fileDescriptors.get(old_fd)}, old_path: ${memory.readString(old_path_ptr, old_path_len)}, new_fd: ${new_fd} => ${fileDescriptors.get(new_fd)}, new_path: ${memory.readString(new_path_ptr, new_path_len)}) => [result: ${Errno.toString(result)}]`;
			},
			path_symlink: (_memory: ArrayBuffer, result: errno, old_path_ptr: ptr<bytes>, old_path_len: size, fd: fd, new_path_ptr: ptr<bytes>, new_path_len: size): string => {
				const memory = new Memory(_memory);
				return `path_symlink(old_path: ${memory.readString(old_path_ptr, old_path_len)}, fd: ${fd} => ${getFileDescriptorPath(fd)}, new_path: ${memory.readString(new_path_ptr, new_path_len)}) => [result: ${Errno.toString(result)}]`;
			},
			path_unlink_file: (_memory: ArrayBuffer, result: errno, fd: fd, path_ptr: ptr<bytes>, path_len: size): string => {
				const memory = new Memory(_memory);
				return `path_unlink_file(fd: ${fd} => ${getFileDescriptorPath(fd)}, path: ${memory.readString(path_ptr, path_len)}) => [result: ${Errno.toString(result)}]`;
			},
			poll_oneoff: (_memory: ArrayBuffer, result: errno, _input: ptr<subscription>, _output: ptr<event[]>, _subscriptions: size, _result_size_ptr: ptr<u32>): string => {
				return `poll_oneoff(...) => [result: ${Errno.toString(result)}]`;
			},
			proc_exit: (_memory: ArrayBuffer, result: errno, rval: exitcode): string => {
				return `proc_exit(rval: ${rval}) => [result: ${Errno.toString(result)}]`;
			},
			sched_yield: (_memory: ArrayBuffer, result: errno): string => {
				return `sched_yield() => [result: ${Errno.toString(result)}]`;
			},
			random_get: (_memory: ArrayBuffer, result: errno, _buf: ptr<bytes>, _buf_len: size): string => {
				return `random_get(...) => [result: ${Errno.toString(result)}]`;
			},
			sock_accept: (_memory: ArrayBuffer, result: errno, fd: fd, flags: fdflags, result_fd_ptr: ptr<u32>): string => {
				if (result === Errno.success) {
					const memory = new Memory(_memory);
					return `sock_accept(fd: ${fd}}, flags: ${flags}) => [result_fd: ${memory.readUint32(result_fd_ptr)}, result: ${Errno.toString(result)}]`;
				} else {
					return `sock_accept(fd: ${fd}}, flags: ${flags}) => [result: ${Errno.toString(result)}]`;
				}
			},
			sock_shutdown: (_memory: ArrayBuffer, result: errno, fd: fd, sdflags: sdflags): string => {
				return `sock_shutdown(fd: ${fd}, sdflags: ${Sdflags.toString(sdflags)}) => [result: ${Errno.toString(result)}]`;
			},
			thread_exit: (_memory: ArrayBuffer, result: errno, tid: u32): string => {
				return `thread_exit(tid: ${tid}) => [result: ${Errno.toString(result)}]`;
			},
			'thread-spawn': (_memory: ArrayBuffer, result: errno, _start_args_ptr: ptr): string => {
				return `thread-spawn(...) => [result: ${Errno.toString(result)}]`;
			}
		};
	}
}
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import assert from 'assert';
import path from 'path';
import fs, { open } from 'fs';
import os from 'os';
import * as uuid from 'uuid';
import { TextDecoder, TextEncoder } from 'util';

import { DeviceDescription, Environment, WASI, Clockid, Errno, Prestat, fd, Oflags, Rights, Filestat, Iovec, Ciovec } from '@vscode/wasm-wasi';
import { URI } from 'vscode-uri';

import { TestApi } from './testApi';
import { ptr } from '@vscode/wasm-wasi/src/common/baseTypes';

const decoder = new TextDecoder();
const encoder = new TextEncoder();

const consoleUri = URI.from({ scheme: 'console', authority: 'developerTools' });

namespace wasi {
	export type Uint32 = { readonly $ptr: ptr; value: number };
	export type Uint32Array = { readonly $ptr: ptr;  size: number; get(index: number): number; set(index: number, value: number): void };

	export type Uint64 = { readonly $ptr: ptr; value: bigint };

	export type String = { readonly $ptr: ptr; byteLength: number };
	export type StringBuffer = { readonly $ptr: ptr; get value(): string };

	export type Bytes = { readonly $ptr: ptr; readonly byteLength: number };

	export type StructArray<T> = { readonly $ptr: ptr;  size: number; get(index: number): T };
}

class Memory {

	private readonly raw: ArrayBuffer;
	private readonly dataView: DataView;
	private index: number;

	constructor(byteLength: number = 65536) {
		this.raw = new ArrayBuffer(byteLength);
		this.dataView = new DataView(this.raw);
		this.index = 0;
	}

	public getRaw(): ArrayBuffer {
		return this.raw;
	}

	public alloc(bytes: number): ptr {
		const result = this.index;
		this.index += bytes;
		return result;
	}

	public allocStruct<T>(info: { size: number; create: (ptr: ptr, memory: DataView) => T }): T {
		const ptr: ptr = this.alloc(info.size);
		return info.create(ptr, this.dataView);
	}

	public allocStructArray<T>(size: number, info: { size: number; create: (ptr: ptr, memory: DataView) => T }): wasi.StructArray<T> {
		const ptr: ptr = this.alloc(size * info.size);
		const structs: T[] = new Array(size);
		for (let i = 0; i < size; i++) {
			const struct = info.create(ptr + i * info.size, this.dataView);
			structs[i] = struct;
		}
		return {
			get $ptr(): ptr { return ptr; },
			get size(): number { return size; },
			get(index: number): T { return structs[index]; }
		};
	}

	public allocUint32(value?: number): wasi.Uint32 {
		const ptr = this.alloc(Uint32Array.BYTES_PER_ELEMENT);
		value !== undefined && this.dataView.setUint32(ptr, value, true);
		const view = this.dataView;
		return {
			get $ptr(): ptr { return ptr; },
			get value(): number { return view.getUint32(ptr, true ); },
			set value(value: number) { view.setUint32(ptr, value, true); }
		};
	}

	public allocUint32Array(size: number): wasi.Uint32Array {
		const ptr = this.alloc(Uint32Array.BYTES_PER_ELEMENT * size);
		const view = this.dataView;
		return {
			get $ptr(): ptr { return ptr; },
			get size(): number { return size; },
			get(index: number): number { return view.getUint32(ptr + index * Uint32Array.BYTES_PER_ELEMENT, true); },
			set(index: number, value: number) { view.setUint32(ptr + index * Uint32Array.BYTES_PER_ELEMENT, value, true); }
		};
	}

	public allocBigUint64(value?: bigint): wasi.Uint64 {
		const ptr = this.alloc(BigUint64Array.BYTES_PER_ELEMENT);
		value !== undefined && this.dataView.setBigUint64(ptr, value, true);
		const view = this.dataView;
		return {
			get $ptr(): ptr { return ptr; },
			get value(): bigint { return view.getBigUint64(ptr, true ); },
			set value(value: bigint) { view.setBigUint64(ptr, value, true); }
		};
	}

	public allocString(value: string): wasi.String {
		const bytes = encoder.encode(value);
		const ptr = this.alloc(bytes.length);
		(new Uint8Array(this.raw)).set(bytes, ptr);
		return {
			get $ptr(): ptr { return ptr; },
			get byteLength(): number { return bytes.length; }
		};
	}

	public allocStringBuffer(length: number): wasi.StringBuffer {
		const ptr = this.alloc(length);
		const raw = this.raw;
		return {
			get $ptr(): ptr { return ptr; },
			get value(): string {
				return decoder.decode(new Uint8Array(raw, ptr, length));
			}
		};
	}

	public allocBytes(bytes: Uint8Array): wasi.Bytes {
		const ptr = this.alloc(bytes.length);
		(new Uint8Array(this.raw)).set(bytes, ptr);
		return {
			get $ptr(): ptr { return ptr; },
			get byteLength(): number { return bytes.length; }
		};
	}

	public readString(ptr: ptr): string {
		const length = this.getStringLength(ptr);
		if (length === -1) {
			throw new Error(`No null terminate character found`);
		}
		return decoder.decode(new Uint8Array(this.raw, ptr, length));
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

namespace Timestamp {
	export function inNanoseconds(timeInMilliseconds: number): bigint {
		return BigInt(timeInMilliseconds) * 1000000n;
	}
}

suite('Configurations', () => {

	function createWASI(programName: string, fileLocation?: string, args?: string[], env?: Environment): [WASI, Memory] {
		const devices: DeviceDescription[] = [
			{ kind: 'console', uri:  consoleUri }
		];
		if (fileLocation !== undefined) {
			devices.push({ kind: 'fileSystem', uri: URI.parse(`file://${fileLocation}`), mountPoint: '/' },);
		}
		const wasi = WASI.create(programName, new TestApi(), (_rval) => { }, devices, {
			stdin: { kind: 'console', uri: consoleUri },
			stdout: { kind: 'console', uri: consoleUri },
			stderr: { kind: 'console', uri: consoleUri },
		}, {
			args: args,
			env: env
		});
		const memory = new Memory();
		wasi.initialize({ exports: { memory: {
			buffer: memory.getRaw(),
			grow: () => { return 65536; }
		}}});
		return [wasi, memory];
	}

	test('argv', () => {
		const args = ['arg1', 'arg22', 'arg333'];
		const [wasi, memory] = createWASI('testApp', undefined, args);

		const argvCount = memory.allocUint32();
		const argvBufSize = memory.allocUint32();
		let errno = wasi.args_sizes_get(argvCount.$ptr, argvBufSize.$ptr);
		assert.strictEqual(errno, Errno.success);

		const expectedArgs = ['testApp'].concat(...args);
		assert.strictEqual(argvCount.value, expectedArgs.length);

		const expectedBufferLength = expectedArgs.reduce<number>((previous, value) => {
			return previous + encoder.encode(value).length + 1;
		}, 0);
		assert.strictEqual(argvBufSize.value, expectedBufferLength);

		const argv = memory.allocUint32Array(argvCount.value);
		const argvBuf = memory.alloc(argvBufSize.value);

		errno = wasi.args_get(argv.$ptr, argvBuf);
		assert.strictEqual(errno, Errno.success);

		for (let i = 0; i < argvCount.value; i++) {
			const valueStartOffset = argv.get(i);
			const arg = memory.readString(valueStartOffset);
			assert.strictEqual(arg, expectedArgs[i]);
		}
	});

	test('clock', () => {
		const [wasi, memory] = createWASI('testApp');
		for (const clockid of [Clockid.realtime, Clockid.monotonic, Clockid.process_cputime_id, Clockid.thread_cputime_id]) {
			const timestamp = memory.allocBigUint64();
			const errno = wasi.clock_res_get(clockid, timestamp.$ptr);
			assert.strictEqual(errno, Errno.success);
			assert.strictEqual(timestamp.value, 1n);
		}

		const delta = (100n * 1000000n); // 100 ms
		const time = memory.allocBigUint64();
		let errno = wasi.clock_time_get(Clockid.realtime, 0n, time.$ptr);
		assert.strictEqual(errno, Errno.success);
		// Clock realtime is in ns but date now in ms.
		const now = BigInt(Date.now()) * 1000000n;
		assert.ok(now - delta < time.value && time.value <= now);

		errno = wasi.clock_time_get(Clockid.monotonic, 0n, time.$ptr);
		assert.strictEqual(errno, Errno.success);
		const hrtime = process.hrtime.bigint();
		assert.ok(hrtime - delta < time.value && time.value <= hrtime);

		errno = wasi.clock_time_get(Clockid.process_cputime_id, 0n, time.$ptr);
		assert.strictEqual(errno, Errno.success);

		errno = wasi.clock_time_get(Clockid.thread_cputime_id, 0n, time.$ptr);
		assert.strictEqual(errno, Errno.success);
	});

	test('env', () => {
		const env: Environment = { 'var1': 'value1', 'var2': 'value2' };
		const [wasi, memory] = createWASI('testApp', undefined, undefined, env);

		const environCount = memory.allocUint32();
		const environBufSize = memory.allocUint32();
		let errno = wasi.environ_sizes_get(environCount.$ptr, environBufSize.$ptr);
		assert.strictEqual(errno, 0);

		const keys = Object.keys(env);
		assert.strictEqual(environCount.value, keys.length);

		let expectedBufferLength: number = 0;
		for (const key of keys) {
			expectedBufferLength += encoder.encode(key).length + 1 /* = */ + encoder.encode(env[key]).length + 1 /* 0 */;
		}
		assert.strictEqual(environBufSize.value, expectedBufferLength);

		const environ = memory.allocUint32Array(environCount.value);
		const environBuf = memory.alloc(environBufSize.value);
		errno = wasi.environ_get(environ.$ptr, environBuf);
		assert.strictEqual(errno, 0);

		for (let i = 0; i < environCount.value; i++) {
			const valueStartOffset = environ.get(i);
			const value = memory.readString(valueStartOffset);
			const values = value.split('=');
			assert.strictEqual(values.length, 2);
			assert.strictEqual(env[values[0]], values[1]);
		}
	});
});

suite ('Filesystem', () => {

	function createWASI(programName: string, fileLocation: string): [WASI, Memory] {
		const devices: DeviceDescription[] = [
			{ kind: 'fileSystem', uri: URI.parse(`file://${fileLocation}`), mountPoint: '/' },
			{ kind: 'console', uri:  consoleUri }
		];

		const wasi = WASI.create(programName, new TestApi(), (_rval) => { }, devices, {
			stdin: { kind: 'console', uri: consoleUri },
			stdout: { kind: 'console', uri: consoleUri },
			stderr: { kind: 'console', uri: consoleUri },
		}, {
		});
		const memory = new Memory();
		wasi.initialize({ exports: { memory: {
			buffer: memory.getRaw(),
			grow: () => { return 65536; }
		}}});
		return [wasi, memory];
	}

	function rimraf(location: string) {
		const stat = fs.lstatSync(location);
		if (stat) {
			if (stat.isDirectory() && !stat.isSymbolicLink()) {
				for (const dir of fs.readdirSync(location)) {
					rimraf(path.join(location, dir));
				}
				fs.rmdirSync(location);
			} else {
				fs.unlinkSync(location);
			}
		}
	}

	function runTestWithFilesystem(callback: (wasi: WASI, memory: Memory, rootFd: fd, testLocation: string) => void): void {
		const tempDir = os.tmpdir();
		const directory = path.join(tempDir, 'wasm-wasi-tests', uuid.v4());
		try {
			fs.mkdirSync(directory, { recursive: true });
			const [wasi, memory] = createWASI('fileTest', directory);
			const prestat = memory.allocStruct(Prestat);
			let errno = wasi.fd_prestat_get(3, prestat.$ptr);
			assert.strictEqual(errno, Errno.success);
			const pathLength = prestat.len;
			// We only have one prestat dir. So this must not succeed.
			errno = wasi.fd_prestat_get(4, memory.allocStruct(Prestat).$ptr);
			assert.strictEqual(errno, Errno.badf);

			const stringBuffer = memory.allocStringBuffer(pathLength);
			errno = wasi.fd_prestat_dir_name(3, stringBuffer.$ptr, pathLength);
			assert.strictEqual(errno, Errno.success);
			const mountPoint = stringBuffer.value;
			assert.strictEqual(mountPoint, '/');

			callback(wasi, memory, 3, directory);
		} finally {
			try {
				rimraf(directory);
			} catch (error) {
				console.error(error);
				throw error;
			}
		}
	}

	function createFile(wasi: WASI, memory: Memory, parentFd: fd, name: string): fd {
		const fd = memory.allocUint32(0);
		const path = memory.allocString(name);
		let errno = wasi.path_open(parentFd, 0, path.$ptr, path.byteLength, Oflags.creat, Rights.FileBase, Rights.FileInheriting, 0, fd.$ptr);
		assert.strictEqual(errno, Errno.success);
		return fd.value;
	}

	function createFileWithContent(wasi: WASI, memory: Memory, parentFd: fd, name: string, content: string): fd {
		const fd = memory.allocUint32(0);
		const path = memory.allocString(name);
		let errno = wasi.path_open(parentFd, 0, path.$ptr, path.byteLength, Oflags.creat, Rights.FileBase, Rights.FileInheriting, 0, fd.$ptr);
		assert.strictEqual(errno, Errno.success);
		const ciovecs = memory.allocStructArray(1, Ciovec);
		const bytes = encoder.encode(content);
		const data = memory.allocBytes(bytes);
		ciovecs.get(0).buf = data.$ptr;
		ciovecs.get(0).buf_len = data.byteLength;
		const bytesWritten = memory.allocUint32();
		wasi.fd_write(fd.$ptr, ciovecs.$ptr, 1, bytesWritten.$ptr);
		return fd.value;
	}

	test('filesystem setup', () => {
		runTestWithFilesystem((_wasi, _memory, rootFd) => {
			assert.strictEqual(rootFd, 3);
		});
	});

	test('path_open - file doesn\'t exist', () => {
		runTestWithFilesystem((wasi, memory, rootFd) => {
			const name = 'test.txt';
			const fd = memory.allocUint32(0);
			const path = memory.allocString(name);
			let errno = wasi.path_open(rootFd, 0, path.$ptr, path.byteLength, 0, Rights.FileBase, Rights.FileInheriting, 0, fd.$ptr);
			assert.strictEqual(errno, Errno.noent);
		});
	});

	test('path_open - file exists', () => {
		runTestWithFilesystem((wasi, memory, rootFd, testLocation) => {
			const name = 'test.txt';
			fs.writeFileSync(path.join(testLocation, name), 'Hello World');
			const fd = memory.allocUint32(0);
			const p = memory.allocString(name);
			let errno = wasi.path_open(rootFd, 0, p.$ptr, p.byteLength, 0, Rights.FileBase, Rights.FileInheriting, 0, fd.$ptr);
			assert.strictEqual(errno, Errno.success);
			assert.notStrictEqual(fd.value, 0);
			errno = wasi.fd_close(fd.value);
			assert.strictEqual(errno, Errno.success);
		});
	});

	test('path_open - create file', () => {
		runTestWithFilesystem((wasi, memory, rootFd) => {
			const name = 'test.txt';
			const fd = memory.allocUint32(0);
			const path = memory.allocString(name);
			let errno = wasi.path_open(rootFd, 0, path.$ptr, path.byteLength, Oflags.creat, Rights.FileBase, Rights.FileInheriting, 0, fd.$ptr);
			assert.strictEqual(errno, Errno.success);
			assert.notStrictEqual(fd.value, 0);
			errno = wasi.fd_close(fd.value);
			assert.strictEqual(errno, Errno.success);
		});
	});

	test('path_open - truncate file', () => {
		runTestWithFilesystem((wasi, memory, rootFd, testLocation) => {
			const name = 'test.txt';
			fs.writeFileSync(path.join(testLocation, name), 'Hello World');
			const fd = memory.allocUint32(0);
			const p = memory.allocString(name);
			let errno = wasi.path_open(rootFd, 0, p.$ptr, p.byteLength, Oflags.trunc, Rights.FileBase, Rights.FileInheriting, 0, fd.$ptr);
			assert.strictEqual(errno, Errno.success);
			assert.notStrictEqual(fd.value, 0);
			errno = wasi.fd_close(fd.value);
			assert.strictEqual(errno, Errno.success);
			const stat = fs.statSync(path.join(testLocation, name));
			assert.strictEqual(stat.size, 0);
		});
	});

	test('path_open - fail if file exists', () => {
		runTestWithFilesystem((wasi, memory, rootFd, testLocation) => {
			const name = 'test.txt';
			fs.writeFileSync(path.join(testLocation, name), 'Hello World');
			const fd = memory.allocUint32(0);
			const p = memory.allocString(name);
			let errno = wasi.path_open(rootFd, 0, p.$ptr, p.byteLength, Oflags.excl, Rights.FileBase, Rights.FileInheriting, 0, fd.$ptr);
			assert.strictEqual(errno, Errno.exist);
		});
	});

	test('path_open - fail if not directory', () => {
		runTestWithFilesystem((wasi, memory, rootFd, testLocation) => {
			const name = 'test.txt';
			fs.writeFileSync(path.join(testLocation, name), 'Hello World');
			const fd = memory.allocUint32(0);
			const p = memory.allocString(name);
			let errno = wasi.path_open(rootFd, 0, p.$ptr, p.byteLength, Oflags.directory, Rights.FileBase, Rights.FileInheriting, 0, fd.$ptr);
			assert.strictEqual(errno, Errno.notdir);
		});
	});

	test('path_open - is directory', () => {
		runTestWithFilesystem((wasi, memory, rootFd, testLocation) => {
			const name = 'folder';
			fs.mkdirSync(path.join(testLocation, name));
			const fd = memory.allocUint32(0);
			const p = memory.allocString(name);
			let errno = wasi.path_open(rootFd, 0, p.$ptr, p.byteLength, Oflags.directory, Rights.FileBase, Rights.FileInheriting, 0, fd.$ptr);
			assert.strictEqual(errno, Errno.success);
			assert.notStrictEqual(fd.value, 0);
			errno = wasi.fd_close(fd.value);
			assert.strictEqual(errno, Errno.success);
		});
	});

	test('fd_advise', () => {
		runTestWithFilesystem((wasi, memory, rootFd, testLocation) => {
		});
	});

	test('fd_filestat_get', () => {
		runTestWithFilesystem((wasi, memory, rootFd, testLocation) => {
			const name = 'test.txt';
			fs.writeFileSync(path.join(testLocation, name), 'Hello World');
			const fd = memory.allocUint32(0);
			const p = memory.allocString(name);
			let errno = wasi.path_open(rootFd, 0, p.$ptr, p.byteLength, Oflags.creat, Rights.fd_filestat_get, 0n, 0, fd.$ptr);
			assert.strictEqual(errno, Errno.success);
			assert.notStrictEqual(fd.value, 0);
			const filestat = memory.allocStruct(Filestat);
			errno = wasi.fd_filestat_get(fd.value, filestat.$ptr);
			assert.strictEqual(errno, Errno.success);
			const stat = fs.statSync(path.join(testLocation, name));
			assert.strictEqual(filestat.size, BigInt(stat.size));
			assert.strictEqual(filestat.nlink, BigInt(stat.nlink));
			assert.strictEqual(filestat.ctim, Timestamp.inNanoseconds(stat.ctime.valueOf()));
			assert.strictEqual(filestat.mtim, Timestamp.inNanoseconds(stat.mtime.valueOf()));
			// VS Code has no API for atime. So we use the mtime.
			assert.strictEqual(filestat.atim, Timestamp.inNanoseconds(stat.mtime.valueOf()));
			errno = wasi.fd_close(fd.value);
			assert.strictEqual(errno, Errno.success);
		});
	});

	test('fd_write - single ciovec', () => {
		runTestWithFilesystem((wasi, memory, rootFd, testLocation) => {
			const hw = 'Hello World';
			const fd = createFile(wasi, memory, rootFd, 'test.txt');
			const ciovecs = memory.allocStructArray(1, Ciovec);
			const content = memory.allocBytes(encoder.encode(hw));
			ciovecs.get(0).buf = content.$ptr;
			ciovecs.get(0).buf_len = content.byteLength;
			const bytesWritten = memory.allocUint32();
			let errno = wasi.fd_write(fd, ciovecs.$ptr, 1, bytesWritten.$ptr);
			assert.strictEqual(errno, Errno.success);
			assert.strictEqual(bytesWritten.value, content.byteLength);
			assert.strictEqual(fs.readFileSync(path.join(testLocation, 'test.txt'), { encoding: 'utf8' }), hw);
		});
	});

	test('fd_write - multiple ciovec', () => {
		runTestWithFilesystem((wasi, memory, rootFd, testLocation) => {
			const hw = ['Hello ', 'World ', '!!!'];
			const fd = createFile(wasi, memory, rootFd, 'test.txt');
			const ciovecs = memory.allocStructArray(3, Ciovec);
			let contentLength: number = 0;
			for (let i = 0; i < hw.length; i++) {
				const content = memory.allocBytes(encoder.encode(hw[i]));
				ciovecs.get(i).buf = content.$ptr;
				ciovecs.get(i).buf_len = content.byteLength;
				contentLength += content.byteLength;
			}
			const bytesWritten = memory.allocUint32();
			let errno = wasi.fd_write(fd, ciovecs.$ptr, ciovecs.size, bytesWritten.$ptr);
			assert.strictEqual(errno, Errno.success);
			assert.strictEqual(bytesWritten.value, contentLength);
			assert.strictEqual(fs.readFileSync(path.join(testLocation, 'test.txt'), { encoding: 'utf8' }), hw.join(''));
		});
	});
});
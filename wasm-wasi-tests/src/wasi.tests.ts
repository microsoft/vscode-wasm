/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import assert from 'assert';
import path from 'path';
import fs from 'fs';
import os from 'os';
import * as uuid from 'uuid';
import { TextDecoder, TextEncoder } from 'util';

import { DeviceDescription, Environment, WASI, Clockid, Errno, Prestat, fd, Oflags, Rights, Filestat } from '@vscode/wasm-wasi';
import { URI } from 'vscode-uri';

import { TestApi } from './testApi';
import { ptr } from '@vscode/wasm-wasi/src/common/baseTypes';

const decoder = new TextDecoder();
const encoder = new TextEncoder();

const consoleUri = URI.from({ scheme: 'console', authority: 'developerTools' });

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

	public allocUint32(value?: number): { $ptr: ptr; value: number } {
		const ptr = this.alloc(Uint32Array.BYTES_PER_ELEMENT);
		value !== undefined && this.dataView.setUint32(ptr, value, true);
		const view = this.dataView;
		return {
			get $ptr(): ptr { return ptr; },
			get value(): number { return view.getUint32(ptr, true ); },
			set value(value: number) { view.setUint32(ptr, value, true); }
		};
	}

	public allocUint32Array(size: number): { $ptr: ptr; get(index: number): number; set(index: number, value: number): void } {
		const ptr = this.alloc(Uint32Array.BYTES_PER_ELEMENT * size);
		const view = this.dataView;
		return {
			get $ptr(): ptr { return ptr; },
			get(index: number): number { return view.getUint32(ptr + index * Uint32Array.BYTES_PER_ELEMENT, true); },
			set(index: number, value: number) { view.setUint32(ptr + index * Uint32Array.BYTES_PER_ELEMENT, value, true); }
		};
	}

	public allocBigUint64(value?: bigint): { $ptr: ptr; value: bigint } {
		const ptr = this.alloc(BigUint64Array.BYTES_PER_ELEMENT);
		value !== undefined && this.dataView.setBigUint64(ptr, value, true);
		const view = this.dataView;
		return {
			get $ptr(): ptr { return ptr; },
			get value(): bigint { return view.getBigUint64(ptr, true ); },
			set value(value: bigint) { view.setBigUint64(ptr, value, true); }
		};
	}

	public allocString(value: string): { $ptr: ptr; byteLength: number } {
		const bytes = encoder.encode(value);
		const ptr = this.alloc(bytes.length);
		(new Uint8Array(this.raw)).set(bytes, ptr);
		return {
			get $ptr(): ptr { return ptr; },
			get byteLength(): number { return bytes.length; }
		};
	}

	public allocStringBuffer(length: number): { $ptr: ptr; get value(): string } {
		const ptr = this.alloc(length);
		const raw = this.raw;
		return {
			get $ptr(): ptr { return ptr; },
			get value(): string {
				return decoder.decode(new Uint8Array(raw, ptr, length));
			}
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

	function runTestWithFilesystem(callback: (wasi: WASI, memory: Memory, rootFd: fd) => void): void {
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

			callback(wasi, memory, 3);
		} finally {
			try {
				rimraf(directory);
			} catch (error) {
				console.error(error);
				throw error;
			}
		}
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

	test('fd_filestat_get', () => {
		runTestWithFilesystem((wasi, memory, rootFd) => {
			const name = 'test.txt';
			const fd = memory.allocUint32(0);
			const path = memory.allocString(name);
			let errno = wasi.path_open(rootFd, 0, path.$ptr, path.byteLength, Oflags.creat, Rights.fd_filestat_get, 0n, 0, fd.$ptr);
			assert.strictEqual(errno, Errno.success);
			assert.notStrictEqual(fd.value, 0);
			const filestat = memory.allocStruct(Filestat);
			errno = wasi.fd_filestat_get(fd.value, filestat.$ptr);
			assert.strictEqual(errno, Errno.success);
			assert.strictEqual(filestat.size, 0n);
			assert.strictEqual(filestat.nlink, 0n);
			errno = wasi.fd_close(fd.value);
			assert.strictEqual(errno, Errno.success);
		});
	});
});
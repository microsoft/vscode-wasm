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

import { DeviceDescription, Environment, WASI, Clockid, Errno, Prestat, fd, Oflags, Rights, Fdflags, Fdstat, Filestat } from '@vscode/wasm-wasi';
import { URI } from 'vscode-uri';

import { TestApi } from './testApi';

const decoder = new TextDecoder();
const encoder = new TextEncoder();

function getStringLength(buffer: ArrayBuffer, start: number): number {
	const bytes = new Uint8Array(buffer);
	let index = start;
	while (index < bytes.byteLength) {
		if (bytes[index] === 0) {
			return index - start;
		}
		index++;
	}
	return -1;
}

const consoleUri = URI.from({ scheme: 'console', authority: 'developerTools' });

suite('Configurations', () => {


	function createWASI(programName: string, fileLocation?: string, args?: string[], env?: Environment): [WASI, ArrayBuffer, DataView] {
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
		const buffer = new ArrayBuffer(65536);
		const memory = new DataView(buffer);
		wasi.initialize({ exports: { memory: {
			buffer: buffer,
			grow: () => { return 65536; }
		}}});
		return [wasi, buffer, memory];
	}

	test('argv', () => {
		const args = ['arg1', 'arg22', 'arg333'];
		const [wasi, rawMemory, memory] = createWASI('testApp', undefined, args);

		let errno = wasi.args_sizes_get(0, 1024);
		assert.strictEqual(errno, Errno.success);

		const numberOfArgs = memory.getUint32(0, true);
		const bufferLength = memory.getUint32(1024, true);

		const expectedArgs = ['testApp'].concat(...args);
		assert.strictEqual(numberOfArgs, expectedArgs.length);

		const expectedBufferLength = expectedArgs.reduce<number>((previous, value) => {
			return previous + encoder.encode(value).length + 1;
		}, 0);
		assert.strictEqual(bufferLength, expectedBufferLength);

		errno = wasi.args_get(0, 1024);
		assert.strictEqual(errno, Errno.success);

		for (let i = 0; i < numberOfArgs; i++) {
			const offset = 0 + i * 4;
			const valueStartOffset = memory.getUint32(offset, true);
			const valueLength = getStringLength(rawMemory, valueStartOffset);
			assert.notStrictEqual(valueLength, -1);
			const arg = decoder.decode(new Uint8Array(rawMemory, valueStartOffset, valueLength));
			assert.strictEqual(arg, expectedArgs[i]);
		}
	});

	test('clock', () => {
		const [wasi, , memory] = createWASI('testApp');
		for (const clockid of [Clockid.realtime, Clockid.monotonic, Clockid.process_cputime_id, Clockid.thread_cputime_id]) {
			const errno = wasi.clock_res_get(clockid, 512);
			assert.strictEqual(errno, Errno.success);
			assert.strictEqual(memory.getBigUint64(512, true), 1n);
		}

		const delta = (100n * 1000000n); // 100 ms
		let errno = wasi.clock_time_get(Clockid.realtime, 0n, 1024);
		assert.strictEqual(errno, Errno.success);
		let time = memory.getBigUint64(1024, true);
		// Clock realtime is in ns but date now in ms.
		const now = BigInt(Date.now()) * 1000000n;
		assert.ok(now - delta < time && time <= now);

		errno = wasi.clock_time_get(Clockid.monotonic, 0n, 1024);
		assert.strictEqual(errno, Errno.success);
		time = memory.getBigUint64(1024, true);
		const hrtime = process.hrtime.bigint();
		assert.ok(hrtime - delta < time && time <= hrtime);

		errno = wasi.clock_time_get(Clockid.process_cputime_id, 0n, 1024);
		assert.strictEqual(errno, Errno.success);

		errno = wasi.clock_time_get(Clockid.thread_cputime_id, 0n, 1024);
		assert.strictEqual(errno, Errno.success);
	});

	test('env', () => {
		const env: Environment = { 'var1': 'value1', 'var2': 'value2' };
		const [wasi, rawMemory, memory] = createWASI('testApp', undefined, undefined, env);

		let errno = wasi.environ_sizes_get(0, 4);
		assert.strictEqual(errno, 0);

		const numberOfEnvs = memory.getUint32(0, true);
		const bufferLength = memory.getUint32(4, true);

		const keys = Object.keys(env);
		assert.strictEqual(numberOfEnvs, keys.length);

		let expectedBufferLength: number = 0;
		for (const key of keys) {
			expectedBufferLength += encoder.encode(key).length + 1 /* = */ + encoder.encode(env[key]).length + 1 /* 0 */;
		}
		assert.strictEqual(bufferLength, expectedBufferLength);

		errno = wasi.environ_get(0, 0 + numberOfEnvs * 4);
		assert.strictEqual(errno, 0);

		for (let i = 0; i < numberOfEnvs; i++) {
			const offset = 0 + i * 4;
			const valueStartOffset = memory.getUint32(offset, true);
			const valueLength = getStringLength(rawMemory, valueStartOffset);
			assert.notStrictEqual(valueLength, -1);
			const value = decoder.decode(new Uint8Array(rawMemory, valueStartOffset, valueLength));
			const values = value.split('=');
			assert.strictEqual(values.length, 2);
			assert.strictEqual(env[values[0]], values[1]);
		}
	});
});

suite ('Filesystem', () => {

	function createWASI(programName: string, fileLocation: string): [WASI, ArrayBuffer, DataView] {
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
		const buffer = new ArrayBuffer(65536);
		const memory = new DataView(buffer);
		wasi.initialize({ exports: { memory: {
			buffer: buffer,
			grow: () => { return 65536; }
		}}});
		return [wasi, buffer, memory];
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

	const memory_location_0 = 0 as const;
	const memory_location_256 = 256 as const;
	const memory_location_512 = 512 as const;
	const memory_location_1024 = 1024 as const;

	function runTestWithFilesystem(callback: (wasi: WASI, rawMemory: ArrayBuffer, memory: DataView, rootFd: fd) => void): void {
		const tempDir = os.tmpdir();
		const directory = path.join(tempDir, 'wasm-wasi-tests', uuid.v4());
		try {
			fs.mkdirSync(directory, { recursive: true });
			const [wasi, rawMemory, memory] = createWASI('fileTest', directory);
			let errno = wasi.fd_prestat_get(3, memory_location_0);
			assert.strictEqual(errno, Errno.success);
			const pathLength = Prestat.create(memory_location_0, memory).len;
			// We only have one prestat dir. So this must not succeed.
			errno = wasi.fd_prestat_get(4, memory_location_0);
			assert.strictEqual(errno, Errno.badf);

			errno = wasi.fd_prestat_dir_name(3, memory_location_0, pathLength);
			assert.strictEqual(errno, Errno.success);
			const mountPoint = decoder.decode(new Uint8Array(rawMemory, memory_location_0, pathLength));
			assert.strictEqual(mountPoint, '/');
			callback(wasi, rawMemory, memory, 3);
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
		runTestWithFilesystem((_wasi, _rawMemory, _memory, rootFd) => {
			assert.strictEqual(rootFd, 3);
		});
	});

	test('path_open', () => {
		runTestWithFilesystem((wasi, rawMemory, memory, rootFd) => {
			const name = 'test.txt';
			memory.setUint32(memory_location_256, 0);
			(new Uint8Array(rawMemory)).set(encoder.encode(name), memory_location_512);
			let errno = wasi.path_open(rootFd, 0, memory_location_512, name.length, Oflags.creat, Rights.FileBase, Rights.FileInheriting, 0, memory_location_256);
			assert.strictEqual(errno, Errno.success);
			const fd = memory.getUint32(memory_location_256, true);
			assert.notStrictEqual(fd, 0);
			errno = wasi.fd_close(fd);
			assert.strictEqual(errno, Errno.success);
		});
	});

	test('fd_filestat_get', () => {
		runTestWithFilesystem((wasi, rawMemory, memory, rootFd) => {
			const name = 'test.txt';
			memory.setUint32(memory_location_256, 0);
			(new Uint8Array(rawMemory)).set(encoder.encode(name), memory_location_512);
			let errno = wasi.path_open(rootFd, 0, memory_location_512, name.length, Oflags.creat, Rights.fd_filestat_get, 0n, 0, memory_location_256);
			assert.strictEqual(errno, Errno.success);
			const fd = memory.getUint32(memory_location_256, true);
			assert.notStrictEqual(fd, 0);
			errno = wasi.fd_filestat_get(fd, memory_location_1024);
			assert.strictEqual(errno, Errno.success);
			const filestat = Filestat.create(memory_location_1024, memory);
			assert.strictEqual(filestat.size, 0n);
			assert.strictEqual(filestat.nlink, 0n);
			errno = wasi.fd_close(fd);
			assert.strictEqual(errno, Errno.success);
		});
	});
});
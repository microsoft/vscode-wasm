/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RAL from '../ral';

import assert from 'assert';

import { Clockid, Errno, Prestat, fd, Lookupflags, Oflags, Fdflags, rights, Rights } from '../wasi';
import { Environment } from '../api';
import TestEnvironment from './testEnvironment';

const FileBaseRights: rights = Rights.fd_datasync | Rights.fd_read | Rights.fd_seek | Rights.fd_fdstat_set_flags |
		Rights.fd_sync | Rights.fd_tell | Rights.fd_write | Rights.fd_advise | Rights.fd_allocate | Rights.fd_filestat_get |
		Rights.fd_filestat_set_size | Rights.fd_filestat_set_times | Rights.poll_fd_readwrite;
const FileInheritingRights: rights = 0n;

// namespace Timestamp {
// 	export function inNanoseconds(time: Date): bigint {
// 		return BigInt(time.getTime()) * 1000000n;
// 	}
// }

const encoder = RAL().TextEncoder.create();
const wasi = TestEnvironment.wasi();
const createMemory = TestEnvironment.createMemory;
const memoryQualifier = TestEnvironment.qualifier();

suite(`Simple test - ${memoryQualifier}`, () => {

	test('argv', () => {
		const memory = TestEnvironment.createMemory();

		const args = ['arg1', 'arg22', 'arg333'];
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

		errno = wasi.args_get(argv.$ptr, argvBuf.$ptr);
		assert.strictEqual(errno, Errno.success);

		for (let i = 0; i < argvCount.value; i++) {
			const valueStartOffset = argv.get(i);
			const arg = memory.readString(valueStartOffset);
			assert.strictEqual(arg, expectedArgs[i]);
		}
	});

	test('clock', () => {
		const memory = createMemory();
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
		assert.ok(now - delta < time.value && time.value <= now, 'realtime');

		errno = wasi.clock_time_get(Clockid.monotonic, 0n, time.$ptr);
		assert.strictEqual(errno, Errno.success);
		const hrtime =  RAL().clock.monotonic();
		assert.ok(hrtime - delta < time.value && time.value <= hrtime, 'monotonic');

		errno = wasi.clock_time_get(Clockid.process_cputime_id, 0n, time.$ptr);
		assert.strictEqual(errno, Errno.success);

		errno = wasi.clock_time_get(Clockid.thread_cputime_id, 0n, time.$ptr);
		assert.strictEqual(errno, Errno.success);
	});

	test('env', () => {
		const memory = createMemory();
		const environCount = memory.allocUint32();
		const environBufSize = memory.allocUint32();
		let errno = wasi.environ_sizes_get(environCount.$ptr, environBufSize.$ptr);
		assert.strictEqual(errno, 0);

		const env: Environment = { 'var1': 'value1', 'var2': 'value2' };
		const keys = Object.keys(env);
		assert.strictEqual(environCount.value, keys.length);

		let expectedBufferLength: number = 0;
		for (const key of keys) {
			expectedBufferLength += encoder.encode(key).length + 1 /* = */ + encoder.encode(env[key]).length + 1 /* 0 */;
		}
		assert.strictEqual(environBufSize.value, expectedBufferLength);

		const environ = memory.allocUint32Array(environCount.value);
		const environBuf = memory.alloc(environBufSize.value);
		errno = wasi.environ_get(environ.$ptr, environBuf.$ptr);
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

suite(`Filesystem - ${memoryQualifier}`, () => {
	const rootFd: fd = 4;
	let root: string;
	test(`fd_prestat`, () => {
		const memory = createMemory();
		const prestat = memory.allocStruct(Prestat);
		let errno = wasi.fd_prestat_get(rootFd, prestat.$ptr);
		assert.strictEqual(errno, Errno.success);
		const buffer = memory.allocStringBuffer(prestat.len);
		errno = wasi.fd_prestat_dir_name(rootFd, buffer.$ptr, prestat.len);
		assert.strictEqual(errno, Errno.success);
		root = buffer.value;
		// We only have one prestat directory
		errno = wasi.fd_prestat_get(5, prestat.$ptr);
		assert.strictEqual(errno, Errno.badf);
	});

	test(`path_open - exists`, () => {
		const memory = createMemory();
		const fd = memory.allocUint32();
		const path = memory.allocString('fixture/path_open/helloWorld.txt');
		let errno = wasi.path_open(rootFd, Lookupflags.none, path.$ptr, path.byteLength, Oflags.none, FileBaseRights, FileInheritingRights, Fdflags.none, fd.$ptr);
		assert.strictEqual(errno, Errno.success);
		assert.strictEqual(fd.value, 5);
	});
});

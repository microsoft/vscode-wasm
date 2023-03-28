/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RAL from '../ral';

import assert from 'assert';
import * as uuid from 'uuid';

import { Clockid, Errno, Prestat, fd, Lookupflags, Oflags, Fdflags, rights, Rights, Filetype, Filestat, Ciovec, WasiError, Advise, fdstat, Fdstat, fdflags, Whence, Fstflags } from '../wasi';
import { Environment } from '../api';
import TestEnvironment from './testEnvironment';
import { Memory } from './memory';
import { filestat } from '../wasi';
import { Iovec } from '../wasi';

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
const decoder = RAL().TextDecoder.create();

const wasi = TestEnvironment.wasi();
const createMemory = TestEnvironment.createMemory;
const memoryQualifier = TestEnvironment.qualifier();

namespace Clock {
	export const start = RAL().clock.realtime();
	export function now(memory: Memory): bigint {
		const time = memory.allocBigUint64();
		let errno = wasi.clock_time_get(Clockid.realtime, 0n, time.$ptr);
		assert.strictEqual(errno, Errno.success);
		return time.value;
	}
	export function assertClock(actual: bigint, expected: bigint): void {
		const delta = (3000n * 1000000n); // 3 s
		const low = expected - delta;
		const high = expected;
		assert.ok(low < actual && actual <= high, `Expected [${low},${high}] but got ${actual}`);
	}
}

namespace FileSystem {
	export function pathOpen(memory: Memory, parentFd: fd, name: string): fd {
		const fd = memory.allocUint32(0);
		const path = memory.allocString(name);
		let errno = wasi.path_open(parentFd, 0, path.$ptr, path.byteLength, 0, FileBaseRights, FileInheritingRights, 0, fd.$ptr);
		assert.strictEqual(errno, Errno.success);
		return fd.value;
	}

	export function createFile(memory: Memory, parentFd: fd, name: string, content?: Uint8Array | string): fd {
		const fd = memory.allocUint32(0);
		const path = memory.allocString(name);
		let errno = wasi.path_open(parentFd, 0, path.$ptr, path.byteLength, Oflags.creat, FileBaseRights, FileInheritingRights, 0, fd.$ptr);
		assert.strictEqual(errno, Errno.success);
		let _stat = stat(memory, fd.value);
		assert.strictEqual(_stat.filetype, Filetype.regular_file);
		if (content === undefined) {
			return fd.value;
		}
		if (typeof content === 'string') {
			content = encoder.encode(content);
		}
		const iovecs = memory.allocStructArray(1, Iovec);
		const buffer = memory.allocBytes(content);
		iovecs.get(0).buf = buffer.$ptr;
		iovecs.get(0).buf_len = buffer.byteLength;
		const bytesWritten = memory.allocUint32();
		errno = wasi.fd_write(fd.value, iovecs.$ptr, iovecs.size, bytesWritten.$ptr);
		assert.strictEqual(errno, Errno.success);
		assert.strictEqual(bytesWritten.value, content.byteLength);
		_stat = stat(memory, fd.value);
		assert.strictEqual(_stat.size, BigInt(content.byteLength));
		const newOffset = memory.allocBigUint64();
		errno = wasi.fd_seek(fd.value, 0n, Whence.set, newOffset.$ptr);
		assert.strictEqual(errno, Errno.success);
		assert.strictEqual(newOffset.value, 0n);
		return fd.value;
	}

	export function stat(memory: Memory, fd: fd): filestat {
		const stat = memory.allocStruct(Filestat);
		let errno = wasi.fd_filestat_get(fd, stat.$ptr);
		assert.strictEqual(errno, Errno.success);
		return stat;
	}

	export function read(memory: Memory, fd: fd): Uint8Array {
		const _stat  = stat(memory, fd);
		const iovecs = memory.allocStructArray(1, Iovec);
		const buffer = memory.alloc(BigInts.asNumber(_stat.size));
		iovecs.get(0).buf = buffer.$ptr;
		iovecs.get(0).buf_len = buffer.byteLength;
		const bytesRead = memory.allocUint32();
		let errno = wasi.fd_read(fd, iovecs.$ptr, iovecs.size, bytesRead.$ptr);
		assert.strictEqual(errno, Errno.success);
		return memory.readBytes(buffer.$ptr, bytesRead.value);
	}

	export function createFileClose(memory: Memory, parentFd: fd, filename: string, content: Uint8Array | string): void {
		close(createFile(memory, parentFd, filename, content));
	}

	export function write(memory: Memory, fd: fd, content: Uint8Array | string): void {
		if (typeof content === 'string') {
			content = encoder.encode(content);
		}
		const iovecs = memory.allocStructArray(1, Iovec);
		const buffer = memory.allocBytes(content);
		iovecs.get(0).buf = buffer.$ptr;
		iovecs.get(0).buf_len = buffer.byteLength;
		const bytesWritten = memory.allocUint32();
		let errno = wasi.fd_write(fd, iovecs.$ptr, iovecs.size, bytesWritten.$ptr);
		assert.strictEqual(errno, Errno.success);
		assert.strictEqual(bytesWritten.value, content.byteLength);
	}

	export function close(fd: fd): void {
		let errno = wasi.fd_close(fd);
		assert.strictEqual(errno, Errno.success);
	}
}

namespace BigInts {
	const MAX_VALUE_AS_BIGINT = BigInt(Number.MAX_VALUE);
	export function asNumber(value: bigint): number {
		if (value > MAX_VALUE_AS_BIGINT) {
			throw new WasiError(Errno.fbig);
		}
		return Number(value);
	}
}

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
		const path = memory.allocString('fixture/read/helloWorld.txt');
		let errno = wasi.path_open(rootFd, Lookupflags.none, path.$ptr, path.byteLength, Oflags.none, FileBaseRights, FileInheritingRights, Fdflags.none, fd.$ptr);
		assert.strictEqual(errno, Errno.success);
		assert.strictEqual(fd.value, 5);
		errno = wasi.fd_close(fd.value);
		assert.strictEqual(errno, Errno.success);
	});

	test(`fd_filestat_get`, () => {
		const memory = createMemory();
		const name = 'fixture/read/helloWorld.txt';
		const fd = FileSystem.pathOpen(memory, rootFd, name);
		const filestat = memory.allocStruct(Filestat);
		let errno = wasi.fd_filestat_get(fd, filestat.$ptr);
		FileSystem.close(fd);
		assert.strictEqual(errno, Errno.success);
		assert.strictEqual(filestat.filetype, Filetype.regular_file);
		assert.strictEqual(filestat.size, 11n);
		assert.strictEqual(filestat.nlink, 1n);
		Clock.assertClock(filestat.atim, Clock.start);
		Clock.assertClock(filestat.ctim, Clock.start);
		Clock.assertClock(filestat.mtim, Clock.start);
	});

	test('fd_read - single iovec', () => {
		const memory = createMemory();
		const name = 'fixture/read/helloWorld.txt';
		const content = 'Hello World';
		const fd = FileSystem.pathOpen(memory, rootFd, name);
		const stat = FileSystem.stat(memory, fd);
		const iovecs = memory.allocStructArray(1, Iovec);
		const buffer = memory.alloc(1024);
		iovecs.get(0).buf = buffer.$ptr;
		iovecs.get(0).buf_len = buffer.byteLength;
		const bytesRead = memory.allocUint32();
		let errno = wasi.fd_read(fd, iovecs.$ptr, iovecs.size, bytesRead.$ptr);
		assert.strictEqual(errno, Errno.success);
		assert.strictEqual(BigInt(bytesRead.value), stat.size);
		assert.strictEqual(decoder.decode(memory.readBytes(buffer.$ptr, bytesRead.value)), content);
		FileSystem.close(fd);
	});

	test('fd_read - multiple iovec', () => {
		const memory = createMemory();
		const name = 'fixture/read/large.txt';
		const fd = FileSystem.pathOpen(memory, rootFd, name);
		const stat = FileSystem.stat(memory, fd);
		assert.strictEqual(stat.size, 3000n);
		const iovecs = memory.allocStructArray(3, Iovec);
		for (let i = 0; i < iovecs.size; i++) {
			const buffer = memory.alloc(1024);
			iovecs.get(i).buf = buffer.$ptr;
			iovecs.get(i).buf_len = buffer.byteLength;
		}
		const bytesRead = memory.allocUint32();
		let errno = wasi.fd_read(fd, iovecs.$ptr, iovecs.size, bytesRead.$ptr);
		assert.strictEqual(errno, Errno.success);
		assert.strictEqual(BigInt(bytesRead.value), stat.size);
		let rest = 3000;
		for (let i = 0; i < iovecs.size; i++) {
			const iovec = iovecs.get(i);
			const toRead = rest >= 1024 ? 1024 : rest;
			assert.strictEqual(decoder.decode(memory.readBytes(iovec.buf, toRead)), '1'.repeat(toRead));
			rest -= toRead;
		}
		FileSystem.close(fd);
	});

	test('path_open - create file', () => {
		const memory = createMemory();
		const name = '/tmp/test.txt';
		const fd = memory.allocUint32(0);
		const path = memory.allocString(name);
		let errno = wasi.path_open(rootFd, 0, path.$ptr, path.byteLength, Oflags.creat, FileBaseRights, FileInheritingRights, 0, fd.$ptr);
		assert.strictEqual(errno, Errno.success);
		assert.notStrictEqual(fd.value, 0);
		const stat = FileSystem.stat(memory, fd.value);
		assert.strictEqual(stat.filetype, Filetype.regular_file);
		FileSystem.close(fd.value);
	});

	test('fd_write - single ciovec', () => {
		const memory = createMemory();
		const filename = `/tmp/${uuid.v4()}`;
		const hw = 'Hello World';
		const fd = FileSystem.createFile(memory, rootFd, filename);
		const ciovecs = memory.allocStructArray(1, Ciovec);
		const content = memory.allocBytes(encoder.encode(hw));
		ciovecs.get(0).buf = content.$ptr;
		ciovecs.get(0).buf_len = content.byteLength;
		const bytesWritten = memory.allocUint32();
		let errno = wasi.fd_write(fd, ciovecs.$ptr, 1, bytesWritten.$ptr);
		assert.strictEqual(errno, Errno.success);
		assert.strictEqual(bytesWritten.value, content.byteLength);
		FileSystem.close(fd);
		const check = FileSystem.pathOpen(memory, rootFd, filename);
		const written = FileSystem.read(memory, check);
		assert.strictEqual(decoder.decode(written), hw);
		FileSystem.close(check);
	});

	test('path_open - truncate file', () => {
		const memory = createMemory();
		const filename = `/tmp/${uuid.v4()}`;
		FileSystem.close(FileSystem.createFile(memory, rootFd, filename, 'Hello World'));
		const fd = memory.allocUint32();
		const p = memory.allocString(filename);
		let errno = wasi.path_open(rootFd, 0, p.$ptr, p.byteLength, Oflags.trunc, FileBaseRights, FileInheritingRights, 0, fd.$ptr);
		assert.strictEqual(errno, Errno.success);
		assert.notStrictEqual(fd.value, 0);
		const stat = FileSystem.stat(memory, fd.value);
		assert.strictEqual(stat.size, 0n);
		FileSystem.close(fd.value);
	});

	test('path_open - fail if file exists', () => {
		const memory = createMemory();
		const filename = `/tmp/${uuid.v4()}`;
		FileSystem.close(FileSystem.createFile(memory, rootFd, filename, 'Hello World'));
		const fd = memory.allocUint32(0);
		const p = memory.allocString(filename);
		let errno = wasi.path_open(rootFd, 0, p.$ptr, p.byteLength, Oflags.excl, FileBaseRights, FileInheritingRights, 0, fd.$ptr);
		assert.strictEqual(errno, Errno.exist);
	});

	test('path_open - fail if not directory', () => {
		const memory = createMemory();
		const filename = `/tmp/${uuid.v4()}`;
		FileSystem.close(FileSystem.createFile(memory, rootFd, filename, 'Hello World'));
		const fd = memory.allocUint32(0);
		const p = memory.allocString(filename);
		const errno = wasi.path_open(rootFd, 0, p.$ptr, p.byteLength, Oflags.directory, FileBaseRights, FileInheritingRights, 0, fd.$ptr);
		assert.strictEqual(errno, Errno.notdir);
	});

	test('path_open - is directory', () => {
		const memory = createMemory();
		const foldername = `fixture/read`;
		const fd = memory.allocUint32(0);
		const p = memory.allocString(foldername);
		const errno = wasi.path_open(rootFd, 0, p.$ptr, p.byteLength, Oflags.directory, FileBaseRights, FileInheritingRights, 0, fd.$ptr);
		assert.strictEqual(errno, Errno.success);
		assert.notStrictEqual(fd.value, 0);
		FileSystem.close(fd.value);
	});

	test('path_open - append mode', () => {
		const memory = createMemory();
		const filename = `/tmp/${uuid.v4()}`;
		FileSystem.close(FileSystem.createFile(memory, rootFd, filename, 'Hello'));
		const fd = memory.allocUint32(0);
		const p = memory.allocString(filename);
		let errno = wasi.path_open(rootFd, 0, p.$ptr, p.byteLength, 0, FileBaseRights, FileInheritingRights, Fdflags.append, fd.$ptr);
		assert.strictEqual(errno, Errno.success);
		FileSystem.write(memory, fd.value, ' World');
		FileSystem.close(fd.value);
		const check = FileSystem.pathOpen(memory, rootFd, filename);
		assert.strictEqual(decoder.decode(FileSystem.read(memory, check)), 'Hello World');
	});

	test('fd_seek', () => {
		const memory = createMemory();
		const filename = `/tmp/${uuid.v4()}`;
		const hw = 'Hello World';
		const fd = FileSystem.createFile(memory, rootFd, filename, hw);
		const newOffset = memory.allocBigUint64();
		let errno = wasi.fd_seek(fd, 6n, Whence.set, newOffset.$ptr);
		assert.strictEqual(errno, Errno.success);
		assert.strictEqual(newOffset.value, 6n);
		errno = wasi.fd_seek(fd, 2n, Whence.cur, newOffset.$ptr);
		assert.strictEqual(errno, Errno.success);
		assert.strictEqual(newOffset.value, 8n);
		errno = wasi.fd_seek(fd, -4n, Whence.cur, newOffset.$ptr);
		assert.strictEqual(errno, Errno.success);
		assert.strictEqual(newOffset.value, 4n);
		errno = wasi.fd_seek(fd, 3n, Whence.end, newOffset.$ptr);
		assert.strictEqual(errno, Errno.success);
		assert.strictEqual(newOffset.value, 8n);
		FileSystem.close(fd);
	});

	test('fd_advise - sequential', () => {
		const memory = createMemory();
		const filename = `/tmp/${uuid.v4()}`;
		const fd = FileSystem.createFile(memory, rootFd, filename, 'Hello World');
		// VS Code has no advise support. So all advises should result in success
		const errno = wasi.fd_advise(fd, 0n, 3n, Advise.sequential);
		assert.strictEqual(errno, Errno.success);
		FileSystem.close(fd);
	});

	test('fd_advise - random', () => {
		const memory = createMemory();
		const filename = `/tmp/${uuid.v4()}`;
		const fd = FileSystem.createFile(memory, rootFd, filename, 'Hello World');
		// VS Code has no advise support. So all advises should result in success
		const errno = wasi.fd_advise(fd, 0n, 3n, Advise.random);
		assert.strictEqual(errno, Errno.success);
		FileSystem.close(fd);
	});

	test('fd_advise - willneed', () => {
		const memory = createMemory();
		const filename = `/tmp/${uuid.v4()}`;
		const fd = FileSystem.createFile(memory, rootFd, filename, 'Hello World');
		// VS Code has no advise support. So all advises should result in success
		const errno = wasi.fd_advise(fd, 0n, 3n, Advise.willneed);
		assert.strictEqual(errno, Errno.success);
		FileSystem.close(fd);
	});

	test('fd_advise - dontneed', () => {
		const memory = createMemory();
		const filename = `/tmp/${uuid.v4()}`;
		const fd = FileSystem.createFile(memory, rootFd, filename, 'Hello World');
		// VS Code has no advise support. So all advises should result in success
		const errno = wasi.fd_advise(fd, 0n, 3n, Advise.dontneed);
		assert.strictEqual(errno, Errno.success);
		FileSystem.close(fd);
	});

	test('fd_advise - noreuse', () => {
		const memory = createMemory();
		const filename = `/tmp/${uuid.v4()}`;
		const fd = FileSystem.createFile(memory, rootFd, filename, 'Hello World');
		// VS Code has no advise support. So all advises should result in success
		const errno = wasi.fd_advise(fd, 0n, 3n, Advise.noreuse);
		assert.strictEqual(errno, Errno.success);
		FileSystem.close(fd);
	});

	test('fd_allocate - start', () => {
		const memory = createMemory();
		const filename = `/tmp/${uuid.v4()}`;
		FileSystem.createFileClose(memory, rootFd, filename, 'Hello World');
		const fd = FileSystem.pathOpen(memory, rootFd, filename);
		const before = FileSystem.stat(memory, fd);
		const errno = wasi.fd_allocate(fd, 0n, 5n);
		assert.strictEqual(errno, Errno.success);
		const after = FileSystem.stat(memory, fd);
		assert.strictEqual(before.size + 5n, after.size);
		const buffer = FileSystem.read(memory, fd);
		for (let i = 0; i < 5; i++) {
			assert.strictEqual(buffer[i], 0);
		}
		assert.notStrictEqual(buffer[5], 0);
		FileSystem.close(fd);
	});

	test('fd_allocate - middle', () => {
		const memory = createMemory();
		const filename = `/tmp/${uuid.v4()}`;
		FileSystem.createFileClose(memory, rootFd, filename, 'Hello World');
		const fd = FileSystem.pathOpen(memory, rootFd, filename);
		const before = FileSystem.stat(memory, fd);
		const errno = wasi.fd_allocate(fd, 5n, 11n);
		assert.strictEqual(errno, Errno.success);
		const after = FileSystem.stat(memory, fd);
		assert.strictEqual(before.size + 11n, after.size);
		const buffer = FileSystem.read(memory, fd);
		for (let i = 5; i < 5 + 11; i++) {
			assert.strictEqual(buffer[i], 0);
		}
		assert.notStrictEqual(buffer[5 + 11], 0);
		FileSystem.close(fd);
	});

	test('fd_allocate - end', () => {
		const memory = createMemory();
		const filename = `/tmp/${uuid.v4()}`;
		FileSystem.createFileClose(memory, rootFd, filename, 'Hello World');
		const fd = FileSystem.pathOpen(memory, rootFd, filename);
		const before = FileSystem.stat(memory, fd);
		const errno = wasi.fd_allocate(fd, 11n, 7n);
		assert.strictEqual(errno, Errno.success);
		const after = FileSystem.stat(memory, fd);
		assert.strictEqual(before.size + 7n, after.size);
		const buffer = FileSystem.read(memory, fd);
		assert.strictEqual(buffer.length, 11 + 7);
		for (let i = 11; i < 11 + 7; i++) {
			assert.strictEqual(buffer[i], 0);
		}
		FileSystem.close(fd);
	});

	test('fd_datasync', async () => {
		// In VS Code data sync writes `blindly` to disk since no other
		// options are available.
		const memory = createMemory();
		const filename = `/tmp/${uuid.v4()}`;
		const fd = FileSystem.createFile(memory, rootFd, filename, 'Hello World');
		const before = FileSystem.stat(memory, fd);
		await new Promise(resolve => RAL().timer.setTimeout(resolve, 5));

		const errno = wasi.fd_datasync(fd);
		const after = FileSystem.stat(memory, fd);
		assert.strictEqual(errno, Errno.success);
		assert.ok(before.mtim < after.mtim);
		FileSystem.close(fd);
	});

	test('fd_fdstat_get', () => {
		const memory = createMemory();
		const filename = `/tmp/${uuid.v4()}`;
		const fd = FileSystem.createFile(memory, rootFd, filename, 'Hello World');
		const fdstat: fdstat = memory.allocStruct(Fdstat);
		const errno = wasi.fd_fdstat_get(fd, fdstat.$ptr);
		assert.strictEqual(errno, Errno.success);
		assert.strictEqual(fdstat.fs_filetype, Filetype.regular_file);
		assert.strictEqual(fdstat.fs_flags, 0);
		assert.strictEqual(fdstat.fs_rights_base, FileBaseRights);
		assert.strictEqual(fdstat.fs_rights_inheriting, FileInheritingRights);
		FileSystem.close(fd);
	});

	test('fd_fdstat_set_flags', () => {
		function setFlags(memory: Memory, fd: fd, flags: fdflags) {
			let errno = wasi.fd_fdstat_set_flags(fd, flags);
			assert.strictEqual(errno, Errno.success);
			const fdstat: fdstat = memory.allocStruct(Fdstat);
			errno = wasi.fd_fdstat_get(fd, fdstat.$ptr);
			assert.strictEqual(errno, Errno.success);
			assert.notStrictEqual(fdstat.fs_flags & flags, 0);
		}
		const memory = createMemory();
		const filename = `/tmp/${uuid.v4()}`;
		const fd = FileSystem.createFile(memory, rootFd, filename);
		setFlags(memory, fd, Fdflags.dsync);
		setFlags(memory, fd, Fdflags.nonblock);
		setFlags(memory, fd, Fdflags.rsync);
		setFlags(memory, fd, Fdflags.sync);
		FileSystem.close(fd);
	});

	test('fd_filestat_set_size', () => {
		const memory = createMemory();
		const filename = `/tmp/${uuid.v4()}`;
		const content = 'Hello World';
		const fd = FileSystem.createFile(memory, rootFd, filename, content);
		const stat = FileSystem.stat(memory, fd);
		const errno = wasi.fd_filestat_set_size(fd, stat.size + 13n);
		assert.strictEqual(errno, Errno.success);
		const newSize = FileSystem.stat(memory, fd).size;
		assert.strictEqual(newSize, stat.size + 13n);
		const originalLength = encoder.encode(content).byteLength;
		FileSystem.close(fd);
		const check = FileSystem.pathOpen(memory, rootFd, filename);
		const buffer = FileSystem.read(memory, check);
		assert.strictEqual(buffer.length, originalLength + 13);
		for (let i = originalLength; i < buffer.length; i++) {
			assert.strictEqual(buffer[i], 0);
		}
		FileSystem.close(check);
	});

	test('fd_filestat_set_times', () => {
		const memory = createMemory();
		const filename = `/tmp/${uuid.v4()}`;
		const content = 'Hello World';
		const fd = FileSystem.createFile(memory, rootFd, filename, content);
		const errno = wasi.fd_filestat_set_times(fd, 10n, 10n, Fstflags.atim | Fstflags.mtim);
		assert.strictEqual(errno, Errno.nosys);
		FileSystem.close(fd);
	});
});
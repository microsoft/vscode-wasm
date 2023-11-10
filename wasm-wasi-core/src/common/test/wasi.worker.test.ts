/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RAL from '../ral';

import assert from 'assert';
import * as uuid from 'uuid';

import { Clockid, Errno, Prestat, fd, Lookupflags, Oflags, Fdflags, rights, Rights, Filetype, Filestat, Ciovec, WasiError, Advise, fdstat, Fdstat, fdflags, Whence, Fstflags, Dirent } from '../wasi';
import { Environment } from '../api';
import TestEnvironment from './testEnvironment';
import { Memory, wasi } from './memory';
import { filestat } from '../wasi';
import { Iovec } from '../wasi';

const FileBaseRights: rights = Rights.fd_datasync | Rights.fd_read | Rights.fd_seek | Rights.fd_fdstat_set_flags |
		Rights.fd_sync | Rights.fd_tell | Rights.fd_write | Rights.fd_advise | Rights.fd_allocate | Rights.fd_filestat_get |
		Rights.fd_filestat_set_size | Rights.fd_filestat_set_times | Rights.poll_fd_readwrite;
const FileInheritingRights: rights = 0n;
const DirectoryBaseRights: rights = Rights.fd_fdstat_set_flags | Rights.path_create_directory |
		Rights.path_create_file | Rights.path_link_source | Rights.path_link_target | Rights.path_open |
		Rights.fd_readdir | Rights.path_readlink | Rights.path_rename_source | Rights.path_rename_target |
		Rights.path_filestat_get | Rights.path_filestat_set_size | Rights.path_filestat_set_times |
		Rights.fd_filestat_get | Rights.fd_filestat_set_times | Rights.path_remove_directory | Rights.path_unlink_file |
		Rights.path_symlink;
const DirectoryInheritingRights: rights = DirectoryBaseRights | FileBaseRights;


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

namespace FileSystem {

	export function openFile(memory: Memory, parentFd: fd, name: string): fd {
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

	export function createFolder(memory: Memory, parentFd: fd, name: string): void {
		const path = memory.allocString(name);
		let errno = wasi.path_create_directory(parentFd, path.$ptr, path.byteLength);
		assert.strictEqual(errno, Errno.success);
	}

	export function openFolder(memory: Memory, parentFd: fd, name: string): fd {
		const fd = memory.allocUint32(0);
		const path = memory.allocString(name);
		let errno = wasi.path_open(parentFd, 0, path.$ptr, path.byteLength, 0, DirectoryBaseRights, DirectoryInheritingRights, 0, fd.$ptr);
		assert.strictEqual(errno, Errno.success);
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
		assert.ok(now - delta < time.value && time.value < now + delta, `realtime [${now}, ${time.value}]`);

		errno = wasi.clock_time_get(Clockid.monotonic, 0n, time.$ptr);
		assert.strictEqual(errno, Errno.success);
		const hrtime =  RAL().clock.monotonic();
		assert.ok(hrtime - delta < time.value && time.value < hrtime + delta, `monotonic [${hrtime}, ${time.value}]`);

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
	test(`fd_prestat`, () => {
		const memory = createMemory();
		const prestat = memory.allocStruct(Prestat);
		let errno = wasi.fd_prestat_get(rootFd, prestat.$ptr);
		assert.strictEqual(errno, Errno.success);
		const buffer = memory.allocStringBuffer(prestat.len);
		errno = wasi.fd_prestat_dir_name(rootFd, buffer.$ptr, prestat.len);
		assert.strictEqual(errno, Errno.success);
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
		const fd = FileSystem.openFile(memory, rootFd, name);
		const filestat = memory.allocStruct(Filestat);
		let errno = wasi.fd_filestat_get(fd, filestat.$ptr);
		FileSystem.close(fd);
		assert.strictEqual(errno, Errno.success);
		assert.strictEqual(filestat.filetype, Filetype.regular_file);
		assert.strictEqual(filestat.size, 11n);
		assert.strictEqual(filestat.nlink, 1n);
		assert.strictEqual(filestat.atim, TestEnvironment.stats().mtime);
		assert.strictEqual(filestat.ctim, TestEnvironment.stats().ctime);
		assert.strictEqual(filestat.mtim, TestEnvironment.stats().mtime);
	});

	test('fd_read - single iovec', () => {
		const memory = createMemory();
		const name = 'fixture/read/helloWorld.txt';
		const content = 'Hello World';
		const fd = FileSystem.openFile(memory, rootFd, name);
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
		const fd = FileSystem.openFile(memory, rootFd, name);
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
		const check = FileSystem.openFile(memory, rootFd, filename);
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
		const check = FileSystem.openFile(memory, rootFd, filename);
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
		const fd = FileSystem.openFile(memory, rootFd, filename);
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
		const fd = FileSystem.openFile(memory, rootFd, filename);
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
		const fd = FileSystem.openFile(memory, rootFd, filename);
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
		const check = FileSystem.openFile(memory, rootFd, filename);
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

	test('fd_pread', () => {
		const memory = createMemory();
		const filename = `/tmp/${uuid.v4()}`;
		const content = 'Hello World';
		FileSystem.createFileClose(memory, rootFd, filename, content);
		const fd = FileSystem.openFile(memory, rootFd, filename);
		const stat = FileSystem.stat(memory, fd);
		const iovecs = memory.allocStructArray(1, Iovec);
		const buffer = memory.alloc(1024);
		iovecs.get(0).buf = buffer.$ptr;
		iovecs.get(0).buf_len = buffer.byteLength;
		const bytesRead = memory.allocUint32();
		const offset = 6n;
		let errno = wasi.fd_pread(fd, iovecs.$ptr, iovecs.size, offset, bytesRead.$ptr);
		assert.strictEqual(errno, Errno.success);
		assert.strictEqual(BigInt(bytesRead.value), stat.size - offset);
		assert.strictEqual(decoder.decode(memory.readBytes(buffer.$ptr, bytesRead.value)), 'World');
	});

	test('path_create_directory', () => {
		const memory = createMemory();
		const folderName = `/tmp/${uuid.v4()}`;
		const path = memory.allocString(folderName);
		let errno = wasi.path_create_directory(rootFd, path.$ptr, path.byteLength);
		assert.strictEqual(errno, Errno.success);
		const fd = memory.allocUint32(0);
		errno = wasi.path_open(rootFd, Lookupflags.none, path.$ptr, path.byteLength, Oflags.directory, DirectoryBaseRights, DirectoryInheritingRights, Fdflags.none, fd.$ptr);
		assert.strictEqual(errno, Errno.success);
		const stat = FileSystem.stat(memory, fd.value);
		assert.strictEqual(stat.filetype, Filetype.directory);
		FileSystem.close(fd.value);
	});

	test('fd_readdir - single read', () => {
		const memory = createMemory();
		const fileNames: Set<string> = new Set();
		const folderName = '/tmp/readdir-single';
		FileSystem.createFolder(memory, rootFd, folderName);
		const folderFd = FileSystem.openFolder(memory, rootFd, folderName);
		for (let i = 1; i <= 11; i++) {
			const fileName = `test${i}.txt`;
			FileSystem.createFileClose(memory, folderFd, fileName, `${i}`.repeat(i));
			fileNames.add(fileName);
		}
		const buffer = memory.alloc(2048);
		const bufUsed = memory.allocUint32();
		let errno = wasi.fd_readdir(folderFd, buffer.$ptr, buffer.byteLength, 0n, bufUsed.$ptr);
		assert.strictEqual(errno, Errno.success);
		let index = buffer.$ptr;
		let next = 1n;
		const end = index + bufUsed.value;
		while(index < end) {
			const dirent = memory.readStruct(index, Dirent);
			assert.strictEqual(dirent.d_next, next);
			assert.strictEqual(dirent.d_type, Filetype.regular_file);
			const name = decoder.decode(memory.readBytes(index + Dirent.size, dirent.d_namlen));
			assert.ok(fileNames.has(name), 'Known file name');
			fileNames.delete(name);
			index += Dirent.size + dirent.d_namlen;
			next++;
		}
		assert.strictEqual(0, fileNames.size);
	});

	test('fd_readdir - multiple read', () => {
		type Uint32 = wasi.Uint32;
		const memory = createMemory();
		const fileNames: Set<string> = new Set();
		const folderName = '/tmp/readdir-multi';
		FileSystem.createFolder(memory, rootFd, folderName);
		const folderFd = FileSystem.openFolder(memory, rootFd, folderName);
		for (let i = 1; i <= 11; i++) {
			const fileName = `test${i}.txt`;
			FileSystem.createFileClose(memory, folderFd, fileName, `${i}`.repeat(i));
			fileNames.add(fileName);
		}
		const buffSize = 128;
		let bufUsed: Uint32;
		let dircookie = 0n;
		do {
			const buffer = memory.alloc(buffSize);
			bufUsed = memory.allocUint32();
			let errno = wasi.fd_readdir(folderFd, buffer.$ptr, buffer.byteLength, dircookie, bufUsed.$ptr);
			assert.strictEqual(errno, Errno.success);
			let index = buffer.$ptr;
			let spaceLeft = buffSize;
			while(spaceLeft >= Dirent.size && index - buffer.$ptr < bufUsed.value) {
				const dirent = memory.readStruct(index, Dirent);
				assert.strictEqual(dirent.d_next, dircookie + 1n);
				assert.strictEqual(dirent.d_type, Filetype.regular_file);
				spaceLeft -= Dirent.size;
				index += Dirent.size;
				if (spaceLeft >= dirent.d_namlen) {
					const name = decoder.decode(memory.readBytes(index, dirent.d_namlen));
					assert.ok(fileNames.has(name), 'Known file name');
					fileNames.delete(name);
					index += dirent.d_namlen;
					spaceLeft -= dirent.d_namlen;
					dircookie = dirent.d_next;
				} else {
					spaceLeft = 0;
				}
			}
		} while (bufUsed.value === buffSize);
		assert.strictEqual(0, fileNames.size);
	});

	test('fd_sync', async () => {
		const memory = createMemory();
		const filename = `/tmp/${uuid.v4()}`;
		const content = 'Hello World';
		const fd = FileSystem.createFile(memory, rootFd, filename, content);
		const before = FileSystem.stat(memory, fd);
		await new Promise((resolve) => RAL().timer.setTimeout(resolve, 5)); // Wait for 5ms to ensure mtim changes
		const errno = wasi.fd_sync(fd);
		const after = FileSystem.stat(memory, fd);
		assert.strictEqual(errno, Errno.success);
		assert.ok(before.mtim < after.mtim);
	});

	test('fd_tell', () => {
		const memory = createMemory();
		const filename = `/tmp/${uuid.v4()}`;
		const content = 'Hello World';
		const fd = FileSystem.createFile(memory, rootFd, filename, content);
		const newOffset = memory.allocBigUint64();
		let errno = wasi.fd_seek(fd, 3n, Whence.set, newOffset.$ptr);
		assert.strictEqual(errno, Errno.success);
		const tellOffset = memory.allocBigUint64();
		errno = wasi.fd_tell(fd, tellOffset.$ptr);
		assert.strictEqual(errno, Errno.success);
		assert.strictEqual(newOffset.value, tellOffset.value);
	});

	test('fd_write - multiple ciovec', () => {
		const memory = createMemory();
		const filename = `/tmp/${uuid.v4()}`;
		const hw = ['Hello ', 'World ', '!!!'];
		const fd = FileSystem.createFile(memory, rootFd, filename);
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
		FileSystem.close(fd);
		const check = FileSystem.openFile(memory, rootFd, filename);
		assert.strictEqual(errno, Errno.success);
		assert.strictEqual(bytesWritten.value, contentLength);
		assert.strictEqual(decoder.decode(FileSystem.read(memory, check)), hw.join(''));
		FileSystem.close(check);
	});

	test('path_filestat_get', () => {
		const memory = createMemory();
		const filename = '/fixture/read/helloWorld.txt';
		const path = memory.allocString(filename);
		const filestat = memory.allocStruct(Filestat);
		let errno = wasi.path_filestat_get(rootFd, Lookupflags.none, path.$ptr, path.byteLength, filestat.$ptr);
		assert.strictEqual(errno, Errno.success);
		assert.strictEqual(errno, Errno.success);
		assert.strictEqual(filestat.filetype, Filetype.regular_file);
		assert.strictEqual(filestat.size, 11n);
		assert.strictEqual(filestat.nlink, 1n);
		assert.strictEqual(filestat.atim, TestEnvironment.stats().mtime);
		assert.strictEqual(filestat.ctim, TestEnvironment.stats().ctime);
		assert.strictEqual(filestat.mtim, TestEnvironment.stats().mtime);
	});

	test('path_filestat_set_times', () => {
		const memory = createMemory();
		const filename = `/tmp/${uuid.v4()}`;
		const content = 'Hello World';
		const fd = FileSystem.createFile(memory, rootFd, filename, content);
		FileSystem.close(fd);
		const path = memory.allocString(filename);
		const errno = wasi.path_filestat_set_times(rootFd, Lookupflags.none, path.$ptr, path.byteLength, 10n, 10n, Fstflags.atim | Fstflags.mtim);
		assert.strictEqual(errno, Errno.nosys);
	});

	test('path_link', () => {
		const memory = createMemory();
		const filename = `/tmp/${uuid.v4()}`;
		const content = 'Hello World';
		const fd = FileSystem.createFile(memory, rootFd, filename, content);
		FileSystem.close(fd);
		const oldPath = memory.allocString(filename);
		const newPath = memory.allocString(`/tmp/${uuid.v4()}`);
		const errno = wasi.path_link(rootFd, Lookupflags.none, oldPath.$ptr, oldPath.byteLength, rootFd, newPath.$ptr, newPath.byteLength);
		assert.strictEqual(errno, Errno.nosys);
	});

	test('path_readlink', () => {
		const memory = createMemory();
		const filename = `/tmp/${uuid.v4()}`;
		const content = 'Hello World';
		const fd = FileSystem.createFile(memory, rootFd, filename, content);
		FileSystem.close(fd);
		const path = memory.allocString(filename);
		const buffer = memory.alloc(1024);
		const bufUsed = memory.allocUint32();
		const errno = wasi.path_readlink(rootFd, path.$ptr, path.byteLength, buffer.$ptr, buffer.byteLength, bufUsed.$ptr);
		assert.strictEqual(errno, Errno.nolink);
	});

	test('path_remove_directory', () => {
		const memory = createMemory();
		const foldername = `/tmp/${uuid.v4()}`;
		FileSystem.createFolder(memory, rootFd, foldername);
		const path = memory.allocString(foldername);
		const filestat = memory.allocStruct(Filestat);
		let errno = wasi.path_filestat_get(rootFd, Lookupflags.none, path.$ptr, path.byteLength, filestat.$ptr);
		assert.strictEqual(errno, Errno.success);
		assert.strictEqual(filestat.filetype, Filetype.directory);
		errno = wasi.path_remove_directory(rootFd, path.$ptr, path.byteLength);
		assert.strictEqual(errno, Errno.success);
		errno = wasi.path_filestat_get(rootFd, Lookupflags.none, path.$ptr, path.byteLength, filestat.$ptr);
		assert.strictEqual(errno, Errno.noent);
	});

	test('path_rename', () => {
		const memory = createMemory();
		const filename = `/tmp/${uuid.v4()}`;
		const content = 'Hello World';
		const fd = FileSystem.createFile(memory, rootFd, filename, content);
		FileSystem.close(fd);
		const oldPath = memory.allocString(filename);
		const newPath = memory.allocString(`/tmp/${uuid.v4()}`);
		let errno = wasi.path_rename(rootFd, oldPath.$ptr, oldPath.byteLength, rootFd, newPath.$ptr, newPath.byteLength);
		assert.strictEqual(errno, Errno.success);
		const filestat = memory.allocStruct(Filestat);
		errno = wasi.path_filestat_get(rootFd, Lookupflags.none, oldPath.$ptr, oldPath.byteLength, filestat.$ptr);
		assert.strictEqual(errno, Errno.noent);
		errno = wasi.path_filestat_get(rootFd, Lookupflags.none, newPath.$ptr, newPath.byteLength, filestat.$ptr);
		assert.strictEqual(errno, Errno.success);
	});

	test('path_rename - open file descriptor', () => {
		const memory = createMemory();
		const filename = `/tmp/${uuid.v4()}`;
		const content = 'Hello World';
		const fd = FileSystem.createFile(memory, rootFd, filename, content);
		const oldPath = memory.allocString(filename);
		const newPath = memory.allocString(`/tmp/${uuid.v4()}`);
		let errno = wasi.path_rename(rootFd, oldPath.$ptr, oldPath.byteLength, rootFd, newPath.$ptr, newPath.byteLength);
		assert.strictEqual(errno, Errno.success);
		const stat = FileSystem.stat(memory, fd);
		assert.strictEqual(stat.filetype, Filetype.regular_file);
		FileSystem.close(fd);
	});

	test('path_symlink', () => {
		// VS Code has no symlink support. So we can only test
		// that the call is processed correctly.
		const memory = createMemory();
		const oldPath = memory.allocString(`/tmp/${uuid.v4()}`);
		const newPath = memory.allocString(`/tmp/${uuid.v4()}`);
		const errno = wasi.path_symlink(oldPath.$ptr, oldPath.byteLength, rootFd, newPath.$ptr, newPath.byteLength);
		assert.strictEqual(errno, Errno.nosys);
	});

	test('path_unlink_file', () => {
		const memory = createMemory();
		const filename = `/tmp/${uuid.v4()}`;
		const content = 'Hello World';
		const fd = FileSystem.createFile(memory, rootFd, filename, content);
		FileSystem.close(fd);
		const path = memory.allocString(filename);
		let errno = wasi.path_unlink_file(rootFd, path.$ptr, path.byteLength);
		assert.strictEqual(errno, Errno.success);
		const filestat = memory.allocStruct(Filestat);
		errno = wasi.path_filestat_get(rootFd, Lookupflags.none, path.$ptr, path.byteLength, filestat.$ptr);
		assert.strictEqual(errno, Errno.noent);
	});

	test('path_unlink_file - open file descriptor', () => {
		const memory = createMemory();
		const filename = `/tmp/${uuid.v4()}`;
		const content = 'Hello World';
		const fd = FileSystem.createFile(memory, rootFd, filename, content);
		const newOffset = memory.allocBigUint64();
		let errno = wasi.fd_seek(fd, 0n, Whence.set, newOffset.$ptr);
		assert.strictEqual(errno, Errno.success);
		assert.strictEqual(newOffset.value, 0n);
		const path = memory.allocString(filename);
		errno = wasi.path_unlink_file(rootFd, path.$ptr, path.byteLength);
		assert.strictEqual(errno, Errno.success);
		const filestat = memory.allocStruct(Filestat);
		errno = wasi.fd_filestat_get(fd, filestat.$ptr);
		assert.strictEqual(errno, Errno.success);
		const bytes = FileSystem.read(memory, fd);
		assert.strictEqual(decoder.decode(bytes), content);
		FileSystem.close(fd);
		errno = wasi.fd_filestat_get(fd, filestat.$ptr);
		assert.strictEqual(errno, Errno.badf);
		errno = wasi.path_filestat_get(rootFd, Lookupflags.none, path.$ptr, path.byteLength, filestat.$ptr);
		assert.strictEqual(errno, Errno.noent);
	});
});
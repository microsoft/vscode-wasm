/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import assert from 'assert';

import { DeviceDescription, Environment, WASI, Clockid, Errno } from '@vscode/wasm-wasi';
import { URI } from 'vscode-uri';

import { TestApi } from './testApi';
import { TextDecoder, TextEncoder } from 'util';

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

suite('Configurations', () => {

	const consoleUri = URI.from({ scheme: 'console', authority: 'developerTools' });

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
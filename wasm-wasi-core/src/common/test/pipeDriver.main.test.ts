/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import assert from 'assert';

import * as pipeDriver from '../pipeDriver';
import { WritableStream } from '../streams';
import { Errno, Fdflags, Fdstat, WasiError } from '../wasi';

suite('Pipe Driver Tests', () => {
	test('non-blocking stdin', async () => {
		const stdin = new WritableStream();
		const driver = pipeDriver.create(1n, stdin, undefined, undefined, Fdflags.nonblock);
		const descriptor = driver.createStdioFileDescriptor(0);
		const stat = Fdstat.create(new DataView(new ArrayBuffer(Fdstat.size)), 0);

		await driver.fd_fdstat_get(descriptor, stat);
		assert.strictEqual(stat.fs_flags, Fdflags.nonblock);

		assert.strictEqual(await driver.fd_read(descriptor, [new Uint8Array(0)]), 0);

		await assert.rejects(
			driver.fd_read(descriptor, [new Uint8Array(1)]),
			(error: unknown) => error instanceof WasiError && error.errno === Errno.again
		);

		await stdin.write(new Uint8Array([42]));
		const buffer = new Uint8Array(1);
		assert.strictEqual(await driver.fd_read(descriptor, [buffer]), 1);
		assert.strictEqual(buffer[0], 42);

		stdin.end();
		assert.strictEqual(await driver.fd_read(descriptor, [buffer]), 0);
	});

	test('set stdin non-blocking', async () => {
		const stdin = new WritableStream();
		const driver = pipeDriver.create(1n, stdin, undefined, undefined);
		const descriptor = driver.createStdioFileDescriptor(0);

		await driver.fd_fdstat_set_flags(descriptor, Fdflags.nonblock);
		await assert.rejects(
			driver.fd_read(descriptor, [new Uint8Array(1)]),
			(error: unknown) => error instanceof WasiError && error.errno === Errno.again
		);
	});
});

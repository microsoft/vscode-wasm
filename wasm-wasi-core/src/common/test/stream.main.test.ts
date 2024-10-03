/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import assert from 'assert';
import RAL from '../ral';
import { ReadableStream, WritableStream, WritableStreamEOT } from '../streams';

suite('Stream Tests', () => {
	test('Stream write 16k', async () => {
		const writeable = new WritableStream();
		const data = new Uint8Array(1024 * 16);
		await writeable.write(data);
		const read = await writeable.read();
		assert.strictEqual(read.byteLength, data.byteLength);
	});

	test('Stream write 32k', async () => {
		const writeable = new WritableStream();
		const data = new Uint8Array(1024 * 32);
		await writeable.write(data);
		const read = await writeable.read();
		assert.strictEqual(read.byteLength, data.byteLength);
	});

	test('Stream read paused', async () => {
		const readable = new ReadableStream();
		readable.pause();
		let onData = false;
		readable.onData(() => {
			onData = true;
		});
		await readable.write(new Uint8Array(1024));
		assert.strictEqual(onData, false);
		const data = await readable.read();
		assert.strictEqual(data.byteLength, 1024);
	});

	test('Stream read flowing', async () => {
		const readable = new ReadableStream();
		let received = 0;
		readable.onData((data) => {
			received += data.byteLength;
		});
		await readable.write(new Uint8Array(1024));
		await readable.write(new Uint8Array(10));
		while (readable.size > 0) {
			await new Promise(resolve => RAL().timer.setTimeout(resolve, 10));
		}
		assert.strictEqual(received, 1034);
	});

	test('Stream read flowing -> paused', async () => {
		const readable = new ReadableStream();
		let received = 0;
		readable.onData((data) => {
			received += data.byteLength;
		});
		await readable.write(new Uint8Array(1024));
		await readable.write(new Uint8Array(10));
		readable.pause(true);
		await readable.write(new Uint8Array(20));
		received += (await readable.read())!.byteLength;
		assert.strictEqual(received, 1054);
	});

	test('Stream read max (see #178)', async () => {
		const encoder = RAL().TextEncoder.create();
		const a = encoder.encode('a');
		const success = encoder.encode('success');
		const readable = new ReadableStream();
		readable.pause();
		for (let i = 0; i < 8190; i++) {
			await readable.write(a);
		}
		await readable.write(success);
		let data = await readable.read('max', 8192);
		assert.strictEqual(data.byteLength, 8190);
		for (let i = 0; i < 8190; i++) {
			assert.strictEqual(data[i], a[0]);
		}
		data = await readable.read('max', 8192);
		assert.strictEqual(data.byteLength, 7);
		for (let i = 0; i < 5; i++) {
			assert.strictEqual(data[i], success[i]);
		}
	});

	test('Stream end', async () => {
		const writeable = new WritableStream();
		await writeable.write('Hello World');
		const decoder = RAL().TextDecoder.create();
		assert.strictEqual(decoder.decode(await writeable.read()), 'Hello World');
		writeable.end();
		const data = await writeable.read();
		assert.strictEqual(data.byteLength, 0);
	});

	test('Stream end write throws', async () => {
		const writeable = new WritableStream();
		writeable.end();
		await assert.rejects(async () => {
			await writeable.write('Hello World');
		});
	});
});

suite('Stream EOT Tests', () => {
	test('Stream write EOT after read', async () => {
		const writeable = new WritableStreamEOT();
		await writeable.write('Hello World');
		const decoder = RAL().TextDecoder.create();
		assert.strictEqual(decoder.decode(await writeable.read()), 'Hello World');
		await writeable.write(new Uint8Array([0x04]));
		const data = await writeable.read();
		assert.strictEqual(data.byteLength, 0);
	});

	test('Stream write EOT before read', async () => {
		const writeable = new WritableStreamEOT();
		await writeable.write('Hello World');
		await writeable.write(new Uint8Array([0x04]));
		const decoder = RAL().TextDecoder.create();
		assert.strictEqual(decoder.decode(await writeable.read()), 'Hello World');
		const data = await writeable.read();
		assert.strictEqual(data.byteLength, 0);
	});

	test('Stream write EOT embedded', async () => {
		const writeable = new WritableStreamEOT();
		await writeable.write('Hello World\u0004');
		const decoder = RAL().TextDecoder.create();
		assert.strictEqual(decoder.decode(await writeable.read()), 'Hello World');
		const data = await writeable.read();
		assert.strictEqual(data.byteLength, 0);
	});
});
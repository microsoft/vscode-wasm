/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import assert from 'assert';
import RAL from '../ral';
import { ReadableStream, WritableStream } from '../streams';

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


});
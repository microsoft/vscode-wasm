/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import path from 'node:path';
import { Worker } from 'node:worker_threads';

const mainWorker = new Worker(path.join(__dirname, 'thread.js'));
mainWorker.on('message', (buffer: SharedArrayBuffer) => {
	try {
		const view = new DataView(buffer);
		const value = Math.trunc(Math.random() * 1000);
		view.setInt32(4, value, true);
	} finally {
		const sync = new Int32Array(buffer, 0, 1);
		Atomics.store(sync, 0, 1);
		Atomics.notify(sync, 0);
	}
});

mainWorker.postMessage('start');

const buffer = new SharedArrayBuffer(4096);
const view = new DataView(buffer);

function store(): void {
	const value = Math.trunc(Math.random() * 1000);
	view.setInt32(4, value, true);
}

let sum: number = 0;
const start = Date.now();
for (let i = 0; i < 1000000; i++) {
	store();
	sum += view.getInt32(4, true);

}
const end = Date.now();
console.log(`Time taken to call 1000000 times: ${end - start}ms. Sum value: ${sum}`);
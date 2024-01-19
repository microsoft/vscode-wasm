/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { parentPort } from 'node:worker_threads';

import { float64, ptr } from '@vscode/wasm-component-model';

import { SArray } from '../../common/sarray';
import { MessageConnection } from './messageConnection';
import { Notifications, Operations, Requests, ServerNotifications } from './messages';
import { SharedObject } from '../../common/sobject';

const connection = new MessageConnection<undefined, Operations | ServerNotifications, Requests, Notifications>(parentPort!);

const arrays: Map<ptr, SArray<float64>> = new Map();

const operations: string[] = [
	'array/push',
	'array/pop',
	'array/get'
];

let workerId!: number;
connection.onRequest('init', async (params) => {
	workerId = params.workerId;
	await SharedObject.initialize(params.memory);
});


connection.onNotification('array/new', async (params) => {
	const array = new SArray<float64>(float64, { value: params.array });
	arrays.set(params.array, array);

	const counter = new Uint32Array(SharedObject.memory().buffer, params.counter, 1);

	function push() {
		const value = Math.random();
		let sequence!: number;
		let length!: number;
		array.runLocked(() => {
			sequence = Atomics.add(counter, 0, 1);
			array.push(value);
			length = array.length;
		});
		connection.sendNotification('array/push', { workerId, sequence, value, length });
	}

	function pop() {
		let sequence!: number;
		let result: number | undefined;
		let length!: number;
		array.runLocked(() => {
			sequence = Atomics.add(counter, 0, 1);
			result = array.pop();
			length = array.length;
		});
		connection.sendNotification('array/pop', { workerId, sequence, result, length });
	}

	function get() {
		let sequence!: number;
		let index!: number;
		let result!: number;
		array.runLocked(() => {
			index = Math.floor(Math.random() * array.length);
			sequence = Atomics.add(counter, 0, 1);
			result = array.at(index)!;
		});
		connection.sendNotification('array/get', { workerId, sequence, index, result });
	}

	let start = Date.now();

	while(Date.now() - start < 10000) {
		const operation = operations[Math.floor(Math.random() * operations.length)];
		switch (operation) {
			case 'array/push':
				push();
				break;
			case 'array/pop':
				pop();
				break;
			case 'array/get':
				get();
				break;
		}
	}
	connection.sendNotification('done');
});

connection.onNotification('exit', async () => {
	process.exit(0);
});

connection.listen();
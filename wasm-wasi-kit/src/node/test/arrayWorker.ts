/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import RIL from '../ril';
RIL.install();

import { parentPort } from 'node:worker_threads';

import { float64, ptr } from '@vscode/wasm-component-model';

import { SharedArray } from '../../common/array';
import { Connection } from '../connection';
import { Notifications, Operations, ManagementCalls, ServerNotifications } from './messages';
import { Lock, MemoryLocation, SharedMemory } from '../../common/sharedObject';

const connection = new Connection<undefined, undefined, Operations | ServerNotifications, ManagementCalls, undefined, Notifications>(parentPort!);

const arrays: Map<ptr, SharedArray<float64>> = new Map();

const operations: string[] = [
	'array/push',
	'array/pop',
	'array/get'
];

let workerId!: number;
let memory: SharedMemory;
connection.onAsyncCall('init', async (params) => {
	workerId = params.workerId;
	memory = await SharedMemory.createFrom(params.memory);
	connection.initializeSyncCall(memory);
});

connection.onNotify('array/new', async (params) => {
	const lock = new Lock(MemoryLocation.to(memory, params.lock));
	const array = SharedArray.synchronized(lock, new SharedArray<float64>(float64, MemoryLocation.to(memory, params.array)));
	arrays.set(array.getMemoryLocation().ptr, array);

	const counter =  MemoryLocation.to(memory, params.counter).getUint32View(0);

	function push() {
		const value = Math.random();
		let sequence!: number;
		let length!: number;
		array.runLocked(() => {
			sequence = Atomics.add(counter, 0, 1);
			array.push(value);
			length = array.length;
		});
		connection.notify('array/push', { workerId, sequence, value, length });
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
		connection.notify('array/pop', { workerId, sequence, result, length });
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
		connection.notify('array/get', { workerId, sequence, index, result });
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
	connection.notify('done');
});

connection.onNotify('exit', async () => {
	process.exit(0);
});

connection.listen();
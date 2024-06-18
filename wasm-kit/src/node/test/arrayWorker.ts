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
import { Lock, SharedMemory } from '../../common/sharedObject';

const connection = new Connection<undefined, undefined, Operations | ServerNotifications, ManagementCalls, undefined, Notifications>(parentPort!);

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


type ArrayInfo = { counter: Uint32Array; ptr: ptr; array: SharedArray.Synchronized<float64> };
const arrays: ArrayInfo[] = [];

connection.onAsyncCall('array/new', async (params) => {
	const counter =  memory.range.fromLocation(params.counter).getUint32View(0);
	const lock = new Lock(memory.range.fromLocation(params.lock));
	const array = SharedArray.synchronized(lock, new SharedArray<float64>(float64, memory.range.fromLocation(params.array)));
	arrays.push({ counter, ptr: array.location().ptr, array });
});

function push(info: ArrayInfo) {
	const array = info.array;
	const value = Math.random();
	let sequence!: number;
	let length!: number;
	array.runLocked(() => {
		sequence = Atomics.add(info.counter, 0, 1);
		array.push(value);
		length = array.length;
	});
	connection.notify('array/push', { workerId, array: info.ptr, sequence, value, length });
}

function pop(info: ArrayInfo) {
	const array = info.array;
	let sequence!: number;
	let result: number | undefined;
	let length!: number;
	array.runLocked(() => {
		sequence = Atomics.add(info.counter, 0, 1);
		result = array.pop();
		length = array.length;
	});
	connection.notify('array/pop', { workerId, array: info.ptr, sequence, result, length });
}

function get(info: ArrayInfo) {
	const array = info.array;
	let sequence!: number;
	let index!: number;
	let result!: number;
	array.runLocked(() => {
		index = Math.floor(Math.random() * array.length);
		sequence = Atomics.add(info.counter, 0, 1);
		result = array.at(index)!;
	});
	connection.notify('array/get', { workerId, array: info.ptr, sequence, index, result });
}

connection.onNotify('start', async () => {
	let start = Date.now();

	while(Date.now() - start < 10000) {
		const array = arrays[Math.floor(Math.random() * arrays.length)];
		const operation = operations[Math.floor(Math.random() * operations.length)];
		switch (operation) {
			case 'array/push':
				push(array);
				break;
			case 'array/pop':
				pop(array);
				break;
			case 'array/get':
				get(array);
				break;
		}
	}
	connection.notify('done');
});

connection.onNotify('exit', async () => {
	process.exit(0);
});

connection.listen();
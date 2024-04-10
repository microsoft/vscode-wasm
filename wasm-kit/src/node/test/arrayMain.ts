/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import RIL from '../ril';
RIL.install();

import path from 'node:path';
import { Worker } from 'node:worker_threads';

import { Alignment, float64, u32, type ptr, type MemoryRange  } from '@vscode/wasm-component-model';

import { Lock, MemoryLocation, SharedMemory } from '../../common/sharedObject';
import { SharedArray } from '../../common/array';

import { Notifications, Operations, ManagementCalls, ServerNotifications } from './messages';
import { Connection } from '../connection';

declare const v8debug: object;
const isDebugging = typeof v8debug === 'object' || /--debug|--inspect/.test(process.execArgv.join(' '));

class ArrayOperations {

	private readonly sarray: SharedArray<float64>;
	public readonly jarray: number[];
	private operations: Operations[] = [];

	constructor(sarray: SharedArray<float64>) {
		this.sarray = sarray;
		this.jarray = [];
		this.operations = [];
	}

	public size(): number {
		return this.operations.length;
	}

	public record(operation: Operations): void {
		const index = operation.params.sequence;
		const entry = this.operations[index];
		if (entry !== undefined) {
			debugger;
		}
		this.operations[index] = operation;
	}

	public replay(): void {
		for (const operation of this.operations) {
			this._replay(operation);
		}
	}

	public compare(): void {
		if (this.jarray.length !== this.sarray.length) {
			this.debugOrThrow(`Length mismatch: ${this.jarray.length} !== ${this.sarray.length}`);
		}
		for (let i = 0; i < this.jarray.length; i++) {
			const jvalue = this.jarray[i];
			const svalue = this.sarray.at(i);
			if (jvalue !== svalue) {
				this.debugOrThrow(`Value mismatch at ${i}: ${jvalue} !== ${svalue}`);
			}
		}
	}

	private _replay(operation: Operations): void {
		const jarray = this.jarray;
		switch (operation.method) {
			case 'array/push':
				jarray.push(operation.params.value);
				if (jarray.length !== operation.params.length) {
					this.debugOrThrow(`Length mismatch: ${jarray.length} !== ${operation.params.length}`);
				}
				break;
			case 'array/pop':
				const pop = jarray.pop();
				if (jarray.length !== operation.params.length || pop !== operation.params.result) {
					this.debugOrThrow(`Length mismatch: ${jarray.length} !== ${operation.params.length} or value mismatch: ${pop} !== ${operation.params.result}`);
				}
				break;
			case 'array/get':
				const get = jarray[operation.params.index];
				if (get !== operation.params.result) {
					this.debugOrThrow(`Value mismatch at ${operation.params.index}: ${get} !== ${operation.params.result}`);
				}
				break;
		}
	}

	private debugOrThrow(message: string): void {
		if (isDebugging) {
			debugger;
		} else {
			throw new Error(message);
		}
	}
}

type ConnectionType = Connection<ManagementCalls, undefined, Notifications, undefined, undefined, Operations | ServerNotifications>;

async function main(): Promise<void> {

	const memory = await SharedMemory.create();

	const threads: { worker: Worker; connection: ConnectionType }[] = [];
	const array2Operations: Map<ptr, ArrayOperations> = new Map();
	const arrays: { counter: MemoryRange; lock: Lock; array: SharedArray<float64>}[] = [];
	const promises: Promise<void>[] = [];

	const numberOfThreads = 16;
	const numberOfArrays = Math.max(2, Math.ceil(numberOfThreads / 4));

	for (let i = 0; i < numberOfArrays; i++) {
		const counter = memory.alloc(Alignment.halfWord, u32.size);
		const lock = new Lock(memory);
		const array = new SharedArray<float64>(float64, memory);
		arrays.push({ counter, lock, array });
		array2Operations.set(array.location().ptr, new ArrayOperations(array));
	}

	process.stdout.write(`Starting array simulation using ${numberOfArrays} arrays on ${numberOfThreads} threads.\n`);

	for (let i = 0; i < numberOfThreads; i++) {
		const worker = new Worker(path.join(__dirname, './arrayWorker.js'));
		const connection: ConnectionType = new Connection<ManagementCalls, undefined, Notifications, undefined, undefined, Operations | ServerNotifications>(worker);
		connection.initializeSyncCall(memory);
		connection.listen();

		await connection.callAsync('init', { workerId: i, memory: memory.getTransferable() });
		for (const array of arrays) {
			await connection.callAsync('array/new', { counter: MemoryLocation.from(array.counter), lock: array.lock.location(), array: array.array.location() });
		}

		connection.onNotify('array/push', (params) => {
			const operations = array2Operations.get(params.array)!;
			operations.record({ method: 'array/push', params });
		});
		connection.onNotify('array/pop', (params) => {
			const operations = array2Operations.get(params.array)!;
			operations.record({ method: 'array/pop', params });
		});
		connection.onNotify('array/get', (params) => {
			const operations = array2Operations.get(params.array)!;
			operations.record({ method: 'array/get', params });
		});

		connection.notify('start');

		promises.push(new Promise<void>((resolve) => {
			connection.onNotify('done', () => {
				connection.notify('exit');
				resolve();
			});
		}));
		threads.push({ worker, connection });
	}

	await Promise.all(promises);

	try {
		process.stdout.write(`Replaying ${Array.from(array2Operations.values()).reduce((p, v) => p + v.size(), 0) } operations.\n`);
		for (const operations of array2Operations.values()) {
			operations.replay();
			operations.compare();
		}
	} catch(error) {
		// eslint-disable-next-line no-console
		console.error(error);
	} finally {
	}
}

if (require.main === module) {
	// eslint-disable-next-line no-console
	main().catch(console.error);
}
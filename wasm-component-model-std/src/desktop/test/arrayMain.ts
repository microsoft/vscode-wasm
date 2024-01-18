/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import path from 'node:path';
import { Worker } from 'node:worker_threads';

import { Alignment, float64, u32  } from '@vscode/wasm-component-model';

import { SArray } from '../../common/sarray';
import { MessageConnection } from './messageConnection';
import { Notifications, Operations, Requests, ServerNotifications } from './messages';
import { SharedObject } from '../../common/sobject';

declare const v8debug: object;
const isDebugging = typeof v8debug === 'object' || /--debug|--inspect/.test(process.execArgv.join(' '));

class ArrayOperations {

	private readonly sarray: SArray<float64>;
	public readonly jarray: number[];
	private operations: Operations[] = [];

	constructor(sarray: SArray<float64>) {
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
			const svalue = this.sarray.get(i);
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

async function main(): Promise<void> {

	const memory = new WebAssembly.Memory({ initial: 2, maximum: 8, shared: true });
	await SharedObject.initialize(memory);

	const counter = SharedObject.memory().alloc(Alignment.halfWord, u32.size);

	const threads: { worker: Worker; connection: MessageConnection<Requests, Notifications, undefined, Operations | ServerNotifications> }[] = [];
	const sarray = new SArray<float64>(float64);
	const operations = new ArrayOperations(sarray);
	const promises: Promise<void>[] = [];

	const numberOfThreads = 8;

	process.stdout.write(`Starting array simulation using ${numberOfThreads} threads.\n`);

	for (let i = 0; i < numberOfThreads; i++) {
		const worker = new Worker(path.join(__dirname, './arrayWorker.js'));
		const connection = new MessageConnection<Requests, Notifications, undefined, Operations | ServerNotifications>(worker);
		connection.listen();

		await connection.sendRequest('init', { workerId: i, memory });
		connection.onNotification('array/push', (params) => {
			operations.record({ method: 'array/push', params });
		});
		connection.onNotification('array/pop', (params) => {
			operations.record({ method: 'array/pop', params });
		});
		connection.onNotification('array/get', (params) => {
			operations.record({ method: 'array/get', params });
		});

		promises.push(new Promise<void>((resolve) => {
			connection.onNotification('done', () => {
				connection.sendNotification('exit');
				resolve();
			});
		}));
		threads.push({ worker, connection });
		connection.sendNotification('array/new', { array: sarray.location().value, counter });
	}

	await Promise.all(promises);

	try {
		process.stdout.write(`Replaying ${operations.size()} operations.\n`);
		operations.replay();
		operations.compare();
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
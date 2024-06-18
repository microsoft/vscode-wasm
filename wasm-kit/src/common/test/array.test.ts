/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import assert from 'assert';

import { float64, u32 } from '@vscode/wasm-component-model';

import { SharedMemory } from '../sharedObject';
import { SharedArray } from '../array';

suite('SArray', () => {

	let memory: SharedMemory;
	suiteSetup(async () => {
		memory = await SharedMemory.create();
	});

	test('push', () => {
		const arr = new SharedArray(float64, memory);
		arr.push(1.1);
		arr.push(2.2);

		assert.strictEqual(arr.length, 2);
		assert.strictEqual(arr.at(0), 1.1);
		assert.strictEqual(arr.at(1), 2.2);
	});

	test('pop', () => {
		const arr = new SharedArray(float64, memory);
		arr.push(1.1);
		arr.push(2.2);

		const v = arr.pop();
		assert.strictEqual(v, 2.2);
		assert.strictEqual(arr.length, 1);
	});

	test('keys', () => {
		const arr = new SharedArray(float64, memory);
		arr.push(1.1);
		arr.push(2.2);

		const keys = arr.keys();
		assert.strictEqual(keys.next().value, 0);
		assert.strictEqual(keys.next().value, 1);
		assert.strictEqual(keys.next().done, true);
	});

	test('values', () => {
		const arr = new SharedArray(float64, memory);
		arr.push(1.1);
		arr.push(2.2);

		const keys = arr.values();
		assert.strictEqual(keys.next().value, 1.1);
		assert.strictEqual(keys.next().value, 2.2);
		assert.strictEqual(keys.next().done, true);
	});

	test('entries', () => {
		const arr = new SharedArray(float64, memory);
		arr.push(1.1);
		arr.push(2.2);

		const entries = arr.entries();
		let first = entries.next().value;
		assert.strictEqual(first[0], 0);
		assert.strictEqual(first[1], 1.1);
		let second = entries.next().value;
		assert.strictEqual(second[0], 1);
		assert.strictEqual(second[1], 2.2);
		assert.strictEqual(entries.next().done, true);
	});

	test('locked', () => {
		const arr = SharedArray.synchronized(memory, new SharedArray(float64, memory));
		arr.push(1.1);
		arr.push(2.2);
		assert.strictEqual(arr.length, 2);
		arr.runLocked(arr => {
			assert.strictEqual(arr.length, 2);
			assert.strictEqual(arr.at(0), 1.1);
			assert.strictEqual(arr.at(1), 2.2);
		});
	});

	test('grow', () => {
		const arr = new SharedArray(u32, memory, 1);
		for (let i = 0; i < 100; i++) {
			arr.push(i);
		}
		assert.strictEqual(arr.length, 100);
		for (let i = 0; i < 100; i++) {
			assert.strictEqual(arr.at(i), i);
		}
	});
});
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import assert from 'assert';

import { float64} from '@vscode/wasm-component-model';

import { SObject } from '../sobject';
import { SArray } from '../sarray';

suite('SArray', () => {

	suiteSetup(async () => {
		await SObject.initialize(new WebAssembly.Memory({ initial: 2, maximum: 8, shared: true }));
	});

	test('push', () => {
		const arr = new SArray(float64);

		arr.push(1.1);
		arr.push(2.2);
		assert.strictEqual(arr.length, 2);
		assert.strictEqual(arr.get(0), 1.1);
		assert.strictEqual(arr.get(1), 2.2);
	});

	test('pop', () => {
		const arr = new SArray(float64);

		arr.push(1.1);
		arr.push(2.2);

		const v = arr.pop();
		assert.strictEqual(v, 2.2);
		assert.strictEqual(arr.length, 1);
	});
});
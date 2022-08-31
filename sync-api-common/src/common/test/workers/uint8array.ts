/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/* eslint-disable no-console */

import assert from 'assert';
import { RAL, Uint8Result } from '../../api';
import { assertData, runSingle } from './tests';

export function run(): void {
	runSingle((connection) => {
		const result = connection.sendRequest('uint8array', { p1: '12345678' }, Uint8Result.fromLength(8), 50);
		assert.strictEqual(result.errno, 0);
		assertData(result);
		assert.ok(result.data instanceof Uint8Array);
		const str = RAL().TextDecoder.create().decode(result.data.slice());
		assert.strictEqual(str, '12345678');
	}).catch(RAL().console.error);
}
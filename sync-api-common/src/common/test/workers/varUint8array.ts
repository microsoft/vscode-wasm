/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/* eslint-disable no-console */

import assert from 'assert';
import { RAL, VariableResult } from '../../api';
import { assertData, runSingle } from './tests';

export function run(): void {
	runSingle((connection) => {
		const result = connection.sendRequest('varUint8array', new VariableResult('binary'), 50);
		assert.strictEqual(result.errno, 0, 'Request was successful');
		assertData(result);
		assert.strictEqual(result.data.length, 32);
		assert.strictEqual(RAL().TextDecoder.create().decode(result.data.slice()), '1'.repeat(32));
	}).catch(RAL().console.error);
}
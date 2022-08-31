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
		const result = connection.sendRequest('varJSON', new VariableResult('json'), 50);
		assert.strictEqual(result.errno, 0, 'Request was successful');
		assertData(result);
		assert.strictEqual(result.data.name, 'vscode');
		assert.strictEqual(result.data.age, 70);
	}).catch(RAL().console.error);
}
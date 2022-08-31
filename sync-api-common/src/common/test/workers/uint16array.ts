/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/* eslint-disable no-console */

import { RAL, Uint16Result } from '../../api';
import { assertResult, runSingle } from './tests';

export function run(): void {
	runSingle((connection) => {
		const resultType = Uint16Result.fromLength(16);
		const result = connection.sendRequest('uint16array', resultType, 50);
		assertResult(result, resultType, 16, 1);
	}).catch(RAL().console.error);
}
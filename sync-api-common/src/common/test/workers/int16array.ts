/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Int16Result, RAL } from '../../api';
import { assertResult, runSingle } from './tests';

export function run(): void {
	runSingle((connection) => {
		const resultType = Int16Result.fromLength(16);
		const result = connection.sendRequest('int16array', resultType, 50);
		assertResult(result, resultType, 16, -1);
	}).catch(RAL().console.error);
}
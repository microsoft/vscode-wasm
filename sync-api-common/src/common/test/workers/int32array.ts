/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/* eslint-disable no-console */

import { RAL, Int32Result } from '../../api';
import { assertResult, runSingle } from './tests';

export function run(): void {
	runSingle((connection) => {
		const resultType = Int32Result.fromLength(32);
		const result = connection.sendRequest('int32array', resultType, 50);
		assertResult(result, resultType, 32, -1);
	}).catch(RAL().console.error);
}
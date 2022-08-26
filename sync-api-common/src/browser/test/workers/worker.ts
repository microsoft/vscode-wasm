/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/* eslint-disable no-console */

import { Int8Result } from '../../main';
import { runSingle, assertResult } from './tests';

runSingle((connection) => {
	const resultType = Int8Result.fromLength(8);
	const result = connection.sendRequest('int8array', resultType, 50);
	assertResult(result, resultType, 8, -1);
}).catch(console.error);
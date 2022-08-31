/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/* eslint-disable no-console */

import { RAL } from '../../api';

import type { TestRequests } from '../tests';

import * as int8Array from './int8array';
import * as uint8Array from './uint8array';
import * as int16Array from './int16array';
import * as uint16Array from './uint16array';
import * as int32Array from './int32array';
import * as uint32Array from './uint32array';
import * as int64Array from './int64array';
import * as uint64Array from './uint64array';
import * as varJson from './varJson';
import * as varUint8Array from './varUint8array';

const tests: Map<TestRequests['method'], { run: () => void }> = new Map([
	['int8array', int8Array],
	['uint8array', uint8Array],
	['int16array', int16Array],
	['uint16array', uint16Array],
	['int32array', int32Array],
	['uint32array', uint32Array],
	['int64array', int64Array],
	['uint64array', uint64Array],
	['varJSON', varJson],
	['varUint8array', varUint8Array],
]);

export function run(): void {
	const workerTest = RAL().$testing.testCase as TestRequests['method'];
	tests.get(workerTest)?.run();
}
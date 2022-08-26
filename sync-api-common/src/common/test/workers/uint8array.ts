/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/* eslint-disable no-console */

import RAL from '../../ral';
import type { TestRequests } from '../tests';

const connection = RAL().$testing.ServiceConnection.create<TestRequests>()!;
connection.onRequest('uint8array', (params, resultBuffer) => {
	resultBuffer.set(RAL().TextEncoder.create().encode(params.p1));
	return { errno: 0 };
});
connection.signalReady();
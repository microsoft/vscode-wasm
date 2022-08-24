/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/* eslint-disable no-console */

import type { Requests } from '../../../common/test/tests';
import { ServiceConnection } from '../../main';

const connection = new ServiceConnection<Requests>(self);
connection.onRequest('int8array', (resultBuffer) => {
	const result = new Int8Array(8);
	for (let i = 0; i < result.length; i++) {
		result[i] = (i + 1) * -1;
	}
	resultBuffer.set(result);
	return { errno: 0 };
});
connection.signalReady();
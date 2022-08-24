/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import RAL from '../../ral';
import type { Requests } from '../tests';

const connection = RAL().$testing.ServiceConnection.create<Requests>()!;
connection.onRequest('int32array', (resultBuffer) => {
	const result = new Int32Array(32);
	for (let i = 0; i < result.length; i++) {
		result[i] = (i + 1) * -1;
	}
	resultBuffer.set(result);
	return { errno: 0 };
});
connection.signalReady();
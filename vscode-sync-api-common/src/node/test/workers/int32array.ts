/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { parentPort  } from 'worker_threads';
import { ServiceConnection } from '../../main';
import type { Requests } from '../connection.test';

if (parentPort === null) {
	process.exit();
}

const connection = new ServiceConnection<Requests>(parentPort);
connection.onRequest('int32array', (resultBuffer) => {
	const result = new Int32Array(32);
	for (let i = 0; i < result.length; i++) {
		result[i] = (i + 1) * -1;
	}
	resultBuffer.set(result);
	return { errno: 0 };
});
connection.signalReady();
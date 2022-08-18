/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/* eslint-disable no-console */
import { TextEncoder } from 'util';
import { parentPort  } from 'worker_threads';
import { ServiceConnection } from '../../main';
import type { Requests } from '../connection.test';

if (parentPort === null) {
	process.exit();
}

const connection = new ServiceConnection<Requests>(parentPort);
connection.onRequest('uint8array', (params, resultBuffer) => {
	resultBuffer.set(new TextEncoder().encode(params.p1));
	return { errno: 0 };
});
connection.signalReady();
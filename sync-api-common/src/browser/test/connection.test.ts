/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

// Ensure we have RIL installed.
import '../main';

import * as assert from 'assert';
import { AssertionErrorData, ErrorData, TestRequests } from '../../common/test/tests';
import { ServiceConnection } from '../main';

async function runTest(url: string, test: (connection: ServiceConnection<TestRequests>) => void) {
	const worker = new Worker(url);
	const connection = new ServiceConnection<TestRequests>(worker);

	let assertionError: AssertionErrorData | undefined;
	let error: ErrorData | undefined;

	connection.onRequest('testing/assertionError', (params) => {
		assertionError = params;
		return { errno: 0 };
	});

	connection.onRequest('testing/error', (params) => {
		error = params;
		return { errno: 0 };
	});

	test(connection);

	await new Promise<void>((resolve) => {
		connection.onRequest('testing/done', () => {
			resolve();
			return { errno: 0 };
		});
		connection.signalReady();
	});

	worker.terminate();

	if (assertionError !== undefined) {
		throw new assert.AssertionError(assertionError);
	}
	if (error !== undefined) {
		throw new Error(error.message);
	}
}
suite('Connection', () => {
	test('Int8Array', async () => {
		await runTest('/sync-api-common/dist/worker.js', (connection) => {
			connection.onRequest('int8array', (resultBuffer) => {
				const result = new Int8Array(8);
				for (let i = 0; i < result.length; i++) {
					result[i] = (i + 1) * -1;
				}
				resultBuffer.set(result);
				return { errno: 0 };
			});
		});
	});
});
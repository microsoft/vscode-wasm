/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/* eslint-disable no-console */

import assert from 'assert';

import { TestRequests, AssertionErrorData, ErrorData } from './tests';
import { Cancellation, RAL, ServiceConnection } from '../api';

let script: string = '';

export function setScript(value: string): void {
	script = value;
}

async function runTest(testCase: string, test: (connection: ServiceConnection<TestRequests>) => void) {

	if (script === '') {
		throw new Error(`No worker script installed`);
	}

	const connection = RAL().$testing.ServiceConnection.create<TestRequests>(script, testCase);

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
		connection.signalReady(undefined);
	});

	await connection.terminate();

	if (assertionError !== undefined) {
		throw new assert.AssertionError(assertionError);
	}
	if (error !== undefined) {
		throw new Error(error.message);
	}
}

suite('Connection', () => {

	test('UInt8Array', async () => {
		await runTest('uint8array', (connection) => {
			connection.onRequest('uint8array', (params, resultBuffer) => {
				resultBuffer.set(RAL().TextEncoder.create().encode(params.p1));
				return { errno: 0 };
			});
		});
	});

	test('Int8Array', async () => {
		await runTest('int8array', (connection) => {
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

	test('Uint16Array', async () => {
		await runTest('uint16array', (connection) => {
			connection.onRequest('uint16array', (resultBuffer) => {
				const result = new Uint16Array(16);
				for (let i = 0; i < result.length; i++) {
					result[i] = (i + 1);
				}
				resultBuffer.set(result);
				return { errno: 0 };
			});
		});

	});

	test('Int16Array', async () => {
		await runTest('int16array', (connection) => {
			connection.onRequest('int16array', (resultBuffer) => {
				const result = new Int16Array(16);
				for (let i = 0; i < result.length; i++) {
					result[i] = (i + 1) * -1;
				}
				resultBuffer.set(result);
				return { errno: 0 };
			});
		});
	});

	test('Uint32Array', async () => {
		await runTest('uint32array', (connection) => {
			connection.onRequest('uint32array', (resultBuffer) => {
				const result = new Uint32Array(32);
				for (let i = 0; i < result.length; i++) {
					result[i] = (i + 1);
				}
				resultBuffer.set(result);
				return { errno: 0 };
			});
		});
	});

	test('Int32Array', async () => {
		await runTest('int32array', (connection) => {
			connection.onRequest('int32array', (resultBuffer) => {
				const result = new Int32Array(32);
				for (let i = 0; i < result.length; i++) {
					result[i] = (i + 1) * -1;
				}
				resultBuffer.set(result);
				return { errno: 0 };
			});
		});
	});

	test('Uint64Array', async () => {
		await runTest('uint64array', (connection) => {
			connection.onRequest('uint64array', (resultBuffer) => {
				const result = new BigUint64Array(64);
				for (let i = 0; i < result.length; i++) {
					result[i] = BigInt(i + 1);
				}
				resultBuffer.set(result);
				return { errno: 0 };
			});
		});
	});

	test('Int64Array', async () => {
		await runTest('int64array', (connection) => {
			connection.onRequest('int64array', (resultBuffer) => {
				const result = new BigInt64Array(64);
				for (let i = 0; i < result.length; i++) {
					result[i] = BigInt((i + 1) * -1);
				}
				resultBuffer.set(result);
				return { errno: 0 };
			});
		});
	});

	test('Variable UInt8Array', async () => {
		await runTest('varUint8array', (connection) => {
			connection.onRequest('varUint8array', () => {
				return { errno: 0, data: RAL().TextEncoder.create().encode('1'.repeat(32)) };
			});
		});
	});

	test('Variable JSON result', async () => {
		await runTest('varJSON', (connection) => {
			connection.onRequest('varJSON', () => {
				return { errno: 0, data: { name: 'vscode', age: 70 } };
			});
		});
	});

	test('Message Cancellation', async () => {
		const message: { $cancellationData?: SharedArrayBuffer | undefined } = {};
		const cancel = Cancellation.addData(message);
		assert.ok(message.$cancellationData instanceof SharedArrayBuffer);
		const check = Cancellation.retrieveCheck(message);
		assert.strictEqual(check(), false);
		cancel();
		assert.strictEqual(check(), true);
	});
});
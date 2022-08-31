/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';

import type { TestRequests } from '../tests';
import { RAL, ClientConnection, RPCErrno, TypedArray, TypedArrayResult } from '../../api';

export function assertData<T>(value: { errno: RPCErrno } | { errno: 0; data: T }): asserts value is { errno: 0; data: T } {
	const candidate: { errno: RPCErrno; data?: T | null } = value;
	if (candidate.data === undefined) {
		throw new Error(`Request result has no data`);
	}
}

export function assertResult(result: { errno: 0; data: TypedArray } | { errno: RPCErrno }, resultType: TypedArrayResult, length: number, factor: number) {
	assert.strictEqual(result.errno, 0, 'Request was successful');
	assertData(result);
	assert.ok(resultType.is(result.data));
	assert.strictEqual(result.data.length, length);
	for (let i = 0; i < result.data.length; i++) {
		assert.equal(result.data[i], (i + 1) * factor);
	}
}

export async function runSingle(test: (connection: ClientConnection<TestRequests>) => void): Promise<void> {
	const connection = RAL().$testing.ClientConnection.create<TestRequests>()!;
	await connection.serviceReady();
	try {
		test(connection);
	} catch (error) {
		if (error instanceof assert.AssertionError) {
			connection.sendRequest('testing/assertionError', {
				message: error.message,
				actual: error.actual,
				expected: error.expected,
				operator: error.operator,
				generatedMessage: error.generatedMessage,
				code: error.code
			});
		} else if (error instanceof Error) {
			connection.sendRequest('testing/error', {
				message: error.message
			});
		} else {
			connection.sendRequest('testing/error', {
				message: `Unknown error occurred during test execution`
			});
		}
	} finally {
		connection.sendRequest('testing/done');
	}
}
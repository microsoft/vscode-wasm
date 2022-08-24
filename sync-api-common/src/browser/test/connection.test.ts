/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

// Ensure we have RIL installed.

import * as assert from 'assert';

import { Requests } from '../../common/test/tests';
import { Int8Result, RPCErrno, TypedArray, TypedArrayResult } from '../../common/connection';

import { ClientConnection } from '../main';

async function createConnection(): Promise<[ClientConnection<Requests>, Worker]> {
	const worker = new Worker('/sync-api-common/dist/worker.js');
	const connection = new ClientConnection<Requests>(worker);
	await connection.serviceReady();
	return [connection, worker];
}

function assertData<T>(value: { errno: RPCErrno } | { errno: 0; data: T }): asserts value is { errno: 0; data: T } {
	const candidate: { errno: RPCErrno; data?: T | null } = value;
	if (candidate.data === undefined) {
		throw new Error(`Request result has no data`);
	}
}

function assertResult(result: { errno: 0; data: TypedArray } | { errno: RPCErrno }, resultType: TypedArrayResult, length: number, factor: number) {
	assert.strictEqual(result.errno, 0, 'Request was successful');
	assertData(result);
	assert.ok(resultType.is(result.data));
	assert.strictEqual(result.data.length, length);
	for (let i = 0; i < result.data.length; i++) {
		assert.equal(result.data[i], (i + 1) * factor);
	}
}

suite('Connection', () => {
	test('Int8Array', async () => {
		const [connection, worker] = await createConnection();
		const resultType = Int8Result.fromLength(8);
		const result = connection.sendRequest('int8array', resultType, 50);
		await worker.terminate();
		assertResult(result, resultType, 8, -1);
	});
});
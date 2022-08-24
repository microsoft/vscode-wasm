/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/* eslint-disable no-console */

import * as assert from 'assert';
import * as path from 'path';
import { TextDecoder } from 'util';
import { Worker } from 'worker_threads';
import { Requests } from '../../common/test/tests';
import {
	ClientConnection, Uint8Result, RPCErrno, VariableResult, Int8Result, Uint16Result, TypedArrayResult,
	TypedArray, Int16Result, Uint32Result, Int32Result, Uint64Result, Int64Result
} from '../main';


function assertData<T>(value: { errno: RPCErrno } | { errno: 0; data: T }): asserts value is { errno: 0; data: T } {
	const candidate: { errno: RPCErrno; data?: T | null } = value;
	if (candidate.data === undefined) {
		throw new Error(`Request result has no data`);
	}
}

async function createConnection(filename: string): Promise<[ClientConnection<Requests>, Worker]> {
	const bootstrap = path.join(__dirname, './workers/main.js');
	const worker = new Worker(bootstrap, { argv: [path.join(__dirname, filename)] });
	const connection = new ClientConnection<Requests>(worker);
	await connection.serviceReady();
	return [connection, worker];
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

	test('UInt8Array', async () => {
		const [connection, worker] = await createConnection('../../common/test/workers/uint8array.js');
		const result = connection.sendRequest('uint8array', { p1: '12345678' }, Uint8Result.fromLength(8), 50);
		await worker.terminate();
		assert.strictEqual(result.errno, 0);
		assertData(result);
		assert.ok(result.data instanceof Uint8Array);
		const str = new TextDecoder().decode(result.data);
		assert.strictEqual(str, '12345678');
	});

	test('Int8Array', async () => {
		const [connection, worker] = await createConnection('../../common/test/workers/int8array.js');
		const resultType = Int8Result.fromLength(8);
		const result = connection.sendRequest('int8array', resultType, 50);
		await worker.terminate();
		assertResult(result, resultType, 8, -1);
	});

	test('Uint16Array', async () => {
		const [connection, worker] = await createConnection('../../common/test/workers/uint16array.js');
		const resultType = Uint16Result.fromLength(16);
		const result = connection.sendRequest('uint16array', resultType, 50);
		await worker.terminate();
		assertResult(result, resultType, 16, 1);
	});

	test('Int16Array', async () => {
		const [connection, worker] = await createConnection('../../common/test//workers/int16array.js');
		const resultType = Int16Result.fromLength(16);
		const result = connection.sendRequest('int16array', resultType, 50);
		await worker.terminate();
		assertResult(result, resultType, 16, -1);
	});

	test('Uint32Array', async () => {
		const [connection, worker] = await createConnection('../../common/test/workers/uint32array.js');
		const resultType = Uint32Result.fromLength(32);
		const result = connection.sendRequest('uint32array', resultType, 50);
		await worker.terminate();
		assertResult(result, resultType, 32, 1);
	});

	test('Int32Array', async () => {
		const [connection, worker] = await createConnection('../../common/test/workers/int32array.js');
		const resultType = Int32Result.fromLength(32);
		const result = connection.sendRequest('int32array', resultType, 50);
		await worker.terminate();
		assertResult(result, resultType, 32, -1);
	});

	test('Uint64Array', async () => {
		const [connection, worker] = await createConnection('../../common/test/workers/uint64array.js');
		const resultType = Uint64Result.fromLength(64);
		const result = connection.sendRequest('uint64array', resultType, 50);
		await worker.terminate();
		assertResult(result, resultType, 64, 1);
	});

	test('Int64Array', async () => {
		const [connection, worker] = await createConnection('../../common/test/workers/int64array.js');
		const resultType = Int64Result.fromLength(64);
		const result = connection.sendRequest('int64array', resultType, 50);
		await worker.terminate();
		assertResult(result, resultType, 64, -1);
	});

	test('Variable UInt8Array', async () => {
		const worker = new Worker(path.join(__dirname, './workers/main.js'), { argv: [path.join(__dirname, '../../common/test/workers/varUint8array.js')] });
		const connection = new ClientConnection<Requests>(worker);
		await connection.serviceReady();
		const result = connection.sendRequest('varUint8array', new VariableResult('binary'), 50);
		await worker.terminate();
		assert.strictEqual(result.errno, 0, 'Request was successful');
		assertData(result);
		assert.strictEqual(result.data.length, 32);
		assert.strict(new TextDecoder().decode(result.data), '1'.repeat(32));
	});

	test('Variable JSON result', async () => {
		const worker = new Worker(path.join(__dirname, './workers/main.js'), { argv: [path.join(__dirname, '../../common/test/workers/varJson.js')] });
		const connection = new ClientConnection<Requests>(worker);
		await connection.serviceReady();
		const result = connection.sendRequest('varJSON', new VariableResult('json'), 50);
		await worker.terminate();
		assert.strictEqual(result.errno, 0, 'Request was successful');
		assertData(result);
		assert.strictEqual(result.data.name, 'vscode');
		assert.strictEqual(result.data.age, 70);
	});
});
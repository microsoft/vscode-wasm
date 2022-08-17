/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as assert from 'assert';
import * as path from 'path';
import { TextDecoder } from 'util';
import { Worker } from 'worker_threads';
import { ClientConnection, Uint8Result, RPCErrno, VariableResult } from '../main';

export type Requests = {
	method: 'uint8array';
	params: {
		p1: string;
	};
	result: Uint8Array;
} | {
	method: 'varUint8array';
	params: undefined;
	result: VariableResult<Uint8Result>;
};

function assertData<T>(value: { errno: RPCErrno } | { errno: 0; data: T }): asserts value is { errno: 0; data: T } {
	const candidate: { errno: RPCErrno; data?: T | null } = value;
	if (candidate.data === undefined) {
		throw new Error(`Request result has no data`);
	}
}

suite('Connection', () => {

	test('UInt8Array', async () => {
		const worker = new Worker(path.join(__dirname, './workers/uint8array.js'));
		const connection = new ClientConnection<Requests>(worker);
		await connection.serviceReady();
		const result = connection.sendRequest('uint8array', { p1: '12345678' }, Uint8Result.fromLength(8));
		await worker.terminate();
		assert.strictEqual(result.errno, 0);
		assertData(result);
		const str = new TextDecoder().decode(result.data);
		assert.strictEqual(str, '12345678');
	});

	test('Variable UInt8Array', async () => {
		const worker = new Worker(path.join(__dirname, './workers/varUint8array.js'));
		const connection = new ClientConnection<Requests>(worker);
		await connection.serviceReady();
		const result = connection.sendRequest('varUint8array', new VariableResult<Uint8Array>('binary'));
		await worker.terminate();
		assert.strictEqual(result.errno, 0);
		assertData(result);
		assert.strictEqual(result.data.length, 32);
	});
});
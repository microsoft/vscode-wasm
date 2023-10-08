/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import assert from 'assert';

import { Host, u32, Memory as IMemory, ptr, size, Context } from '../componentModel';

class Memory implements IMemory {
	public readonly buffer: ArrayBuffer;
	public readonly raw: Uint8Array;
	public readonly view: DataView;

	private index: number;

	constructor(byteLength: number = 65536, shared: boolean = false) {
		this.buffer = shared ? new SharedArrayBuffer(byteLength) : new ArrayBuffer(byteLength);
		this.raw = new Uint8Array(this.buffer);
		this.view = new DataView(this.buffer);
		this.index = 0;
	}

	public alloc(bytes: number): ptr {
		const result = this.index;
		this.index += bytes;
		return result;
	}

	public realloc(ptr: ptr, _oldSize: size, _align: size, _newSize: size): ptr {
		return ptr;
	}
}

import { test as t } from './test';

const sampleImpl: t.Sample = {
	call(point: t.Sample.Point): u32 {
		return point.x + point.y;
	}
};

interface TestHost extends Host {
	call(x: u32, y: u32): u32;
}

const context: Context = {
	memory: new Memory(),
	options: { encoding: 'utf-8' }
};

suite('sample', () => {
	test('host', () => {
		const host: TestHost = t.Sample._.createHost<TestHost>(sampleImpl, context);
		assert.strictEqual(host.call(1, 2), 3);
	});
	test('service', () => {
		const host: TestHost = t.Sample._.createHost<TestHost>(sampleImpl, context);
		const service: t.Sample = t.Sample._.createService(Host.asWasmInterface(host), context);
		assert.strictEqual(service.call({ x: 1, y: 2 }), 3);
	});
});
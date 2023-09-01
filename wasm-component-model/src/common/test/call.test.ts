/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import assert from 'assert';

import { FunctionType, Host, JRecord, RecordType, u32, Memory as IMemory, ptr, size, Service, Context } from '../componentModel';

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

// This will be generated from a Wit file
namespace Sample {

	export interface Point extends JRecord {
		x: u32;
		y: u32;
	}

	export declare function call(point: Point): u32;
	export type call = typeof call;

	export namespace $cm {
		export const $Point = new RecordType<Point>([['x', u32], ['y', u32]]);
		export const $call = new FunctionType<call>('call', [['point', $Point]], u32);
	}
}
export type Sample = Pick<typeof Sample, 'call'>;

const sampleImpl: Sample = {
	call(point: Sample.Point): u32 {
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
		const host: TestHost = Host.create<TestHost>([Sample.$cm.$call], sampleImpl, context);
		assert.strictEqual(host.call(1, 2), 3);
	});
	test('service', () => {
		const host: TestHost = Host.create<TestHost>([Sample.$cm.$call], sampleImpl, context);
		const service: Sample = Service.create<Sample>([Sample.$cm.$call], Host.asWasmInterface(host), context);
		assert.strictEqual(service.call({ x: 1, y: 2 }), 3);
	});
});
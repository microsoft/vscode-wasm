/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import assert from 'assert';

import { u32, Memory as IMemory, ptr, size, Context, borrow, own } from '../componentModel';

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

namespace PointResourceImpl {

	class Point {
		constructor(public x: u32, public y: u32) { }
	}
	let counter: u32 = 0;

	const data: Map<u32, Point> = new Map();

	export function constructor(x: u32, y: u32): own<t.Sample.PointResource> {
		const id = counter++;
		data.set(id, new Point(x, y));
		return id;
	}

	export function getX(self: borrow<t.Sample.PointResource>): u32 {
		return data.get(self)!.x;
	}

	export function getY(self: borrow<t.Sample.PointResource>): u32 {
		return data.get(self)!.y;
	}

	export function add(self: borrow<t.Sample.PointResource>): u32 {
		return data.get(self)!.x + data.get(self)!.y;
	}
}

const sampleImpl: t.Sample = {
	call(point: t.Sample.Point): u32 {
		return point.x + point.y;
	},
	PointResource: PointResourceImpl
};

const context: Context = {
	memory: new Memory(),
	options: { encoding: 'utf-8' }
};

suite('sample', () => {
	test('host', () => {
		const host: t.Sample._.WasmInterface = t.Sample._.createHost(sampleImpl, context);
		assert.strictEqual(host.call(1, 2), 3);

		const point = host['[constructor]point-resource'](1, 2);
		assert.strictEqual(host['[method]point-resource.get-x'](point), 1);
		assert.strictEqual(host['[method]point-resource.get-y'](point), 2);
		assert.strictEqual(host['[method]point-resource.add'](point), 3);
	});
	test('service', () => {
		const host: t.Sample._.WasmInterface = t.Sample._.createHost(sampleImpl, context);
		const service: t.Sample = t.Sample._.createService(host, context);
		assert.strictEqual(service.call({ x: 1, y: 2 }), 3);
		const point = service.PointResource.constructor(1, 2);
		assert.strictEqual(service.PointResource.getX(point), 1);
		assert.strictEqual(service.PointResource.getY(point), 2);
		assert.strictEqual(service.PointResource.add(point), 3);
	});
});
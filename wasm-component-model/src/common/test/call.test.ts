/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import assert from 'assert';

import { u32, Memory as IMemory, ptr, size, Context, borrow, own, alignment } from '../componentModel';

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

	public alloc(align: alignment, bytes: number): ptr {
		const result = Memory.align(this.index, align);
		this.index += bytes;
		return result;
	}

	public realloc(ptr: ptr, _oldSize: size, _align: size, _newSize: size): ptr {
		return ptr;
	}

	private static align(ptr: ptr, alignment: alignment): ptr {
		return Math.ceil(ptr / alignment) * alignment;
	}
}

import * as td from './testData';
import Types = td.testData.Types;
import TestVariant = Types.TestVariant;

namespace PointResourceImpl {

	class Point {
		constructor(public x: u32, public y: u32) { }
	}
	let counter: u32 = 0;

	const data: Map<u32, Point> = new Map();

	export function constructor(x: u32, y: u32): own<Types.PointResource> {
		const id = counter++;
		data.set(id, new Point(x, y));
		return id;
	}

	export function getX(self: borrow<Types.PointResource>): u32 {
		return data.get(self)!.x;
	}

	export function getY(self: borrow<Types.PointResource>): u32 {
		return data.get(self)!.y;
	}

	export function add(self: borrow<Types.PointResource>): u32 {
		return data.get(self)!.x + data.get(self)!.y;
	}
}

const serviceImpl: Types = {
	call(point: Types.Point | undefined): u32 {
		if (point === undefined) {
			return 0;
		}
		return point.x + point.y;
	},
	callOption(point: Types.Point | undefined): u32 | undefined {
		if (point === undefined) {
			return undefined;
		}
		return point.x + point.y;
	},
	PointResource: PointResourceImpl,
	checkVariant(value)  {
		switch (value.case) {
			case TestVariant.unsigned32:
				return TestVariant._unsigned32(value.value + 1);
			case TestVariant.unsigned64:
				return TestVariant._unsigned64(value.value + 1n);
			case TestVariant.signed32:
				return TestVariant._signed32(value.value + 1);
			case TestVariant.signed64:
				return TestVariant._signed64(value.value + 1n);
			case TestVariant.floatingPoint32:
				return TestVariant._floatingPoint32(value.value + 1.3);
			case TestVariant.floatingPoint64:
				return TestVariant._floatingPoint64(value.value + 1.3);
			case TestVariant.structure:
				return TestVariant._structure({ x: value.value.x + 1, y: value.value.y + 1});
			default:
				return TestVariant._empty();
		}
	}
};

const context: Context = {
	memory: new Memory(),
	options: { encoding: 'utf-8' }
};

suite('point', () => {
	const host: Types._.WasmInterface = Types._.createHost(serviceImpl, context);
	const service: Types = Types._.createService(host, context);
	test('host:call', () => {
		assert.strictEqual(host.call(1, 2), 3);
	});
	test('service:call', () => {
		assert.strictEqual(service.call({ x: 1, y: 2 }), 3);
	});
});

suite ('point-resource', () => {
	const host: Types._.WasmInterface = Types._.createHost(serviceImpl, context);
	const service: Types = Types._.createService(host, context);
	test('host:call', () => {
		const point = host['[constructor]point-resource'](1, 2);
		assert.strictEqual(host['[method]point-resource.get-x'](point), 1);
		assert.strictEqual(host['[method]point-resource.get-y'](point), 2);
		assert.strictEqual(host['[method]point-resource.add'](point), 3);
	});
	test('service:call', () => {
		const point = service.PointResource.constructor(1, 2);
		assert.strictEqual(service.PointResource.getX(point), 1);
		assert.strictEqual(service.PointResource.getY(point), 2);
		assert.strictEqual(service.PointResource.add(point), 3);
	});
});

suite('option', () => {
	test('host:call', () => {
		const host: Types._.WasmInterface = Types._.createHost(serviceImpl, context);
		const memory = context.memory;
		const ptr = memory.alloc(4, 8);
		host['call-option'](1, 1, 2, ptr);
		assert.strictEqual(memory.view.getUint32(ptr, true), 1);
		assert.strictEqual(memory.view.getUint32(ptr + 4, true), 3);
	});
});

suite('variant', () => {
	const host: Types._.WasmInterface = Types._.createHost(serviceImpl, context);
	const service: Types = Types._.createService(host, context);

	test('empty', () => {
		const empty = service.checkVariant(TestVariant._empty());
		assert.strictEqual(empty.case, TestVariant.empty);
	});

	test('u32', () => {
		const u32 = service.checkVariant(TestVariant._unsigned32(1));
		assert.strictEqual(u32.case, TestVariant.unsigned32);
		assert.strictEqual(u32.value, 2);
	});

	test('u64', () => {
		const u64 = service.checkVariant(TestVariant._unsigned64(10n));
		assert.strictEqual(u64.case, TestVariant.unsigned64);
		assert.strictEqual(u64.value, 11n);
	});

	test('s32', () => {
		const s32 = service.checkVariant(TestVariant._signed32(-2));
		assert.strictEqual(s32.case, TestVariant.signed32);
		assert.strictEqual(s32.value, -1);
	});

	test('u64', () => {
		const u64 = service.checkVariant(TestVariant._unsigned64(9007199254740991n));
		assert.strictEqual(u64.case, TestVariant.unsigned64);
		assert.strictEqual(u64.value, 9007199254740992n);
	});

	test('s64', () => {
		const s64 = service.checkVariant(TestVariant._signed64(-9007199254740991n));
		assert.strictEqual(s64.case, TestVariant.signed64);
		assert.strictEqual(s64.value, -9007199254740990n);
	});

	test('float32', () => {
		const float32 = service.checkVariant(TestVariant._floatingPoint32(1.5));
		assert.strictEqual(float32.case, TestVariant.floatingPoint32);
		assert.strictEqual(float32.value, 2.799999952316284);
	});

	test('float64', () => {
		const float64 = service.checkVariant(TestVariant._floatingPoint64(1.5));
		assert.strictEqual(float64.case, TestVariant.floatingPoint64);
		assert.strictEqual(float64.value, 2.8);
	});

	test('structure', () => {
		const structure = service.checkVariant(TestVariant._structure({ x: 1, y: 2 }));
		assert.strictEqual(structure.case, TestVariant.structure);
		assert.strictEqual(structure.value.x, 2);
		assert.strictEqual(structure.value.y, 3);
	});
});
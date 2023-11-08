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
import TestFlagsShort = Types.TestFlagsShort;
import TestFlagsLong = Types.TestFlagsLong;

namespace PointResourceModule {

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

class PointResourceClass implements Types.PointResource.Interface {
	constructor(public x: u32, public y: u32) { }

	public getX(): u32 {
		return this.x;
	}

	public getY(): u32 {
		return this.y;
	}

	public add(): u32 {
		return this.x + this.y;
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
	PointResource: PointResourceClass,
	checkVariant(value)  {
		switch (value.tag) {
			case TestVariant.unsigned32:
				return TestVariant.Unsigned32(value.value + 1);
			case TestVariant.unsigned64:
				return TestVariant.Unsigned64(value.value + 1n);
			case TestVariant.signed32:
				return TestVariant.Signed32(value.value + 1);
			case TestVariant.signed64:
				return TestVariant.Signed64(value.value + 1n);
			case TestVariant.floatingPoint32:
				return TestVariant.FloatingPoint32(value.value + 1.3);
			case TestVariant.floatingPoint64:
				return TestVariant.FloatingPoint64(value.value + 1.3);
			case TestVariant.structure:
				return TestVariant.Structure({ x: value.value.x + 1, y: value.value.y + 1});
			default:
				return TestVariant.Empty();
		}
	},
	checkFlagsShort(value) {
		value = value | TestFlagsShort.six;
		return value;
	},
	checkFlagsLong(value) {
		value =  value | TestFlagsLong.thirtyNine;
		return value;
	},
};

const context: Context = {
	memory: new Memory(),
	options: { encoding: 'utf-8' }
};

suite('point', () => {
	const host: Types._.WasmInterface = Types._.createHost(serviceImpl, context);
	const service: Types = Types._.createService(Types._.PointResource.Module, host, context);
	test('host:call', () => {
		assert.strictEqual(host.call(1, 2), 3);
	});
	test('service:call', () => {
		assert.strictEqual(service.call({ x: 1, y: 2 }), 3);
	});
});

suite ('point-resource - Module', () => {
	const moduleImplementation = Object.assign({}, serviceImpl);
	moduleImplementation.PointResource = PointResourceModule;
	const host: Types._.WasmInterface = Types._.createHost(serviceImpl, context);
	const service = Types._.createService(Types._.PointResource.Module, host, context);
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

suite ('point-resource - Class', () => {
	const moduleImplementation = Object.assign({}, serviceImpl);
	moduleImplementation.PointResource = PointResourceClass;
	const host: Types._.WasmInterface = Types._.createHost(serviceImpl, context);
	const service = Types._.createService(Types._.PointResource.Class, host, context);
	test('host:call', () => {
		const point = host['[constructor]point-resource'](1, 2);
		assert.strictEqual(host['[method]point-resource.get-x'](point), 1);
		assert.strictEqual(host['[method]point-resource.get-y'](point), 2);
		assert.strictEqual(host['[method]point-resource.add'](point), 3);
	});
	test('service:call', () => {
		const point = new service.PointResource(1, 2);
		assert.strictEqual(point.getX(), 1);
		assert.strictEqual(point.getY(), 2);
		assert.strictEqual(point.add(), 3);
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
	const service: Types = Types._.createService(Types._.PointResource.Module, host, context);

	test('empty', () => {
		const empty = service.checkVariant(TestVariant.Empty());
		assert.strictEqual(empty.tag, TestVariant.empty);
	});

	test('u32', () => {
		const u32 = service.checkVariant(TestVariant.Unsigned32(1));
		assert.strictEqual(u32.tag, TestVariant.unsigned32);
		assert.strictEqual(u32.value, 2);
	});

	test('u64', () => {
		const u64 = service.checkVariant(TestVariant.Unsigned64(10n));
		assert.strictEqual(u64.tag, TestVariant.unsigned64);
		assert.strictEqual(u64.value, 11n);
	});

	test('s32', () => {
		const s32 = service.checkVariant(TestVariant.Signed32(-2));
		assert.strictEqual(s32.tag, TestVariant.signed32);
		assert.strictEqual(s32.value, -1);
	});

	test('u64', () => {
		const u64 = service.checkVariant(TestVariant.Unsigned64(9007199254740991n));
		assert.strictEqual(u64.tag, TestVariant.unsigned64);
		assert.strictEqual(u64.value, 9007199254740992n);
	});

	test('s64', () => {
		const s64 = service.checkVariant(TestVariant.Signed64(-9007199254740991n));
		assert.strictEqual(s64.tag, TestVariant.signed64);
		assert.strictEqual(s64.value, -9007199254740990n);
	});

	test('float32', () => {
		const float32 = service.checkVariant(TestVariant.FloatingPoint32(1.5));
		assert.strictEqual(float32.tag, TestVariant.floatingPoint32);
		assert.strictEqual(float32.value, 2.799999952316284);
	});

	test('float64', () => {
		const float64 = service.checkVariant(TestVariant.FloatingPoint64(1.5));
		assert.strictEqual(float64.tag, TestVariant.floatingPoint64);
		assert.strictEqual(float64.value, 2.8);
	});

	test('structure', () => {
		const structure = service.checkVariant(TestVariant.Structure({ x: 1, y: 2 }));
		assert.strictEqual(structure.tag, TestVariant.structure);
		assert.strictEqual(structure.value.x, 2);
		assert.strictEqual(structure.value.y, 3);
	});
});

suite('flags', () => {
	const host: Types._.WasmInterface = Types._.createHost(serviceImpl, context);
	const service: Types = Types._.createService(Types._.PointResource.Module, host, context);
	test('short', () => {
		const flags: TestFlagsShort = TestFlagsShort.one;
		const returned = service.checkFlagsShort(flags);
		assert.strictEqual((returned & TestFlagsShort.one) !== 0, true, 'one');
		assert.strictEqual((returned & TestFlagsShort.six) !== 0, true, 'six');
	});
	test('long', () => {
		const flags:TestFlagsLong = TestFlagsLong.one;
		const returned = service.checkFlagsLong(flags);
		assert.strictEqual((returned & TestFlagsLong.one) !== 0n, true, 'one');
		assert.strictEqual((returned & TestFlagsLong.thirtyNine) !== 0n, true, 'thirty nine');
	});
});
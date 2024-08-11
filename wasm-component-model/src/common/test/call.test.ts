/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import assert from 'assert';

import { Alignment, Memory as IMemory, MemoryRange, ReadonlyMemoryRange, Resource, ResourceManager, ResourceManagers, WasmContext, bool, ptr, size, u32 } from '../componentModel';

class Memory implements IMemory {


	public readonly id: string;
	public readonly buffer: ArrayBuffer;

	private index: number;

	constructor(byteLength: number = 65536, shared: boolean = false) {
		this.buffer = shared ? new SharedArrayBuffer(byteLength) : new ArrayBuffer(byteLength);
		this.id = Date.now().toString();
		this.index = 0;
	}

	public alloc(align: Alignment, bytes: number): MemoryRange {
		const ptr = Memory.align(this.index, align);
		this.index += bytes;
		return new MemoryRange(this, ptr, bytes);
	}

	public realloc(memory: MemoryRange, _align: size, _newSize: size): MemoryRange {
		return memory;
	}

	public readonly(ptr: ptr, bytes: number): ReadonlyMemoryRange {
		return new ReadonlyMemoryRange(this, ptr, bytes);
	}

	preAllocated(ptr: number, size: size): MemoryRange {
		return new MemoryRange(this, ptr, size);
	}

	private static align(ptr: ptr, alignment: Alignment): ptr {
		return Math.ceil(ptr / alignment) * alignment;
	}
}

import * as td from './testData';
import Types = td.Types;
import TestVariant = Types.TestVariant;
import TestFlagsShort = Types.TestFlagsShort;
import TestFlagsLong = Types.TestFlagsLong;
import TestData = td.testData;

class PointResourceClass extends Resource.Default implements Types.PointResource {

	public static readonly $resources: ResourceManager<Types.PointResource> = new ResourceManager.Default<Types.PointResource>();

	public static readonly $rm: ResourceManager =  this.$resources;

	constructor(public x: u32, public y: u32) {
		super(PointResourceClass.$resources);
	}

	public $drop(): void {
	}

	public getX(): u32 {
		return this.x;
	}

	public getY(): u32 {
		return this.y;
	}

	public add(): u32 {
		return this.x + this.y;
	}

	public check(): u32 {
		if (this.x + this.y === 10) {
			return 10;
		}
		throw new bool.Error(false);
	}
}

const worldImpl: TestData.Imports = {
	foo: () => {
		return 10;
	},
	types: {
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
		}
	}
};

const memory = new Memory();
const resources = new ResourceManagers.Default();
const context: WasmContext = {
	getMemory: () => memory,
	options: { encoding: 'utf-8' },
	resources,
};

suite('point', () => {
	const host = TestData._.imports.create(worldImpl, context);
	const service = TestData._.imports.loop(worldImpl, context);
	test('host:call', () => {
		assert.strictEqual(host['vscode:test-data/types'].call(1, 2), 3);
	});
	test('service:call', () => {
		assert.strictEqual(service.types.call({ x: 1, y: 2 }), 3);
	});
});

declare const global: { gc?: () => void } | undefined;
suite ('point-resource', () => {
	const host = TestData._.imports.create(worldImpl, context)['vscode:test-data/types'];
	const service = TestData._.imports.loop(worldImpl, context).types;
	test('host:call', () => {
		const pointResourceManager = context.resources.ensure('vscode:test-data/types/point-resource');
		const point = host['[constructor]point-resource'](1, 2);
		assert.ok(pointResourceManager.getResource(point) !== undefined);
		assert.strictEqual(host['[method]point-resource.get-x'](point), 1);
		assert.strictEqual(host['[method]point-resource.get-y'](point), 2);
		assert.strictEqual(host['[method]point-resource.add'](point), 3);
		host['[resource-drop]point-resource'](point);
		assert.throws(() => pointResourceManager.getResource(point));
	});
	test('service:call', () => {
		const pointResourceManager = context.resources.ensure('vscode:test-data/types/point-resource');
		let point: Types.PointResource | undefined = new service.PointResource(1, 2);
		const handle = point.$handle();
		assert.ok(typeof handle === 'number');
		assert.ok(pointResourceManager.getResource(handle) !== undefined);
		assert.strictEqual(point.getX(), 1);
		assert.strictEqual(point.getY(), 2);
		assert.strictEqual(point.add(), 3);
		try {
			point.check();
			assert.fail('Expected an error');
		} catch (error) {
			assert.ok(error instanceof bool.Error);
		}
		if (typeof global?.gc === 'function') {
			point = undefined;
			global.gc();
			assert.throws(() => pointResourceManager.getResource(handle));
		}
	});
});

suite('option', () => {
	test('host:call', () => {
		const host = TestData._.imports.create(worldImpl, context);
		const memory = context.getMemory();
		const range = memory.alloc(4, 8);
		host['vscode:test-data/types']['call-option'](1, 1, 2, range.ptr);
		assert.strictEqual(range.getUint32(0), 1);
		assert.strictEqual(range.getUint32(4), 3);
	});
});

suite('variant', () => {
	const service: Types = TestData._.imports.loop(worldImpl, context).types;

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
	const service: Types = TestData._.imports.loop(worldImpl, context).types;
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
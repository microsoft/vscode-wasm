/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '../componentModel';
import type { u32, u64, s32, s64, float32, float64, own, i32, ptr, i64 } from '../componentModel';

export namespace testData {
	export namespace Types {
		export type Point = {
			x: u32;
			y: u32;
		};

		export type PointOption = {
			x?: u32 | undefined;
			y?: u32 | undefined;
		};

		export namespace TestVariant {
			export const empty = 'empty' as const;
			export type Empty = { readonly tag: typeof empty } & _common;
			export function Empty(): Empty {
				return new VariantImpl(empty, undefined) as Empty;
			}

			export const unsigned32 = 'unsigned32' as const;
			export type Unsigned32 = { readonly tag: typeof unsigned32; readonly value: u32 } & _common;
			export function Unsigned32(value: u32): Unsigned32 {
				return new VariantImpl(unsigned32, value) as Unsigned32;
			}

			export const unsigned64 = 'unsigned64' as const;
			export type Unsigned64 = { readonly tag: typeof unsigned64; readonly value: u64 } & _common;
			export function Unsigned64(value: u64): Unsigned64 {
				return new VariantImpl(unsigned64, value) as Unsigned64;
			}

			export const signed32 = 'signed32' as const;
			export type Signed32 = { readonly tag: typeof signed32; readonly value: s32 } & _common;
			export function Signed32(value: s32): Signed32 {
				return new VariantImpl(signed32, value) as Signed32;
			}

			export const signed64 = 'signed64' as const;
			export type Signed64 = { readonly tag: typeof signed64; readonly value: s64 } & _common;
			export function Signed64(value: s64): Signed64 {
				return new VariantImpl(signed64, value) as Signed64;
			}

			export const floatingPoint32 = 'floatingPoint32' as const;
			export type FloatingPoint32 = { readonly tag: typeof floatingPoint32; readonly value: float32 } & _common;
			export function FloatingPoint32(value: float32): FloatingPoint32 {
				return new VariantImpl(floatingPoint32, value) as FloatingPoint32;
			}

			export const floatingPoint64 = 'floatingPoint64' as const;
			export type FloatingPoint64 = { readonly tag: typeof floatingPoint64; readonly value: float64 } & _common;
			export function FloatingPoint64(value: float64): FloatingPoint64 {
				return new VariantImpl(floatingPoint64, value) as FloatingPoint64;
			}

			export const structure = 'structure' as const;
			export type Structure = { readonly tag: typeof structure; readonly value: Point } & _common;
			export function Structure(value: Point): Structure {
				return new VariantImpl(structure, value) as Structure;
			}

			export type _tt = typeof empty | typeof unsigned32 | typeof unsigned64 | typeof signed32 | typeof signed64 | typeof floatingPoint32 | typeof floatingPoint64 | typeof structure;
			export type _vt = u32 | u64 | s32 | s64 | float32 | float64 | Point | undefined;
			type _common = Omit<VariantImpl, 'tag' | 'value'>;
			export function _ctor(t: _tt, v: _vt): TestVariant {
				return new VariantImpl(t, v) as TestVariant;
			}
			class VariantImpl {
				private readonly _tag: _tt;
				private readonly _value?: _vt;
				constructor(t: _tt, value: _vt) {
					this._tag = t;
					this._value = value;
				}
				get tag(): _tt {
					return this._tag;
				}
				get value(): _vt {
					return this._value;
				}
				isEmpty(): this is Empty {
					return this._tag === TestVariant.empty;
				}
				isUnsigned32(): this is Unsigned32 {
					return this._tag === TestVariant.unsigned32;
				}
				isUnsigned64(): this is Unsigned64 {
					return this._tag === TestVariant.unsigned64;
				}
				isSigned32(): this is Signed32 {
					return this._tag === TestVariant.signed32;
				}
				isSigned64(): this is Signed64 {
					return this._tag === TestVariant.signed64;
				}
				isFloatingPoint32(): this is FloatingPoint32 {
					return this._tag === TestVariant.floatingPoint32;
				}
				isFloatingPoint64(): this is FloatingPoint64 {
					return this._tag === TestVariant.floatingPoint64;
				}
				isStructure(): this is Structure {
					return this._tag === TestVariant.structure;
				}
			}
		}
		export type TestVariant = TestVariant.Empty | TestVariant.Unsigned32 | TestVariant.Unsigned64 | TestVariant.Signed32 | TestVariant.Signed64 | TestVariant.FloatingPoint32 | TestVariant.FloatingPoint64 | TestVariant.Structure;

		export const TestFlagsShort = Object.freeze({
			one: 1 << 0,
			two: 1 << 1,
			three: 1 << 2,
			four: 1 << 3,
			five: 1 << 4,
			six: 1 << 5,
		});
		export type TestFlagsShort = u32;

		export const TestFlagsLong = Object.freeze({
			one: 1n << 0n,
			two: 1n << 1n,
			three: 1n << 2n,
			four: 1n << 3n,
			five: 1n << 4n,
			six: 1n << 5n,
			seven: 1n << 6n,
			eight: 1n << 7n,
			nine: 1n << 8n,
			ten: 1n << 9n,
			eleven: 1n << 10n,
			twelve: 1n << 11n,
			thirteen: 1n << 12n,
			fourteen: 1n << 13n,
			fifteen: 1n << 14n,
			sixteen: 1n << 15n,
			seventeen: 1n << 16n,
			eighteen: 1n << 17n,
			nineteen: 1n << 18n,
			twenty: 1n << 19n,
			twentyOne: 1n << 20n,
			twentyTwo: 1n << 21n,
			twentyThree: 1n << 22n,
			twentyFour: 1n << 23n,
			twentyFive: 1n << 24n,
			twentySix: 1n << 25n,
			twentySeven: 1n << 26n,
			twentyEight: 1n << 27n,
			twentyNine: 1n << 28n,
			thirty: 1n << 29n,
			thirtyOne: 1n << 30n,
			thirtyTwo: 1n << 31n,
			thirtyThree: 1n << 32n,
			thirtyFour: 1n << 33n,
			thirtyFive: 1n << 34n,
			thirtySix: 1n << 35n,
			thirtySeven: 1n << 36n,
			thirtyEight: 1n << 37n,
			thirtyNine: 1n << 38n,
			forty: 1n << 39n,
		});
		export type TestFlagsLong = bigint;

		export namespace PointResource {
			export interface Interface {
				$handle?: $wcm.ResourceHandle;

				getX(): u32;

				getY(): u32;

				add(): u32;
			}
			export type Statics = {
				$new?(x: u32, y: u32): Interface;
				$drop(inst: Interface): void;
			};
			export type Class = Statics & {
				new(x: u32, y: u32): Interface;
			};
		}
		export type PointResource = PointResource.Interface;

		export type call = (point: Point) => u32;

		export type callOption = (point: Point | undefined) => u32 | undefined;

		export type checkVariant = (value: TestVariant) => TestVariant;

		export type checkFlagsShort = (value: TestFlagsShort) => TestFlagsShort;

		export type checkFlagsLong = (value: TestFlagsLong) => TestFlagsLong;
	}
	export type Types = {
		PointResource: Types.PointResource.Class;
		call: Types.call;
		callOption: Types.callOption;
		checkVariant: Types.checkVariant;
		checkFlagsShort: Types.checkFlagsShort;
		checkFlagsLong: Types.checkFlagsLong;
	};
	export namespace test {
		export type Imports = {
			types: testData.Types;
		};
		export type Exports = {
		};
	}
}

export namespace testData {
	export namespace Types.$ {
		export const Point = new $wcm.RecordType<testData.Types.Point>([
			['x', $wcm.u32],
			['y', $wcm.u32],
		]);
		export const PointResource = new $wcm.ResourceType<testData.Types.PointResource>('point-resource', 'vscode:test-data/types/point-resource');
		export const PointResource_Handle = new $wcm.ResourceHandleType('point-resource');
		export const PointOption = new $wcm.RecordType<testData.Types.PointOption>([
			['x', new $wcm.OptionType<u32>($wcm.u32)],
			['y', new $wcm.OptionType<u32>($wcm.u32)],
		]);
		export const TestVariant = new $wcm.VariantType<testData.Types.TestVariant, testData.Types.TestVariant._tt, testData.Types.TestVariant._vt>([['empty', undefined], ['unsigned32', $wcm.u32], ['unsigned64', $wcm.u64], ['signed32', $wcm.s32], ['signed64', $wcm.s64], ['floatingPoint32', $wcm.float32], ['floatingPoint64', $wcm.float64], ['structure', Point]], testData.Types.TestVariant._ctor);
		export const TestFlagsShort = new $wcm.FlagsType<testData.Types.TestFlagsShort>(6);
		export const TestFlagsLong = new $wcm.FlagsType<testData.Types.TestFlagsLong>(40);
		PointResource.addConstructor('constructor', new $wcm.ConstructorType<testData.Types.PointResource.Class['constructor']>('[constructor]point-resource', [
			['x', $wcm.u32],
			['y', $wcm.u32],
		], new $wcm.OwnType(PointResource_Handle)));
		PointResource.addMethod('getX', new $wcm.MethodType<testData.Types.PointResource.Interface['getX']>('[method]point-resource.get-x', [], $wcm.u32));
		PointResource.addMethod('getY', new $wcm.MethodType<testData.Types.PointResource.Interface['getY']>('[method]point-resource.get-y', [], $wcm.u32));
		PointResource.addMethod('add', new $wcm.MethodType<testData.Types.PointResource.Interface['add']>('[method]point-resource.add', [], $wcm.u32));
		PointResource.addDestructor('$drop', new $wcm.DestructorType<testData.Types.PointResource.Statics['$drop']>('[resource-drop]point-resource', [['inst', PointResource]]));
		export const call = new $wcm.FunctionType<testData.Types.call>('call',[
			['point', Point],
		], $wcm.u32);
		export const callOption = new $wcm.FunctionType<testData.Types.callOption>('call-option',[
			['point', new $wcm.OptionType<testData.Types.Point>(Point)],
		], new $wcm.OptionType<u32>($wcm.u32));
		export const checkVariant = new $wcm.FunctionType<testData.Types.checkVariant>('check-variant',[
			['value', TestVariant],
		], TestVariant);
		export const checkFlagsShort = new $wcm.FunctionType<testData.Types.checkFlagsShort>('check-flags-short',[
			['value', TestFlagsShort],
		], TestFlagsShort);
		export const checkFlagsLong = new $wcm.FunctionType<testData.Types.checkFlagsLong>('check-flags-long',[
			['value', TestFlagsLong],
		], TestFlagsLong);
	}
	export namespace Types._ {
		export const id = 'vscode:test-data/types' as const;
		export const witName = 'types' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['Point', $.Point],
			['PointOption', $.PointOption],
			['TestVariant', $.TestVariant],
			['TestFlagsShort', $.TestFlagsShort],
			['TestFlagsLong', $.TestFlagsLong],
			['PointResource', $.PointResource]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['call', $.call],
			['callOption', $.callOption],
			['checkVariant', $.checkVariant],
			['checkFlagsShort', $.checkFlagsShort],
			['checkFlagsLong', $.checkFlagsLong]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map<string, $wcm.ResourceType>([
			['PointResource', $.PointResource]
		]);
		export namespace PointResource {
			export type WasmInterface = {
				'[constructor]point-resource': (x: i32, y: i32) => i32;
				'[method]point-resource.get-x': (self: i32) => i32;
				'[method]point-resource.get-y': (self: i32) => i32;
				'[method]point-resource.add': (self: i32) => i32;
				'[resource-drop]point-resource': (self: i32) => void;
			};
			type ObjectModule = {
				constructor(x: u32, y: u32): own<$wcm.ResourceHandle>;
				getX(self: PointResource): u32;
				getY(self: PointResource): u32;
				add(self: PointResource): u32;
			};
			type ClassModule = {
				$drop(self: PointResource): void;
			};
			export class Impl extends $wcm.Resource implements testData.Types.PointResource.Interface {
				private readonly _om: ObjectModule;
				public static readonly $manager = $wcm.ResourceManager.createDefault();
				constructor(x: u32, y: u32, om: ObjectModule) {
					super();
					this._om = om;
					this.$handle = om.constructor(x, y);
					Impl.$manager.$handle(this);
				}
				public getX(): u32 {
					return this._om.getX(this);
				}
				public getY(): u32 {
					return this._om.getY(this);
				}
				public add(): u32 {
					return this._om.add(this);
				}
			}
			export function Class(wasmInterface: WasmInterface, context: $wcm.WasmContext): testData.Types.PointResource.Class {
				const resource = testData.Types.$.PointResource;
				const om: ObjectModule = $wcm.Module.createObjectModule(resource, wasmInterface, context);
				const cm: ClassModule = $wcm.Module.createClassModule(resource, wasmInterface, context);
				return class extends Impl {
					constructor(x: u32, y: u32) {
						super(x, y, om);
					}
					public static $drop(self: PointResource): void {
						return cm.$drop(self);
					}
				};
			}
		}
		export type WasmInterface = {
			'call': (point_x: i32, point_y: i32) => i32;
			'call-option': (point_case: i32, point_option_x: i32, point_option_y: i32, result: ptr<u32 | undefined>) => void;
			'check-variant': (value_case: i32, value_0: i64, value_1: i32, result: ptr<TestVariant>) => void;
			'check-flags-short': (value: i32) => i32;
			'check-flags-long': (value_0: i32, value_1: i32, result: ptr<TestFlagsLong>) => void;
		} & PointResource.WasmInterface;
		export function createImports(service: testData.Types, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Imports.create<WasmInterface>(functions, resources, service, context);
		}
		export function filterExports(exports: object, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Exports.filter<WasmInterface>(exports, functions, resources, id, undefined, context);
		}
		export function bindExports(wasmInterface: WasmInterface, context: $wcm.WasmContext): testData.Types {
			return $wcm.Exports.bind<testData.Types>(functions, [['PointResource', $.PointResource, PointResource.Class]], wasmInterface, context);
		}
	}
	export namespace test.$ {
	}
	export namespace test._ {
		export const id = 'vscode:test-data/test' as const;
		export const witName = 'test' as const;
		export namespace Imports {
			export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
				['Types', Types._]
			]);
		}
		export type Imports = {
			'vscode:test-data/types': testData.Types._.WasmInterface;
		};
		export const Exports = {};
		export type Exports = {};
		export function createImports(service: test.Imports, context: $wcm.WasmContext): Imports {
			const result: Imports = Object.create(null);
			result['vscode:test-data/types'] = testData.Types._.createImports(service.types, context);
			return result;
		}
	}
}

export namespace testData._ {
	export const id = 'vscode:test-data' as const;
	export const witName = 'test-data' as const;
	export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
		['Types', Types._]
	]);
	export const worlds: Map<string, $wcm.WorldType> = new Map<string, $wcm.WorldType>([
		['test', test._]
	]);
}
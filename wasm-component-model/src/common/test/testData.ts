/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '../componentModel';
import type { u32, resource, own, borrow, u64, s32, s64, float32, float64, u8, i32, ptr, i64 } from '../componentModel';

export namespace testData {
	export namespace Types {
		export const id = 'vscode:test-data/types' as const;

		export type Point = {
			x: u32;
			y: u32;
		};

		export namespace PointResource {

			export type constructor = (x: u32, y: u32) => own<PointResource>;

			export type getX = (self: borrow<PointResource>) => u32;

			export type getY = (self: borrow<PointResource>) => u32;

			export type add = (self: borrow<PointResource>) => u32;
		}
		export type PointResource = resource;

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

		export type TestFlagsShort = {
			one: boolean;
			two: boolean;
			three: boolean;
			four: boolean;
			five: boolean;
			six: boolean;
		};
		export namespace TestFlagsShort {
			class FlagsImpl implements TestFlagsShort {
				private bits: u8;
				constructor(bits: u8 = 0) {
					this.bits = bits;
				}
				get _value(): u8 {
					return this.bits;
				}
				get one(): boolean {
					return (this.bits & 1) !== 0;
				}
				set one(value: boolean) {
					this.bits = value ? this.bits | 1 : this.bits & ~1;
				}
				get two(): boolean {
					return (this.bits & 2) !== 0;
				}
				set two(value: boolean) {
					this.bits = value ? this.bits | 2 : this.bits & ~2;
				}
				get three(): boolean {
					return (this.bits & 4) !== 0;
				}
				set three(value: boolean) {
					this.bits = value ? this.bits | 4 : this.bits & ~4;
				}
				get four(): boolean {
					return (this.bits & 8) !== 0;
				}
				set four(value: boolean) {
					this.bits = value ? this.bits | 8 : this.bits & ~8;
				}
				get five(): boolean {
					return (this.bits & 16) !== 0;
				}
				set five(value: boolean) {
					this.bits = value ? this.bits | 16 : this.bits & ~16;
				}
				get six(): boolean {
					return (this.bits & 32) !== 0;
				}
				set six(value: boolean) {
					this.bits = value ? this.bits | 32 : this.bits & ~32;
				}
			}

			export function create(bits?: u8): TestFlagsShort {
				return new FlagsImpl(bits);
			}
			export function value(flags: TestFlagsShort): u8 {
				return (flags as FlagsImpl)._value;
			}
		}

		export type TestFlagsLong = {
			one: boolean;
			two: boolean;
			three: boolean;
			four: boolean;
			five: boolean;
			six: boolean;
			seven: boolean;
			eight: boolean;
			nine: boolean;
			ten: boolean;
			eleven: boolean;
			twelve: boolean;
			thirteen: boolean;
			fourteen: boolean;
			fifteen: boolean;
			sixteen: boolean;
			seventeen: boolean;
			eighteen: boolean;
			nineteen: boolean;
			twenty: boolean;
			twentyOne: boolean;
			twentyTwo: boolean;
			twentyThree: boolean;
			twentyFour: boolean;
			twentyFive: boolean;
			twentySix: boolean;
			twentySeven: boolean;
			twentyEight: boolean;
			twentyNine: boolean;
			thirty: boolean;
			thirtyOne: boolean;
			thirtyTwo: boolean;
			thirtyThree: boolean;
			thirtyFour: boolean;
			thirtyFive: boolean;
			thirtySix: boolean;
			thirtySeven: boolean;
			thirtyEight: boolean;
			thirtyNine: boolean;
			forty: boolean;
		};
		export namespace TestFlagsLong {
			class FlagsImpl implements TestFlagsLong {
				private bits: u32[];
				constructor(bits: u32[] = new Array(2).fill(0)) {
					if (bits.length !== 2) {
						throw new Error('Invalid array length. Expected 2 but got ' + bits.length + '.');
					}
					this.bits = bits;
				}
				get _value(): u32[] {
					return this.bits;
				}
				get one(): boolean {
					return (this.bits[0] & 1) !== 0;
				}
				set one(value: boolean) {
					this.bits[0] = value ? this.bits[0] | 1 : this.bits[0] & ~1;
				}
				get two(): boolean {
					return (this.bits[0] & 2) !== 0;
				}
				set two(value: boolean) {
					this.bits[0] = value ? this.bits[0] | 2 : this.bits[0] & ~2;
				}
				get three(): boolean {
					return (this.bits[0] & 4) !== 0;
				}
				set three(value: boolean) {
					this.bits[0] = value ? this.bits[0] | 4 : this.bits[0] & ~4;
				}
				get four(): boolean {
					return (this.bits[0] & 8) !== 0;
				}
				set four(value: boolean) {
					this.bits[0] = value ? this.bits[0] | 8 : this.bits[0] & ~8;
				}
				get five(): boolean {
					return (this.bits[0] & 16) !== 0;
				}
				set five(value: boolean) {
					this.bits[0] = value ? this.bits[0] | 16 : this.bits[0] & ~16;
				}
				get six(): boolean {
					return (this.bits[0] & 32) !== 0;
				}
				set six(value: boolean) {
					this.bits[0] = value ? this.bits[0] | 32 : this.bits[0] & ~32;
				}
				get seven(): boolean {
					return (this.bits[0] & 64) !== 0;
				}
				set seven(value: boolean) {
					this.bits[0] = value ? this.bits[0] | 64 : this.bits[0] & ~64;
				}
				get eight(): boolean {
					return (this.bits[0] & 128) !== 0;
				}
				set eight(value: boolean) {
					this.bits[0] = value ? this.bits[0] | 128 : this.bits[0] & ~128;
				}
				get nine(): boolean {
					return (this.bits[0] & 256) !== 0;
				}
				set nine(value: boolean) {
					this.bits[0] = value ? this.bits[0] | 256 : this.bits[0] & ~256;
				}
				get ten(): boolean {
					return (this.bits[0] & 512) !== 0;
				}
				set ten(value: boolean) {
					this.bits[0] = value ? this.bits[0] | 512 : this.bits[0] & ~512;
				}
				get eleven(): boolean {
					return (this.bits[0] & 1024) !== 0;
				}
				set eleven(value: boolean) {
					this.bits[0] = value ? this.bits[0] | 1024 : this.bits[0] & ~1024;
				}
				get twelve(): boolean {
					return (this.bits[0] & 2048) !== 0;
				}
				set twelve(value: boolean) {
					this.bits[0] = value ? this.bits[0] | 2048 : this.bits[0] & ~2048;
				}
				get thirteen(): boolean {
					return (this.bits[0] & 4096) !== 0;
				}
				set thirteen(value: boolean) {
					this.bits[0] = value ? this.bits[0] | 4096 : this.bits[0] & ~4096;
				}
				get fourteen(): boolean {
					return (this.bits[0] & 8192) !== 0;
				}
				set fourteen(value: boolean) {
					this.bits[0] = value ? this.bits[0] | 8192 : this.bits[0] & ~8192;
				}
				get fifteen(): boolean {
					return (this.bits[0] & 16384) !== 0;
				}
				set fifteen(value: boolean) {
					this.bits[0] = value ? this.bits[0] | 16384 : this.bits[0] & ~16384;
				}
				get sixteen(): boolean {
					return (this.bits[0] & 32768) !== 0;
				}
				set sixteen(value: boolean) {
					this.bits[0] = value ? this.bits[0] | 32768 : this.bits[0] & ~32768;
				}
				get seventeen(): boolean {
					return (this.bits[0] & 65536) !== 0;
				}
				set seventeen(value: boolean) {
					this.bits[0] = value ? this.bits[0] | 65536 : this.bits[0] & ~65536;
				}
				get eighteen(): boolean {
					return (this.bits[0] & 131072) !== 0;
				}
				set eighteen(value: boolean) {
					this.bits[0] = value ? this.bits[0] | 131072 : this.bits[0] & ~131072;
				}
				get nineteen(): boolean {
					return (this.bits[0] & 262144) !== 0;
				}
				set nineteen(value: boolean) {
					this.bits[0] = value ? this.bits[0] | 262144 : this.bits[0] & ~262144;
				}
				get twenty(): boolean {
					return (this.bits[0] & 524288) !== 0;
				}
				set twenty(value: boolean) {
					this.bits[0] = value ? this.bits[0] | 524288 : this.bits[0] & ~524288;
				}
				get twentyOne(): boolean {
					return (this.bits[0] & 1048576) !== 0;
				}
				set twentyOne(value: boolean) {
					this.bits[0] = value ? this.bits[0] | 1048576 : this.bits[0] & ~1048576;
				}
				get twentyTwo(): boolean {
					return (this.bits[0] & 2097152) !== 0;
				}
				set twentyTwo(value: boolean) {
					this.bits[0] = value ? this.bits[0] | 2097152 : this.bits[0] & ~2097152;
				}
				get twentyThree(): boolean {
					return (this.bits[0] & 4194304) !== 0;
				}
				set twentyThree(value: boolean) {
					this.bits[0] = value ? this.bits[0] | 4194304 : this.bits[0] & ~4194304;
				}
				get twentyFour(): boolean {
					return (this.bits[0] & 8388608) !== 0;
				}
				set twentyFour(value: boolean) {
					this.bits[0] = value ? this.bits[0] | 8388608 : this.bits[0] & ~8388608;
				}
				get twentyFive(): boolean {
					return (this.bits[0] & 16777216) !== 0;
				}
				set twentyFive(value: boolean) {
					this.bits[0] = value ? this.bits[0] | 16777216 : this.bits[0] & ~16777216;
				}
				get twentySix(): boolean {
					return (this.bits[0] & 33554432) !== 0;
				}
				set twentySix(value: boolean) {
					this.bits[0] = value ? this.bits[0] | 33554432 : this.bits[0] & ~33554432;
				}
				get twentySeven(): boolean {
					return (this.bits[0] & 67108864) !== 0;
				}
				set twentySeven(value: boolean) {
					this.bits[0] = value ? this.bits[0] | 67108864 : this.bits[0] & ~67108864;
				}
				get twentyEight(): boolean {
					return (this.bits[0] & 134217728) !== 0;
				}
				set twentyEight(value: boolean) {
					this.bits[0] = value ? this.bits[0] | 134217728 : this.bits[0] & ~134217728;
				}
				get twentyNine(): boolean {
					return (this.bits[0] & 268435456) !== 0;
				}
				set twentyNine(value: boolean) {
					this.bits[0] = value ? this.bits[0] | 268435456 : this.bits[0] & ~268435456;
				}
				get thirty(): boolean {
					return (this.bits[0] & 536870912) !== 0;
				}
				set thirty(value: boolean) {
					this.bits[0] = value ? this.bits[0] | 536870912 : this.bits[0] & ~536870912;
				}
				get thirtyOne(): boolean {
					return (this.bits[0] & 1073741824) !== 0;
				}
				set thirtyOne(value: boolean) {
					this.bits[0] = value ? this.bits[0] | 1073741824 : this.bits[0] & ~1073741824;
				}
				get thirtyTwo(): boolean {
					return (this.bits[0] & -2147483648) !== 0;
				}
				set thirtyTwo(value: boolean) {
					this.bits[0] = value ? this.bits[0] | -2147483648 : this.bits[0] & ~-2147483648;
				}
				get thirtyThree(): boolean {
					return (this.bits[1] & 1) !== 0;
				}
				set thirtyThree(value: boolean) {
					this.bits[1] = value ? this.bits[1] | 1 : this.bits[1] & ~1;
				}
				get thirtyFour(): boolean {
					return (this.bits[1] & 2) !== 0;
				}
				set thirtyFour(value: boolean) {
					this.bits[1] = value ? this.bits[1] | 2 : this.bits[1] & ~2;
				}
				get thirtyFive(): boolean {
					return (this.bits[1] & 4) !== 0;
				}
				set thirtyFive(value: boolean) {
					this.bits[1] = value ? this.bits[1] | 4 : this.bits[1] & ~4;
				}
				get thirtySix(): boolean {
					return (this.bits[1] & 8) !== 0;
				}
				set thirtySix(value: boolean) {
					this.bits[1] = value ? this.bits[1] | 8 : this.bits[1] & ~8;
				}
				get thirtySeven(): boolean {
					return (this.bits[1] & 16) !== 0;
				}
				set thirtySeven(value: boolean) {
					this.bits[1] = value ? this.bits[1] | 16 : this.bits[1] & ~16;
				}
				get thirtyEight(): boolean {
					return (this.bits[1] & 32) !== 0;
				}
				set thirtyEight(value: boolean) {
					this.bits[1] = value ? this.bits[1] | 32 : this.bits[1] & ~32;
				}
				get thirtyNine(): boolean {
					return (this.bits[1] & 64) !== 0;
				}
				set thirtyNine(value: boolean) {
					this.bits[1] = value ? this.bits[1] | 64 : this.bits[1] & ~64;
				}
				get forty(): boolean {
					return (this.bits[1] & 128) !== 0;
				}
				set forty(value: boolean) {
					this.bits[1] = value ? this.bits[1] | 128 : this.bits[1] & ~128;
				}
			}

			export function create(bits?: u32[]): TestFlagsLong {
				return new FlagsImpl(bits);
			}
			export function value(flags: TestFlagsLong): u32[] {
				return (flags as FlagsImpl)._value;
			}
		}

		export type call = (point: Point) => u32;

		export type callOption = (point: Point | undefined) => u32 | undefined;

		export type checkVariant = (value: TestVariant) => TestVariant;

		export type checkFlagsShort = (value: TestFlagsShort) => TestFlagsShort;

		export type checkFlagsLong = (value: TestFlagsLong) => TestFlagsLong;
	}
	export type Types = {
		PointResource: {
			constructor: Types.PointResource.constructor;
			getX: Types.PointResource.getX;
			getY: Types.PointResource.getY;
			add: Types.PointResource.add;
		};
		call: Types.call;
		callOption: Types.callOption;
		checkVariant: Types.checkVariant;
		checkFlagsShort: Types.checkFlagsShort;
		checkFlagsLong: Types.checkFlagsLong;
	};

}

export namespace testData {
	export namespace Types.$ {
		export const Point = new $wcm.RecordType<testData.Types.Point>([
			['x', $wcm.u32],
			['y', $wcm.u32],
		]);
		export const PointResource = new $wcm.NamespaceResourceType('PointResource', 'point-resource');
		export const PointOption = new $wcm.RecordType<testData.Types.PointOption>([
			['x', new $wcm.OptionType<u32>($wcm.u32)],
			['y', new $wcm.OptionType<u32>($wcm.u32)],
		]);
		export const TestVariant = new $wcm.VariantType<testData.Types.TestVariant, testData.Types.TestVariant._tt, testData.Types.TestVariant._vt>([['empty', undefined], ['unsigned32', $wcm.u32], ['unsigned64', $wcm.u64], ['signed32', $wcm.s32], ['signed64', $wcm.s64], ['floatingPoint32', $wcm.float32], ['floatingPoint64', $wcm.float64], ['structure', Point]], testData.Types.TestVariant._ctor);
		export const TestFlagsShort = new $wcm.FlagsType<testData.Types.TestFlagsShort>(6, { kind: $wcm.FlagsStorageKind.Single, type: $wcm.u8, create: testData.Types.TestFlagsShort.create, value: testData.Types.TestFlagsShort.value as $wcm.SingleFlagsValueFunc });
		export const TestFlagsLong = new $wcm.FlagsType<testData.Types.TestFlagsLong>(40, { kind: $wcm.FlagsStorageKind.Array, length: 2, type: $wcm.u32, create: testData.Types.TestFlagsLong.create, value: testData.Types.TestFlagsLong.value as $wcm.ArrayFlagsValueFunc });
		export const call = new $wcm.FunctionType<testData.Types.call>('call', 'call',[
			['point', Point],
		], $wcm.u32);
		export const callOption = new $wcm.FunctionType<testData.Types.callOption>('callOption', 'call-option',[
			['point', new $wcm.OptionType<testData.Types.Point>(Point)],
		], new $wcm.OptionType<u32>($wcm.u32));
		export const checkVariant = new $wcm.FunctionType<testData.Types.checkVariant>('checkVariant', 'check-variant',[
			['value', TestVariant],
		], TestVariant);
		export const checkFlagsShort = new $wcm.FunctionType<testData.Types.checkFlagsShort>('checkFlagsShort', 'check-flags-short',[
			['value', TestFlagsShort],
		], TestFlagsShort);
		export const checkFlagsLong = new $wcm.FunctionType<testData.Types.checkFlagsLong>('checkFlagsLong', 'check-flags-long',[
			['value', TestFlagsLong],
		], TestFlagsLong);
		PointResource.addFunction(new $wcm.FunctionType<testData.Types.PointResource.constructor>('constructor', '[constructor]point-resource', [
			['x', $wcm.u32],
			['y', $wcm.u32],
		], new $wcm.OwnType<testData.Types.PointResource>(PointResource)));
		PointResource.addFunction(new $wcm.FunctionType<testData.Types.PointResource.getX>('getX', '[method]point-resource.get-x', [
			['self', new $wcm.BorrowType<testData.Types.PointResource>(PointResource)],
		], $wcm.u32));
		PointResource.addFunction(new $wcm.FunctionType<testData.Types.PointResource.getY>('getY', '[method]point-resource.get-y', [
			['self', new $wcm.BorrowType<testData.Types.PointResource>(PointResource)],
		], $wcm.u32));
		PointResource.addFunction(new $wcm.FunctionType<testData.Types.PointResource.add>('add', '[method]point-resource.add', [
			['self', new $wcm.BorrowType<testData.Types.PointResource>(PointResource)],
		], $wcm.u32));
	}
	export namespace Types._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [$.call, $.callOption, $.checkVariant, $.checkFlagsShort, $.checkFlagsLong];
		const resources: $wcm.NamespaceResourceType[] = [$.PointResource];
		export type WasmInterface = {
			'call': (point_x: i32, point_y: i32) => i32;
			'call-option': (point_case: i32, point_option_x: i32, point_option_y: i32, result: ptr<[i32, i32]>) => void;
			'[constructor]point-resource': (x: i32, y: i32) => i32;
			'[method]point-resource.get-x': (self: i32) => i32;
			'[method]point-resource.get-y': (self: i32) => i32;
			'[method]point-resource.add': (self: i32) => i32;
			'check-variant': (value_case: i32, value_0: i64, value_1: i32, result: ptr<[i32, i64, i32]>) => void;
			'check-flags-short': (value: i32) => i32;
			'check-flags-long': (value_0: i32, value_1: i32, result: ptr<[i32, i32]>) => void;
		};
		export function createHost(service: testData.Types, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context): testData.Types {
			return $wcm.Service.create<testData.Types>(functions, resources, wasmInterface, context);
		}
	}
}
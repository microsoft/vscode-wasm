/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '../componentModel';
import type { u32, resource, own, borrow, u64, s32, s64, float32, float64, i32, ptr, i64 } from '../componentModel';

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
			export const empty = 0 as const;
			export type empty = { readonly case: typeof empty } & _common;

			export const unsigned32 = 1 as const;
			export type unsigned32 = { readonly case: typeof unsigned32; readonly value: u32 } & _common;

			export const unsigned64 = 2 as const;
			export type unsigned64 = { readonly case: typeof unsigned64; readonly value: u64 } & _common;

			export const signed32 = 3 as const;
			export type signed32 = { readonly case: typeof signed32; readonly value: s32 } & _common;

			export const signed64 = 4 as const;
			export type signed64 = { readonly case: typeof signed64; readonly value: s64 } & _common;

			export const floatingPoint32 = 5 as const;
			export type floatingPoint32 = { readonly case: typeof floatingPoint32; readonly value: float32 } & _common;

			export const floatingPoint64 = 6 as const;
			export type floatingPoint64 = { readonly case: typeof floatingPoint64; readonly value: float64 } & _common;

			export const structure = 7 as const;
			export type structure = { readonly case: typeof structure; readonly value: Point } & _common;

			export type _ct = typeof empty | typeof unsigned32 | typeof unsigned64 | typeof signed32 | typeof signed64 | typeof floatingPoint32 | typeof floatingPoint64 | typeof structure;
			export type _vt = u32 | u64 | s32 | s64 | float32 | float64 | Point | undefined;
			type _common = Omit<VariantImpl, 'case' | 'value'>;
			export function _ctor(c: _ct, v: _vt): TestVariant {
				return new VariantImpl(c, v) as TestVariant;
			}
			export function _empty(): empty {
				return new VariantImpl(empty, undefined) as empty;
			}
			export function _unsigned32(value: u32): unsigned32 {
				return new VariantImpl(unsigned32, value) as unsigned32;
			}
			export function _unsigned64(value: u64): unsigned64 {
				return new VariantImpl(unsigned64, value) as unsigned64;
			}
			export function _signed32(value: s32): signed32 {
				return new VariantImpl(signed32, value) as signed32;
			}
			export function _signed64(value: s64): signed64 {
				return new VariantImpl(signed64, value) as signed64;
			}
			export function _floatingPoint32(value: float32): floatingPoint32 {
				return new VariantImpl(floatingPoint32, value) as floatingPoint32;
			}
			export function _floatingPoint64(value: float64): floatingPoint64 {
				return new VariantImpl(floatingPoint64, value) as floatingPoint64;
			}
			export function _structure(value: Point): structure {
				return new VariantImpl(structure, value) as structure;
			}
			class VariantImpl {
				private readonly _case: _ct;
				private readonly _value?: _vt;
				constructor(c: _ct, value: _vt) {
					this._case = c;
					this._value = value;
				}
				get case(): _ct {
					return this._case;
				}
				get value(): _vt {
					return this._value;
				}
				empty(): this is empty {
					return this._case === TestVariant.empty;
				}
				unsigned32(): this is unsigned32 {
					return this._case === TestVariant.unsigned32;
				}
				unsigned64(): this is unsigned64 {
					return this._case === TestVariant.unsigned64;
				}
				signed32(): this is signed32 {
					return this._case === TestVariant.signed32;
				}
				signed64(): this is signed64 {
					return this._case === TestVariant.signed64;
				}
				floatingPoint32(): this is floatingPoint32 {
					return this._case === TestVariant.floatingPoint32;
				}
				floatingPoint64(): this is floatingPoint64 {
					return this._case === TestVariant.floatingPoint64;
				}
				structure(): this is structure {
					return this._case === TestVariant.structure;
				}
			}
		}
		export type TestVariant = TestVariant.empty | TestVariant.unsigned32 | TestVariant.unsigned64 | TestVariant.signed32 | TestVariant.signed64 | TestVariant.floatingPoint32 | TestVariant.floatingPoint64 | TestVariant.structure;

		export type call = (point: Point) => u32;

		export type callOption = (point: Point | undefined) => u32 | undefined;

		export type checkVariant = (value: TestVariant) => TestVariant;
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
		export const TestVariant = new $wcm.VariantType<testData.Types.TestVariant, testData.Types.TestVariant._ct, testData.Types.TestVariant._vt>([undefined, $wcm.u32, $wcm.u64, $wcm.s32, $wcm.s64, $wcm.float32, $wcm.float64, Point], testData.Types.TestVariant._ctor);
		export const call = new $wcm.FunctionType<testData.Types.call>('call', 'call',[
			['point', Point],
		], $wcm.u32);
		export const callOption = new $wcm.FunctionType<testData.Types.callOption>('callOption', 'call-option',[
			['point', new $wcm.OptionType<testData.Types.Point>(Point)],
		], new $wcm.OptionType<u32>($wcm.u32));
		export const checkVariant = new $wcm.FunctionType<testData.Types.checkVariant>('checkVariant', 'check-variant',[
			['value', TestVariant],
		], TestVariant);
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
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [$.call, $.callOption, $.checkVariant];
		const resources: $wcm.NamespaceResourceType[] = [$.PointResource];
		export type WasmInterface = {
			'call': (point_x: i32, point_y: i32) => i32;
			'call-option': (point_case: i32, point_option_x: i32, point_option_y: i32, result: ptr<[i32, i32]>) => void;
			'[constructor]point-resource': (x: i32, y: i32) => i32;
			'[method]point-resource.get-x': (self: i32) => i32;
			'[method]point-resource.get-y': (self: i32) => i32;
			'[method]point-resource.add': (self: i32) => i32;
			'check-variant': (value_case: i32, value_0: i64, value_1: i32, result: ptr<[i32, i64, i32]>) => void;
		};
		export function createHost(service: testData.Types, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context): testData.Types {
			return $wcm.Service.create<testData.Types>(functions, resources, wasmInterface, context);
		}
	}
}
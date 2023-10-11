/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '../componentModel';
import type { u32, resource, own, borrow, i32, ptr } from '../componentModel';

export namespace test {
	export namespace Sample {

		export type Point = {
			x: u32;
			y: u32;
		};

		export type PointResource = resource;
		export namespace PointResource {

			export declare function constructor(x: u32, y: u32): own<PointResource>;

			export declare function getX(self: borrow<PointResource>): u32;

			export declare function getY(self: borrow<PointResource>): u32;

			export declare function add(self: borrow<PointResource>): u32;
		}

		export declare function call(point: Point | undefined): u32 | undefined;
	}
	export type Sample = Pick<typeof Sample, 'PointResource' | 'call'>;

}

export namespace test {
	export namespace Sample.$ {
		export const Point = new $wcm.RecordType<test.Sample.Point>([
			['x', $wcm.u32],
			['y', $wcm.u32],
		]);
		export const PointResource = new $wcm.NamespaceResourceType('PointResource', 'point-resource');
		export const call = new $wcm.FunctionType<typeof test.Sample.call>('call', 'call',[
			['point', new $wcm.OptionType<test.Sample.Point>(Point)],
		], new $wcm.OptionType<u32>($wcm.u32));
		PointResource.addFunction(new $wcm.FunctionType<typeof test.Sample.PointResource.constructor>('constructor', '[constructor]point-resource', [
			['x', $wcm.u32],
			['y', $wcm.u32],
		], new $wcm.OwnType<test.Sample.PointResource>(PointResource)));
		PointResource.addFunction(new $wcm.FunctionType<typeof test.Sample.PointResource.getX>('getX', '[method]point-resource.get-x', [
			['self', new $wcm.BorrowType<test.Sample.PointResource>(PointResource)],
		], $wcm.u32));
		PointResource.addFunction(new $wcm.FunctionType<typeof test.Sample.PointResource.getY>('getY', '[method]point-resource.get-y', [
			['self', new $wcm.BorrowType<test.Sample.PointResource>(PointResource)],
		], $wcm.u32));
		PointResource.addFunction(new $wcm.FunctionType<typeof test.Sample.PointResource.add>('add', '[method]point-resource.add', [
			['self', new $wcm.BorrowType<test.Sample.PointResource>(PointResource)],
		], $wcm.u32));
	}
	export namespace Sample._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [$.call];
		const resources: $wcm.NamespaceResourceType[] = [$.PointResource];
		export type WasmInterface = {
			'[constructor]point-resource': (x: i32, y: i32) => i32;
			'[method]point-resource.get-x': (self: i32) => i32;
			'[method]point-resource.get-y': (self: i32) => i32;
			'[method]point-resource.add': (self: i32) => i32;
			'call': (point_case: i32, point_option_x: i32, point_option_y: i32, result: ptr<[i32, i32]>) => void;
		};
		export function createHost(service: test.Sample, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context): test.Sample {
			return $wcm.Service.create<test.Sample>(functions, resources, wasmInterface, context);
		}
	}
}
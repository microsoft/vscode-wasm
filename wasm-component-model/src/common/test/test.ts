/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '../componentModel';
import type { u32, i32 } from '../componentModel';

export namespace test {
	export namespace Sample {

		export type Point = {
			x: u32;
			y: u32;
		};

		export declare function call(point: Point): u32;
	}
	export type Sample = Pick<typeof Sample, 'call'>;

}

export namespace test {
	export namespace Sample.$ {
		export const Point = new $wcm.RecordType<test.Sample.Point>([
			['x', $wcm.u32],
			['y', $wcm.u32],
		]);
		export const call = new $wcm.FunctionType<typeof test.Sample.call>('call', 'call',[
			['point', Point],
		], $wcm.u32);
	}
	export namespace Sample._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [$.call];
		const resources: $wcm.NamespaceResourceType[] = [];
		export type WasmInterface = {
			'call': (point_x: i32, point_y: i32) => i32;
		};
		type internalWasmInterface = {
			[ket: string]: (...args: (number & bigint)[]) => number | bigint;
		};

		let c: WasmInterface | undefined;
		let i: internalWasmInterface | undefined;
		i = c;
		export function createHost(service: test.Sample, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context): test.Sample {
			return $wcm.Service.create<test.Sample>(functions, resources, wasmInterface, context);
		}
	}
}
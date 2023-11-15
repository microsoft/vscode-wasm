/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '@vscode/wasm-component-model';

import { io } from './io';
import { clocks } from './clocks';
import { filesystem } from './filesystem';
import { sockets } from './sockets';
import { random } from './random';
import { cli } from './cli';
import { http } from './http';

type wasi<I extends io = io, F extends filesystem = filesystem, S extends sockets = sockets, H extends http = http> = {
	io?: I;
	clocks?: clocks;
	filesystem?: F;
	sockets?: S;
	random?: random;
	cli?: cli;
	http?: H;
};
namespace wasi._ {
	export const packages: Map<string, $wcm.PackageType> =  new Map<string, $wcm.PackageType>([
		['io', io._],
		['clocks', clocks._],
		['filesystem', filesystem._],
		['sockets', sockets._],
		['random', random._],
		['cli', cli._],
		['http', http._],
	]);
	export type WasmInterface = io._.WasmInterface & clocks._.WasmInterface & filesystem._.WasmInterface & sockets._.WasmInterface & random._.WasmInterface & cli._.WasmInterface & http._.WasmInterface;
	export function createHost(service: wasi, context: $wcm.Context): WasmInterface {
		let result: WasmInterface = Object.create(null);
		if (service.io !== undefined) {
			result = Object.assign(result, io._.createHost(service.io, context));
		}
		if (service.clocks !== undefined) {
			result = Object.assign(result, clocks._.createHost(service.clocks, context));
		}
		if (service.filesystem !== undefined) {
			result = Object.assign(result, filesystem._.createHost(service.filesystem, context));
		}
		if (service.sockets !== undefined) {
			result = Object.assign(result, sockets._.createHost(service.sockets, context));
		}
		if (service.random !== undefined) {
			result = Object.assign(result, random._.createHost(service.random, context));
		}
		if (service.cli !== undefined) {
			result = Object.assign(result, cli._.createHost(service.cli, context));
		}
		if (service.http !== undefined) {
			result = Object.assign(result, http._.createHost(service.http, context));
		}
		return result;
	}
	export type ClassService = wasi<io._.ClassService, filesystem._.ClassService, sockets._.ClassService, http._.ClassService>;
	export type ModuleService = wasi<io._.ModuleService, filesystem._.ModuleService, sockets._.ModuleService, http._.ModuleService>;
	export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind?: $wcm.ResourceKind.class): ClassService;
	export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind: $wcm.ResourceKind.module): ModuleService;
	export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind: $wcm.ResourceKind): wasi;
	export function createService<I extends io = io, F extends filesystem = filesystem, S extends sockets = sockets, H extends http = http>(wasmInterface: WasmInterface, context: $wcm.Context, i: io, f: filesystem, s: sockets, h: http): wasi<I, F, S, H>;
	export function createService(wasmInterface: WasmInterface, context: $wcm.Context, i?: io | $wcm.ResourceKind, f?: filesystem, s?: sockets, h?: http): wasi {
		const result: wasi = Object.create(null);
		i = i ?? $wcm.ResourceKind.class;
		if (i === $wcm.ResourceKind.class || i === $wcm.ResourceKind.module) {
			const _io = io._.createService(wasmInterface, context, i);
			if (Object.keys(_io).length > 0) {
				result.io = _io;
			}
			const _clocks = clocks._.createService(wasmInterface, context, i);
			if (Object.keys(_clocks).length > 0) {
				result.clocks = _clocks;
			}
			const _filesystem = filesystem._.createService(wasmInterface, context, i);
			if (Object.keys(_filesystem).length > 0) {
				result.filesystem = _filesystem;
			}
			const _sockets = sockets._.createService(wasmInterface, context, i);
			if (Object.keys(_sockets).length > 0) {
				result.sockets = _sockets;
			}
			const _random = random._.createService(wasmInterface, context, i);
			if (Object.keys(_random).length > 0) {
				result.random = _random;
			}
			const _cli = cli._.createService(wasmInterface, context, i);
			if (Object.keys(_cli).length > 0) {
				result.cli = _cli;
			}
			const _http = http._.createService(wasmInterface, context, i);
			if (Object.keys(_http).length > 0) {
				result.http = _http;
			}
		} else {
			const _io = i;
			if (_io !== undefined && Object.keys(_io).length > 0) {
				result.io = _io;
			}
			const _clocks = clocks._.createService(wasmInterface, context);
			if (Object.keys(_clocks).length > 0) {
				result.clocks = _clocks;
			}
			const _filesystem = f;
			if (_filesystem !== undefined && Object.keys(_filesystem).length > 0) {
				result.filesystem = _filesystem;
			}
			const _sockets = s;
			if (_sockets !== undefined && Object.keys(_sockets).length > 0) {
				result.sockets = _sockets;
			}
			const _random = random._.createService(wasmInterface, context);
			if (Object.keys(_random).length > 0) {
				result.random = _random;
			}
			const _cli = cli._.createService(wasmInterface, context);
			if (Object.keys(_cli).length > 0) {
				result.cli = _cli;
			}
			const _http = h;
			if (_http !== undefined && Object.keys(_http).length > 0) {
				result.http = _http;
			}
		}
		return result;
	}
}
export { io, clocks, filesystem, sockets, random, cli, http};
export default wasi;
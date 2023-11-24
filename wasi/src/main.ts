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

namespace wasi {
	export type Managers = {
		io: io.Managers;
		filesystem: filesystem.Managers;
		sockets: sockets.Managers;
		cli: cli.Managers;
		http: http.Managers;
	};
}
type wasi = {
	io?: io;
	clocks?: clocks;
	filesystem?: filesystem;
	sockets?: sockets;
	random?: random;
	cli?: cli;
	http?: http;
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
	export function createHost(service: wasi, context: $wcm.WasmContext): WasmInterface {
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
	export function createService(wasmInterface: WasmInterface, context: $wcm.WasmContext): wasi {
		let result: wasi = Object.create(null);
		const _io = io._.createService(wasmInterface, context);
		if (Object.keys(_io).length > 0) {
			result.io = _io;
		}
		const _clocks = clocks._.createService(wasmInterface, context);
		if (Object.keys(_clocks).length > 0) {
			result.clocks = _clocks;
		}
		const _filesystem = filesystem._.createService(wasmInterface, context);
		if (Object.keys(_filesystem).length > 0) {
			result.filesystem = _filesystem;
		}
		const _sockets = sockets._.createService(wasmInterface, context);
		if (Object.keys(_sockets).length > 0) {
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
		const _http = http._.createService(wasmInterface, context);
		if (Object.keys(_http).length > 0) {
			result.http = _http;
		}
		return result;
	}
	export function createManagers(): wasi.Managers {
		return Object.freeze({
			io: io._.createManagers(),
			filesystem: filesystem._.createManagers(),
			sockets: sockets._.createManagers(),
			cli: cli._.createManagers(),
			http: http._.createManagers(),
		});
	}
}
export { io, clocks, filesystem, sockets, random, cli, http};
export default wasi;
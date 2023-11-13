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

export namespace _ {
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
}
export { io, clocks, filesystem, sockets, random, cli, http};
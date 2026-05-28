/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '@vscode/wasm-component-model';

import { cli } from './cli';
import { clocks } from './clocks';
import { filesystem } from './filesystem';
import { io } from './io';
import { random } from './random';
import { sockets } from './sockets';

namespace wasi._ {
	export const packages: Map<string, $wcm.PackageType> =  new Map<string, $wcm.PackageType>([
		['io', io._],
		['clocks', clocks._],
		['filesystem', filesystem._],
		['sockets', sockets._],
		['random', random._],
		['cli', cli._],
	]);
}
export { cli, clocks, filesystem, io, random, sockets };
export default wasi;
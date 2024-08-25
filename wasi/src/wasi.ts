/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/* eslint-disable @typescript-eslint/ban-types */
import * as $wcm from '@vscode/wasm-component-model';

import { io } from './io';
import { clocks } from './clocks';
import { filesystem } from './filesystem';
import { sockets } from './sockets';
import { random } from './random';
import { cli } from './cli';

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
export { io, clocks, filesystem, sockets, random, cli };
export default wasi;
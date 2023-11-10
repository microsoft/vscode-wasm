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
import { logging } from './logging';

export namespace _ {
	export const packages: Map<string, $wcm.PackageType> =  new Map<string, $wcm.PackageType>([
		['io', io._],
		['clocks', clocks._],
		['filesystem', filesystem._],
		['sockets', sockets._],
		['random', random._],
		['cli', cli._],
		['http', http._],
		['logging', logging._],
	]);
}
export { io, clocks, filesystem, sockets, random, cli, http, logging};
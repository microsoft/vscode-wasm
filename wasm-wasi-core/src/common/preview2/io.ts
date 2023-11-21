/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { io, http } from '@vscode/wasi';
import { Promisify } from '@vscode/wasm-component-model';

type Pollable = Promisify<io.Poll.Pollable.Module>;

let pollable: Pollable = {
	block(self: number) {
		return Promise.resolve();
	},
	ready(self: number) {
		return Promise.resolve(false);
	},
};

type Types = Promisify<http.Types>;
let t: Types = {} as any;

t.Fields.
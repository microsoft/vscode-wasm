/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/// <reference path="../../typings/webAssemblyNode.d.ts" />
import path from 'node:path';
import fs from 'node:fs/promises';

import { ExtensionContext } from 'vscode';

import RAL from '../common/ral';

const _ril: RAL = Object.freeze<RAL>({
	path: path.posix,
	coreUtils: Object.freeze({
		async load(context: ExtensionContext): Promise<WebAssembly.Module> {
			const location = context.asAbsolutePath(path.posix.join('wasm', 'coreutils.wasm'));
			return WebAssembly.compile(await fs.readFile(location));
		}
	})
});

function RIL(): RAL {
	return _ril;
}

namespace RIL {
	export function install(): void {
		RAL.install(_ril);
	}
}

if (!RAL.isInstalled()) {
	RAL.install(_ril);
}
export default RIL;
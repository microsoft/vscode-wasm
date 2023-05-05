/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/// <reference path="../../typings/webAssemblyNode.d.ts" />
import path from 'node:path';

import { Uri, workspace } from 'vscode';

import RAL from '../common/ral';

const _ril: RAL = Object.freeze<RAL>({
	path: path.posix,
	webAssembly: Object.freeze({
		async compile(uri: Uri): Promise<WebAssembly.Module> {
			const bits = await workspace.fs.readFile(uri);
			return WebAssembly.compile(bits);
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
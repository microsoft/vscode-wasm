/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import path from 'path-browserify';

import RAL from '../common/ral';
import { ExtensionContext } from 'vscode';

const _ril: RAL = Object.freeze<RAL>({
	path: path.posix,
	coreUtils: Object.freeze({
		async load(_context: ExtensionContext): Promise<WebAssembly.Module> {
			throw new Error('Not implemented');
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
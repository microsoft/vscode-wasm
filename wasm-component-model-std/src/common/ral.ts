/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/// <reference path="../../typings/webAssemblyCommon.d.ts" />

import { Memory } from './sobject';

interface RAL {
	readonly Memory: {
		create(memory: WebAssembly.Memory): Promise<Memory>;
	};
}

let _ral: RAL | undefined;

function RAL(): RAL {
	if (_ral === undefined) {
		throw new Error(`No runtime abstraction layer installed`);
	}
	return _ral;
}

namespace RAL {
	export function install(ral: RAL): void {
		if (ral === undefined) {
			throw new Error(`No runtime abstraction layer provided`);
		}
		_ral = ral;
	}
	export function isInstalled(): boolean {
		return _ral !== undefined;
	}
}

export default RAL;
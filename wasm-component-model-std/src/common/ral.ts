/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/// <reference path="../../typings/webAssemblyCommon.d.ts" />

import { RAL as _RAL } from '@vscode/wasm-component-model';

import { Memory } from './sobject';
import type { BaseConnection } from './connection';

interface RAL extends _RAL {
	readonly Memory: {
		module(): Promise<WebAssembly.Module>;
		create(module: WebAssembly.Module, memory: WebAssembly.Memory): Promise<Memory>;
	};
	readonly Worker: {
		getArgs(): string[];
	};
	readonly Connection: {
		create(port: MessagePort): BaseConnection<undefined, undefined, undefined>;
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
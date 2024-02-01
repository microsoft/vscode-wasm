/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/// <reference path="../../typings/webAssemblyCommon.d.ts" />

import { RAL as _RAL } from '@vscode/wasm-component-model';

import { Memory } from './sobject';
import type { AnyConnection } from './connection';
import type { WorkerClient, WorkerClientBase } from './workerClient';

interface RAL extends _RAL {
	readonly Memory: {
		module(): Promise<WebAssembly.Module>;
		create(module: WebAssembly.Module, memory: WebAssembly.Memory): Promise<Memory>;
	};
	readonly Connection: {
		create(port: MessagePort): AnyConnection;
	};
	WorkerClient<C>(base: new () => WorkerClientBase, module: string): (new () => WorkerClient & C);
	readonly Worker: {
		getArgs(): string[];
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
	export type TextEncoder = _RAL.TextEncoder;
	export type TextDecoder = _RAL.TextDecoder;
	export type Disposable = _RAL.Disposable;
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
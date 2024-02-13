/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/// <reference path="../../typings/webAssemblyCommon.d.ts" />
import type { URI } from 'vscode-uri';

import { RAL as _RAL } from '@vscode/wasm-component-model';

import { SharedMemory } from './sobject';
import type { AnyConnection, ConnectionPort } from './connection';
import type { WorkerClient, WorkerClientBase } from './workerClient';

interface RAL extends _RAL {
	readonly Memory: {
		create(constructor: new (module: WebAssembly.Module, memory: WebAssembly.Memory, exports: SharedMemory.Exports) => SharedMemory): Promise<SharedMemory>;
		createFrom(constructor: new (module: WebAssembly.Module, memory: WebAssembly.Memory, exports: SharedMemory.Exports, id: string) => SharedMemory, transferable: SharedMemory.Transferable): Promise<SharedMemory>;
	};
	readonly MessageChannel: {
		create(): [ConnectionPort, ConnectionPort];
	};
	readonly Connection: {
		create(port: ConnectionPort): AnyConnection;
	};
	WorkerClient<C>(base: new () => WorkerClientBase, worker: URI, args?: string[]): (new () => WorkerClient & C);
	readonly Worker: {
		getPort(): ConnectionPort;
		getArgs(): string[];
		exitCode: number | undefined;
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
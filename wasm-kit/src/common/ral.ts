/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import type { URI } from 'vscode-uri';

import { RAL as _RAL } from '@vscode/wasm-component-model';

import type { AnyConnection, ConnectionPort } from './connection';
import { SharedMemory } from './sharedObject';
import type { WorkerClient, WorkerClientBase } from './workerClient';

interface RAL extends _RAL {
	readonly Memory: {
		create(constructor: SharedMemory.Constructor): Promise<SharedMemory>;
		createFrom(constructor: SharedMemory.Constructor, transferable: SharedMemory.Transferable): Promise<SharedMemory>;
	};
	readonly MessageChannel: {
		create(): [ConnectionPort, ConnectionPort];
	};
	readonly AnyConnection: {
		create(port: ConnectionPort): AnyConnection;
	};
	WorkerClient<C>(base: new () => WorkerClientBase, worker: URI, args?: string[]): (new () => WorkerClient & C);
	readonly Worker: {
		getPort(): ConnectionPort;
		getArgs(): string[];
		exitCode: number | undefined;
	};
	readonly WebAssembly: {
		compile(bytes: Uint8Array): Promise<WebAssembly_.Module>;
		instantiate(module: WebAssembly_.Module, imports: WebAssembly_.Imports): Promise<WebAssembly_.Instance>;
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
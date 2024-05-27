/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { MainConnection, WorkerConnection, WorldType } from './componentModel';
import type * as d from './disposable';

interface _TextEncoder {
	encode(input?: string): Uint8Array;
}

interface _TextDecoder {
	decode(input?: Uint8Array): string;
}

interface _ConnectionPort {
	postMessage(message: any, ...args: any[]): void;
	on?(event: 'message', listener: (value: any) => void): this;
	onmessage?: ((this: any, ev: any) => any) | null;
}

interface RAL {

	readonly TextEncoder: {
		create(encoding?: string): _TextEncoder;
	};

	readonly TextDecoder: {
		create(encoding?: string): _TextDecoder;
	};

	readonly console: {
	    info(message?: any, ...optionalParams: any[]): void;
	    log(message?: any, ...optionalParams: any[]): void;
	    warn(message?: any, ...optionalParams: any[]): void;
	    error(message?: any, ...optionalParams: any[]): void;
	};

	readonly timer: {
		setTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]): d.Disposable;
		setImmediate(callback: (...args: any[]) => void, ...args: any[]): d.Disposable;
		setInterval(callback: (...args: any[]) => void, ms: number, ...args: any[]): d.Disposable;
	};

	readonly Connection: {
		createMain(port: RAL.ConnectionPort): Promise<MainConnection>;
		createWorker(port: RAL.ConnectionPort | undefined, world: WorldType, timeout?: number): Promise<WorkerConnection>;
	};

	readonly Worker: {
		getPort(): RAL.ConnectionPort;
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
	export type TextEncoder = _TextEncoder;
	export type TextDecoder = _TextDecoder;
	export type Disposable = d.Disposable;
	export type ConnectionPort = _ConnectionPort;
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
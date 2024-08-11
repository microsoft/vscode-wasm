/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/// <reference path="../../typings/webAssemblyNode.d.ts" preserve="true"/>
import { TextDecoder } from 'util';
import { Worker, parentPort } from 'worker_threads';

import type { MainConnection, WorkerConnection, WorldType } from '../common/componentModel';
import type { Disposable } from '../common/disposable';
import RAL from '../common/ral';

interface RIL extends RAL {
}

const _ril: RIL = Object.freeze<RIL>({
	TextEncoder: Object.freeze({
		create(encoding: BufferEncoding = 'utf-8'): RAL.TextEncoder {
			return {
				encode(input?: string): Uint8Array {
					return Buffer.from(input ?? '', encoding);
				}
			};
		}
	}),
	TextDecoder: Object.freeze({
		create(encoding: string = 'utf-8'): RAL.TextDecoder {
			return new TextDecoder(encoding);
		}
	}),
	console: console,
	timer: Object.freeze({
		setTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]): Disposable {
			const handle = setTimeout(callback, ms, ...args);
			return { dispose: () => clearTimeout(handle)};
		},
		setImmediate(callback: (...args: any[]) => void, ...args: any[]): Disposable {
			const handle = setImmediate(callback, ...args);
			return { dispose: () => clearImmediate(handle) };
		},
		setInterval(callback: (...args: any[]) => void, ms: number, ...args: any[]): Disposable {
			const handle = setInterval(callback, ms, ...args);
			return { dispose: () => clearInterval(handle) };
		}
	}),
	Connection: Object.freeze({
		async createWorker(port: unknown, world: WorldType, timeout?: number): Promise<WorkerConnection> {
			if (port === undefined) {
				port = parentPort;
			}
			if (!(port instanceof MessagePort)) {
				throw new Error(`Expected MessagePort`);
			}
			const connection = await import('./connection.js');
			return new connection.WorkerConnection(port, world, timeout);
		},
		async createMain(port: unknown): Promise<MainConnection> {
			if (!(port instanceof MessagePort) && !(port instanceof Worker)) {
				throw new Error(`Expected MessagePort or Worker`);
			}
			const connection = await import('./connection.js');
			return new connection.MainConnection(port);
		}
	}),
	Worker: Object.freeze({
		getPort(): RAL.ConnectionPort {
			return parentPort!;
		},
		getArgs(): string[] {
			return process.argv.slice(2);
		},
		get exitCode(): number | undefined {
			return process.exitCode;
		},
		set exitCode(value: number | undefined) {
			process.exitCode = value;
		}
	}),
	WebAssembly: Object.freeze({
		compile(bytes: ArrayBufferView | ArrayBuffer): Promise<WebAssembly.Module> {
			return WebAssembly.compile(bytes);
		},
		instantiate(module: WebAssembly.Module, imports: Record<string, any>): Promise<WebAssembly.Instance> {
			return WebAssembly.instantiate(module, imports);
		}
	})
});

function RIL(): RIL {
	return _ril;
}

namespace RIL {
	export function install(): void {
		if (!RAL.isInstalled()) {
			RAL.install(_ril);
		}
	}
}

if (!RAL.isInstalled()) {
	RAL.install(_ril);
}
export default RIL;
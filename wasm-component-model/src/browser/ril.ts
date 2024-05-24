/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import type { Disposable } from '../common/disposable';

import RAL from '../common/ral';
import * as connection from './connection';
import type { MainConnection, WorkerConnection } from './main';


interface RIL extends RAL {
}

// In Browser environments we can only encode / decode utf-8
const encoder: RAL.TextEncoder = new TextEncoder();
const decoder: RAL.TextDecoder = new TextDecoder();

const _ril: RIL = Object.freeze<RIL>({
	TextEncoder: Object.freeze({
		create(_encoding: string = 'utf-8'): RAL.TextEncoder {
			return encoder;
		}
	}),
	TextDecoder: Object.freeze({
		create(_encoding: string = 'utf-8'): RAL.TextDecoder {
			return {
				decode(input?: Uint8Array): string {
					if (input === undefined) {
						return decoder.decode(input);
					} else {
						if (input.buffer instanceof SharedArrayBuffer) {
							return decoder.decode(input.slice(0));
						} else {
							return decoder.decode(input);
						}
					}
				}
			};
		}
	}),
	console: console,
	timer: Object.freeze({
		setTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]): Disposable {
			const handle = setTimeout(callback, ms, ...args);
			return { dispose: () => clearTimeout(handle) };
		},
		setImmediate(callback: (...args: any[]) => void, ...args: any[]): Disposable {
			const handle = setTimeout(callback, 0, ...args);
			return { dispose: () => clearTimeout(handle) };
		},
		setInterval(callback: (...args: any[]) => void, ms: number, ...args: any[]): Disposable {
			const handle =  setInterval(callback, ms, ...args);
			return { dispose: () => clearInterval(handle) };
		},
	}),
	connection: Object.freeze({
		createWorker(port: any): WorkerConnection {
			if (!(port instanceof MessagePort)) {
				throw new Error(`Expected MessagePort`);
			}
			return new connection.WorkerConnection(port);
		},
		createMain(port: any): MainConnection {
			if (!(port instanceof MessagePort) && !(port instanceof Worker)) {
				throw new Error(`Expected MessagePort or Worker`);
			}
			return new connection.MainConnection(port);
		}
	}),
	Worker: Object.freeze({
		getPort(): RAL.ConnectionPort {
			return self;
		},
		getArgs(): string[] {
			return [];
		},
		get exitCode(): number | undefined {
			return 0;
		},
		set exitCode(_value: number | undefined) {
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
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import RAL from '../common/ral';

import { Disposable }  from '../common/disposable';
import * as path from './path';
import { BrowserWasiProcess } from './process';
import { Options } from '../common/api';

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
			return decoder;
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
	clock: Object.freeze({
		realtime(): bigint {
			// Date.now is in ms but clock API is in ns.
			return BigInt(Date.now()) * 1000000n;
		},
		monotonic(): bigint {
			// digits are ms, decimal places are fractions of ms.
			const now = self.performance.now();
			const ms = Math.trunc(now);
			const msf = now - ms;
			// We need to convert everything into nanoseconds
			return BigInt(ms) * 1000000n + BigInt(Math.round(msf * 1000000));
		},
	}),
	crypto: Object.freeze({
		randomGet(size: number): Uint8Array {
			const result = new Uint8Array(size);
			self.crypto.getRandomValues(result);
			return result;
		}
	}),
	path: Object.freeze({
		sep: path.sep,
		dirname(dir: string): string {
			return path.dirname(dir);
		},
		join(...paths: string[]): string {
			return path.join(...paths);
		},
		normalize(value: string): string {
			return path.normalize(value);
		}
	}),
	wasi: Object.freeze({
		create(name: string, bits: ArrayBuffer | WebAssembly.Module, memory: WebAssembly.MemoryDescriptor | WebAssembly.Memory, options?: Options, mapWorkspaceFolders?: boolean): BrowserWasiProcess {
			return new BrowserWasiProcess(name, bits, memory, options, mapWorkspaceFolders);
		}
	})
});


function RIL(): RIL {
	return _ril;
}

namespace RIL {
	export function install(): void {
	}
}

RAL.install(_ril);
export default RIL;
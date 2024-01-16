/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { TextDecoder } from 'util';
import * as path from 'path';
import * as crypto from 'crypto';

import type { Disposable } from 'vscode';

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
	clock: Object.freeze({
		realtime(): bigint {
			// Date.now is in ms but clock API is in ns.
			return BigInt(Date.now()) * 1000000n;
		},
		monotonic(): bigint {
			// hrtime is already in ns.
			return process.hrtime.bigint();
		}
	}),
	crypto: Object.freeze({
		randomGet(size: number): Uint8Array {
			const result = new Uint8Array(size);
			crypto.randomFillSync(result);
			return result;
		}
	}),
	path: path.posix,
	workbench: Object.freeze({
		hasTrash: true
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
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import type { Disposable } from 'vscode';
import { URI, Utils } from 'vscode-uri';

import RAL from '../common/ral';
import * as path from './path';

interface RIL extends RAL {
}

// In Browser environments we can only encode / decode utf-8
const encoder: RAL.TextEncoder = new TextEncoder();
const decoder: RAL.TextDecoder = new TextDecoder();

let _baseUri: URI | undefined;

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
	clock: Object.freeze({
		realtime(): bigint {
			// Date.now is in ms but clock API is in ns.
			return BigInt(Date.now()) * 1000000n;
		},
		monotonic(): bigint {
			// digits are ms, decimal places are fractions of ms.
			const now = self.performance.timeOrigin + self.performance.now();
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
	path: path,
	workbench: Object.freeze({
		hasTrash: false
	}),
	Worker: Object.freeze({
		setBaseUri(uri: RAL.UriComponents): void {
			_baseUri = URI.revive(uri);
		},
		getWorkerUri(location: string): URI {
			if (_baseUri === undefined) {
				throw new Error('Environment.baseUri is not set.');
			}
			if (location.indexOf('/') !== 0) {
				const parts = location.split('/');
				if (parts[0] === 'common') {
					parts.shift();
					parts.unshift('web');
					parts.unshift('dist');
				}
				return Utils.joinPath(_baseUri, ...parts);
			} else {
				return Utils.joinPath(_baseUri, 'dist', 'web', location);
			}
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
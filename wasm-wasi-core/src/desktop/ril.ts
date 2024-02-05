/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { TextDecoder } from 'util';
import * as path from 'path';
import * as crypto from 'crypto';

import type { Disposable } from 'vscode';
import { URI } from 'vscode-uri';

import RAL from '../common/ral';

interface RIL extends RAL {
}

let _baseUri: URI | undefined;

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
				const bundledWorkers = process.env['WASM_WASI_BUNDLED_WORKERS'];
				if (bundledWorkers === '0' || bundledWorkers === 'false') {
					const parts = location.split('/');
					parts[0] = 'desktop';
					return _baseUri.with({ path: path.join(_baseUri.path, 'lib', ...parts)});
				} else {
					const basename = path.basename(location);
					return _baseUri.with( { path: path.join(_baseUri.path, 'dist', 'desktop', basename)});
				}
			} else {
				return _baseUri.with({ path: path.join(_baseUri.path, 'dist', 'desktop', location)});
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
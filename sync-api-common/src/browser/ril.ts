/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import RAL from '../common/ral';

import type { Disposable }  from '../common/disposable';
import type { RequestType } from '../common/connection';
import { ClientConnection, ServiceConnection } from './main';

interface RIL extends RAL {
}

// In Browser environments we can only encode / decode utf-8
const encoder: RAL.TextEncoder = new TextEncoder();
const decoder: RAL.TextDecoder = new TextDecoder();

const _ril: RIL = Object.freeze<RIL>({
	TextEncoder: Object.freeze({
		create(encoding: string = 'utf-8'): RAL.TextEncoder {
			return encoder;
		}
	}),
	TextDecoder: Object.freeze({
		create(encoding: string = 'utf-8'): RAL.TextDecoder {
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
	$testing: Object.freeze({
		ClientConnection: Object.freeze({
			create<Requests extends RequestType | undefined = undefined>(port?: MessagePort | Worker) {
				const p = port ?? self;
				if (p === undefined || p === null) {
					return undefined;
				}
				return new ClientConnection<Requests>(p);
			}
		}),
		ServiceConnection: Object.freeze({
			create<RequestHandlers extends RequestType | undefined = undefined>(port?: MessagePort | Worker) {
				const p = port ?? self;
				if (p === undefined || p === null) {
					return undefined;
				}
				return new ServiceConnection<RequestHandlers>(p);
			}
		}),
		get workerTest() {
			return '';
		}
	})
});


function RIL(): RIL {
	return _ril;
}

namespace RIL {
	export function install(): void {
		RAL.install(_ril);
	}
}

export default RIL;
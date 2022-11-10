/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import RAL from '../common/ral';

import type { Disposable }  from '../common/disposable';
import type { Params, RequestType } from '../common/connection';
import { ClientConnection, ServiceConnection } from './connection';

interface RIL extends RAL {
}

// In Browser environments we can only encode / decode utf-8
const encoder: RAL.TextEncoder = new TextEncoder();
const decoder: RAL.TextDecoder = new TextDecoder();

class TestServiceConnection<RequestHandlers extends RequestType | undefined = undefined, ReadyParams extends Params | undefined = undefined> extends ServiceConnection<RequestHandlers, ReadyParams> {
	private readonly  worker: Worker;
	constructor(script: string, testCase?: string) {
		const url = testCase !== undefined ? `${script}?toRun=${testCase}` : script;
		const worker = new Worker(url);
		super(worker);
		this.worker = worker;
	}
	public terminate(): Promise<number> {
		this.worker.terminate();
		return Promise.resolve(0);
	}
}

const _ril: RIL = Object.freeze<RIL>({
	type: RAL.Type.Browser,
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
	$testing: Object.freeze({
		ClientConnection: Object.freeze({
			create<Requests extends RequestType | undefined = undefined, ReadyParams extends Params | undefined = undefined>() {
				return new ClientConnection<Requests, ReadyParams>(self);
			}
		}),
		ServiceConnection: Object.freeze({
			create<RequestHandlers extends RequestType | undefined = undefined, ReadyParams extends Params | undefined = undefined>(script: string, testCase?: string) {
				return new TestServiceConnection<RequestHandlers, ReadyParams>(script, testCase);
			}
		}),
		get testCase() {
			const location = self.location;
			const search = location.search;
			return search.substring('?toRun='.length);
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
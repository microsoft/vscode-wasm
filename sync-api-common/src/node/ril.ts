/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { TextDecoder } from 'util';
import { parentPort, Worker } from 'worker_threads';

import RAL from '../common/ral';
import type { Disposable } from '../common/disposable';
import type { Params, RequestType } from '../common/connection';
import { ClientConnection, ServiceConnection } from './connection';

interface RIL extends RAL {
}

class TestServiceConnection<RequestHandlers extends RequestType | undefined = undefined, ReadyParams extends Params | undefined = undefined> extends ServiceConnection<RequestHandlers, ReadyParams> {
	private readonly  worker: Worker;
	constructor(script: string, testCase?: string) {
		const worker = new Worker(script, testCase !== undefined ? { argv: [testCase] } : undefined);
		super(worker);
		this.worker = worker;
	}
	public terminate(): Promise<number> {
		return this.worker.terminate();
	}
}

const _ril: RIL = Object.freeze<RIL>({
	type: RAL.Type.Node,
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
	$testing: Object.freeze({
		ClientConnection: Object.freeze({
			create<Requests extends RequestType | undefined = undefined, ReadyParams extends Params | undefined = undefined>() {
				if (!parentPort) {
					throw new Error(`No parent port defined. Shouldn't happen in test setup`);
				}
				return new ClientConnection<Requests, ReadyParams>(parentPort);
			}
		}),
		ServiceConnection: Object.freeze({
			create<RequestHandlers extends RequestType | undefined = undefined, ReadyParams extends Params | undefined = undefined>(script: string, testCase?: string) {
				return new TestServiceConnection<RequestHandlers, ReadyParams>(script, testCase);
			}
		}),
		get testCase() {
			return process.argv[2];
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
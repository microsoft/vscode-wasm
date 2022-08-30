/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Disposable } from './disposable';
import type { RequestType, ClientConnection, ServiceConnection } from './connection';

interface _TextEncoder {
	encode(input?: string): Uint8Array;
}

interface _TextDecoder {
	decode(input?: Uint8Array): string;
}

interface _TestServiceConnection<RequestHandlers extends RequestType | undefined = undefined> extends ServiceConnection<RequestHandlers> {
	terminate(): Promise<number>;
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
		setTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]): Disposable;
		setImmediate(callback: (...args: any[]) => void, ...args: any[]): Disposable;
		setInterval(callback: (...args: any[]) => void, ms: number, ...args: any[]): Disposable;
	};

	readonly $testing: {
		readonly ClientConnection: {
			create<Requests extends RequestType | undefined = undefined>(): ClientConnection<Requests>;
		};
		readonly ServiceConnection: {
			create<RequestHandlers extends RequestType | undefined = undefined>(testCase: string): _TestServiceConnection<RequestHandlers>;
		};
		readonly testCase: string;
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
	export function install(ral: RAL): void {
		if (ral === undefined) {
			throw new Error(`No runtime abstraction layer provided`);
		}
		_ral = ral;
	}
}

export default RAL;
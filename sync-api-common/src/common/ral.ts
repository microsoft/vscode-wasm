/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Disposable } from './disposable';
import type { RequestType, ClientConnection, ServiceConnection, Params } from './connection';

interface _TextEncoder {
	encode(input?: string): Uint8Array;
}

interface _TextDecoder {
	decode(input?: Uint8Array): string;
}

interface _TestServiceConnection<RequestHandlers extends RequestType | undefined = undefined, ReadyParams extends Params | undefined = undefined> extends ServiceConnection<RequestHandlers, ReadyParams> {
	terminate(): Promise<number>;
}

export enum _RALType {
	Browser = 1,
	Node = 2
}

interface RAL {

	readonly type: _RALType;

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
			create<Requests extends RequestType | undefined = undefined, ReadyParams extends Params | undefined = undefined>(): ClientConnection<Requests, ReadyParams>;
		};
		readonly ServiceConnection: {
			create<RequestHandlers extends RequestType | undefined = undefined, ReadyParams extends Params | undefined = undefined>(script: string, testCase?: string): _TestServiceConnection<RequestHandlers, ReadyParams>;
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
	export const Type = _RALType;
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
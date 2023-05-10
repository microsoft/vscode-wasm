/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { Disposable } from 'vscode';

interface _TextEncoder {
	encode(input?: string): Uint8Array;
}

interface _TextDecoder {
	decode(input?: Uint8Array): string;
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

	readonly clock: {
		/**
		 * Real time (since epoch) in nanoseconds
		 */
		realtime(): bigint;

		/**
		 * Monotonic time in nanoseconds.
		 */
		monotonic(): bigint;
	};

	readonly crypto: {
		randomGet(size: number): Uint8Array;
	};

	readonly path: {
		readonly sep: string;
		basename(path: string): string;
		dirname(path: string): string;
		join(...paths: string[]): string;
		normalize(path: string): string;
		isAbsolute(path: string): boolean;
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
	export function isInstalled(): boolean {
		return _ral !== undefined;
	}
}

export default RAL;
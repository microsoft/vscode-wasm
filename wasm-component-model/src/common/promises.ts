/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export interface CapturedPromise<T> {
	promise: Promise<T>;
	resolve: (value: T | PromiseLike<T>) => void;
	reject: (reason?: any) => void;
}

export namespace CapturedPromise {
	export function create<T>(): CapturedPromise<T> {
		let _resolve!: (value: T | PromiseLike<T>) => void;
		let _reject!: (reason?: any) => void;
		const promise: Promise<T> = new Promise<T>((resolve, reject) => {
			_resolve = resolve;
			_reject = reject;
		});
		return {
			promise, resolve: _resolve, reject: _reject
		};
	}
}
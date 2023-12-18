/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Alignment, ptr, size } from '@vscode/wasm-component-model';

interface Exports {
	malloc(size: number): number;
	free(ptr: number): void;
	aligned_alloc(align: number, size: number): number;
}

let _malloc: ((size: number) => number) | undefined;
let _free: ((ptr: number) => void) | undefined;
let _aligned_alloc: ((align: number, size: number) => number) | undefined;

export function initialize(module: WebAssembly.Module, memory: WebAssembly.Memory): void {
	if (_malloc !== undefined || _free !== undefined) {
		throw new Error('Memory is already initialized');

	}
	const instance = new WebAssembly.Instance(module, {
		env: {
			memory
		},
		wasi_snapshot_preview1: {
			sched_yield: () => 0
		}
	});
	const exports = instance.exports as unknown as Exports;
	_malloc = exports.malloc;
	_free = exports.free;
	_aligned_alloc = exports.aligned_alloc;
}

export function malloc(size: size): ptr {
	if (!_malloc) {
		throw new Error('Memory is not initialized');
	}

	return _malloc(size);
}

export function free(ptr: ptr): void {
	if (!_free) {
		throw new Error('Memory is not initialized');
	}
	_free(ptr);
}

export function alloc(align: Alignment, size: size): ptr {
	if (!_aligned_alloc) {
		throw new Error('Memory is not initialized');
	}
	return _aligned_alloc(align, size);
}
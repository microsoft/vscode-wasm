/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Alignment, Memory, ptr } from '@vscode/wasm-component-model';

export class LinearMemory implements Memory {

	private _buffer: SharedArrayBuffer;
	private _raw: Uint8Array;
	private _view: DataView;

	private _index: number;

	constructor(initialSize?: number);
	constructor(buffer: SharedArrayBuffer, ptr: number);
	constructor(arg0?: number | SharedArrayBuffer, arg1?: ptr) {
		if (arg0 === undefined || typeof arg0 === 'number') {
			this._buffer = new SharedArrayBuffer(arg0 || 65536);
		} else {
			this._buffer = arg0;
			this._index = arg1 || 0;
		}
		this._raw = new Uint8Array(this._buffer);
		this._view = new DataView(this._buffer);
		this._index = 0;
	}

	public get buffer(): SharedArrayBuffer {
		return this._buffer;
	}

	public get view(): DataView {
		return this._view;
	}

	public get raw(): Uint8Array {
		return this._raw;
	}

	public get index(): number {
		return this._index;
	}

	public alloc(alignment: Alignment, size: number): ptr {
		this._index = Math.ceil(this._index / alignment) * alignment;
		if (this._index + size > this._buffer.byteLength) {
			const newBuffer = new SharedArrayBuffer(this._buffer.byteLength * 2);
			new Uint8Array(newBuffer).set(this._raw);
			this._buffer = newBuffer;
			this._raw = new Uint8Array(this._buffer);
			this._view = new DataView(this._buffer);
		}
		const ptr = this._index;
		this._index += size;
		return ptr;
	}

	public realloc(ptr: ptr, oldSize: number, align: Alignment, newSize: number): ptr {
		if (newSize <= oldSize) {
			return ptr;
		}
		const newPtr = this.alloc(align, newSize);
		this._raw.copyWithin(newPtr, ptr, ptr + oldSize);
		return newPtr;
	}
}

export class ReadonlyMemory implements Memory {

	public readonly buffer: ArrayBuffer;

	private _raw: Uint8Array | undefined;
	private _view: DataView | undefined;

	constructor(buffer: ArrayBuffer) {
		this.buffer = buffer;
	}

	public get raw(): Uint8Array {
		if (!this._raw) {
			this._raw = new Uint8Array(this.buffer);
		}
		return this._raw;
	}

	public get view(): DataView {
		if (!this._view) {
			this._view = new DataView(this.buffer);
		}
		return this._view;
	}

	public alloc(): ptr {
		throw new Error('Memory is readonly');
	}

	public realloc(): ptr {
		throw new Error('Memory is readonly');
	}
}
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export class Memory {

	private readonly _buffer: ArrayBuffer;

	constructor(byteLength: number = 65536, shared: boolean = false) {
		this._buffer = shared ? new SharedArrayBuffer(byteLength) : new ArrayBuffer(byteLength);
	}

	get buffer(): ArrayBuffer {
		return this._buffer;
	}

	public grow(_delta: number): number {
		throw new Error('Memory.grow not implemented');
	}
}
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ptr } from '../baseTypes';
import RAL from '../ral';
import { Errno, WasiError } from '../wasi';

export namespace wasi {
	export type Uint32 = { readonly $ptr: ptr; value: number };
	export type Uint32Array = { readonly $ptr: ptr;  size: number; get(index: number): number; set(index: number, value: number): void };

	export type Uint64 = { readonly $ptr: ptr; value: bigint };

	export type String = { readonly $ptr: ptr; byteLength: number };
	export type StringBuffer = { readonly $ptr: ptr; get value(): string };

	export type Bytes = { readonly $ptr: ptr; readonly byteLength: number };

	export type StructArray<T> = { readonly $ptr: ptr;  size: number; get(index: number): T };
}

export class Memory {

	private readonly raw: ArrayBuffer;
	private readonly dataView: DataView;
	private index: number;
	private readonly encoder: RAL.TextEncoder;
	private readonly decoder: RAL.TextDecoder;

	constructor(byteLength: number = 65536, shared: boolean = false) {
		this.raw = shared ? new SharedArrayBuffer(byteLength) : new ArrayBuffer(byteLength);
		this.dataView = new DataView(this.raw);
		this.index = 0;
		this.encoder = RAL().TextEncoder.create();
		this.decoder = RAL().TextDecoder.create();
	}

	get buffer(): ArrayBuffer {
		return this.raw;
	}

	public grow(_delta: number): number {
		throw new WasiError(Errno.nosys);
	}

	public getRaw(): ArrayBuffer {
		return this.raw;
	}

	public alloc(bytes: number): wasi.Bytes {
		const result = this.index;
		this.index += bytes;
		return { $ptr: result, byteLength: bytes};
	}

	public allocStruct<T>(info: { size: number; create: (memory: DataView, ptr: ptr) => T }): T {
		const ptr: ptr = this.allocRaw(info.size);
		return info.create(this.dataView, ptr);
	}

	public allocStructArray<T>(size: number, info: { size: number; create: (memory: DataView, ptr: ptr) => T }): wasi.StructArray<T> {
		const ptr: ptr = this.allocRaw(size * info.size);
		const structs: T[] = new Array(size);
		for (let i = 0; i < size; i++) {
			const struct = info.create(this.dataView, ptr + i * info.size);
			structs[i] = struct;
		}
		return {
			get $ptr(): ptr { return ptr; },
			get size(): number { return size; },
			get(index: number): T { return structs[index]; }
		};
	}

	public readStruct<T>(ptr: ptr<T>, info: { size: number; create: (memory: DataView, ptr: ptr) => T }): T {
		return info.create(this.dataView, ptr);
	}

	public allocUint32(value?: number): wasi.Uint32 {
		const ptr = this.allocRaw(Uint32Array.BYTES_PER_ELEMENT);
		value !== undefined && this.dataView.setUint32(ptr, value, true);
		const view = this.dataView;
		return {
			get $ptr(): ptr { return ptr; },
			get value(): number { return view.getUint32(ptr, true ); },
			set value(value: number) { view.setUint32(ptr, value, true); }
		};
	}

	public allocUint32Array(size: number): wasi.Uint32Array {
		const ptr = this.allocRaw(Uint32Array.BYTES_PER_ELEMENT * size);
		const view = this.dataView;
		return {
			get $ptr(): ptr { return ptr; },
			get size(): number { return size; },
			get(index: number): number { return view.getUint32(ptr + index * Uint32Array.BYTES_PER_ELEMENT, true); },
			set(index: number, value: number) { view.setUint32(ptr + index * Uint32Array.BYTES_PER_ELEMENT, value, true); }
		};
	}

	public allocBigUint64(value?: bigint): wasi.Uint64 {
		const ptr = this.allocRaw(BigUint64Array.BYTES_PER_ELEMENT);
		value !== undefined && this.dataView.setBigUint64(ptr, value, true);
		const view = this.dataView;
		return {
			get $ptr(): ptr { return ptr; },
			get value(): bigint { return view.getBigUint64(ptr, true ); },
			set value(value: bigint) { view.setBigUint64(ptr, value, true); }
		};
	}

	public allocString(value: string): wasi.String {
		const bytes = this.encoder.encode(value);
		const ptr = this.allocRaw(bytes.length);
		(new Uint8Array(this.raw)).set(bytes, ptr);
		return {
			get $ptr(): ptr { return ptr; },
			get byteLength(): number { return bytes.length; }
		};
	}

	public allocStringBuffer(length: number): wasi.StringBuffer {
		const ptr = this.allocRaw(length);
		const raw = this.raw;
		const that = this;
		return {
			get $ptr(): ptr { return ptr; },
			get value(): string {
				return that.decoder.decode((new Uint8Array(raw, ptr, length)).slice(0));
			}
		};
	}

	public readString(ptr: ptr): string {
		const length = this.getStringLength(ptr);
		if (length === -1) {
			throw new Error(`No null terminate character found`);
		}
		return this.decoder.decode((new Uint8Array(this.raw, ptr, length)).slice(0));
	}

	public allocBytes(bytes: Uint8Array): wasi.Bytes {
		const ptr = this.allocRaw(bytes.length);
		(new Uint8Array(this.raw)).set(bytes, ptr);
		return {
			get $ptr(): ptr { return ptr; },
			get byteLength(): number { return bytes.length; }
		};
	}

	public readBytes(ptr: ptr, length: number): Uint8Array {
		return new Uint8Array(this.raw, ptr, length);
	}

	private allocRaw(bytes: number): ptr {
		const result = this.index;
		this.index += bytes;
		return result;
	}

	private getStringLength(start: ptr): number {
		const bytes = new Uint8Array(this.raw);
		let index = start;
		while (index < bytes.byteLength) {
			if (bytes[index] === 0) {
				return index - start;
			}
			index++;
		}
		return -1;
	}
}
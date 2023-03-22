/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RAL from '../ral';

import assert from 'assert';

import { ptr } from '../baseTypes';
import { WorkerReadyMessage } from '../connection';
import { WasiHost } from '../host';
import { Errno, WasiError } from '../wasi';

debugger;
const hostConnection = RAL().$testing.HostConnection.create();
const wasi = WasiHost.create(hostConnection);
const ready: WorkerReadyMessage = { method: 'workerReady' };
hostConnection.postMessage(ready);

const decoder = RAL().TextDecoder.create();
const encoder = RAL().TextEncoder.create();

namespace wasi {
	export type Uint32 = { readonly $ptr: ptr; value: number };
	export type Uint32Array = { readonly $ptr: ptr;  size: number; get(index: number): number; set(index: number, value: number): void };

	export type Uint64 = { readonly $ptr: ptr; value: bigint };

	export type String = { readonly $ptr: ptr; byteLength: number };
	export type StringBuffer = { readonly $ptr: ptr; get value(): string };

	export type Bytes = { readonly $ptr: ptr; readonly byteLength: number };

	export type StructArray<T> = { readonly $ptr: ptr;  size: number; get(index: number): T };
}

class Memory {

	private readonly raw: ArrayBuffer;
	private readonly dataView: DataView;
	private index: number;

	constructor(byteLength: number = 65536, shared: boolean = false) {
		this.raw = shared ? new SharedArrayBuffer(byteLength) : new ArrayBuffer(byteLength);
		this.dataView = new DataView(this.raw);
		this.index = 0;
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

	public allocStruct<T>(info: { size: number; create: (ptr: ptr, memory: DataView) => T }): T {
		const ptr: ptr = this.allocRaw(info.size);
		return info.create(ptr, this.dataView);
	}

	public allocStructArray<T>(size: number, info: { size: number; create: (ptr: ptr, memory: DataView) => T }): wasi.StructArray<T> {
		const ptr: ptr = this.allocRaw(size * info.size);
		const structs: T[] = new Array(size);
		for (let i = 0; i < size; i++) {
			const struct = info.create(ptr + i * info.size, this.dataView);
			structs[i] = struct;
		}
		return {
			get $ptr(): ptr { return ptr; },
			get size(): number { return size; },
			get(index: number): T { return structs[index]; }
		};
	}

	public readStruct<T>(ptr: ptr<T>, info: { size: number; create: (ptr: ptr, memory: DataView) => T }): T {
		return info.create(ptr, this.dataView);
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
		const bytes = encoder.encode(value);
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
		return {
			get $ptr(): ptr { return ptr; },
			get value(): string {
				return decoder.decode(new Uint8Array(raw, ptr, length));
			}
		};
	}

	public readString(ptr: ptr): string {
		const length = this.getStringLength(ptr);
		if (length === -1) {
			throw new Error(`No null terminate character found`);
		}
		return decoder.decode(new Uint8Array(this.raw, ptr, length));
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

// namespace Timestamp {
// 	export function inNanoseconds(time: Date): bigint {
// 		return BigInt(time.getTime()) * 1000000n;
// 	}
// }

suite('Simple test', () => {
	test('argv', () => {
		const memory = new Memory(undefined, RAL().$testing.sharedMemory);
		const args = ['arg1', 'arg22', 'arg333'];
		wasi.initialize(memory);

		const argvCount = memory.allocUint32();
		const argvBufSize = memory.allocUint32();
		let errno = wasi.args_sizes_get(argvCount.$ptr, argvBufSize.$ptr);
		assert.strictEqual(errno, Errno.success);

		const expectedArgs = ['testApp'].concat(...args);
		assert.strictEqual(argvCount.value, expectedArgs.length);

		const expectedBufferLength = expectedArgs.reduce<number>((previous, value) => {
			return previous + encoder.encode(value).length + 1;
		}, 0);
		assert.strictEqual(argvBufSize.value, expectedBufferLength);

		const argv = memory.allocUint32Array(argvCount.value);
		const argvBuf = memory.alloc(argvBufSize.value);

		errno = wasi.args_get(argv.$ptr, argvBuf.$ptr);
		assert.strictEqual(errno, Errno.success);

		for (let i = 0; i < argvCount.value; i++) {
			const valueStartOffset = argv.get(i);
			const arg = memory.readString(valueStartOffset);
			assert.strictEqual(arg, expectedArgs[i]);
		}
	});
});
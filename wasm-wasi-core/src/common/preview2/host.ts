/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import wasi from '@vscode/wasi';
import { Options, Memory, Alignment, ptr, ComponentModelTypeVisitor, FunctionType, Context, wstring, FlagsType, u8, u16, u32, TupleType, ListType, WasmTypeKind, InterfaceType } from '@vscode/wasm-component-model';
import { Header } from './connection';
import RAL from '../ral';
import { LinearMemory } from './memory';

export { Options };

class ParamAndHeapTransfer implements ComponentModelTypeVisitor {

	private readonly signature: FunctionType<any>;
	private readonly params: (number | bigint)[];
	private readonly paramMemory: LinearMemory;
	private readonly heapMemory: LinearMemory;
	private readonly context: Context;

	private index: number;

	constructor(signature: FunctionType<any>, params: (number | bigint)[], paramMemory: LinearMemory, heapMemory: LinearMemory, context: Context) {
		this.signature = signature;
		this.paramMemory = paramMemory;
		this.heapMemory = heapMemory;
		this.context = context;
		this.index = 0;
		const flatTypes = this.signature.paramFlatTypes;
		if (flatTypes.length > FunctionType.MAX_FLAT_PARAMS) {
			const ptr = params[0] as number;
			this.params = [];
			this.signature.paramTupleType.loadFlat(this.params, this.context.memory, ptr, this.context.options);
		} else {
			this.params = params;
		}

	}

	public visitU8(): void {
		this.storeNumber(this.asNumber(this.params[this.index++]));
	}

	public visitU16(): void {
		this.storeNumber(this.asNumber(this.params[this.index++]));
	}

	public visitU32(): void {
		this.storeNumber(this.asNumber(this.params[this.index++]));
	}

	public visitU64(): void {
		this.storeBigInt(this.asBigInt(this.params[this.index++]));
	}

	public visitS8(): void {
		this.storeNumber(this.asNumber(this.params[this.index++]));
	}

	public visitS16(): void {
		this.storeNumber(this.asNumber(this.params[this.index++]));
	}

	public visitS32(): void {
		this.storeNumber(this.asNumber(this.params[this.index++]));
	}

	public visitS64?(): void {
		this.storeBigInt(this.asBigInt(this.params[this.index++]));
	}

	public visitFloat32(): void {
		this.storeFloat32(this.asNumber(this.params[this.index++]));
	}

	public visitFloat64(): void {
		this.storeFloat64(this.asNumber(this.params[this.index++]));
	}

	public visitBool(): void {
		this.storeNumber(this.asNumber(this.params[this.index++]));
	}

	public visitString(): void {
		const options = this.context.options;
		const wasmPtr = this.asNumber(this.params[this.index++]);
		const codeUnits = this.asNumber(this.params[this.index++]);
		const bytes = wstring.byteLength(codeUnits, options);
		const ptr = this.heapMemory.alloc(wstring.dataAlignment(options), bytes);
		this.heapMemory.raw.set(this.context.memory.raw.subarray(wasmPtr, wasmPtr + bytes), ptr);
		this.storeNumber(ptr);
		this.storeNumber(codeUnits);
	}

	public visitBorrow(): void {
		this.storeNumber(this.asNumber(this.params[this.index++]));
	}

	public visitOwn(): void {
		this.storeNumber(this.asNumber(this.params[this.index++]));
	}

	public visitResource(): void {
		this.storeNumber(this.asNumber(this.params[this.index++]));
	}

	public visitEnum(): void {
		this.storeNumber(this.asNumber(this.params[this.index++]));
	}

	public visitFlags(type: FlagsType<any>): void {
		if (type.type === u8 || type.type === u16 || type.type === u32) {
			this.storeNumber(this.asNumber(this.params[this.index++]));
		} else if (type.type instanceof TupleType) {
			for (const field of type.type.fields) {
				ComponentModelTypeVisitor.visit(field.type, this);
			}
		}
	}

	visitList(type: ListType<any>): boolean {
		const wasmPtr = this.asNumber(this.params[this.index++]);
		const length = this.asNumber(this.params[this.index++]);
		const bytes = length * type.elementType.size;
		const ptr = this.heapMemory.alloc(type.elementType.alignment, bytes);
		this.heapMemory.raw.set(this.context.memory.raw.subarray(wasmPtr, wasmPtr + bytes), ptr);
		this.storeNumber(ptr);
		this.storeNumber(length);
		return false;
	}

	private storeNumber(value: number) {
		this.paramMemory.view.setInt32(this.paramMemory.alloc(Alignment.word, 4), value);
	}

	private storeFloat32(value: number) {
		this.paramMemory.view.setFloat32(this.paramMemory.alloc(Alignment.word, 4), value);
	}

	private storeFloat64(value: number) {
		this.paramMemory.view.setFloat64(this.paramMemory.alloc(Alignment.word, 4), value);
	}

	private storeBigInt(value: bigint) {
		this.paramMemory.view.setBigInt64(this.paramMemory.alloc(Alignment.doubleWord, 8), value);
	}

	public run(): void {
		this.index = 0;
		ComponentModelTypeVisitor.visit(this.signature.paramTupleType, this);
	}

	private asNumber(param: number | bigint): number {
		if (typeof param !== 'number') {
			throw new Error('Expected number');
		}
		return param;
	}

	private asBigInt(param: number | bigint): bigint {
		if (typeof param !== 'bigint') {
			throw new Error('Expected bigint');
		}
		return param;
	}
}

class ParamOnlyTransfer {

	private readonly signature: FunctionType<any>;
	private readonly params: (number | bigint)[];
	private readonly paramMemory: LinearMemory;
	private readonly context: Context;

	constructor(signature: FunctionType<any>, params: (number | bigint)[], paramMemory: LinearMemory, context: Context) {
		this.signature = signature;
		this.paramMemory = paramMemory;
		this.context = context;
		const flatTypes = this.signature.paramFlatTypes;
		if (flatTypes.length > FunctionType.MAX_FLAT_PARAMS) {
			const ptr = params[0] as number;
			this.params = [];
			this.signature.paramTupleType.loadFlat(this.params, this.context.memory, ptr, this.context.options);
		} else {
			this.params = params;
		}
	}

	public run(): void {
		const flatTypes = this.signature.paramFlatTypes;
		let params: (number | bigint)[] = [];
		if (flatTypes.length > FunctionType.MAX_FLAT_PARAMS) {
			const ptr = this.params[0] as number;
			this.signature.paramTupleType.loadFlat(params, this.context.memory, ptr, this.context.options);
		} else {
			params = this.params;
		}
		for (const [index, param] of params.entries()) {
			const flatType = flatTypes[index];
			switch (flatType) {
				case WasmTypeKind.i32:
					this.paramMemory.view.setInt32(this.paramMemory.alloc(Alignment.word, 4), param as number);
					break;
				case WasmTypeKind.f32:
					this.paramMemory.view.setFloat32(this.paramMemory.alloc(Alignment.word, 4), param as number);
					break;
				case WasmTypeKind.f64:
					this.paramMemory.view.setFloat64(this.paramMemory.alloc(Alignment.word, 4), param as number);
					break;
				case WasmTypeKind.i64:
					this.paramMemory.view.setBigInt64(this.paramMemory.alloc(Alignment.doubleWord, 8), param as bigint);
					break;
			}
		}
	}
}

export abstract class AbstractHostConnection {

	private readonly encoder: RAL.TextEncoder;

	constructor() {
		this.encoder = RAL().TextEncoder.create('utf-8');
	}

	public call(iface: InterfaceType, signature: FunctionType<any>, params: (number | bigint)[], context: Context): (number | bigint)[] {
		const transferMemory = new LinearMemory();
		transferMemory.alloc(Alignment.halfWord, Header.size);

		Header.setLock(transferMemory.view, 0);

		const ifaceName = this.encoder.encode(iface.witName);
		const ifacePtr = transferMemory.alloc(Alignment.byte, ifaceName.byteLength);
		transferMemory.raw.set(ifaceName, ifacePtr);
		Header.setIface(transferMemory.view, ifacePtr, ifaceName.byteLength);

		const funcName = this.encoder.encode(signature.witName);
		const funcPtr = transferMemory.alloc(Alignment.byte, funcName.byteLength);
		transferMemory.raw.set(funcName, funcPtr);
		Header.setFunc(transferMemory.view, ifacePtr, funcName.byteLength);
		const params_ptr = transferMemory.index;
		let dataMemory: SharedArrayBuffer;
		if (context.memory.buffer instanceof SharedArrayBuffer) {
			const transfer = new ParamOnlyTransfer(signature, params, transferMemory, context);
			transfer.run();
			Header.setParams(transferMemory.view, params_ptr, transferMemory.index - params_ptr);
			dataMemory = context.memory.buffer;
		} else {
			const memory = new LinearMemory();
			const transfer = new ParamAndHeapTransfer(signature, params, transferMemory, memory, context);
			transfer.run();
			dataMemory = memory.buffer;
		}
		Header.setReturn(transferMemory.view, transferMemory.index, 0);
		this.doCall(transferMemory.buffer, dataMemory);
		return[];
	}

	protected abstract doCall(transferMemory: SharedArrayBuffer, dataMemory: SharedArrayBuffer): void;
}

declare namespace WebAssembly {

	interface Global {
		value: any;
		valueOf(): any;
	}
	interface Table {
		readonly length: number;
		get(index: number): any;
		grow(delta: number, value?: any): number;
		set(index: number, value?: any): void;
	}
	interface Memory {
		readonly buffer: ArrayBuffer;
		grow(delta: number): number;
	}
	type ExportValue = Function | Global | Memory | Table;

	interface Instance {
		readonly exports: Record<string, ExportValue>;
	}

	var Instance: {
    	prototype: Instance;
    	new(): Instance;
	};
}

export interface WasiHost extends wasi._.WasmInterface {
	initialize: (instOrMemory: WebAssembly.Instance | WebAssembly.Memory) => void;
	memory: () => ArrayBuffer;
}

export namespace WasiHost {
	export function create(connection: AbstractHostConnection, options: Options): WasiHost {

		let $instance: WebAssembly.Instance | undefined;
		let $memory: WebAssembly.Memory | undefined;

		function memory(): ReadonlyMemory {
			if ($memory !== undefined) {
				return new ReadonlyMemory($memory.buffer);
			}
			if ($instance === undefined || $instance.exports.memory === undefined) {
				throw new Error(`WASI layer is not initialized. Missing WebAssembly instance or memory module.`);
			}
			return new ReadonlyMemory(($instance.exports.memory as WebAssembly.Memory).buffer);
		}

		const result = Object.create(null);
		result.initialize = (instOrMemory: WebAssembly.Instance | WebAssembly.Memory): void => {
			if (instOrMemory instanceof WebAssembly.Instance) {
				$instance = instOrMemory;
				$memory = undefined;
			} else {
				$instance = undefined;
				$memory = instOrMemory;
			}
		};

		for (const pkg of wasi._.packages.values()) {
			for (const iface of pkg.interfaces.values()) {
				const wasm = Object.create(null);
				for (const func of iface.functions.values()) {
					wasm[func.witName] = (...params: (number | bigint)[]) => {
						connection.call(iface, func, params, { memory: memory(), options });
					};
				}
				result[iface.id] = wasm;
			}
		}
		return result;
	}
}
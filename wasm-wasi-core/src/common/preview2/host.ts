/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import wasi from '@vscode/wasi';
import {
	Options, Alignment, FunctionType, WasmContext, InterfaceType, ResourceManagers
} from '@vscode/wasm-component-model';

import RAL from '../ral';
import { Header, ParamAndDataTransfer, ParamTransfer } from './connection';
import { LinearMemory, ReadonlyMemory } from './memory';

export { Options };

export abstract class AbstractHostConnection {

	private readonly encoder: RAL.TextEncoder;

	constructor() {
		this.encoder = RAL().TextEncoder.create('utf-8');
	}

	public call(iface: InterfaceType, signature: FunctionType<any>, params: (number | bigint)[], context: WasmContext): number | bigint | void {
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
		const memory = context.getMemory();
		if (memory.buffer instanceof SharedArrayBuffer) {
			const transfer = new ParamTransfer(signature, params, transferMemory, context);
			transfer.run();
			Header.setParams(transferMemory.view, params_ptr, transferMemory.index - params_ptr);
			dataMemory = memory.buffer;
		} else {
			const memory = new LinearMemory();
			const transfer = new ParamAndDataTransfer(signature, params, transferMemory, memory, context);
			transfer.run();
			dataMemory = memory.buffer;
		}
		Header.setReturn(transferMemory.view, transferMemory.index, 0);
		this.doCall(transferMemory.buffer, dataMemory);
		return;
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

		let $wasmContext: WasmContext | undefined;

		function wasmContext(): WasmContext {
			if ($wasmContext === undefined) {
				throw new Error(`WASI layer is not initialized. Missing WebAssembly instance or memory module.`);
			}
			return $wasmContext;
		}

		const result = Object.create(null);
		result.initialize = (instOrMemory: WebAssembly.Instance | WebAssembly.Memory): void => {
			let instance: WebAssembly.Instance | undefined;
			let memory: WebAssembly.Memory;

			if (instOrMemory instanceof WebAssembly.Instance) {
				instance = instOrMemory;
				memory = instance.exports.memory as WebAssembly.Memory;
			} else {
				instance = undefined;
				memory = instOrMemory;
			}

			if (instance !== undefined) {
				let buffer = memory.buffer;
				let wasiMemory = new ReadonlyMemory(buffer);
				$wasmContext = {
					getMemory: () => {
						const current = instance!.exports.memory as WebAssembly.Memory;
						if (buffer !== current.buffer || buffer.byteLength !== current.buffer.byteLength) {
							buffer = current.buffer;
							wasiMemory = new ReadonlyMemory(buffer);
						}
						return wasiMemory;
					},
					options: options,
					managers: ResourceManagers.createDefault()
				};
			} else {
				const wasiMemory = new ReadonlyMemory(memory.buffer);
				$wasmContext = {
					getMemory: () => {
						return wasiMemory;
					},
					options: options,
					managers: ResourceManagers.createDefault()
				};
			}
		};

		for (const pkg of wasi._.packages.values()) {
			for (const iface of pkg.interfaces.values()) {
				const wasm = Object.create(null);
				for (const func of iface.functions.values()) {
					wasm[func.witName] = (...params: (number | bigint)[]) => {
						connection.call(iface, func, params, wasmContext());
					};
				}
				result[iface.id] = wasm;
			}
		}
		return result;
	}
}
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import wasi from '@vscode/wasi';
import {
	Options, Alignment, FunctionType, Context, InterfaceType
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

	public call(iface: InterfaceType, signature: FunctionType<any>, params: (number | bigint)[], context: Context): number | bigint | void {
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
			const transfer = new ParamTransfer(signature, params, transferMemory, context);
			transfer.run();
			Header.setParams(transferMemory.view, params_ptr, transferMemory.index - params_ptr);
			dataMemory = context.memory.buffer;
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
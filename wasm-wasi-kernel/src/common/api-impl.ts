/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WasiProcess, Options } from './api';
import RAL from './ral';

namespace MemoryDescriptor {
	export function is(value: any): value is WebAssembly.MemoryDescriptor {
		const candidate = value as WebAssembly.MemoryDescriptor;
		return candidate && typeof candidate === 'object'
			&& typeof candidate.initial === 'number'
			&& (typeof candidate.maximum === 'number' || candidate.maximum === undefined)
			&& (typeof candidate.shared === 'boolean' || candidate.shared === undefined);
	}
}

export namespace wasi {
	export function create(name: string, bits: ArrayBuffer | WebAssembly.Module, options?: Options, mapWorkspaceFolders?: boolean): WasiProcess;
	export function create(name: string, bits: ArrayBuffer | WebAssembly.Module, memory: WebAssembly.MemoryDescriptor | WebAssembly.Memory, options?: Options, mapWorkspaceFolders?: boolean): WasiProcess;
	export function create(name: string, bits: ArrayBuffer | WebAssembly.Module, memoryOrOptions?: WebAssembly.MemoryDescriptor | WebAssembly.Memory | Options, optionsOrMapWorkspaceFolders?: Options | boolean, mwf?: boolean): WasiProcess {
		let memory: WebAssembly.Memory | WebAssembly.MemoryDescriptor | undefined;
		let options: Options | undefined;
		let mapWorkspaceFolders: boolean | undefined;
		if (memoryOrOptions instanceof WebAssembly.Memory || MemoryDescriptor.is(memoryOrOptions)) {
			memory = memoryOrOptions;
			options = optionsOrMapWorkspaceFolders as Options | undefined;
			mapWorkspaceFolders = mwf;
		} else {
			options = memoryOrOptions;
			mapWorkspaceFolders = mwf;
		}
		return RAL().wasi.create(name, bits, memory, options, mapWorkspaceFolders);
	}
}
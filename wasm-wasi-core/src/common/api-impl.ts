/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ExtensionContext, Uri } from 'vscode';
import { WasiProcess, Options, WasiCor } from './api';

namespace MemoryDescriptor {
	export function is(value: any): value is WebAssembly.MemoryDescriptor {
		const candidate = value as WebAssembly.MemoryDescriptor;
		return candidate && typeof candidate === 'object'
			&& typeof candidate.initial === 'number'
			&& (typeof candidate.maximum === 'number' || candidate.maximum === undefined)
			&& (typeof candidate.shared === 'boolean' || candidate.shared === undefined);
	}
}

export namespace WasiKernelImpl {

	export function create(context: ExtensionContext, construct: new (baseUri: Uri, programName: string, module: WebAssembly.Module | Promise<WebAssembly.Module>, memory: WebAssembly.Memory | WebAssembly.MemoryDescriptor | undefined, options: Options | undefined, mapWorkspaceFolders: boolean | undefined) => WasiProcess): WasiCor {
		return {
			createProcess(name: string, module: WebAssembly.Module | Promise<WebAssembly.Module>, memoryOrOptions?: WebAssembly.MemoryDescriptor | WebAssembly.Memory | Options, optionsOrMapWorkspaceFolders?: Options | boolean, mwf?: boolean): WasiProcess {
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
				return new construct(context.extensionUri, name, module, memory, options, mapWorkspaceFolders);
			}
		};
	}
}
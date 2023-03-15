/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ExtensionContext, Uri } from 'vscode';
import { WasiProcess, Options, WasiCore } from './api';
import { WasiPseudoterminal } from './terminal';

namespace MemoryDescriptor {
	export function is(value: any): value is WebAssembly.MemoryDescriptor {
		const candidate = value as WebAssembly.MemoryDescriptor;
		return candidate && typeof candidate === 'object'
			&& typeof candidate.initial === 'number'
			&& (typeof candidate.maximum === 'number' || candidate.maximum === undefined)
			&& (typeof candidate.shared === 'boolean' || candidate.shared === undefined);
	}
}

export namespace WasiCoreImpl {

	export function create(context: ExtensionContext, construct: new (baseUri: Uri, programName: string, module: WebAssembly.Module | Promise<WebAssembly.Module>, memory: WebAssembly.Memory | WebAssembly.MemoryDescriptor | undefined, options: Options | undefined) => WasiProcess): WasiCore {
		return {
			createPseudoterminal(): WasiPseudoterminal {
				return WasiPseudoterminal.create();
			},
			createProcess(name: string, module: WebAssembly.Module | Promise<WebAssembly.Module>, memoryOrOptions?: WebAssembly.MemoryDescriptor | WebAssembly.Memory | Options, optionsOrMapWorkspaceFolders?: Options | boolean): WasiProcess {
				let memory: WebAssembly.Memory | WebAssembly.MemoryDescriptor | undefined;
				let options: Options | undefined;
				if (memoryOrOptions instanceof WebAssembly.Memory || MemoryDescriptor.is(memoryOrOptions)) {
					memory = memoryOrOptions;
					options = optionsOrMapWorkspaceFolders as Options | undefined;
				} else {
					options = memoryOrOptions;
				}
				return new construct(context.extensionUri, name, module, memory, options);
			}
		};
	}
}
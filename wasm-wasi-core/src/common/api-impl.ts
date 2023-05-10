/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/// <reference path="../../typings/webAssemblyCommon.d.ts" />

import { ExtensionContext, Uri } from 'vscode';

import { WasmProcess, ProcessOptions, TerminalOptions, Wasm, MemoryFileSystem, MountPointDescriptor, WasmFileSystem } from './api';
import { WasmPseudoterminal } from './terminal';
import { WasiProcess as InternalWasiProcess } from './process';
import { MemoryFileSystem as InMemoryFileSystemImpl } from './memoryFileSystem';
import WasiKernel from './kernel';
import { FileDescriptors } from './fileDescriptor';
import { Filetype } from './wasi';

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
	export function create(context: ExtensionContext, construct: new (baseUri: Uri, programName: string, module: WebAssembly.Module | Promise<WebAssembly.Module>, memory: WebAssembly.Memory | WebAssembly.MemoryDescriptor | undefined, options: ProcessOptions | undefined) => InternalWasiProcess): Wasm {
		return {
			createPseudoterminal(options?: TerminalOptions): WasmPseudoterminal {
				return WasmPseudoterminal.create(options);
			},
			createInMemoryFileSystem(): MemoryFileSystem {
				return new InMemoryFileSystemImpl();
			},
			async createWasmFileSystem(descriptors: MountPointDescriptor[]): Promise<WasmFileSystem> {
				const fileDescriptors = new FileDescriptors();
				const info = await WasiKernel.createRootFileSystem(fileDescriptors, descriptors);
				return {
					uri: info.fileSystem.uri,
					stat() {
						return Promise.resolve({ filetype: Filetype.regular_file });
					}
				};
			},
			async createProcess(name: string, module: WebAssembly.Module | Promise<WebAssembly.Module>, memoryOrOptions?: WebAssembly.MemoryDescriptor | WebAssembly.Memory | ProcessOptions, optionsOrMapWorkspaceFolders?: ProcessOptions | boolean): Promise<WasmProcess> {
				let memory: WebAssembly.Memory | WebAssembly.MemoryDescriptor | undefined;
				let options: ProcessOptions | undefined;
				if (memoryOrOptions instanceof WebAssembly.Memory || MemoryDescriptor.is(memoryOrOptions)) {
					memory = memoryOrOptions;
					options = optionsOrMapWorkspaceFolders as ProcessOptions | undefined;
				} else {
					options = memoryOrOptions;
				}
				const result = new construct(context.extensionUri, name, module, memory, options);
				await result.initialize();
				return result;
			}
		};
	}
}
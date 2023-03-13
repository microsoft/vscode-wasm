/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export interface Environment {
	[key: string]: string;
}

export interface Options {

	/**
	 * The encoding to use.
	 */
	encoding?: string;

	/**
	 * Command line arguments accessible in the WASM.
	 */
	args?: string [];

	/**
	 * The environment accessible in the WASM.
	 */
	env?: Environment;
}

export interface WasiProcess {
	/**
	 * Runs the WASI process.
	 */
	run(): Promise<number>;

	/**
	 * Terminate the WASI process.
	 */
	 terminate(): Promise<number>;
}

export interface WasiKernel {
	createProcess(name: string, module: WebAssembly.Module | Promise<WebAssembly.Module>, options?: Options, mapWorkspaceFolders?: boolean): WasiProcess;
	createProcess(name: string, module: WebAssembly.Module | Promise<WebAssembly.Module>, memory: WebAssembly.MemoryDescriptor | WebAssembly.Memory, options?: Options, mapWorkspaceFolders?: boolean): WasiProcess;
}

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Pseudoterminal, Uri } from 'vscode';

import { fdflags, oflags } from './wasi';
export { fdflags, oflags };

export interface Environment {
	[key: string]: string;
}

export type StdioFileDescriptor = {
	kind: 'file';
	path: string;
	oflags?: oflags;
	fdflags?: fdflags;
};

export type StdioTerminalDescriptor = {
	kind: 'terminal';
	terminal: WasiPseudoterminal;
};

export type StdioDescriptor = StdioFileDescriptor | StdioTerminalDescriptor | 'pipe';

export type Stdio = {
	in?: StdioDescriptor;
	out?: StdioDescriptor;
	err?: StdioDescriptor;
};

export interface WasiPseudoterminal extends Pseudoterminal {
	/**
	 * Clients must not use this property. It is here to ensure correct typing.
	 */
	readonly _wasiPseudoterminalBrand: any;

	/**
	 * Create stdio
	 */
	readonly stdio: Stdio;
}

export interface MapDirEntry {
	vscode_fs: Uri;
	mountPoint: string;
}

export interface Options {

	/**
	 * The encoding to use when decoding strings from and to the WASM layer.
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

	/**
	 * How VS Code files systems are mapped into the WASM/WASI file system.
	 *
	 * A boolean value of true maps the workspace folders into their default
	 * location.
	 */
	mapDir?: boolean | MapDirEntry[];

	/**
	 * Stdio setup
	 */
	stdio?: Stdio;
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

export interface WasiCore {
	createPseudoterminal(name: string): WasiPseudoterminal;
	createProcess(name: string, module: WebAssembly.Module | Promise<WebAssembly.Module>, options?: Options): WasiProcess;
	createProcess(name: string, module: WebAssembly.Module | Promise<WebAssembly.Module>, memory: WebAssembly.MemoryDescriptor | WebAssembly.Memory, options?: Options): WasiProcess;
}

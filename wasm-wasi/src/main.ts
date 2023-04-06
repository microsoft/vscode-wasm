/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/// <reference path="../typings/webAssemblyCommon.d.ts" />

import { Event, Pseudoterminal, Uri, extensions as Extensions } from 'vscode';

type u16 = number;
export type oflags = u16;
export namespace Oflags {
	/**
	 * No flags.
	 */
	export const none = 0;

	/**
	 * Create file if it does not exist.
	 */
	export const creat = 1 << 0;

	/**
	 * Fail if not a directory.
	 */
	export const directory = 1 << 1;

	/**
	 * Fail if file already exists.
	 */
	export const excl = 1 << 2;

	/**
	 * Truncate file to size 0.
	 */
	export const trunc = 1 << 3;
}

export type fdflags = u16;
export namespace Fdflags {

	/**
	 * No flags.
	 */
	export const none = 0;

	/**
	 * Append mode: Data written to the file is always appended to the file's
	 * end.
	 */
	export const append = 1 << 0;

	/**
	 * Write according to synchronized I/O data integrity completion. Only the
	 * data stored in the file is synchronized.
	 */
	export const dsync = 1 << 1;

	/**
	 * Non-blocking mode.
	 */
	export const nonblock = 1 << 2;

	/**
	 * Synchronized read I/O operations.
	 */
	export const rsync = 1 << 3;

	/**
	 * Write according to synchronized I/O file integrity completion. In
	 * addition to synchronizing the data stored in the file, the
	 * implementation may also synchronously update the file's metadata.
	 */
	export const sync = 1 << 4;
}

export interface Environment {
	[key: string]: string;
}

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

export type StdioPipeDescriptor = {
	kind: 'pipe';
};

export type StdioDescriptor = StdioFileDescriptor | StdioTerminalDescriptor | StdioPipeDescriptor;

export type Stdio = {
	in?: StdioDescriptor;
	out?: StdioDescriptor;
	err?: StdioDescriptor;
};

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
	mapDir?: boolean | MapDirEntry[] | { folders: boolean; entries: MapDirEntry[] };

	/**
	 * Stdio setup
	 */
	stdio?: Stdio;
}

export interface Writable {
	write(chunk: Uint8Array | string): Promise<void>;
}

export interface Readable {
	onData: Event<Uint8Array>;
}

export interface WasiProcess {

	readonly stdin: Writable | undefined;

	readonly stdout: Readable | undefined;

	readonly stderr: Readable | undefined;

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
	createPseudoterminal(): WasiPseudoterminal;
	createProcess(name: string, module: WebAssembly.Module | Promise<WebAssembly.Module>, options?: Options): Promise<WasiProcess>;
	createProcess(name: string, module: WebAssembly.Module | Promise<WebAssembly.Module>, memory: WebAssembly.MemoryDescriptor | WebAssembly.Memory, options?: Options): Promise<WasiProcess>;
}

export async function api(): Promise<WasiCore> {
	const wasiCoreExt = Extensions.getExtension('ms-vscode.wasm-wasi-core');
	if (wasiCoreExt === undefined) {
		throw new Error(`Unable to load WASM WASI Core extension.`);
	}
	const result: WasiCore = await wasiCoreExt.activate();
	return result;
}

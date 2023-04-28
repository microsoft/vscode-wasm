/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/// <reference path="../typings/webAssemblyCommon.d.ts" />

import { Event, Pseudoterminal, Uri, extensions as Extensions, ExtensionContext } from 'vscode';

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

export interface TerminalOptions {
	/**
	 * Enables a history stack for the terminal.
	 */
	history?: boolean;
}

/**
 * A special pseudo terminal that has support for reading and writing.
 *
 * This interface is not intended to be implemented. Instances of this
 * interface are available via `Wasm.createPseudoterminal`.
 */
export interface WasmPseudoterminal extends Pseudoterminal {
	/**
	 * Create stdio
	 */
	readonly stdio: Stdio;

	/**
	 * Read a line from the terminal.
	 */
	readline(): Promise<string>;

	/**
	 * Write a string to the terminal.
	 *
	 * @param str The string to write to the terminal.
	 */
	write(str: string): Promise<void>;

	/**
	 * Write a prompt to the terminal.
	 *
	 * @param prompt The prompt to write to the terminal.
	 */
	prompt(prompt: string): Promise<void>;
}

/**
 * A mountable file system that can be used inside a WASM process.
 *
 * This interface is not intended to be implemented. Instances of this
 * interface are available via `Wasm.createPseudoterminal`.
 */
export interface WasmFileSystem {
	id: bigint;
	uri: Uri;
}

export type StdioFileDescriptor = {
	kind: 'file';
	path: string;
	oflags?: oflags;
	fdflags?: fdflags;
};

export type StdioTerminalDescriptor = {
	kind: 'terminal';
	terminal: WasmPseudoterminal;
};

export type StdioPipeDescriptor = {
	kind: 'pipe';
};

export type StdioConsoleDescriptor = {
	kind: 'console';
};

export type StdioDescriptor = StdioFileDescriptor | StdioTerminalDescriptor | StdioPipeDescriptor | StdioConsoleDescriptor;

export type Stdio = {
	in?: StdioDescriptor;
	out?: StdioDescriptor;
	err?: StdioDescriptor;
};

export interface MapDirEntry {
	fileSystem: WasmFileSystem;
	mountPoint: string;
}

export interface ProcessOptions {

	/**
	 * The encoding to use when decoding strings from and to the WASM layer.
	 */
	encoding?: string;

	/**
	 * Command line arguments accessible in the WASM.
	 */
	args?: (string | Uri)[];

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

export interface WasmProcess {

	readonly stdin: Writable | undefined;

	readonly stdout: Readable | undefined;

	readonly stderr: Readable | undefined;

	/**
	 * Runs the Wasm process.
	 */
	run(): Promise<number>;

	/**
	 * Terminate the Wasm process.
	 */
	 terminate(): Promise<number>;
}

export interface Wasm {
	/**
	 * Creates a new pseudoterminal.
	 *
	 * @param options Additional options for the terminal.
	 */
	createPseudoterminal(options?: TerminalOptions): WasmPseudoterminal;

	/**
	 * Creates a file system that reads and writes data through VS Code's file
	 * system provider API.
	 *
	 * @param uri The URI of the VS Code file system.
	 */
	createVSCodeFileSystem(uri: Uri): WasmFileSystem;

	/**
	 * Creates a file system that reads and writes data from the extensions
	 * installation directory.
	 *
	 * @param context The extension context.
	 */
	createExtensionInstallationFileSystem(context: ExtensionContext): WasmFileSystem;

	/**
	 * Creates a new WASM process.
	 *
	 * @param name The name of the process. Will be available as `argv[0]`.
	 * @param module The WASM module to run.
	 * @param options Additional options for the process.
	 */
	createProcess(name: string, module: WebAssembly.Module | Promise<WebAssembly.Module>, options?: ProcessOptions): Promise<WasmProcess>;

	/**
	 * Creates a new WASM process.
	 *
	 * @param name The name of the process. Will be available as `argv[0]`.
	 * @param module The WASM module to run.
	 * @param memory The memory descriptor for the WASM module.
	 * @param options Additional options for the process.
	 */
	createProcess(name: string, module: WebAssembly.Module | Promise<WebAssembly.Module>, memory: WebAssembly.MemoryDescriptor | WebAssembly.Memory, options?: ProcessOptions): Promise<WasmProcess>;
}

export namespace Wasm {
	export async function api(): Promise<Wasm> {
		const wasiCoreExt = Extensions.getExtension('ms-vscode.wasm-wasi-core');
		if (wasiCoreExt === undefined) {
			throw new Error(`Unable to load WASM WASI Core extension.`);
		}
		const result: Wasm = await wasiCoreExt.activate();
		return result;
	}
}
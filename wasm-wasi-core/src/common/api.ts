/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/// <reference path="../../typings/webAssemblyCommon.d.ts" />

import { Event, Extension, ExtensionContext, Pseudoterminal, Uri } from 'vscode';

import { WasmPseudoterminal as WasmPseudoterminalImpl } from './terminal';
import { WasiProcess as InternalWasiProcess } from './process';
import { MemoryFileSystem as InMemoryFileSystemImpl } from './memoryFileSystemDriver';
import WasiKernel from './kernel';
import { FileDescriptors } from './fileDescriptor';
import { StdinStream, StdoutStream } from './streams';
import { WasmRootFileSystemImpl } from './fileSystem';

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
 * A writable stream.
 *
 * This interface is not intended to be implemented. Instances of this
 * interface are available via `Wasm.createWritable`.
 */
export interface Writable {

	/**
	 * Write some data to the stream.
	 * @param chunk The data to write.
	 */
	write(chunk: Uint8Array): Promise<void>;

	/**
	 * Write a string to the stream.
	 * @param chunk The string to write.
	 * @param encoding The encoding to use to convert to a binary format.
	 */
	write(chunk: string, encoding?: 'utf-8'): Promise<void>;
}

/**
 * A readable stream.
 *
 * This interface is not intended to be implemented. Instances of this
 * interface are available via `Wasm.createReadable`.
 */
export interface Readable {
	onData: Event<Uint8Array>;
}

/**
 * Flags used to open a file.
 */
export namespace OpenFlags {
	/**
	 * No flags.
	 */
	export const none = 0;

	/**
	 * Create file if it does not exist.
	 */
	export const create = 1 << 0;

	/**
	 * Fail if not a directory.
	 */
	export const directory = 1 << 1;

	/**
	 * Fail if file already exists.
	 */
	export const exclusive = 1 << 2;

	/**
	 * Truncate file to size 0.
	 */
	export const truncate = 1 << 3;
}
export type OpenFlags = number;
/**
 * A stdio descriptor denoting a file in a WASM
 * file system.
 */
export type StdioFileDescriptor = {
	kind: 'file';
	path: string;
	openFlags?: OpenFlags;
};

/**
 * A stdio descriptor denoting a WASM Pseudo terminal.
 */
export type StdioTerminalDescriptor = {
	kind: 'terminal';
	terminal: WasmPseudoterminal;
};

/**
 * A stdio descriptor denoting a pipe that is used to
 * write to the WASM process.
 */
export type StdioPipeInDescriptor = {
	kind: 'pipeIn';
	pipe?: Writable;
};

/**
 * A stdio descriptor denoting a pipe that is used to
 * read from the WASM process.
 */
export type StdioPipeOutDescriptor = {
	kind: 'pipeOut';
	pipe?: Readable;
};

/**
 * A stdio descriptor denoting the console.
 */
export type StdioConsoleDescriptor = {
	kind: 'console';
};

/**
 * Stdio setup for a WASM process.
 */
export type Stdio = {
	in?: StdioFileDescriptor | StdioTerminalDescriptor | StdioPipeInDescriptor;
	out?: StdioFileDescriptor | StdioTerminalDescriptor | StdioConsoleDescriptor | StdioPipeOutDescriptor;
	err?: StdioFileDescriptor | StdioTerminalDescriptor | StdioConsoleDescriptor | StdioPipeOutDescriptor;
};

/**
 * A descriptor signaling that the workspace folder is mapped as `/workspace` or in case of a
 * multi-root workspace each folder is mapped as `/workspaces/folder-name`.
 */
export type WorkspaceFolderDescriptor = {
	kind: 'workspaceFolder';
};

/**
 * A descriptor signaling that the extension location is mapped under the given
 * mount point.
 */
export type ExtensionLocationDescriptor = {
	kind: 'extensionLocation';
	extension: ExtensionContext | Extension<any>;
	path: string;
	mountPoint: string;
};

/**
 * A descriptor signaling that a VS Code file system is mapped under the given
 * mount point.
 */
export type VSCodeFileSystemDescriptor = {
	kind: 'vscodeFileSystem';
	uri: Uri;
	mountPoint: string;
};

/**
 * A descriptor signaling that an in-memory file system is mapped under the given
 * mount point.
 */
export type InMemoryFileSystemDescriptor = {
	kind: 'inMemoryFileSystem';
	fileSystem: MemoryFileSystem;
	mountPoint: string;
};

/**
 * The union of all mount point descriptors.
 */
export type MountPointDescriptor = WorkspaceFolderDescriptor | ExtensionLocationDescriptor | VSCodeFileSystemDescriptor | InMemoryFileSystemDescriptor;

/**
 * Options for a WASM process.
 */
export type BaseProcessOptions = {

	/**
	 * The encoding to use when decoding strings from and to the WASM layer.
	 *
	 * Currently we only have support for utf-8 since this is the only encoding
	 * that browsers currently support natively.
	 */
	encoding?: 'utf-8';

	/**
	 * Command line arguments accessible in the WASM.
	 */
	args?: (string | Uri)[];

	/**
	 * The environment accessible in the WASM.
	 */
	env?: Environment;

	/**
	 * Stdio setup
	 */
	stdio?: Stdio;

	/**
	 * Whether the WASM/WASI API should be traced or not.
	 */
	trace?: boolean;
};

export type MountPointOptions = {
	/**
	 * How VS Code files systems are mapped into the WASM/WASI file system.
	 */
	mountPoints?: MountPointDescriptor[];
};
export namespace MountPointOptions {
	export function is(value: any): value is MountPointOptions {
		const candidate = value as MountPointOptions;
		return candidate && Array.isArray(candidate.mountPoints);
	}
}

export type RootFileSystemOptions = {
	/**
	 * The root file system that is used by the WASM process.
	 */
	rootFileSystem?: RootFileSystem;
};
export namespace RootFileSystemOptions {
	export function is(value: any): value is { rootFileSystem: WasmRootFileSystemImpl } {
		const candidate = value as RootFileSystemOptions;
		return candidate && candidate.rootFileSystem instanceof WasmRootFileSystemImpl;
	}
}

export type ProcessOptions = BaseProcessOptions & (MountPointOptions | RootFileSystemOptions);

/**
 * A WASM process.
 */
export interface WasmProcess {

	/**
	 * The stdin of the WASM process or undefined if not available.
	 */
	readonly stdin: Writable | undefined;

	/**
	 * The stdout of the WASM process or undefined if not available.
	 */
	readonly stdout: Readable | undefined;

	/**
	 * The stderr of the WASM process or undefined if not available.
	 */
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

export enum Filetype {

	/**
	 * The type of the file descriptor or file is unknown or is different from
	 * any of the other types specified.
	 */
	unknown,

	/**
	 * The file descriptor or file refers to a directory inode.
	 */
	directory,

	/**
	 * The file descriptor or file refers to a regular file inode.
	 */
	regular_file,

	/**
	 * The file descriptor or file refers to a character device.
	 */
	character_device
}

/**
 * The memory file system.
 */
export interface MemoryFileSystem {
	createDirectory(path: string): void;
	createFile(path: string, content: Uint8Array | { size: bigint; reader: () => Promise<Uint8Array> }): void;
}

export interface RootFileSystem {
	/**
	 * Maps the give absolute path to a URI. Return undefined if the path cannot
	 * be mapped.
	 */
	mapPath(path: string): Promise<Uri | undefined>;

	/**
	 * Stats the file / folder at the given absolute path.
	 *
	 * @param path the absolute path
	 */
	stat(path: string): Promise<{ filetype: Filetype }>;
}

export interface Wasm {
	/**
	 * Creates a new pseudoterminal.
	 *
	 * @param options Additional options for the terminal.
	 */
	createPseudoterminal(options?: TerminalOptions): WasmPseudoterminal;

	/**
	 * Creates a new in-memory file system.
	 */
	createInMemoryFileSystem(): Promise<MemoryFileSystem>;

	/**
	 * Creates a new WASM file system.
	 */
	createRootFileSystem(descriptors: MountPointDescriptor[]): Promise<RootFileSystem>;

	/**
	 * Creates a new readable stream.
	 */
	createReadable(): Readable;

	/**
	 * Creates a new writable stream.
	 */
	createWritable(encoding?: 'utf-8'): Writable;

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
				return WasmPseudoterminalImpl.create(options);
			},
			createInMemoryFileSystem(): Promise<MemoryFileSystem> {
				return Promise.resolve(new InMemoryFileSystemImpl());
			},
			async createRootFileSystem(mountDescriptors: MountPointDescriptor[]): Promise<RootFileSystem> {
				const fileDescriptors = new FileDescriptors();
				const info = await WasiKernel.createRootFileSystem(fileDescriptors, mountDescriptors);
				const result = new WasmRootFileSystemImpl(info, fileDescriptors);
				await result.initialize();
				return result;
			},
			createReadable() {
				return new StdoutStream();
			},
			createWritable(encoding?: 'utf-8') {
				return new StdinStream(encoding);
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
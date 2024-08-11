/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/// <reference path="../../typings/webAssemblyCommon.d.ts" preserve="true"/>

import * as v1 from './v1';

/**
 * @deprecated use types from the v1 module instead.
 */
export type Environment = v1.Environment;

/**
 * @deprecated use types from the v1 module instead.
 */
export type TerminalOptions = v1.TerminalOptions;

/**
 * @deprecated use types from the v1 module instead.
 */
export type PseudoterminalState = v1.PseudoterminalState;

/**
 * @deprecated use types from the v1 module instead.
 */
export type PseudoterminalStateChangeEvent = v1.PseudoterminalStateChangeEvent;

/**
 * @deprecated use types from the v1 module instead.
 */
export type WasmPseudoterminal = v1.WasmPseudoterminal;

/**
 * @deprecated use types from the v1 module instead.
 */
export type Writable = v1.Writable;

/**
 * @deprecated use types from the v1 module instead.
 */
export type Readable = v1.Readable;

/**
 * @deprecated use types from the v1 module instead.
 */
export const OpenFlags = v1.OpenFlags;
/**
 * @deprecated use types from the v1 module instead.
 */
export type OpenFlags = v1.OpenFlags;

/**
 * @deprecated use types from the v1 module instead.
 */
export type StdioFileDescriptor = v1.StdioFileDescriptor;

/**
 * @deprecated use types from the v1 module instead.
 */
export type StdioTerminalDescriptor = v1.StdioTerminalDescriptor;

/**
 * @deprecated use types from the v1 module instead.
 */
export type StdioPipeInDescriptor = v1.StdioPipeInDescriptor;

/**
 * @deprecated use types from the v1 module instead.
 */
export type StdioPipeOutDescriptor = v1.StdioPipeOutDescriptor;

/**
 * @deprecated use types from the v1 module instead.
 */
export type StdioConsoleDescriptor = v1.StdioConsoleDescriptor;

/**
 * @deprecated use types from the v1 module instead.
 */
export type Stdio = v1.Stdio;

/**
 * @deprecated use types from the v1 module instead.
 */
export type WorkspaceFolderDescriptor = v1.WorkspaceFolderDescriptor;

/**
 * @deprecated use types from the v1 module instead.
 */
export type ExtensionLocationDescriptor = v1.ExtensionLocationDescriptor;

/**
 * @deprecated use types from the v1 module instead.
 */
export type VSCodeFileSystemDescriptor = v1.VSCodeFileSystemDescriptor;

/**
 * @deprecated use types from the v1 module instead.
 */
export type MemoryFileSystemDescriptor = v1.MemoryFileSystemDescriptor;

/**
 * @deprecated use types from the v1 module instead.
 */
export type MountPointDescriptor = v1.MountPointDescriptor;

/**
 * @deprecated use types from the v1 module instead.
 */
export type ProcessOptions = v1.ProcessOptions;

/**
 * @deprecated use types from the v1 module instead.
 */
export type WasmProcess = v1.WasmProcess;

/**
 * @deprecated use types from the v1 module instead.
 */
export type Filetype = v1.Filetype;
/**
 * @deprecated use types from the v1 module instead.
 */
export const Filetype = v1.Filetype;

/**
 * @deprecated use types from the v1 module instead.
 */
export type MemoryFileSystem = v1.MemoryFileSystem;

/**
 * @deprecated use types from the v1 module instead.
 */
export type RootFileSystem  = v1.RootFileSystem;

/**
 * @deprecated use types from the v1 module instead.
 */
export type Wasm = Exclude<v1.Wasm, 'versions'> & {
	/**
	 * The version of the WASM API following semver semantics.
	 */
	readonly version: string;
};

/**
 * @deprecated use types from the v1 module instead.
 */
export namespace Wasm {

	/**
	 * @deprecated use functions from the v1 module instead.
	 */
	export function api(): Wasm {
		return v1.Wasm.api() as Wasm;
	}

	/**
	 * @deprecated use functions from the v1 module instead.
	 */
	export function load(): Promise<Wasm> {
		return v1.Wasm.load() as Promise<Wasm>;
	}
}
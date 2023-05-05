/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { MapDirDescriptor, WasmPseudoterminal } from '@vscode/wasm-wasi';

export type CommandHandler = (pty: WasmPseudoterminal, command: string, args: string[], cwd: string, mapDir?: MapDirDescriptor[] | undefined) => Promise<number>;

export interface HandlerTarget {
	registerCommandHandler(command: string, handler: CommandHandler): void;
}
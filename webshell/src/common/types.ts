/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { Stdio, RootFileSystem } from '@vscode/wasm-wasi';

export type CommandHandler = (
	command: string,
	args: string[],
	cwd: string,
	stdio: Stdio,
	rootFileSystem: RootFileSystem
) => Promise<number>;

export interface HandlerTarget {
	registerCommandHandler(command: string, handler: CommandHandler): void;
}
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { RootFileSystem, Stdio } from '@vscode/wasm-wasi/v1';

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
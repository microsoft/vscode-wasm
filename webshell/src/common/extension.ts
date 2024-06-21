/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ExtensionContext, commands } from 'vscode';

import { Wasm } from '@vscode/wasm-wasi/v1';

import { CoreUtils } from './coreUtils';
import { WebShell } from './webShell';
import { WebShellContributions } from './webShellContributions';

export async function activate(context: ExtensionContext): Promise<void> {
	const wasm: Wasm = await Wasm.load();
	await WebShell.initialize(wasm, WebShellContributions);
	const coreUtils = new CoreUtils(context);
	coreUtils.contributeHandlers(wasm, WebShell);

	commands.registerCommand('ms-vscode.webshell.create', async () => {
		const webShell = new WebShell(wasm, '/workspace');
		void webShell.runCommandLoop();
	});
}

export function deactivate(): Promise<void> {
	return Promise.resolve();
}
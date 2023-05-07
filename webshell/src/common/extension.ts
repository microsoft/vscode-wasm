/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ExtensionContext, commands } from 'vscode';

import { Wasm } from '@vscode/wasm-wasi';

import { Webshell } from './webShell';
import { CoreUtils } from './coreUtils';
import { WebShellContributions } from './webShellContributions';

export async function activate(context: ExtensionContext): Promise<void> {
	const wasm: Wasm = await Wasm.api();
	const contributions: WebShellContributions = WebShellContributions;

	commands.registerCommand('ms-vscode.webshell.create', async () => {
		const webShell = new Webshell(wasm, contributions, '/workspace');
		const coreUtils = new CoreUtils(context);
		coreUtils.contributeHandlers(wasm, webShell);
		void webShell.runCommandLoop();
	});
}

export function deactivate(): Promise<void> {
	return Promise.resolve();
}
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { commands, extensions, window } from 'vscode';
import { WasiCore } from './wasiCore';
import { binary } from './wasm';

export async function activate() {
	const wasiCoreExt = extensions.getExtension('ms-vscode.wasm-wasi-core');
	if (wasiCoreExt === undefined) {
		window.showErrorMessage('The WASI core extension is required to run this testbed.');
		return;
	}

	const wasiCore: WasiCore =  await wasiCoreExt.activate();
	commands.registerCommand('testbed-threads.run', () => {
		const process = wasiCore.createProcess('threads', WebAssembly.compile(binary.buffer), { initial: 2, maximum: 160, shared: true });
		process.run().catch(err => {
			window.showErrorMessage(err.message);
		});
	});
}

export function deactivate() {
}
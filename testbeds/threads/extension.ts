/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { commands, extensions, window } from 'vscode';
import { WasiKernel } from './wasiKernel';
import { binary } from './wasm';

export async function activate() {
	const wasiKernelExt = extensions.getExtension('ms-vscode.wasm-wasi-kernel');
	if (wasiKernelExt === undefined) {
		window.showErrorMessage('The WASI Kernel extension is required to run this testbed.');
		return;
	}

	const wasiKernel: WasiKernel =  await wasiKernelExt.activate();
	commands.registerCommand('testbed-threads.run', () => {
		const process = wasiKernel.createProcess('threads', WebAssembly.compile(binary.buffer), { initial: 2, maximum: 160, shared: true });
		process.run().catch(err => {
			window.showErrorMessage(err.message);
		});
	});
}

export function deactivate() {
}
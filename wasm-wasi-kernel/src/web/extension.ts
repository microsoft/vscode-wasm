/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RIL from './ril';
RIL.install();

import { commands, ExtensionContext  } from 'vscode';
import { BrowserWasiProcess } from './process';
import { binary } from './wasm';

export async function activate(context: ExtensionContext) {
	commands.registerCommand('testbed-threads.run', () => {
		const bits = new SharedArrayBuffer(binary.length);
		new Uint8Array(bits).set(binary);
		const process: BrowserWasiProcess = new BrowserWasiProcess(context.extensionUri, 'threads', bits, { initial: 2, maximum: 160, shared: true });
		process.run().catch(() => {});
	});
}

export function deactivate() {
}
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RIL from './ril';
RIL.install();

import { commands, ExtensionContext  } from 'vscode';
import { NodeWasiProcess } from './process';
import { binary } from './wasm';

export async function activate(context: ExtensionContext) {
	commands.registerCommand('testbed-threads.run', () => {
		const bits = new SharedArrayBuffer(binary.length);
		new Uint8Array(bits).set(binary);
		const process: NodeWasiProcess = new NodeWasiProcess(context.extensionUri, 'threads', bits);
		process.run().catch(() => {});
	});
}

export function deactivate() {
}
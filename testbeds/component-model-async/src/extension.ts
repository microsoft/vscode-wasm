/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import { Worker } from 'worker_threads';

import { calculator, Types } from './calculator';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	const filename = vscode.Uri.joinPath(context.extensionUri, 'target', 'wasm32-unknown-unknown', 'debug', 'calculator.wasm');
	const bits = await vscode.workspace.fs.readFile(filename);
	const module = await WebAssembly.compile(bits);

	const worker = new Worker(vscode.Uri.joinPath(context.extensionUri, './out/worker.js').fsPath);
	const api = await calculator._.main.bind({}, context as any, worker, module, { encoding: 'utf-8' });
	vscode.commands.registerCommand('testbed-component-model.run', async () => {
		console.log(`Add ${await api.calc(Types.Operation.Add({ left: 1, right: 2 }))}`);
	});
}
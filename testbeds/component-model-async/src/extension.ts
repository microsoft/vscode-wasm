/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import { Worker } from 'worker_threads';

import { Types, calculator } from './calculator';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	// The channel for printing the result.
	const channel = vscode.window.createOutputChannel('Calculator');
	context.subscriptions.push(channel);

	// The channel for printing the log.
	const log = vscode.window.createOutputChannel('Calculator - Log', { log: true });
	context.subscriptions.push(log);

	// The implementation of the log function that is called from WASM
	const service: calculator.Imports = {
		log: (msg: string) => {
			log.info(msg);
		}
	};

	const filename = vscode.Uri.joinPath(context.extensionUri, 'target', 'wasm32-unknown-unknown', 'debug', 'calculator.wasm');
	const bits = await vscode.workspace.fs.readFile(filename);
	const module = await WebAssembly.compile(bits);

	const worker = new Worker(vscode.Uri.joinPath(context.extensionUri, './out/worker.js').fsPath);
	const api = await calculator._.bind(service, module, worker);
	vscode.commands.registerCommand('testbed-component-model-async.run', async () => {
		channel.appendLine(`Add ${await api.calc(Types.Operation.Add({ left: 1, right: 2 }))}`);
		channel.appendLine(`Sub ${await api.calc(Types.Operation.Sub({ left: 10, right: 8 }))}`);
		channel.appendLine(`Mul ${await api.calc(Types.Operation.Mul({ left: 3, right: 7 }))}`);
		channel.appendLine(`Div ${await api.calc(Types.Operation.Div({ left: 10, right: 2 }))}`);

		// const calculator = await api.reverseNotation.Engine.$new();
		// calculator.pushOperand(10);
		// calculator.pushOperand(20);
		// calculator.pushOperation(ReverseNotation.Operation.add);
		// calculator.pushOperand(2);
		// calculator.pushOperation(ReverseNotation.Operation.mul);

		// // Calculate the result
		// const result = calculator.execute();
		// channel.appendLine(`Result: ${result}`);
	});
}
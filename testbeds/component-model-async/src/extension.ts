/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import { Worker } from 'worker_threads';

import { Resource, ResourceManager, type u32 } from '@vscode/wasm-component-model';
import { Types, calculator } from './calculator';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	// The channel for printing the result.
	const channel = vscode.window.createOutputChannel('Calculator');
	context.subscriptions.push(channel);

	// The channel for printing the log.
	const log = vscode.window.createOutputChannel('Calculator - Log', { log: true });
	context.subscriptions.push(log);

	class ChannelImpl extends Resource.Default implements calculator.imports.Promisify<Types.Channel>  {
		public static $resources: ResourceManager = new ResourceManager.Default<ChannelImpl>();
		public static $new(level: u32): Promise<ChannelImpl> {
			return Promise.resolve(new ChannelImpl(level));
		}
		private readonly level: u32;
		constructor(level: u32) {
			super(ChannelImpl.$resources);
			this.level = level;
		}
		send(msg: string): Promise<void> {
			channel.appendLine(msg);
			return Promise.resolve();
		}
	}

	// The implementation of the log function that is called from WASM
	const service: calculator.Imports.Promisified = {
		log: (msg: string) => {
			log.info(msg);
		},
		generate: () => {
			return "Hello from the Host";
		},
		types: {
			Channel: ChannelImpl
		}
	};

	const filename = vscode.Uri.joinPath(context.extensionUri, 'target', 'wasm32-unknown-unknown', 'debug', 'calculator.wasm');
	const bits = await vscode.workspace.fs.readFile(filename);
	const module = await WebAssembly.compile(bits);

	const worker = new Worker(vscode.Uri.joinPath(context.extensionUri, './out/worker.js').fsPath);
	const api = await calculator._.bind(service, module, worker);
	vscode.commands.registerCommand('testbed-component-model-async.run', async () => {
		// channel.appendLine(`Add ${await api.calc(Types.Operation.Add({ left: 1, right: 2 }))}`);
		// channel.appendLine(`Sub ${await api.calc(Types.Operation.Sub({ left: 10, right: 8 }))}`);
		// channel.appendLine(`Mul ${await api.calc(Types.Operation.Mul({ left: 3, right: 7 }))}`);
		// channel.appendLine(`Div ${await api.calc(Types.Operation.Div({ left: 10, right: 2 }))}`);

		// const calculator = await api.reverseNotation.Engine.$new();
		// await calculator.pushOperand(10);
		// await calculator.pushOperand(20);
		// await calculator.pushOperation(ReverseNotation.Operation.add);

		// // Calculate the result
		// const result = await calculator.execute();
		// channel.appendLine(`Result: ${result}`);

		channel.appendLine(`Message: ${await api.msg()}`);
	});
}
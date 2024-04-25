/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { WasmContext, Memory } from '@vscode/wasm-component-model';
import * as vscode from 'vscode';

import { calculator, Types } from './calculator';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	const filename = vscode.Uri.joinPath(context.extensionUri, 'target', 'wasm32-unknown-unknown', 'debug', 'calculator.wasm');
	const bits = await vscode.workspace.fs.readFile(filename);
	const module = await WebAssembly.compile(bits);

	const wasmContext: WasmContext.Default = new WasmContext.Default();
	const instance = await WebAssembly.instantiate(module, {});
	wasmContext.initialize(new Memory.Default(instance.exports));
	const api = calculator._.exports.bind(instance.exports as calculator._.Exports, wasmContext);

	vscode.commands.registerCommand('testbed-component-model.run', () => {
		console.log(`Add ${api.calc(Types.Operation.Add({ left: 1, right: 2}))}`);
		console.log(`Sub ${api.calc(Types.Operation.Sub({ left: 10, right: 8 }))}`);
		console.log(`Mul ${api.calc(Types.Operation.Mul({ left: 3, right: 7 }))}`);
		console.log(`Div ${api.calc(Types.Operation.Div({ left: 10, right: 2 }))}`);
	});
}
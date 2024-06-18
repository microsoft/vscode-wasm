/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';

import { calculator, Types } from './calculator';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	const filename = vscode.Uri.joinPath(context.extensionUri, 'target', 'wasm32-unknown-unknown', 'debug', 'calculator.wasm');
	const bits = await vscode.workspace.fs.readFile(filename);
	const module = await WebAssembly.compile(bits);

	const service: calculator.Imports = {
		generate: () => {
			return "Hello from the Host";
		}
	}

	const api = await calculator._.bind(service, module);

	vscode.commands.registerCommand('testbed-component-model.run', () => {
		console.log(`Add ${api.calc(Types.Operation.Add({ left: 1, right: 2}))}`);
		console.log(`Sub ${api.calc(Types.Operation.Sub({ left: 10, right: 8 }))}`);
		console.log(`Mul ${api.calc(Types.Operation.Mul({ left: 3, right: 7 }))}`);
		console.log(`Div ${api.calc(Types.Operation.Div({ left: 10, right: 2 }))}`);

		console.log(`Message: ${api.msg()}`);
	});
}
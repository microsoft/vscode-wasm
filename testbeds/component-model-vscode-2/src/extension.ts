/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import * as vscode_rust from '@vscode/rust-api'

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	const filename = vscode.Uri.joinPath(context.extensionUri, 'target', 'wasm32-unknown-unknown', 'debug', 'vscode_example.wasm');
	const bits = await vscode.workspace.fs.readFile(filename);
	const module = await WebAssembly.compile(bits);
	vscode_rust.activate(context, module);
}

export async function deactivate(): Promise<void> {
	vscode_rust.deactivate();
}
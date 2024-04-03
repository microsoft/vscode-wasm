/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import * as vscode_rust from '@vscode/rust-api'

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	vscode_rust.activate(context);
}
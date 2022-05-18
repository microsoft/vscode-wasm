/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ExtensionContext, window } from 'vscode';

const channel = window.createOutputChannel('WASI Browser Channel');
export async function activate(_context: ExtensionContext) {

	channel.appendLine("Hello World");
}

export function deactivate() {
}
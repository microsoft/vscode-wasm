/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { commands, ExtensionContext, window, debug } from 'vscode';

import { DebugAdapterDescriptorFactory, DebugConfigurationProvider, debugFile } from './debugger';


export async function activate(context: ExtensionContext) {

	commands.registerCommand('testbed-debug_pdb.debugFile', async () => {
		const activeDocument = window.activeTextEditor?.document;
		if (activeDocument === undefined || activeDocument.languageId !== 'python') {
			return;
		}
		await debugFile(window.activeTextEditor!.document.fileName);
	});

	const provider = new DebugConfigurationProvider();
	context.subscriptions.push(debug.registerDebugConfigurationProvider('python-pdb', provider));

	const factory = new DebugAdapterDescriptorFactory(context);
	context.subscriptions.push(debug.registerDebugAdapterDescriptorFactory('python-pdb', factory));

}

export function deactivate() {
}
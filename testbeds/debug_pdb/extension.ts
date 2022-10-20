/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ExtensionContext, debug } from 'vscode';

import { DebugAdapterDescriptorFactory, DebugConfigurationProvider } from './debugger';


export async function activate(context: ExtensionContext) {

	const provider = new DebugConfigurationProvider();
	context.subscriptions.push(debug.registerDebugConfigurationProvider('python-pdb', provider));

	const factory = new DebugAdapterDescriptorFactory(context);
	context.subscriptions.push(debug.registerDebugAdapterDescriptorFactory('python-pdb', factory));

}

export function deactivate() {
}
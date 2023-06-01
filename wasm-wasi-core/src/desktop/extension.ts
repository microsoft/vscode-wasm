/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RIL from './ril';
RIL.install();

import { ExtensionContext, workspace } from 'vscode';
import { WasiCoreImpl  } from '../common/api';
import { NodeWasiProcess } from './process';

export async function activate(context: ExtensionContext) {
	return WasiCoreImpl.create(context, NodeWasiProcess, async (source) => {
		const bits = await workspace.fs.readFile(source);
		return WebAssembly.compile(bits);
	});
}

export function deactivate() {
}
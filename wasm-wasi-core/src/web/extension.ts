/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RIL from './ril';
RIL.install();

import { ExtensionContext } from 'vscode';
import { WasiCoreImpl  } from '../common/api';
import { BrowserWasiProcess } from './process';

export async function activate(context: ExtensionContext) {
	return WasiCoreImpl.create(context, BrowserWasiProcess, async (source) => {
		return WebAssembly.compileStreaming(fetch(source.toString()));
	});
}

export function deactivate() {
}
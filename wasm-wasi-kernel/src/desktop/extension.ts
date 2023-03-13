/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RIL from './ril';
RIL.install();

import { ExtensionContext } from 'vscode';
import { WasiKernelImpl  } from '../common/api-impl';
import { NodeWasiProcess } from './process';

export async function activate(context: ExtensionContext) {
	return WasiKernelImpl.create(context, NodeWasiProcess);
}

export function deactivate() {
}
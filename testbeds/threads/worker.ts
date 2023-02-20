/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
 import path from 'path-browserify';

import { ClientConnection } from '@vscode/sync-api-common/browser';
import { ApiClient, ApiClientConnection, Requests } from '@vscode/sync-api-client';
import { WASI, DeviceDescription, DebugWrapper } from '@vscode/wasm-wasi/browser';
import { binary } from './wasm'

const apiClient = new ApiClient(new ClientConnection<Requests, ApiClientConnection.ReadyParams>(self));
apiClient.serviceReady().then(async (params) => {
	const exitHandler = (rval: number): void => {
		apiClient.process.procExit(rval);
	};
	const workspaceFolders = apiClient.vscode.workspace.workspaceFolders;
	const devices: DeviceDescription[] = [];
	if (workspaceFolders.length === 1) {
		devices.push({ kind: 'fileSystem',  uri: workspaceFolders[0].uri, mountPoint: path.posix.join(path.posix.sep, 'workspace') });
	} else {
		for (const folder of workspaceFolders) {
			devices.push({ kind: 'fileSystem',  uri: folder.uri, mountPoint: path.posix.join(path.posix.sep, 'workspaces', folder.name) });
		}
	}
	const wasi = DebugWrapper.create(WASI.create('hello', apiClient, exitHandler, devices, params.stdio));
	const { instance } = await WebAssembly.instantiate(binary, {
		wasi_snapshot_preview1: wasi,
		wasi: wasi
	});
	wasi.initialize(instance);
	(instance.exports._start as Function)();
	apiClient.process.procExit(0);
}).catch(console.error);
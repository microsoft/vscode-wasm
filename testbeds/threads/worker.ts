/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as fs from 'fs';
import * as path from 'path';
import { parentPort  } from 'worker_threads';

import { ClientConnection } from '@vscode/sync-api-common/node';
import { ApiClient, ApiClientConnection, Requests } from '@vscode/sync-api-client';
import { WASI, DeviceDescription, DebugWrapper } from '@vscode/wasm-wasi/node';

if (parentPort === null) {
	process.exit();
}

const apiClient = new ApiClient(new ClientConnection<Requests, ApiClientConnection.ReadyParams>(parentPort));
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
	const wasmFile = path.join(__dirname, '..', 'out', 'main.wasm');
	const binary = fs.readFileSync(wasmFile);
	const { instance } = await WebAssembly.instantiate(binary, {
		wasi_snapshot_preview1: wasi,
		wasi: wasi
	});
	wasi.initialize(instance);
	(instance.exports._start as Function)();
	apiClient.process.procExit(0);
}).catch(console.error);
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as fs from 'fs';
import * as path from 'path';
import { parentPort  } from 'worker_threads';

import { ClientConnection } from '@vscode/sync-api-common/node';
import { ApiClient, ApiClientConnection, Requests } from '@vscode/sync-api-client';
import { WASI, Options } from '@vscode/wasm-wasi/node';

if (parentPort === null) {
	process.exit();
}

const apiClient = new ApiClient(new ClientConnection<Requests, ApiClientConnection.ReadyParams>(parentPort));
apiClient.serviceReady().then(async (params) => {
	const name = 'Run Rust';
	const workspaceFolders = apiClient.vscode.workspace.workspaceFolders;
	const mapDir: Options['mapDir'] = [];
	if (workspaceFolders.length === 1) {
		mapDir.push({ name: path.posix.join(path.posix.sep, 'workspace'), uri: workspaceFolders[0].uri });
	} else {
		for (const folder of workspaceFolders) {
			mapDir.push({ name: path.posix.join(path.posix.sep, 'workspaces', folder.name), uri: folder.uri });
		}
	}
	const exitHandler = (rval: number): void => {
		apiClient.process.procExit(rval);
	};
	const wasi = WASI.create(name, apiClient, exitHandler, {
		stdio: params.stdio,
		mapDir,
	});
	const wasmFile = path.join(__dirname, '..', 'target', 'wasm32-wasi', 'debug', 'rust-example.wasm');
	const binary = fs.readFileSync(wasmFile);
	const { instance } = await WebAssembly.instantiate(binary, {
		wasi_snapshot_preview1: wasi
	});
	wasi.initialize(instance);
	(instance.exports.main as Function)();
	apiClient.process.procExit(0);
}).catch(console.error);
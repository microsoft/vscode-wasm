/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as fs from 'fs';
import * as path from 'path';
import { parentPort  } from 'worker_threads';

import { ClientConnection } from '@vscode/sync-api-common/node';
import { ApiClient, Requests } from '@vscode/sync-api-client';
import { WASI } from '@vscode/wasm-wasi/node';

if (parentPort === null) {
	process.exit();
}

// A special connection that allows the worker to talk to the
// extension host API using sync API.
const connection = new ClientConnection<Requests>(parentPort);
connection.serviceReady().then(async (params) => {
	const name = 'Run C Example';
	// A client that provides sync VS Code API
	const apiClient = new ApiClient(connection);
	const exitHandler = (rval: number): void => {
		apiClient.process.procExit(rval);
	};
	// The WASI implementation
	const wasi = WASI.create(name, apiClient, exitHandler, {
		mapDir: []
	});
	// The file contain the web assembly code
	const wasmFile = path.join(__dirname, 'hello.wasm');
	const binary = fs.readFileSync(wasmFile);
	// Create a web assembly instance from the wasm file using the
	// provided WASI implementation.
	const { instance } = await WebAssembly.instantiate(binary, {
		wasi_snapshot_preview1: wasi
	});
	wasi.initialize(instance);
	// Run the web assembly
	(instance.exports._start as Function)();
	apiClient.process.procExit(0);
}).catch(console.error);
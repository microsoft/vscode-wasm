/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as fs from 'fs';
import * as path from 'path';
import { parentPort  } from 'worker_threads';

import { URI } from 'vscode-uri';

import { ClientConnection, ProcExitRequest, Requests } from 'vscode-sync-rpc/node';
import { ApiClient } from 'vscode-sync-api-client';
import { WASI } from 'vscode-wasi/node';

import { Ready } from './ready';
import { Options } from 'vscode-wasi';

if (parentPort === null) {
	process.exit();
}

const connection = new ClientConnection<Requests | ProcExitRequest, Ready>(parentPort);
connection.serviceReady().then(async (_params) => {
	const name = 'WASI Minimal Example';
	const apiClient = new ApiClient(connection);
	const mapDir: Options['mapDir'] = [];
	const root = URI.file(path.join(__dirname, '..', 'python'));
	mapDir.push({ name: '/', uri: root });
	const exitHandler = (rval: number): void => {
		apiClient.procExit(rval);
	};
	const wasi = WASI.create(name, apiClient, exitHandler, {
		mapDir,
		argv: ['-v', 'app.py'],
		env: { PYTHONPATH: '/build/lib.wasi-wasm32-3.12' }
	});
	const wasmFile = path.join(__dirname, '..', 'python', 'python.wasm');
	// const wasmFile = path.join(__dirname, '../rust/target/wasm32-wasi/debug/minimal.wasm');
	const binary = fs.readFileSync(wasmFile);
	const { instance } = await WebAssembly.instantiate(binary, {
		wasi_snapshot_preview1: wasi
	});
	wasi.initialize((instance.exports.memory as WebAssembly.Memory).buffer);
	(instance.exports._start as Function)();
	apiClient.procExit(0);
}).catch(console.error);
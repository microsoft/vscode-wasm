/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as fs from 'fs';
import * as path from 'path';
import { parentPort  } from 'worker_threads';

import { URI } from 'vscode-uri';

import { ClientConnection, ProcExitRequest, Requests } from 'vscode-sync-rpc/node';
import { ApiClient, APIRequests } from 'vscode-sync-api-client';
import { WASI } from 'vscode-wasi/node';

import { Options } from 'vscode-wasi';

if (parentPort === null) {
	process.exit();
}

const connection = new ClientConnection<APIRequests>(parentPort);
connection.serviceReady().then(async (params) => {
	const name = 'Run base32 test.bat';
	const apiClient = new ApiClient(connection);
	const workspaceFolders = apiClient.workspace.workspaceFolders;
	const mapDir: Options['mapDir'] = [];
	let toRun: string | undefined;
	if (workspaceFolders.length === 1) {
		mapDir.push({ name: path.posix.join(path.posix.sep, 'workspace'), uri: workspaceFolders[0].uri });
	} else {
		for (const folder of workspaceFolders) {
			mapDir.push({ name: path.posix.join(path.posix.sep, 'workspaces', folder.name), uri: folder.uri });
		}
	}
	const exitHandler = (rval: number): void => {
		apiClient.procExit(rval);
	};
	const wasi = WASI.create(name, apiClient, exitHandler, {
		mapDir,
		argv: ['coreutils.wasm', 'base32', 'workspace/test.bat'],
		env: {
			TMP: '/tmp',
			PYTHONPATH: '/build/lib.wasi-wasm32-3.12:/Lib:/workspace'
		}

	});
	const wasmFile = path.join(__dirname, '..', 'coreutils.wasm');
	const binary = fs.readFileSync(wasmFile);
	const { instance } = await WebAssembly.instantiate(binary, {
		wasi_snapshot_preview1: wasi
	});
	wasi.initialize(instance);
	(instance.exports._start as Function)();
	apiClient.procExit(0);
}).catch(console.error);
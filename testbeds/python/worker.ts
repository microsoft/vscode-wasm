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
connection.serviceReady().then(async (params) => {
	const name = 'Python Shell';
	const apiClient = new ApiClient(connection);
	const mapDir: Options['mapDir'] = [];
	let toRun: string | undefined;
	if (params.workspaceFolders.length === 1) {
		const folderUri = URI.revive(params.workspaceFolders[0].uri);
		mapDir.push({ name: path.posix.join(path.posix.sep, 'workspace'), uri: folderUri });
		if (params.pythonFile) {
			const file =  URI.revive(params.pythonFile);
			if (file.toString().startsWith(folderUri.toString())) {
				toRun = path.posix.join(path.posix.sep, 'workspace', file.toString().substring(folderUri.toString().length));
			}
		}
	} else {
		for (const folder of params.workspaceFolders) {
			mapDir.push({ name: path.posix.join(path.posix.sep, 'workspaces', folder.name), uri: URI.revive(folder.uri) });
		}
	}
	const root = URI.file(path.join(__dirname, '..', 'bin'));
	mapDir.push({ name: path.posix.sep, uri: root });
	const exitHandler = (rval: number): void => {
		apiClient.procExit(rval);
	};
	const wasi = WASI.create(name, apiClient, exitHandler, {
		mapDir,
		argv: toRun !== undefined ? ['python', '-X', 'utf8', '-B', toRun] : ['python', '-X', 'utf8', '-B'],
		env: { PYTHONPATH: '/build/lib.wasi-wasm32-3.12:/Lib' }
	});
	const wasmFile = path.join(__dirname, '..', 'bin', 'python.wasm');
	const binary = fs.readFileSync(wasmFile);
	const { instance } = await WebAssembly.instantiate(binary, {
		wasi_snapshot_preview1: wasi
	});
	wasi.initialize((instance.exports.memory as WebAssembly.Memory).buffer);
	(instance.exports._start as Function)();
	apiClient.procExit(0);
}).catch(console.error);
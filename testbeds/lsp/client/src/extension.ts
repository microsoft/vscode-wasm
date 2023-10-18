/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import * as path from 'path';
import { ExtensionContext } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';

let client: LanguageClient;

export async function activate(_context: ExtensionContext) {
	// We need to go one level up since an extension compile the js code into
	// the output folder.
	let wasmModule = path.join(__dirname, '..', '..', 'server', 'target', 'wasm32-wasi-preview1-threads', 'debug', 'server.wasm');
	

	let clientOptions: LanguageClientOptions = {
		documentSelector: [
			{ language: 'bat' },
			{ language: 'bat', notebook: '*' },
			{ scheme: 'file', pattern: '**/.vscode/test.txt' }
		],
		diagnosticCollectionName: 'markers',
	};

	client = new LanguageClient('lspClient', 'LSP Client', serverOptions, clientOptions);
	try {
		await client.start();
	} catch (error) {
		client.error(`Start failed`, error, 'force');
	}
}

export function deactivate() {
	return client.stop();
}
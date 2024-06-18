/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { ExtensionContext, Uri, window, workspace, commands } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, RequestType } from 'vscode-languageclient/node';
import { Wasm, ProcessOptions } from '@vscode/wasm-wasi';
import { createStdioOptions, startServer } from '@vscode/wasm-wasi-lsp';

let client: LanguageClient;
const channel = window.createOutputChannel('LSP WASM Server');

export async function activate(context: ExtensionContext) {
	const wasm: Wasm = await Wasm.load();

	const serverOptions: ServerOptions = async () => {
		const options: ProcessOptions = {
			stdio: createStdioOptions(),
			mountPoints: [
				{ kind: 'workspaceFolder' },
			]
		};
		const filename = Uri.joinPath(context.extensionUri, 'server', 'target', 'wasm32-wasi-preview1-threads', 'release', 'server.wasm');
		const bits = await workspace.fs.readFile(filename);
		const module = await WebAssembly.compile(bits);
		const process = await wasm.createProcess('lsp-server', module, { initial: 160, maximum: 160, shared: true }, options);

		const decoder = new TextDecoder('utf-8');
		process.stderr!.onData((data) => {
			channel.append(decoder.decode(data));
		});

		return startServer(process);
	};

	const clientOptions: LanguageClientOptions = {
		documentSelector: [ { language: 'bat' } ],
		outputChannel: channel,
		diagnosticCollectionName: 'markers',
	};

	client = new LanguageClient('lspClient', 'LSP Client', serverOptions, clientOptions);
	try {
		await client.start();
	} catch (error) {
		client.error(`Start failed`, error, 'force');
	}

	type CountFileParams = { dir: string };
	const CountFilesRequest = new RequestType<CountFileParams, number, void>('wasm-language-server/countFilesInDirectory');
	context.subscriptions.push(commands.registerCommand('vscode-samples.wasm-language-server.countFiles', async () => {
		const result = await client.sendRequest(CountFilesRequest, { dir: '/workspace'});
		void window.showInformationMessage(`The workspace contains ${result} files.`);
	}));
}

export function deactivate() {
	return client.stop();
}
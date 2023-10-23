/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { ExtensionContext, Uri, window, workspace } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions } from 'vscode-languageclient/node';
import { Wasm, ProcessOptions, Stdio } from '@vscode/wasm-wasi';
import { runServerProcess } from './lspServer';


let client: LanguageClient;
const channel = window.createOutputChannel('LSP Rust Server');

export async function activate(context: ExtensionContext) {
	const wasm: Wasm = await Wasm.load();

	const serverOptions: ServerOptions = async () => {
		const stdio: Stdio = {
			in: {
				kind: 'pipeIn',
			},
			out: {
				kind: 'pipeOut'
			},
			err: {
				kind: 'pipeOut'
			}
		};

		const options: ProcessOptions = {
			stdio: stdio,
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

		return runServerProcess(process);
	};

	const clientOptions: LanguageClientOptions = {
		documentSelector: [
			{ language: 'bat' }
		],
		outputChannel: channel,
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
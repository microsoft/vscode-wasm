/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { WasmContext, Memory, type ResourceHandle, ResourceManager, Resource } from '@vscode/wasm-component-model';
import * as vscode from 'vscode';

import { api } from './api';
import Types = api.Types;
import OutputChannel = Types.OutputChannel;
import TextDocument = Types.TextDocument;

// Channel implementation
class OutputChannelProxy extends Resource.Default implements OutputChannel {

	public static $resources: ResourceManager = new ResourceManager.Default<OutputChannel>();

	private channel: vscode.OutputChannel;

	constructor(name: string, languageId?: string) {
		super(OutputChannelProxy.$resources);
		this.channel = vscode.window.createOutputChannel(name, languageId);
	}

	public $drop(): void {
		this.channel.dispose();
	}

	name(): string {
		return this.channel.name;
	}
	append(value: string): void {
		this.channel.append(value);
	}
	appendLine(value: string): void {
		this.channel.appendLine(value);
	}
	clear(): void {
		this.channel.clear();
	}
	show(): void {
		this.channel.show();
	}
}

class TextDocumentProxy extends Resource.Default implements TextDocument {

	public static $resources: ResourceManager = new ResourceManager.Default<TextDocument>();

	private textDocument: vscode.TextDocument;

	constructor(document: vscode.TextDocument) {
		super(TextDocumentProxy.$resources);
		this.textDocument = document;
	}

	public $drop(): void {
		console.log('TextDocumentProxy.$drop');
	}

	public uri(): string {
		return this.textDocument.uri.toString();
	}

	public languageId(): string {
		return this.textDocument.languageId;
	}

	public version(): number {
		return this.textDocument.version;
	}

	public getText(): string {
		return this.textDocument.getText();
	}
}

class CommandRegistry {

	private commands: Map<string, vscode.Disposable> = new Map();
	private callback!: api.Callbacks.executeCommand;

	constructor() {
	}

	initialize(callback: api.Callbacks.executeCommand): void {
		this.callback = callback;
	}

	register(command: string): void {
		const disposable = vscode.commands.registerCommand(command, () => {
			this.callback(command);
		});
		this.commands.set(command, disposable);
	}

	dispose(): void {
		for (const disposable of this.commands.values()) {
			disposable.dispose();
		}
	}
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	const filename = vscode.Uri.joinPath(context.extensionUri, 'target', 'wasm32-unknown-unknown', 'debug', 'example.wasm');
	const bits = await vscode.workspace.fs.readFile(filename);
	const module = await WebAssembly.compile(bits);
	const commandRegistry = new CommandRegistry();
	const wasmContext: WasmContext.Default = new WasmContext.Default();
	const service: api.all.Imports = {
		types: {
			OutputChannel: OutputChannelProxy,
			TextDocument: TextDocumentProxy
		},
		window: {
			createOutputChannel: (name: string, languageId?: string) => {
				return new OutputChannelProxy(name, languageId);
			}
		},
		workspace: {
			registerOnDidChangeTextDocument: () => {
			},
			textDocuments: () => {
				return vscode.workspace.textDocuments.map(document => new TextDocumentProxy(document));
			}
		},
		commands: {
			registerCommand: (command: string) => {
				commandRegistry.register(command);
			}
		}
	}
	const imports = api.all._.imports.create(service, wasmContext)
	const instance = await WebAssembly.instantiate(module, imports);
	wasmContext.initialize(new Memory.Default(instance.exports));
	const exports = api.all._.exports.bind(instance.exports as api.all._.Exports, wasmContext);
	commandRegistry.initialize(exports.callbacks.executeCommand);
	exports.activate();
}
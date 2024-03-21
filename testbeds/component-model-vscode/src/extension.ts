/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { WasmContext, ResourceManagers, Memory, MemoryError, type ResourceHandle } from '@vscode/wasm-component-model';
import * as vscode from 'vscode';

import { vscode as vs } from './vscode';
import Types = vs.Types;
import OutputChannel = Types.OutputChannel;
import TextDocument = Types.TextDocument;

// Channel implementation
class OutputChannelProxy implements OutputChannel {
	public $handle: ResourceHandle | undefined;
	private channel: vscode.OutputChannel;

	constructor(name: string, languageId?: string) {
		this.$handle = undefined;
		this.channel = vscode.window.createOutputChannel(name, languageId);
	}

	public static $drop(_instance: OutputChannelProxy): void {
		_instance.channel.dispose();
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

class TextDocumentProxy implements TextDocument {

	public $handle: ResourceHandle | undefined;
	private textDocument: vscode.TextDocument;

	constructor(document: vscode.TextDocument) {
		this.$handle = undefined;
		this.textDocument = document;
	}

	public static $drop(_instance: TextDocumentProxy): void {
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
	private api!: vs.CommandsEvents;

	constructor() {
	}

	initialize(api: vs.CommandsEvents): void {
		this.api = api;
	}

	register(command: string): void {
		const disposable = vscode.commands.registerCommand(command, () => {
			this.api.executeCommand(command);
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
	const filename = vscode.Uri.joinPath(context.extensionUri, 'target', 'wasm32-unknown-unknown', 'debug', 'calculator.wasm');
	const bits = await vscode.workspace.fs.readFile(filename);
	const module = await WebAssembly.compile(bits);
	let memory: Memory | undefined;
	const commandRegistry = new CommandRegistry();
	const wasmContext: WasmContext = {
		options: { encoding: 'utf-8' },
		managers: ResourceManagers.createDefault(),
		getMemory: () => {
			if (memory === undefined) {
				throw new MemoryError(`Memory not yet initialized`);
			}
			return memory;
		}
	}
	const service: vs.api.Imports = {
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
			}
		},
		commands: {
			registerCommand: (command: string) => {
				commandRegistry.register(command);
			}
		}
	}
	const imports = vs.api._.createImports(service, wasmContext)
	const instance = await WebAssembly.instantiate(module, imports);
	memory = Memory.createDefault(Date.now().toString(), instance.exports);
	const api = vs.api._.bindExports(instance.exports as vs.api._.Exports, wasmContext);
	commandRegistry.initialize(api.commandsEvents);
	api.activate();
}
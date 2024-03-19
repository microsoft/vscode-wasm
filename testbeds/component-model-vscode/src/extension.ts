/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { WasmContext, ResourceManagers, Memory, MemoryError, type ResourceHandle } from '@vscode/wasm-component-model';
import * as vscode from 'vscode';

import { example } from './example';
import calculator = example.calculator;
import Types = example.Types;
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
	private api!: example.CommandsEvents;

	constructor() {
	}

	initialize(api: example.CommandsEvents): void {
		this.api = api;
	}

	register(command: string): void {
		const disposable = vscode.commands.registerCommand(command, () => {
			this.api.execute(command);
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
	const service: calculator.Imports = {
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
			register: (command: string) => {
				commandRegistry.register(command);

			}
		}
	}
	const imports = calculator._.createImports(service, wasmContext)
	const instance = await WebAssembly.instantiate(module, imports);
	memory = Memory.createDefault(Date.now().toString(), instance.exports);
	const api = calculator._.bindExports(instance.exports as calculator._.Exports, wasmContext);
	commandRegistry.initialize(api.commandsEvents);

	vscode.commands.registerCommand('testbed-component-model.run', () => {
		console.log(`Add ${api.calc(Types.Operation.Add({ left: 1, right: 2}))}`);
		console.log(`Sub ${api.calc(Types.Operation.Sub({ left: 10, right: 8 }))}`);
		console.log(`Mul ${api.calc(Types.Operation.Mul({ left: 3, right: 7 }))}`);
		console.log(`Div ${api.calc(Types.Operation.Div({ left: 10, right: 2 }))}`);
	});
}
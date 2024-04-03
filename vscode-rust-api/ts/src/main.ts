/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';

import { WasmContext, ResourceManagers, Memory, MemoryError, type ResourceHandle, ComponentModelTrap } from '@vscode/wasm-component-model';
import { RAL } from '@vscode/wasm-wasi-kit';

import { api } from './api';
import Types = api.Types;
import OutputChannel = Types.OutputChannel;
import TextDocument = Types.TextDocument;

// Channel implementation
class OutputChannelResource implements OutputChannel {
	public $handle: ResourceHandle | undefined;
	private channel: vscode.OutputChannel;

	constructor(name: string, languageId?: string) {
		this.$handle = undefined;
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

class TextDocumentResource implements TextDocument {

	private static handleCounter: number = 1;
	private static readonly handle2Resource: Map<ResourceHandle<TextDocumentResource>, TextDocumentResource> = new Map();
	private static readonly document2Handle: WeakMap<vscode.TextDocument, ResourceHandle<TextDocumentResource>> = new WeakMap();

	public static $handle(value: TextDocumentResource): ResourceHandle {
		return value.$handle;
	}

	public static $resource(handle: ResourceHandle<TextDocumentResource>): TextDocumentResource {
		const result = TextDocumentResource.handle2Resource.get(handle);
		if (result === undefined) {
			throw new ComponentModelTrap(`No TextDocumentProxy found for handle ${handle}`);
		}
		return result;
	}

	public static $drop(handle: ResourceHandle<TextDocumentResource>) {
		const proxy = TextDocumentResource.handle2Resource.get(handle);
		if (proxy === undefined) {
			throw new ComponentModelTrap(`No TextDocumentProxy found for handle ${handle}`);
		}
		TextDocumentResource.handle2Resource.delete(handle);
	}

	public static getOrCreate(document: vscode.TextDocument): TextDocumentResource {
		const handle = TextDocumentResource.document2Handle.get(document);
		if (handle !== undefined) {
			let resource = TextDocumentResource.handle2Resource.get(handle);
			if (resource === undefined) {
				resource = new TextDocumentResource(handle, document);
				TextDocumentResource.handle2Resource.set(handle, resource);
			}
			return resource;
		} else {
			const handle = TextDocumentResource.handleCounter++;
			const resource = new TextDocumentResource(handle, document);
			TextDocumentResource.handle2Resource.set(handle, resource);
			TextDocumentResource.document2Handle.set(document, handle);
			return resource;
		}
	}

	public $handle: ResourceHandle;
	private textDocument: vscode.TextDocument;

	private constructor(handle: ResourceHandle, document: vscode.TextDocument) {
		this.$handle = handle;
		this.textDocument = document;
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

const commandRegistry = new CommandRegistry();
let $exports: api.all.Exports;
export async function activate(_context: vscode.ExtensionContext, module: WebAssembly_.Module): Promise<void> {
	let memory: Memory | undefined;
	const wasmContext: WasmContext = {
		options: { encoding: 'utf-8' },
		resources: new ResourceManagers.Default(),
		getMemory: () => {
			if (memory === undefined) {
				throw new MemoryError(`Memory not yet initialized`);
			}
			return memory;
		}
	};
	const service: api.all.Imports = {
		types: {
			OutputChannel: OutputChannelResource,
			TextDocument: TextDocumentResource
		},
		window: {
			createOutputChannel: (name: string, languageId?: string) => {
				return new OutputChannelResource(name, languageId);
			}
		},
		workspace: {
			registerOnDidChangeTextDocument: () => {
			},
			textDocuments: () => {
				return vscode.workspace.textDocuments.map(document => TextDocumentResource.getOrCreate(document));
			}
		},
		commands: {
			registerCommand: (command: string) => {
				commandRegistry.register(command);
			}
		}
	};
	const imports = api.all._.createImports(service, wasmContext);
	const instance = await RAL().WebAssembly.instantiate(module, imports);
	memory = Memory.createDefault(Date.now().toString(), instance.exports);
	$exports = api.all._.bindExports(instance.exports as api.all._.Exports, wasmContext);
	commandRegistry.initialize($exports.callbacks.executeCommand);
	$exports.activate();
}

export function deactivate(): void {
	commandRegistry.dispose();
	$exports.deactivate();
}
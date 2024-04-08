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

namespace Converter {
	export function asDocumentFilter(value: Types.DocumentFilter): vscode.DocumentFilter {
		return {
			language: value.language,
			scheme: value.scheme,
			pattern: asPattern(value.pattern)
		};
	}

	export function asDocumentFilters(value: Types.DocumentFilter[]): vscode.DocumentFilter[] {
		return value.map(asDocumentFilter);
	}

	function asPattern(value: Types.GlobPattern | undefined | null): vscode.GlobPattern | undefined {
		if (value === undefined || value === null) {
			return undefined;
		}
		switch(value.tag) {
			case Types.GlobPattern.pattern:
				return value.value;
		}
	}
}


interface Extension {
	activate?(): void;
	deactivate?(): void;
}

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

	public static textDocument(document: Types.TextDocument): vscode.TextDocument {
		return (document as TextDocumentResource).textDocument;
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

	unregister(command: string): void {
		const disposable = this.commands.get(command);
		if (disposable !== undefined) {
			this.commands.delete(command);
			disposable.dispose();
		}
	}

	dispose(): void {
		for (const disposable of this.commands.values()) {
			disposable.dispose();
		}
	}

}

const commandRegistry = new CommandRegistry();
let instance: WebAssembly_.Instance;
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
	let textDocumentChangeListener: vscode.Disposable | undefined;
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
				if (textDocumentChangeListener !== undefined) {
					return;
				}
				textDocumentChangeListener = vscode.workspace.onDidChangeTextDocument(e => {
					const document = TextDocumentResource.getOrCreate(e.document);
					$exports.callbacks.didChangeTextDocument({
						document,
						contentChanges: e.contentChanges.map(change => ({
							range: change.range,
							rangeOffset: change.rangeOffset,
							rangeLength: change.rangeLength,
							text: change.text
						}))
					});
				});
			},
			unregisterOnDidChangeTextDocument: () => {
				if (textDocumentChangeListener !== undefined) {
					textDocumentChangeListener.dispose();
					textDocumentChangeListener = undefined;
				}
			},
			textDocuments: () => {
				return vscode.workspace.textDocuments.map(document => TextDocumentResource.getOrCreate(document));
			}
		},
		commands: {
			registerCommand: (command: string) => {
				commandRegistry.register(command);
			},
			unregisterCommand: (command: string) => {
				commandRegistry.unregister(command);
			}
		},
		languages: {
			matchSelector: (selector: Types.DocumentSelector, document: Types.TextDocument) => {
				if (selector.isSingle()) {
					return vscode.languages.match(Converter.asDocumentFilter(selector.value), TextDocumentResource.textDocument(document));
				} else if (selector.isMany()) {
					return vscode.languages.match(Converter.asDocumentFilters(selector.value), TextDocumentResource.textDocument(document));
				} else {
					return 0;
				}
			}
		}
	};
	const imports = api.all._.createImports(service, wasmContext);
	instance = await RAL().WebAssembly.instantiate(module, imports);
	memory = Memory.createDefault(Date.now().toString(), instance.exports);
	const $exports = api.all._.bindExports(instance.exports as api.all._.Exports, wasmContext);
	commandRegistry.initialize($exports.callbacks.executeCommand);
	const extension = instance.exports as Extension;
	if (typeof extension.activate === 'function') {
		extension.activate();
	}
}

export function deactivate(): void {
	commandRegistry.dispose();
	if (instance !== undefined) {
		const extension = instance.exports as Extension;
		if (typeof extension.deactivate === 'function') {
			extension.deactivate();
		}
	}
}
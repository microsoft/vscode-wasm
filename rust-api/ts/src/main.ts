/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';

import { Memory, MemoryError, RAL, Resource, ResourceManager, ResourceManagers, WasmContext, type ResourceHandle } from '@vscode/wasm-component-model';

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
class OutputChannelResource extends Resource.Default implements OutputChannel {

	public static $resources: ResourceManager<OutputChannel> = new ResourceManager.Default();

	private channel: vscode.OutputChannel;

	constructor(name: string, languageId?: string) {
		super(OutputChannelResource.$resources);
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

class TextDocumentResourceManager extends ResourceManager.Default<TextDocumentResource> {

	private readonly document2Handle: WeakMap<vscode.TextDocument, ResourceHandle<TextDocumentResource>> = new WeakMap();

	public getOrCreate(document: vscode.TextDocument): TextDocumentResource {
		const handle = this.document2Handle.get(document);
		if (handle !== undefined) {
			if (this.hasResource(handle)) {
				return this.getResource(handle);
			} else {
				const resource = new TextDocumentResource(document, handle);
				this.registerResource(resource, handle);
				return resource;
			}
		} else {
			const resource = new TextDocumentResource(document);
			this.document2Handle.set(document, resource.$handle());
			return resource;
		}
	}
}

class TextDocumentResource extends Resource.Default implements TextDocument {

	public static readonly $resources: TextDocumentResourceManager = new TextDocumentResourceManager();

	public static textDocument(document: Types.TextDocument): vscode.TextDocument {
		return (document as TextDocumentResource).textDocument;
	}

	private textDocument: vscode.TextDocument;

	public constructor(document: vscode.TextDocument, handle?: ResourceHandle<TextDocumentResource>) {
		if (handle !== undefined) {
			super(handle);
		} else {
			super(TextDocumentResource.$resources);
		}
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

class TextDocumentChangeEventResource extends Resource.Default implements Types.TextDocumentChangeEvent {

	public static readonly $resources: ResourceManager<Types.TextDocumentChangeEvent> = new ResourceManager.Default();

	private readonly event: vscode.TextDocumentChangeEvent;

	constructor(event: vscode.TextDocumentChangeEvent) {
		super(TextDocumentChangeEventResource.$resources);
		this.event = event;
	}

	$drop(): void {
	}

	document(): Types.TextDocument {
		return TextDocumentResource.$resources.getOrCreate(this.event.document);
	}

	contentChanges(): Types.TextDocumentContentChangeEvent[] {
		return [];
	}

	reason(): Types.TextDocumentChangeReason | undefined {
		return undefined;
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
			TextDocument: TextDocumentResource,
			TextDocumentChangeEvent: TextDocumentChangeEventResource
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
					const event = new TextDocumentChangeEventResource(e);
					$exports.callbacks.didChangeTextDocument(event);

					// const document = TextDocumentResource.getOrCreate(e.document);
					// $exports.callbacks.didChangeTextDocument({
					// 	document,
					// 	contentChanges: e.contentChanges.map(change => ({
					// 		range: change.range,
					// 		rangeOffset: change.rangeOffset,
					// 		rangeLength: change.rangeLength,
					// 		text: change.text
					// 	}))
					// });
				});
			},
			unregisterOnDidChangeTextDocument: () => {
				if (textDocumentChangeListener !== undefined) {
					textDocumentChangeListener.dispose();
					textDocumentChangeListener = undefined;
				}
			},
			textDocuments: () => {
				return vscode.workspace.textDocuments.map(document => TextDocumentResource.$resources.getOrCreate(document));
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
	const imports = api.all._.imports.create(service, wasmContext);
	instance = await RAL().WebAssembly.instantiate(module, imports);
	memory = new Memory.Default(instance.exports);
	const $exports = api.all._.exports.bind(instance.exports as api.all._.Exports, wasmContext);
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
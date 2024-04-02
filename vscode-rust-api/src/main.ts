/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { WasmContext, ResourceManagers, Memory, MemoryError, type ResourceHandle, ComponentModelTrap } from '@vscode/wasm-component-model';

import { api } from './api';
import Types = api.Types;
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

	private const finalization = new FinalizationRegistry((uri: string) => {

	});

	private static handle2Resource: Map<ResourceHandle<TextDocumentProxy>, TextDocumentProxy> = new Map();
	private static weakRegistry: Map<string, WeakRef<TextDocumentProxy>> = new Map();

	public static $handle(value: TextDocumentProxy): ResourceHandle {
	}

	public static $resource(handle: ResourceHandle<TextDocumentProxy>): TextDocumentProxy {
		const result = TextDocumentProxy.handle2Resource.get(handle);
		if (result === undefined) {
			throw new ComponentModelTrap(`No TextDocumentProxy found for handle ${handle}`);
		}
		return result;
	}

	public static $drop(handle: ResourceHandle<TextDocumentProxy>) {
		const resource = TextDocumentProxy.handle2Resource.get(handle);
		if (resource === undefined) {
			throw new ComponentModelTrap(`No TextDocumentProxy found for handle ${handle}`);
		}
	}

	public static getOrCreate(document: vscode.TextDocument): TextDocumentProxy {
		const uri = document.uri.toString();
		let proxy = TextDocumentProxy.handle2Resource.get(uri);
		if (proxy === undefined) {
			proxy = new TextDocumentProxy(document);
			TextDocumentProxy.handle2Resource.set(uri, proxy);
		}
		return proxy;
	}

	public $handle: ResourceHandle | undefined;
	private textDocument: vscode.TextDocument;

	private constructor(document: vscode.TextDocument) {
		this.$handle = undefined;
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

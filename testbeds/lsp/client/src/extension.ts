/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { ExtensionContext, Uri, window, workspace } from 'vscode';
import { LanguageClient, LanguageClientOptions, Message, ServerOptions, WriteableStreamMessageWriter, Disposable, Emitter, Event, ReadableStreamMessageReader } from 'vscode-languageclient/node';
import { Wasm, ProcessOptions, Stdio, Writable, Readable } from '@vscode/wasm-wasi';


interface ReadableStream {
	onData(listener: (data: Uint8Array) => void): Disposable;
	onClose(listener: () => void): Disposable;
	onError(listener: (error: any) => void): Disposable;
	onEnd(listener: () => void): Disposable;
}

class ReadableStreamImpl implements ReadableStream {

	private readonly errorEmitter: Emitter<[Error, Message | undefined, number | undefined]>;
	private readonly closeEmitter: Emitter<void>;
	private readonly endEmitter: Emitter<void>;

	private readonly readable: Readable;

	constructor(readable: Readable) {
		this.errorEmitter = new Emitter<[Error, Message, number]>();
		this.closeEmitter = new Emitter<void>();
		this.endEmitter = new Emitter<void>();
		this.readable = readable;
	}

	public get onData(): Event<Uint8Array> {
		return this.readable.onData;
	}

	public get onError(): Event<[Error, Message | undefined, number | undefined]> {
		return this.errorEmitter.event;
	}

	public get onClose(): Event<void> {
		return this.closeEmitter.event;
	}

	public onEnd(listener: () => void): Disposable {
		return this.endEmitter.event(listener);
	}
}

type MessageBufferEncoding = 'ascii' | 'utf-8';
interface WritableStream {
	onClose(listener: () => void): Disposable;
	onError(listener: (error: any) => void): Disposable;
	onEnd(listener: () => void): Disposable;
	write(data: Uint8Array): Promise<void>;
	write(data: string, encoding: MessageBufferEncoding): Promise<void>;
	end(): void;
}

class WritableStreamImpl implements WritableStream {

	private readonly errorEmitter: Emitter<[Error, Message | undefined, number | undefined]>;
	private readonly closeEmitter: Emitter<void>;
	private readonly endEmitter: Emitter<void>;

	private readonly writable: Writable;

	constructor(writable: Writable) {
		this.errorEmitter = new Emitter<[Error, Message, number]>();
		this.closeEmitter = new Emitter<void>();
		this.endEmitter = new Emitter<void>();
		this.writable = writable;
	}

	public get onError(): Event<[Error, Message | undefined, number | undefined]> {
		return this.errorEmitter.event;
	}

	public get onClose(): Event<void> {
		return this.closeEmitter.event;
	}

	public onEnd(listener: () => void): Disposable {
		return this.endEmitter.event(listener);
	}

	public write(data: string | Uint8Array, _encoding?: MessageBufferEncoding): Promise<void> {
		if (typeof data === 'string') {
			return this.writable.write(data, 'utf-8');
		} else {
			return this.writable.write(data);
		}
	}

	public end(): void {
	}
}

let client: LanguageClient;
export async function activate(context: ExtensionContext) {
	const wasm: Wasm = await Wasm.load();

	const pty = wasm.createPseudoterminal();
	const terminal = window.createTerminal({ name: 'LSP', pty, isTransient: true });
	terminal.show(true);

	const serverOptions: ServerOptions = async () => {
		const stdio: Stdio = {
			in: {
				kind: 'pipeIn',
			},
			out: {
				kind: 'pipeOut'
			},
			err: pty.stdio.err
		};

		const options: ProcessOptions = {
			stdio: stdio,
			mountPoints: [
				{ kind: 'workspaceFolder' },
			]
		};
		const filename = Uri.joinPath(context.extensionUri, 'server', 'target', 'wasm32-wasi-preview1-threads', 'debug', 'server.wasm');
		const bits = await workspace.fs.readFile(filename);
		const module = await WebAssembly.compile(bits);
		const process = await wasm.createProcess('lsp-server', module, { initial: 160, maximum: 160, shared: true }, options);

		const readableStream = new ReadableStreamImpl(process.stdout!);
		const writableStream = new WritableStreamImpl(process.stdin!);

		process.run().then(undefined, error => {
			console.error(`Launching lsp server failed: ${error.toString()}`);
		});

		return { reader: new ReadableStreamMessageReader(readableStream), writer: new WriteableStreamMessageWriter(writableStream), detached: false };
	};

	const clientOptions: LanguageClientOptions = {
		documentSelector: [
			{ language: 'bat' }
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
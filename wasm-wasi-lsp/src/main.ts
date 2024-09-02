/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as vscode from 'vscode';

import { Readable, WasmProcess, Writable, type Stdio } from '@vscode/wasm-wasi/v1';
import { Disposable, Emitter, Event, Message, MessageTransports, RAL, ReadableStreamMessageReader, WriteableStreamMessageWriter } from 'vscode-languageclient';

class ReadableStreamImpl implements RAL.ReadableStream {

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

	public fireError(error: any, message?: Message, count?: number): void {
		this.errorEmitter.fire([error, message, count]);
	}

	public get onClose(): Event<void> {
		return this.closeEmitter.event;
	}

	public fireClose(): void {
		this.closeEmitter.fire(undefined);
	}

	public onEnd(listener: () => void): Disposable {
		return this.endEmitter.event(listener);
	}

	public fireEnd(): void {
		this.endEmitter.fire(undefined);
	}
}

type MessageBufferEncoding = RAL.MessageBufferEncoding;

class WritableStreamImpl implements RAL.WritableStream {

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

	public fireError(error: any, message?: Message, count?: number): void {
		this.errorEmitter.fire([error, message, count]);
	}

	public get onClose(): Event<void> {
		return this.closeEmitter.event;
	}

	public fireClose(): void {
		this.closeEmitter.fire(undefined);
	}

	public onEnd(listener: () => void): Disposable {
		return this.endEmitter.event(listener);
	}

	public fireEnd(): void {
		this.endEmitter.fire(undefined);
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

export function createStdioOptions(): Stdio {
	return {
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
}

export async function startServer(process: WasmProcess, readable: Readable | undefined = process.stdout, writable: Writable | undefined = process.stdin): Promise<MessageTransports> {

	if (readable === undefined || writable === undefined) {
		throw new Error('Process created without streams or no streams provided.');
	}

	const reader = new ReadableStreamImpl(readable);
	const writer = new WritableStreamImpl(writable);

	process.run().then((value) => {
		if (value === 0) {
			reader.fireEnd();
		} else {
			reader.fireError([new Error(`Process exited with code: ${value}`), undefined, undefined]);
		}
	}, (error) => {
		reader.fireError([error, undefined, undefined]);
	});

	return { reader: new ReadableStreamMessageReader(reader), writer: new WriteableStreamMessageWriter(writer), detached: false };
}

export function createUriConverters(): { code2Protocol: (value: vscode.Uri) => string; protocol2Code: (value: string) => vscode.Uri } | undefined {
	const folders = vscode.workspace.workspaceFolders;
	if (folders === undefined || folders.length === 0) {
		return undefined;
	}
	const c2p: Map<string, string> = new Map();
	const p2c: Map<string, string> = new Map();
	if (folders.length === 1) {
		const folder = folders[0];
		c2p.set(folder.uri.toString(), 'file:///workspace');
		p2c.set('file:///workspace', folder.uri.toString());
	} else {
		for (const folder of folders) {
			const uri = folder.uri.toString();
			c2p.set(uri, `file:///workspace/${folder.name}`);
			p2c.set(`file:///workspace/${folder.name}`, uri);
		}
	}
	return {
		code2Protocol: (uri: vscode.Uri) => {
			const str = uri.toString();
			for (const key of c2p.keys()) {
				if (str.startsWith(key)) {
					return str.replace(key, c2p.get(key) ?? '');
				}
			}
			return str;
		},
		protocol2Code: (value: string) => {
			for (const key of p2c.keys()) {
				if (value.startsWith(key)) {
					return vscode.Uri.parse(value.replace(key, p2c.get(key) ?? ''));
				}
			}
			return vscode.Uri.parse(value);
		}
	};
}
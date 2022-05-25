/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { EventEmitter, Pseudoterminal } from 'vscode';

import RAL, { BaseServiceConnection, Requests } from 'vscode-sync-rpc';

const terminalRegExp = /(\r\n)|(\n)/gm;

type ApiServiceConnection<Ready extends {} | undefined = undefined> = BaseServiceConnection<Requests, Ready>;

export class ApiService<Ready extends {} | undefined = undefined> {

	private readonly connection: ApiServiceConnection<Ready>;
	private readonly textEncoder: RAL.TextEncoder;
	private readonly textDecoder: RAL.TextDecoder;

	private readonly pty: Pseudoterminal;
	private readonly ptyWriteEmitter: EventEmitter<string>;
	private inputBuffer: string[];
	private inputAvailable: undefined | ((inputBuffer: string[]) => void);

	constructor(name: string, receiver: ApiServiceConnection<Ready>) {
		this.connection = receiver;
		this.textEncoder = RAL().TextEncoder.create();
		this.textDecoder = RAL().TextDecoder.create();

		this.ptyWriteEmitter = new EventEmitter<string>();
		this.pty = {
			onDidWrite: this.ptyWriteEmitter.event,
			open: () => {
				this.ptyWriteEmitter.fire(`\x1b[31m${name}\x1b[0m\r\n\r\n`);
			},
			close: () => {
			},
			handleInput: (data: string) => {
				// Echo the data
				this.ptyWriteEmitter.fire(data === '\r' ? '\r\n' : data);
				this.inputBuffer.push(data === '\r' ? '\n' : data);
				if (this.inputAvailable !== undefined) {
					this.inputAvailable(this.inputBuffer);
					this.inputBuffer = [];
					this.inputAvailable = undefined;
				}
			}
		};
		this.inputBuffer = [];

		this.connection.onRequest('terminal/write', (params) => {
			if (params !== undefined && params.binary !== undefined) {
				const str = this.textDecoder.decode(params.binary).replace(terminalRegExp, (match: string, m1: string, m2: string) => {
					if (m1) {
						return m1;
					} else if (m2) {
						return '\r\n';
					} else {
						return match;
					}
				});
				this.ptyWriteEmitter.fire(str);
			}
			return { errno: 0 };
		});

		this.connection.onRequest('terminal/read', async (buffer) => {
			let data: string[];
			if (this.inputBuffer.length === 0) {
				const wait = new Promise<string[]>((resolve) => {
					this.inputAvailable = resolve;
				});
				data = await wait;
			} else {
				data = this.inputBuffer;
				this.inputBuffer = [];
			}
			const text = data.join('');
			// const bufferSize = (params as { bufferSize: number}).bufferSize;
			buffer.set(this.textEncoder.encode(text));
			return { errno: 0 };
		});
	}

	public getPty(): Pseudoterminal {
		return this.pty;
	}
}
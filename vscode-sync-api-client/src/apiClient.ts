/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import RAL, { BaseClientConnection } from 'vscode-sync-rpc';

export interface Terminal {
	write(value: string, encoding?: string): void;
	write(value: Uint8Array): void;
	read(bufferSize: number): Uint8Array | undefined;
}

class TerminalImpl implements Terminal {

	private readonly connection: BaseClientConnection;
	private readonly encoder: RAL.TextEncoder;

	constructor(connection: BaseClientConnection, encoder: RAL.TextEncoder) {
		this.connection = connection;
		this.encoder = encoder;
	}

	public write(value: string, encoding?: string): void;
	public write(value: Uint8Array): void;
	public write(value: string | Uint8Array, _encoding?: string): void {
		const binary = (typeof value === 'string')
			? this.encoder.encode(value) : value;
		this.connection.request('terminal/write', { binary });
	}
	public read(bufferSize: number): Uint8Array | undefined {
		const result = this.connection.request('terminal/read', { bufferSize }, bufferSize + 4);
		if (result.errno !== 0) {
			return undefined;
		}
		return result.data;
	}
}

export class ApiClient {

	private readonly connection: BaseClientConnection;
	private readonly encoder: RAL.TextEncoder;

	public readonly terminal: Terminal;

	constructor(connection: BaseClientConnection) {
		this.connection = connection;
		this.encoder = RAL().TextEncoder.create();
		this.terminal = new TerminalImpl(this.connection, this.encoder);
	}
}
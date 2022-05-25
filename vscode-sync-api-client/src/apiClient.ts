/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import RAL, { BaseClientConnection, RequestResult, Requests } from 'vscode-sync-rpc';

export interface Terminal {
	write(value: string, encoding?: string): void;
	write(value: Uint8Array): void;
	read(bufferSize: number): Uint8Array | undefined;
}

type ApiClientConnection<Ready extends {} | undefined = undefined> = BaseClientConnection<Requests, Ready>;

class TerminalImpl<Ready extends {} | undefined = undefined> implements Terminal {

	private readonly connection: ApiClientConnection<Ready>;
	private readonly encoder: RAL.TextEncoder;

	constructor(connection: ApiClientConnection<Ready>, encoder: RAL.TextEncoder) {
		this.connection = connection;
		this.encoder = encoder;
	}

	public write(value: string, encoding?: string): void;
	public write(value: Uint8Array): void;
	public write(value: string | Uint8Array, _encoding?: string): void {
		const binary = (typeof value === 'string')
			? this.encoder.encode(value) : value;
		this.connection.sendRequest('terminal/write', { binary });
	}
	public read(bufferSize: number): Uint8Array | undefined {
		const result = this.connection.sendRequest('terminal/read', bufferSize);
		if (RequestResult.hasData(result)) {
			return result.data;
		}
		return undefined;
	}
}

export class ApiClient<Ready extends {} | undefined = undefined> {

	private readonly connection: ApiClientConnection<Ready>;
	private readonly encoder: RAL.TextEncoder;

	public readonly terminal: Terminal;

	constructor(connection: ApiClientConnection<Ready>) {
		this.connection = connection;
		this.encoder = RAL().TextEncoder.create();
		this.terminal = new TerminalImpl(this.connection, this.encoder);
	}
}
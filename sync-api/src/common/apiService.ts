/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import RAL from './ral';

import { EventEmitter } from 'vscode';

import { BaseServiceConnection, Params } from './connection';

const terminalRegExp = /(\r\n)|(\n)/gm;

export class ApiService {

	private readonly connection: BaseServiceConnection;
	private readonly textDecoder: RAL.TextDecoder;

	constructor(receiver: BaseServiceConnection, ptyEventEmitter: EventEmitter<string>) {
		this.connection = receiver;
		this.textDecoder = RAL().TextDecoder.create();

		this.connection.onRequest('terminal/write', (params: Params | undefined) => {
			if (params !== undefined && params.binary !== undefined) {
				const str = this.textDecoder.decode(params.binary).replace(terminalRegExp, (match, m1, m2) => {
					if (m1) {
						return m1;
					} else if (m2) {
						return '\r\n';
					} else {
						return match;
					}
				});
				ptyEventEmitter.fire(str);
			}
			return { errno: 0 };
		});
	}
}
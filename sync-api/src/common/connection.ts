/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import RAL from './ral';

type Message = {
	method: string;
	params?: null | undefined | object;
};

type Request = Message;

namespace Request {
	export function is(value: any): value is Request {
		const candidate: Request = value;
		return candidate !== undefined && candidate !== null && typeof candidate.method === 'string';
	}
}

type RequestHandler = {
	(params: any): { errno: 0; data: Uint8Array } | { errno: number };
};

export abstract class BaseSender {

	private readonly textEncoder: RAL.TextEncoder;

	constructor() {
		this.textEncoder = RAL().TextEncoder.create();
	}

	public request(method: string, params: object, resultLength: number): { errno: 0; data: Uint8Array } | { errno: number } {
		const request: Request = { method };
		if (params !== undefined) {
			request.params = params;
		}
		const requestData = this.textEncoder.encode(JSON.stringify(request, undefined, 0));

		const headerLength = 4 /** unused */ + 8 /** message header */ + 12 /** result header */;
		const bufferLength = headerLength + requestData.byteLength + resultLength;
		const sharedArrayBuffer: SharedArrayBuffer = new SharedArrayBuffer(bufferLength);
		const header = new Uint32Array(sharedArrayBuffer, 4);
		const data = new Uint8Array(sharedArrayBuffer, headerLength);

		// The offset and length of the request data in the shared memory
		header[0] = headerLength;
		header[1] = requestData.length;
		header[2] = headerLength + requestData.length;
		header[3] = resultLength;
		header[4] = 0;

		data.set(requestData);

		this.postMessage(sharedArrayBuffer);

		const sync = new Int32Array(sharedArrayBuffer, 0);
		Atomics.store(sync, 0, 0);
		Atomics.wait(sync, 0, 0);
		const errno: number = header[4];
		if (errno !== 0) {
			return { errno };
		} else {
			return { errno: 0, data: new Uint8Array(sharedArrayBuffer, header[2]) };
		}
	}

	protected abstract postMessage(sharedArrayBuffer: SharedArrayBuffer): any;
}

export abstract class BaseReceiver {

	private readonly textDecoder: RAL.TextDecoder;
	private readonly requestHandlers: Map<string, RequestHandler>;

	constructor() {
		this.textDecoder = RAL().TextDecoder.create();
		this.requestHandlers = new Map();
	}

	onRequest(method: string, handler: RequestHandler): void {
		this.requestHandlers.set(method, handler);
	}

	protected handleRequest(sharedArrayBuffer: SharedArrayBuffer): void {
		const header = new Uint32Array(sharedArrayBuffer, 4);
		const messageOffset = header[1];
		const messageLength = header[2];

		try {
			const message = JSON.parse(this.textDecoder.decode(new Uint8Array(sharedArrayBuffer, messageOffset, messageLength)));
			if (Request.is(message)) {
				const handler = this.requestHandlers.get(message.method);
				if (handler !== undefined) {
					const result = handler(message.params);
					header[4] = result.errno;
					if (result.errno === 0) {
						
					}
				}
			} else {
				header[4] = -2;
			}
		} catch (error) {
			header[4] = -1;
		}
		const sync = new Int32Array(sharedArrayBuffer, 0);
		Atomics.notify(sync, 0);
	}
}
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import RAL from './ral';

export type Message = {
	method: string;
	params?: Params;
};

export type Params = {
	[key: string]: null | undefined | number | boolean | string | object | Uint8Array;
	binary?: Uint8Array;
};

export type Request = {
	id: number;
} & Message;

export namespace Request {
	export function is(value: any): value is Request {
		const candidate: Request = value;
		return candidate !== undefined && candidate !== null && typeof candidate.method === 'string';
	}
}

export type RequestResult = { errno: 0; data: Uint8Array } | { errno: number };
export namespace RequestResult {
	export function hasData(result: RequestResult): result is { errno: 0; data: Uint8Array } {
		return result.errno === 0 && (result as { data?: Uint8Array }).data !== undefined;
	}
}

export type RequestHandler = {
	(params?: Params): RequestResult;
};

export type Notification = Message;

export namespace Notification {
	export function is(value: any): value is Notification {
		const candidate: Notification = value;
		return candidate !== undefined && candidate !== null && typeof candidate.method === 'string' && typeof (candidate as Request).id === 'undefined';
	}
}

const enum HeaderIndex {
	messageOffset = 0,
	messageLength = 1,
	binaryParamOffset = 2,
	binaryParamLength = 3,
	errno = 4,
	resultOffset = 5,
	resultLength = 6
}

const enum HeaderSize {
	request = 8,
	binary = 8,
	result = 12,
	total = HeaderSize.request + HeaderSize.binary + HeaderSize.result
}

const enum SyncSize {
	total = 4
}

type PromiseCallbacks = {
	resolve: (response: any) => void;
	reject: (error: any) => void;
};

export abstract class BaseClientConnection<T extends Params = Params> {

	private id: number;
	private readonly textEncoder: RAL.TextEncoder;
	private readonly readyPromise: Promise<T>;
	private readyCallbacks: PromiseCallbacks | undefined;

	constructor() {
		this.id = 1;
		this.textEncoder = RAL().TextEncoder.create();
		this.readyPromise = new Promise((resolve, reject) => {
			this.readyCallbacks = { resolve, reject };
		});
	}

	public serviceReady(): Promise<T> {
		return this.readyPromise;
	}

	public request(method: string, params?: Params): { errno: number };
	public request(method: string, params: Params | undefined, resultLength: number): { errno: 0; data: Uint8Array };
	public request(method: string, params: Params | undefined, resultLength: number = 0): { errno: 0; data: Uint8Array } | { errno: number } {
		const request: Request = { id: this.id++, method };
		if (params !== undefined) {
			request.params = {};
			for (const property of Object.keys(params)) {
				if (property !== 'binary') {
					request.params[property] = params[property];
				}
			}
		}

		const requestData = this.textEncoder.encode(JSON.stringify(request, undefined, 0));
		const binaryData = params?.binary;
		const binaryDataLength = binaryData !== undefined ? binaryData.byteLength : 0;

		const sharedArrayBufferLength = SyncSize.total + HeaderSize.total + requestData.byteLength + binaryDataLength + resultLength;
		const sharedArrayBuffer: SharedArrayBuffer = new SharedArrayBuffer(sharedArrayBufferLength);

		const requestOffset = SyncSize.total + HeaderSize.total;
		const binaryOffset = requestOffset + requestData.byteLength;
		const resultOffset = binaryOffset + binaryDataLength;

		const header = new Uint32Array(sharedArrayBuffer, SyncSize.total, HeaderSize.total / 4);
		header[HeaderIndex.messageOffset] = requestOffset;
		header[HeaderIndex.messageLength] = requestData.byteLength;
		header[HeaderIndex.binaryParamOffset] = binaryOffset;
		header[HeaderIndex.binaryParamLength] = binaryDataLength;
		header[HeaderIndex.errno] = 0;
		header[HeaderIndex.resultOffset] = resultOffset;
		header[HeaderIndex.resultLength] = resultLength;

		const raw = new Uint8Array(sharedArrayBuffer);
		raw.set(requestData, requestOffset);
		if (binaryData !== undefined) {
			raw.set(binaryData, binaryOffset);
		}

		// Send the shard array buffer to the other worker
		const sync = new Int32Array(sharedArrayBuffer, 0, 1);
		Atomics.store(sync, 0, 0);
		this.postMessage(sharedArrayBuffer);

		// Wait for the answer
		Atomics.wait(sync, 0, 0);

		const errno: number = header[HeaderIndex.errno];
		if (errno !== 0) {
			return { errno };
		} else {
			return { errno: 0, data: new Uint8Array(sharedArrayBuffer, header[HeaderIndex.resultOffset], header[HeaderIndex.resultLength]) };
		}
	}

	protected abstract postMessage(sharedArrayBuffer: SharedArrayBuffer): any;

	protected handleMessage(message: Message): void {
		if (message.method === '$/ready') {
			this.readyCallbacks!.resolve(message.params);
		}
	}
}

export abstract class BaseServiceConnection<T extends Params = Params> {

	private readonly textDecoder: RAL.TextDecoder;
	private readonly requestHandlers: Map<string, RequestHandler>;

	constructor() {
		this.textDecoder = RAL().TextDecoder.create();
		this.requestHandlers = new Map();
	}

	onRequest(method: string, handler: RequestHandler): void {
		this.requestHandlers.set(method, handler);
	}

	protected handleMessage(sharedArrayBuffer: SharedArrayBuffer): void {
		const header = new Uint32Array(sharedArrayBuffer, SyncSize.total, HeaderSize.total / 4);
		const requestOffset = header[HeaderIndex.messageOffset];
		const requestLength = header[HeaderIndex.messageLength];

		try {
			const message = JSON.parse(this.textDecoder.decode(new Uint8Array(sharedArrayBuffer, requestOffset, requestLength)));
			if (Request.is(message)) {
				const binaryParamsLength = header[HeaderIndex.binaryParamLength];
				if (binaryParamsLength > 0) {
					const binaryParamsOffset = header[HeaderIndex.binaryParamOffset];
					const binary = new Uint8Array(sharedArrayBuffer, binaryParamsOffset, binaryParamsLength);
					message.params = message.params ?? { };
					message.params.binary = binary;
				}
				const handler = this.requestHandlers.get(message.method);
				if (handler !== undefined) {
					const result = handler(message.params);
					header[HeaderIndex.errno] = result.errno;
					if (RequestResult.hasData(result)) {
						const resultOffset = header[HeaderIndex.resultOffset];
						const resultLength = header[HeaderIndex.resultLength];
						if (result.data.byteLength <= requestLength) {
							header[HeaderIndex.resultLength] = result.data.byteLength;
							const binary = new Uint8Array(sharedArrayBuffer, resultOffset, result.data.byteLength);
							binary.set(result.data);
						} else {
							header[HeaderIndex.errno] = -4;
						}
					}
				} else {
					header[HeaderIndex.errno] = - 3;
				}
			} else {
				header[HeaderIndex.errno] = -2;
			}
		} catch (error) {
			header[HeaderIndex.errno] = -1;
		}
		const sync = new Int32Array(sharedArrayBuffer, 0, 1);
		Atomics.notify(sync, 0);
	}

	public signalReady(params: T): void {
		const notification: Notification = { method: '$/ready', params };
		this.postMessage(notification);
	}

	protected abstract postMessage(message: Message): void;
}
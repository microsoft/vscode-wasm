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
	(arg1?: Params | Uint8Array, arg2?: Uint8Array): RequestResult | Promise<RequestResult>;
};

export type Notification = Message;

export namespace Notification {
	export function is(value: any): value is Notification {
		const candidate: Notification = value;
		return candidate !== undefined && candidate !== null && typeof candidate.method === 'string' && typeof (candidate as Request).id === 'undefined';
	}
}

type PromiseCallbacks = {
	resolve: (response: any) => void;
	reject: (error: any) => void;
};

export type MessageType = {
	method: string;
	params?: null | object;
};

export type RequestType = MessageType & ({
	result?: Uint8Array | Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array | object | null;
});

type UnionToIntersection<U> =
	(U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

type MethodKeys<Messages extends MessageType> = {
	[M in Messages as M['method']]: M['method'];
};

type TypeName<T extends Uint8Array | Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array> =
	T extends Uint8Array ? 'Uint8Array' : '';

type _SendRequestSignatures<Requests extends RequestType> = UnionToIntersection<{
 	[R in Requests as R['method']]: R['params'] extends null | undefined
	 	? R['result'] extends null | undefined
			? (method: R['method']) => { errno: number }
			: R['result'] extends Uint8Array | Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array
				? (method: R['method'], params: R['params'], type: TypeName<R['result']>, resultLength: number) => { errno: 0; data: R['result'] } | { errno: number }
				: (method: R['method'], params: R['params']) => { errno: 0; data: R['result'] } | { errno: number }
		: R['result'] extends null | undefined
			? (method: R['method'], params: R['params']) => { errno: number }
			: R['result'] extends Uint8Array | Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array
				? (method: R['method'], params: R['params'], type: TypeName<R['result']>, resultLength: number) => { errno: 0; data: R['result'] } | { errno: number }
				: (method: R['method'], params: R['params']) => { errno: 0; data: R['result'] } | { errno: number }
}[keyof MethodKeys<Requests>]>;

type SendRequestSignatures<Requests extends RequestType | undefined> = [Requests] extends [RequestType] ? _SendRequestSignatures<Requests> : undefined;

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

export abstract class BaseClientConnection<Requests extends RequestType | undefined = undefined, Ready extends {} | undefined = undefined> {

	private id: number;
	private readonly textEncoder: RAL.TextEncoder;
	private readonly readyPromise: Promise<Ready>;
	private readyCallbacks: PromiseCallbacks | undefined;

	constructor() {
		this.id = 1;
		this.textEncoder = RAL().TextEncoder.create();
		this.readyPromise = new Promise((resolve, reject) => {
			this.readyCallbacks = { resolve, reject };
		});
	}

	public serviceReady(): Promise<Ready> {
		return this.readyPromise;
	}

	public readonly sendRequest: SendRequestSignatures<Requests> = this._sendRequest as SendRequestSignatures<Requests>;

	private _sendRequest(method: string): { errno: number };
	private _sendRequest(method: string, params: Params): { errno: number };
	private _sendRequest(method: string, resultLength: number): { errno: number } | { errno: 0; data: Uint8Array };
	private _sendRequest(method: string, params: Params, resultLength: number): { errno: number } | { errno: 0; data: Uint8Array };

	private _sendRequest(method: string, arg1?: Params | number, arg2?: number): { errno: 0; data: Uint8Array } | { errno: number } {
		debugger;
		const request: Request = { id: this.id++, method };
		let params: Params | undefined = undefined;
		let resultLength: number = 0;
		if (typeof arg1 === 'number') {
			resultLength = arg1;
		} else if (arg1 !== undefined || arg1 !== null) {
			params = arg1;
		}
		if (typeof arg2 === 'number') {
			resultLength = arg2;
		}
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

type _HandleRequestSignatures<Requests extends RequestType> = UnionToIntersection<{
 	[R in Requests as R['method']]: R['params'] extends null | undefined
		? R['result'] extends null | undefined
			? (method: R['method'], handler: () => { errno: number } | Promise<{ errno: number }>) => void
			: (method: R['method'], handler: (resultBuffer: R['result']) => { errno: number } | Promise<{ errno: number }>) => void
		: R['result'] extends null | undefined
			? (method: R['method'], handler: (params: R['params']) => { errno: number } | Promise<{ errno: number }>) => void
			: (method: R['method'], handler: (params: R['params'], resultBuffer: R['result']) => { errno: number } | Promise<{ errno: number }>) => void
}[keyof MethodKeys<Requests>]>;

type HandleRequestSignatures<Requests extends RequestType | undefined> = [Requests] extends [RequestType] ?_HandleRequestSignatures<Requests> : undefined;

export abstract class BaseServiceConnection<RequestHandlers extends RequestType | undefined = undefined, Ready extends {} | undefined = undefined> {

	private readonly textDecoder: RAL.TextDecoder;
	private readonly requestHandlers: Map<string, RequestHandler>;

	constructor() {
		this.textDecoder = RAL().TextDecoder.create();
		this.requestHandlers = new Map();
	}


	public readonly onRequest: HandleRequestSignatures<RequestHandlers> = this._onRequest as HandleRequestSignatures<RequestHandlers>;

	private _onRequest(method: string, handler: RequestHandler): void {
		this.requestHandlers.set(method, handler);
	}

	protected async handleMessage(sharedArrayBuffer: SharedArrayBuffer): Promise<void> {
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
					const resultOffset = header[HeaderIndex.resultOffset];
					const resultLength = header[HeaderIndex.resultLength];
					const resultBuffer = resultLength > 0 ? new Uint8Array(sharedArrayBuffer, resultOffset, resultLength) : undefined;
					const requestResult = message.params !== undefined ? handler(message.params, resultBuffer) : handler(resultBuffer);
					const result = requestResult instanceof Promise ? await requestResult : requestResult;
					header[HeaderIndex.errno] = result.errno;
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

	public signalReady(params: Ready): void {
		const notification: Notification = { method: '$/ready', params };
		this.postMessage(notification);
	}

	protected abstract postMessage(message: Message): void;
}
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import RAL from './ral';
import { Disposable } from './disposable';

export type Message = {
	method: string;
	params?: Params;
};

type ArrayTypes = Uint8Array | Uint16Array | Uint32Array | Int8Array | Int32Array | Int32Array;

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
	result?: ArrayTypes | object | null;
});


class $None {
	static readonly kind: 0 = 0;
	#kind: 0;
	constructor() {
		this.#kind = 0;
	}
	get kind() {
		return this.#kind;
	}
}

const None: $None = new $None();

class $Uint8Length {
	static readonly kind: 1 = 1;
	#kind: 1;
	#length: number;
	constructor(length: number) {
		this.#kind = 1;
		this.#length = length;
	}
	get length(): number {
		return this.#length;
	}
	get kind() {
		return this.#kind;
	}
}

export function Uint8Length(length: number): $Uint8Length {
	return new $Uint8Length(length);
}

class $Uint16Length {
	static readonly kind: 2 = 2;
	#kind: 2;
	#length: number;
	constructor(length: number) {
		this.#kind = 2;
		this.#length = length;
	}
	get length(): number {
		return this.#length;
	}
	get kind() {
		return this.#kind;
	}
}

export function Uint16Length(length: number): $Uint16Length {
	return new $Uint16Length(length);
}

class $Uint32Length {
	static readonly kind: 3 = 3;
	#kind: 3;
	#length: number;
	constructor(length: number) {
		this.#kind = 3;
		this.#length = length;
	}
	get length(): number {
		return this.#length;
	}
	get kind() {
		return this.#kind;
	}
}

export function Uint32Length(length: number): $Uint32Length {
	return new $Uint32Length(length);
}

class $Int8Length {
	static readonly kind: 4 = 4;
	#kind: 4;
	#length: number;
	constructor(length: number) {
		this.#kind = 4;
		this.#length = length;
	}
	get length(): number {
		return this.#length;
	}
	get kind() {
		return this.#kind;
	}
}

export function Int8Length(length: number): $Int8Length {
	return new $Int8Length(length);
}

class $Int16Length {
	static readonly kind: 5 = 5;
	#kind: 5;
	#length: number;
	constructor(length: number) {
		this.#kind = 5;
		this.#length = length;
	}
	get length(): number {
		return this.#length;
	}
	get kind() {
		return this.#kind;
	}
}

export function Int16Length(length: number): $Int16Length {
	return new $Int16Length(length);
}

class $Int32Length {
	static readonly kind: 6 = 6;
	#kind: 6;
	#length: number;
	constructor(length: number) {
		this.#kind = 6;
		this.#length = length;
	}
	get length(): number {
		return this.#length;
	}
	get kind() {
		return this.#kind;
	}
}

export function Int32Length(length: number): $Int32Length {
	return new $Int32Length(length);
}

class $VariableSize {
	static readonly kind: 7 = 7;
	#kind: 7;
	constructor() {
		this.#kind = 7;
	}
	get kind() {
		return this.#kind;
	}
}

export const VariableSize: $VariableSize = new $VariableSize();

type ResultType = $None | $Uint8Length | $Uint16Length | $Uint32Length | $Int8Length | $Int16Length | $Int32Length | $VariableSize;
namespace ResultType {
	export function is(value: any): value is ResultType {
		return value instanceof $Uint8Length || value instanceof $Uint16Length || value instanceof $Uint32Length ||
			value instanceof $Int8Length || value instanceof $Int16Length || value instanceof $Int32Length || value instanceof $VariableSize ||
			value instanceof $None;
	}
}

type UnionToIntersection<U> =
	(U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

type MethodKeys<Messages extends MessageType> = {
	[M in Messages as M['method']]: M['method'];
};

type LengthType<T extends Uint8Array | Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array> =
	T extends Uint8Array
		? $Uint8Length
		: T extends Uint16Array
			? $Uint16Length
			: T extends Uint32Array
				? $Uint32Length
				: T extends Int8Array
					? $Int8Length
					: T extends Int16Array
						? $Int16Length
						: T extends Int32Array
							? $Int32Length
							: never;

type _SendRequestSignatures<Requests extends RequestType> = UnionToIntersection<{
 	[R in Requests as R['method']]: R['params'] extends null | undefined
	 	? R['result'] extends null | undefined
			? (method: R['method']) => { errno: number }
			: R['result'] extends Uint8Array | Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array
				? (method: R['method'], resultKind: LengthType<R['result']>) => { errno: 0; data: R['result'] } | { errno: number }
				: (method: R['method'], resultKind: $VariableSize) => { errno: 0; data: R['result'] } | { errno: number }
		: R['result'] extends null | undefined
			? (method: R['method'], params: R['params']) => { errno: number }
			: R['result'] extends Uint8Array | Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array
				? (method: R['method'], params: R['params'], resultKind: LengthType<R['result']>) => { errno: 0; data: R['result'] } | { errno: number }
				: (method: R['method'], params: R['params'], resultKind: $VariableSize) => { errno: 0; data: R['result'] } | { errno: number }
}[keyof MethodKeys<Requests>]>;

type SendRequestSignatures<Requests extends RequestType | undefined> = [Requests] extends [RequestType] ? _SendRequestSignatures<Requests> : undefined;

const enum HeaderIndex {
	messageOffset = 0,
	messageLength = 1,
	binaryParamOffset = 2,
	binaryParamLength = 3,
	errno = 4,
	resultKind = 5,
	resultOffset = 6,
	resultLength = 7
}

const enum HeaderSize {
	request = 8,
	binary = 8,
	result = 16,
	total = HeaderSize.request + HeaderSize.binary + HeaderSize.result
}

const enum SyncSize {
	total = 4
}

function createResultArray(sharedArrayBuffer: SharedArrayBuffer, resultKind: number, resultOffset: number, resultLength: number) {
	switch(resultKind) {
		case $Uint8Length.kind:
			return new Uint8Array(sharedArrayBuffer, resultOffset, resultLength);
		case $Uint16Length.kind:
			return new Uint16Array(sharedArrayBuffer, resultOffset, resultLength);
		case $Uint32Length.kind:
			return new Uint32Array(sharedArrayBuffer, resultOffset, resultLength);
		case $Int8Length.kind:
			return new Int8Array(sharedArrayBuffer, resultOffset, resultLength);
		case $Int16Length.kind:
			return new Int16Array(sharedArrayBuffer, resultOffset, resultLength);
		case $Int32Length.kind:
			return new Int32Array(sharedArrayBuffer, resultOffset, resultLength);
		case $VariableSize.kind:
			// send another request to get the result.
		default:
			throw new Error(`Unknown result kind ${resultKind}`);
	}
}

export abstract class BaseClientConnection<Requests extends RequestType | undefined = undefined, Ready extends {} | undefined = undefined> {

	private id: number;
	private readonly textEncoder: RAL.TextEncoder;
	private readonly textDecoder: RAL.TextDecoder;
	private readonly readyPromise: Promise<Ready>;
	private readyCallbacks: PromiseCallbacks | undefined;

	constructor() {
		this.id = 1;
		this.textEncoder = RAL().TextEncoder.create();
		this.textDecoder = RAL().TextDecoder.create();
		this.readyPromise = new Promise((resolve, reject) => {
			this.readyCallbacks = { resolve, reject };
		});
	}

	public serviceReady(): Promise<Ready> {
		return this.readyPromise;
	}

	public readonly sendRequest: SendRequestSignatures<Requests> = this._sendRequest as SendRequestSignatures<Requests>;

	private _sendRequest(method: string, arg1?: Params | ResultType, arg2?: ResultType): { errno: 0; data: any } | { errno: number } {
		const id = this.id++;
		const request: Request = { id: id, method };
		let params: Params | undefined = undefined;
		let resultType : ResultType = None;
		if (ResultType.is(arg1)) {
			resultType = arg1;
		} else if (arg1 !== undefined || arg1 !== null) {
			params = arg1;
		}
		if (arg2 !== undefined) {
			resultType = arg2;
		}
		if (params !== undefined) {
			request.params = {};
			for (const property of Object.keys(params)) {
				if (property !== 'binary') {
					request.params[property] = params[property];
				}
			}
		}

		const resultKind: number = resultType.kind;
		const resultLength = resultType instanceof $VariableSize || resultType instanceof $None
			? 0
			: resultType.length;

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
		header[HeaderIndex.resultKind] = resultKind;
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
			switch(resultKind) {
				case $None.kind:
					return { errno: 0 };
				case $VariableSize.kind:
					const lazyResultLength = header[HeaderIndex.resultLength];
					if (resultLength === 0) {
						return { errno: 0 };
					}
					const lazyResult = this._sendRequest('$/fetchResult', { resultId: id }, Uint8Length(lazyResultLength));
					if (lazyResult.errno !== 0) {
						return { errno: lazyResult.errno };
					}
					if (RequestResult.hasData(lazyResult)) {
						try {
							const data = JSON.parse(this.textDecoder.decode(lazyResult.data as Uint8Array));
						} catch (error) {

						}
					}


					// send another request to get the result.
				default:
					return { errno: 0, data: createResultArray(sharedArrayBuffer, resultKind, resultOffset, resultLength) };
			}
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
			? (method: R['method'], handler: () => { errno: number } | Promise<{ errno: number }>) => Disposable
			: R['result'] extends ArrayTypes
				? (method: R['method'], handler: (resultBuffer: R['result']) => { errno: number } | Promise<{ errno: number }>) => Disposable
				: (method: R['method'], handler: () => { errno: number } | { errno: 0; data: R['result'] } | Promise<{ errno: number }| { errno: 0; data: R['result'] }>) => Disposable
		: R['result'] extends null | undefined
			? (method: R['method'], handler: (params: R['params']) => { errno: number } | Promise<{ errno: number }>) => Disposable
			: R['result'] extends ArrayTypes
				? (method: R['method'], handler: (params: R['params'], resultBuffer: R['result']) => { errno: number } | Promise<{ errno: number }>) => Disposable
				: (method: R['method'], handler: (params: R['params']) => { errno: number } | { errno: 0; data: R['result'] } | Promise<{ errno: number }| { errno: 0; data: R['result'] }>) => Disposable
}[keyof MethodKeys<Requests>]>;

type HandleRequestSignatures<Requests extends RequestType | undefined> = [Requests] extends [RequestType] ?_HandleRequestSignatures<Requests> : undefined;

type RequestResult = { errno: 0; data: object } | { errno: number };
namespace RequestResult {
	export function hasData(result: RequestResult): result is { errno: 0; data: object } {
		const candidate: { data?: object | null | undefined } = result as { data?: object | null | undefined };
		return candidate.data !== undefined && candidate.data !== null;
	}
}
type RequestHandler = {
	(arg1?: Params | ArrayTypes, arg2?: ArrayTypes): RequestResult | Promise<RequestResult>;
};

export abstract class BaseServiceConnection<RequestHandlers extends RequestType | undefined = undefined, Ready extends {} | undefined = undefined> {

	private readonly textDecoder: RAL.TextDecoder;
	private readonly textEncoder: RAL.TextEncoder;
	private readonly requestHandlers: Map<string, RequestHandler>;
	private readonly requestResults: Map<number, Uint8Array>;

	constructor() {
		this.textDecoder = RAL().TextDecoder.create();
		this.textEncoder = RAL().TextEncoder.create();
		this.requestHandlers = new Map();
		this.requestResults = new Map();
	}

	public readonly onRequest: HandleRequestSignatures<RequestHandlers> = this._onRequest as HandleRequestSignatures<RequestHandlers>;

	private _onRequest(method: string, handler: RequestHandler): Disposable {
		this.requestHandlers.set(method, handler);
		return {
			dispose: () => this.requestHandlers.delete(method)
		};
	}

	protected async handleMessage(sharedArrayBuffer: SharedArrayBuffer): Promise<void> {
		const header = new Uint32Array(sharedArrayBuffer, SyncSize.total, HeaderSize.total / 4);
		const requestOffset = header[HeaderIndex.messageOffset];
		const requestLength = header[HeaderIndex.messageLength];

		try {
			const message = JSON.parse(this.textDecoder.decode(new Uint8Array(sharedArrayBuffer, requestOffset, requestLength)));
			if (Request.is(message)) {
				if (message.method === '$/fetchResult') {
					const resultId: number = message.params!.resultId as number;
					const result = this.requestResults.get(resultId);
					const resultOffset = header[HeaderIndex.resultOffset];
					const resultLength = header[HeaderIndex.resultLength];
					if (result !== undefined && result.byteLength === resultLength) {
						(new Uint8Array(sharedArrayBuffer, resultOffset, resultLength)).set(result);
						header[HeaderIndex.errno] = 0;
					} else {
						header[HeaderIndex.errno] = - 4;
					}
				} else {
					const binaryParamsLength = header[HeaderIndex.binaryParamLength];
					if (binaryParamsLength > 0) {
						const binaryParamsOffset = header[HeaderIndex.binaryParamOffset];
						const binary = new Uint8Array(sharedArrayBuffer, binaryParamsOffset, binaryParamsLength);
						message.params = message.params ?? { };
						message.params.binary = binary;
					}
					const handler = this.requestHandlers.get(message.method);
					if (handler !== undefined) {
						const resultKind = header[HeaderIndex.resultKind];
						const resultOffset = header[HeaderIndex.resultOffset];
						const resultLength = header[HeaderIndex.resultLength];
						let handlerResult: RequestResult | Promise<RequestResult>;
						let requestResult: RequestResult;
						switch (resultKind) {
							case $None.kind:
								handlerResult = message.params !== undefined ? handler(message.params) : handler();
								requestResult = handlerResult instanceof Promise ? await handlerResult : handlerResult;
								header[HeaderIndex.errno] = requestResult.errno;
								break;
							case $VariableSize.kind:
								handlerResult = message.params !== undefined ? handler(message.params) : handler();
								requestResult = handlerResult instanceof Promise ? await handlerResult : handlerResult;
								header[HeaderIndex.errno] = requestResult.errno;
								if (requestResult.errno === 0) {
									if (RequestResult.hasData(requestResult)) {
										const data = requestResult.data;
										const buffer = this.textEncoder.encode(JSON.stringify(data, undefined, 0));
										header[HeaderIndex.resultLength] = buffer.byteLength;
										this.requestResults.set(message.id, buffer);
									}
								}
								break;
							default:
								const resultBuffer = createResultArray(sharedArrayBuffer, resultKind, resultOffset, resultLength);
								handlerResult = message.params !== undefined ? handler(message.params, resultBuffer as ArrayTypes) : handler(resultBuffer as ArrayTypes);
								requestResult = handlerResult instanceof Promise ? await handlerResult : handlerResult;
								header[HeaderIndex.errno] = requestResult.errno;
						}
					} else {
						header[HeaderIndex.errno] = - 3;
					}
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
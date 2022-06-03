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


class NoResult {
	public static readonly kind: 0 = 0;
	constructor() {
	}
	get kind() {
		return NoResult.kind;
	}
	get byteLength(): number {
		return 0;
	}
	get length(): number {
		return 0;
	}
	getPadding(offset: number): number  {
		return 0;
	}
	createResultArray(sharedArrayBuffer: SharedArrayBuffer, offset: number): Uint8Array {
		return new Uint8Array(sharedArrayBuffer, offset, 0);
	}
}

class VariableResult {
	public static readonly kind: 7 = 7;
	constructor() {
	}
	get kind() {
		return VariableResult.kind;
	}
	get byteLength(): number {
		return 0;
	}
	get length(): number {
		return 0;
	}
	getPadding(offset: number): number  {
		return 0;
	}
	createResultArray(sharedArrayBuffer: SharedArrayBuffer, offset: number): Uint8Array {
		return new Uint8Array(sharedArrayBuffer, offset, 0);
	}
}

export class Uint8Result {
	public static readonly kind: 1 = 1;
	#length: number;
	public static fromLength(length: number): Uint8Result {
		return new Uint8Result(length);
	}
	public static fromByteLength(byteLength: number): Uint8Result {
		return new Uint8Result(byteLength);
	}
	private constructor(value: number) {
		this.#length = value;
	}
	get kind() {
		return Uint8Result.kind;
	}
	get byteLength(): number {
		return this.#length * Uint8Array.BYTES_PER_ELEMENT;
	}
	get length(): number {
		return this.#length;
	}
	getPadding(offset: number): number  {
		return TypedResult.getPadding(offset);
	}
	createResultArray(sharedArrayBuffer: SharedArrayBuffer, offset: number): Uint8Array {
		return new Uint8Array(sharedArrayBuffer, offset, this.length);
	}
}

export class Uint16Result {
	public static readonly kind: 2 = 2;
	#length: number;
	public static fromLength(length: number): Uint16Result {
		return new Uint16Result(length);
	}
	public static fromByteLength(byteLength: number): Uint16Result {
		if (byteLength % Uint16Array.BYTES_PER_ELEMENT !== 0) {
			throw new Error(`Byte length must be a multiple of ${Uint16Array.BYTES_PER_ELEMENT} but was ${byteLength}`);
		}
		return new Uint16Result(byteLength / Uint16Array.BYTES_PER_ELEMENT);
	}
	private constructor(value: number) {
		this.#length = value;
	}
	get kind() {
		return Uint16Result.kind;
	}
	get byteLength(): number {
		return this.#length * Uint16Array.BYTES_PER_ELEMENT;
	}
	get length(): number {
		return this.#length;
	}
	getPadding(offset: number): number  {
		return TypedResult.getPadding(offset);
	}
	createResultArray(sharedArrayBuffer: SharedArrayBuffer, offset: number): Uint16Array {
		return new Uint16Array(sharedArrayBuffer, offset, this.length);
	}
}

export class Uint32Result {
	public static readonly kind: 3 = 3;
	#length: number;
	public static fromLength(length: number): Uint32Result {
		return new Uint32Result(length);
	}
	public static fromByteLength(byteLength: number): Uint32Result {
		if (byteLength % Uint32Array.BYTES_PER_ELEMENT !== 0) {
			throw new Error(`Byte length must be a multiple of ${Uint32Array.BYTES_PER_ELEMENT} but was ${byteLength}`);
		}
		return new Uint32Result(byteLength / Uint32Array.BYTES_PER_ELEMENT);
	}
	private constructor(value: number) {
		this.#length = value;
	}
	get kind() {
		return Uint32Result.kind;
	}
	get byteLength(): number {
		return this.#length * Uint32Array.BYTES_PER_ELEMENT;
	}
	get length(): number {
		return this.#length;
	}
	getPadding(offset: number): number  {
		return TypedResult.getPadding(offset);
	}
	createResultArray(sharedArrayBuffer: SharedArrayBuffer, offset: number): Uint32Array {
		return new Uint32Array(sharedArrayBuffer, offset, this.length);
	}
}

export class Int8Result {
	public static readonly kind: 4 = 4;
	#length: number;
	public static fromLength(length: number): Int8Result {
		return new Int8Result(length);
	}
	public static fromByteLength(byteLength: number): Int8Result {
		return new Int8Result(byteLength);
	}
	private constructor(value: number) {
		this.#length = value;
	}
	get kind() {
		return Int8Result.kind;
	}
	get byteLength(): number {
		return this.#length * Int8Array.BYTES_PER_ELEMENT;
	}
	get length(): number {
		return this.#length;
	}
	getPadding(offset: number): number  {
		return TypedResult.getPadding(offset);
	}
	createResultArray(sharedArrayBuffer: SharedArrayBuffer, offset: number): Int8Array {
		return new Int8Array(sharedArrayBuffer, offset, this.length);
	}
}

export class Int16Result {
	public static readonly kind: 5 = 5;
	#length: number;
	public static fromLength(length: number): Int16Result {
		return new Int16Result(length);
	}
	public static fromByteLength(byteLength: number): Int16Result {
		if (byteLength % Int16Array.BYTES_PER_ELEMENT !== 0) {
			throw new Error(`Byte length must be a multiple of ${Int16Array.BYTES_PER_ELEMENT} but was ${byteLength}`);
		}
		return new Int16Result(byteLength / Int16Array.BYTES_PER_ELEMENT);
	}
	private constructor(value: number) {
		this.#length = value;
	}
	get kind() {
		return Int16Result.kind;
	}
	get byteLength(): number {
		return this.#length * Int16Array.BYTES_PER_ELEMENT;
	}
	get length(): number {
		return this.#length;
	}
	getPadding(offset: number): number  {
		return TypedResult.getPadding(offset);
	}
	createResultArray(sharedArrayBuffer: SharedArrayBuffer, offset: number): Int32Array {
		return new Int32Array(sharedArrayBuffer, offset, this.length);
	}
}

export class Int32Result {
	public static readonly kind: 6 = 6;
	#length: number;
	public static fromLength(length: number): Int32Result {
		return new Int32Result(length);
	}
	public static fromByteLength(byteLength: number): Int32Result {
		if (byteLength % Int32Array.BYTES_PER_ELEMENT !== 0) {
			throw new Error(`Byte length must be a multiple of ${Int32Array.BYTES_PER_ELEMENT} but was ${byteLength}`);
		}
		return new Int32Result(byteLength / Int32Array.BYTES_PER_ELEMENT);
	}
	private constructor(value: number) {
		this.#length = value;
	}
	get kind() {
		return Int32Result.kind;
	}
	get byteLength(): number {
		return this.#length * Int32Array.BYTES_PER_ELEMENT;
	}
	get length(): number {
		return this.#length;
	}
	getPadding(offset: number): number  {
		return TypedResult.getPadding(offset);
	}
	createResultArray(sharedArrayBuffer: SharedArrayBuffer, offset: number): Int32Array {
		return new Int32Array(sharedArrayBuffer, offset, this.length);
	}
}

namespace TypedResult {
	export function fromByteLength(kind: number, byteLength: number) {
		switch (kind) {
			case Uint8Result.kind:
				return Uint8Result.fromByteLength(byteLength);
			case Uint16Result.kind:
				return Uint16Result.fromByteLength(byteLength);
			case Uint32Result.kind:
				return Uint32Result.fromByteLength(byteLength);
			case Int8Result.kind:
				return Int8Result.fromByteLength(byteLength);
			case Int16Result.kind:
				return Int16Result.fromByteLength(byteLength);
			case Int32Result.kind:
				return Int32Result.fromByteLength(byteLength);
			case VariableResult.kind:
				// send another request to get the result.
				throw new Error(`No result array for variable result type`);
			default:
				throw new Error(`Unknown result kind ${kind}`);
		}
	}

	/**
	 * For now we align everything on a 4 byte boundary
	 */
	export function getPadding(offset: number): number {
		return 4 - (offset % 4);
	}
}

type ResultType = NoResult | Uint8Result | Uint16Result | Uint32Result | Int8Result | Int16Result | Int32Result | VariableResult;
namespace ResultType {
	export function is(value: any): value is ResultType {
		return value instanceof Uint8Result || value instanceof Uint16Result || value instanceof Uint32Result ||
			value instanceof Int8Result || value instanceof Int16Result || value instanceof Int32Result || value instanceof VariableResult ||
			value instanceof NoResult;
	}
}

type UnionToIntersection<U> =
	(U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

type MethodKeys<Messages extends MessageType> = {
	[M in Messages as M['method']]: M['method'];
};

type LengthType<T extends Uint8Array | Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array> =
	T extends Uint8Array
		? Uint8Result
		: T extends Uint16Array
			? Uint16Result
			: T extends Uint32Array
				? Uint32Result
				: T extends Int8Array
					? Int8Result
					: T extends Int16Array
						? Int16Result
						: T extends Int32Array
							? Int32Result
							: never;

type _SendRequestSignatures<Requests extends RequestType> = UnionToIntersection<{
 	[R in Requests as R['method']]: R['params'] extends null | undefined
	 	? R['result'] extends null | undefined
			? (method: R['method']) => { errno: number }
			: R['result'] extends Uint8Array | Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array
				? (method: R['method'], resultKind: LengthType<R['result']>) => { errno: 0; data: R['result'] } | { errno: number }
				: (method: R['method'], resultKind: VariableResult) => { errno: 0; data: R['result'] } | { errno: number }
		: R['result'] extends null | undefined
			? (method: R['method'], params: R['params']) => { errno: number }
			: R['result'] extends Uint8Array | Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array
				? (method: R['method'], params: R['params'], resultKind: LengthType<R['result']>) => { errno: 0; data: R['result'] } | { errno: number }
				: (method: R['method'], params: R['params'], resultKind: VariableResult) => { errno: 0; data: R['result'] } | { errno: number }
}[keyof MethodKeys<Requests>]>;

type SendRequestSignatures<Requests extends RequestType | undefined> = [Requests] extends [RequestType] ? _SendRequestSignatures<Requests> : undefined;

const enum HeaderIndex {
	messageOffset = 0,
	messageByteLength = 1,
	binaryParamOffset = 2,
	binaryParamByteLength = 3,
	errno = 4,
	resultKind = 5,
	resultOffset = 6,
	resultByteLength = 7
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
		let resultType : ResultType = new NoResult();
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


		const requestData = this.textEncoder.encode(JSON.stringify(request, undefined, 0));
		const binaryData = params?.binary;
		const binaryDataLength = binaryData !== undefined ? binaryData.byteLength : 0;
		const requestOffset = SyncSize.total + HeaderSize.total;
		const binaryOffset = requestOffset + requestData.byteLength;

		const resultByteLength = resultType.byteLength;
		const resultPadding = resultType.getPadding(binaryOffset + binaryDataLength);
		const resultOffset = (binaryOffset + binaryDataLength) + resultPadding;

		const sharedArrayBufferLength = SyncSize.total + HeaderSize.total + requestData.byteLength + binaryDataLength + resultPadding + resultByteLength;
		const sharedArrayBuffer: SharedArrayBuffer = new SharedArrayBuffer(sharedArrayBufferLength);

		const header = new Uint32Array(sharedArrayBuffer, SyncSize.total, HeaderSize.total / 4);
		header[HeaderIndex.messageOffset] = requestOffset;
		header[HeaderIndex.messageByteLength] = requestData.byteLength;
		header[HeaderIndex.binaryParamOffset] = binaryOffset;
		header[HeaderIndex.binaryParamByteLength] = binaryDataLength;
		header[HeaderIndex.errno] = 0;
		header[HeaderIndex.resultKind] = resultType.kind;
		header[HeaderIndex.resultOffset] = resultOffset;
		header[HeaderIndex.resultByteLength] = resultByteLength;

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
			switch(resultType.kind) {
				case NoResult.kind:
					return { errno: 0 };
				case VariableResult.kind:
					const lazyResultLength = header[HeaderIndex.resultByteLength];
					if (resultByteLength === 0) {
						return { errno: 0 };
					}
					const lazyResult = this._sendRequest('$/fetchResult', { resultId: id }, Uint8Result.fromLength(lazyResultLength));
					if (lazyResult.errno !== 0) {
						return { errno: lazyResult.errno };
					}
					if (RequestResult.hasData(lazyResult)) {
						try {
							const data = JSON.parse(this.textDecoder.decode(lazyResult.data as Uint8Array));
							return { errno: 0, data };
						} catch (error) {
							return { errno: - 5};
						}
					} else {
						return { errno: -5 };
					}
				default:
					return { errno: 0, data: resultType.createResultArray(sharedArrayBuffer, resultOffset) };
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
export namespace RequestResult {
	export function hasData<T>(value: { errno: number } | { errno: 0; data: T }): value is { errno: 0; data: T } {
		const candidate: { errno: number; data?: T | null } = value;
		return candidate.errno === 0 && candidate.data !== undefined && candidate.data !== null;
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
		const requestLength = header[HeaderIndex.messageByteLength];

		try {
			const message = JSON.parse(this.textDecoder.decode(new Uint8Array(sharedArrayBuffer, requestOffset, requestLength)));
			if (Request.is(message)) {
				if (message.method === '$/fetchResult') {
					const resultId: number = message.params!.resultId as number;
					const result = this.requestResults.get(resultId);
					const resultOffset = header[HeaderIndex.resultOffset];
					const resultByteLength = header[HeaderIndex.resultByteLength];
					if (result !== undefined && result.byteLength === resultByteLength) {
						(new Uint8Array(sharedArrayBuffer, resultOffset, resultByteLength)).set(result);
						header[HeaderIndex.errno] = 0;
					} else {
						header[HeaderIndex.errno] = - 4;
					}
				} else {
					const binaryParamsLength = header[HeaderIndex.binaryParamByteLength];
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
						const resultByteLength = header[HeaderIndex.resultByteLength];
						let handlerResult: RequestResult | Promise<RequestResult>;
						let requestResult: RequestResult;
						switch (resultKind) {
							case NoResult.kind:
								handlerResult = message.params !== undefined ? handler(message.params) : handler();
								requestResult = handlerResult instanceof Promise ? await handlerResult : handlerResult;
								header[HeaderIndex.errno] = requestResult.errno;
								break;
							case VariableResult.kind:
								handlerResult = message.params !== undefined ? handler(message.params) : handler();
								requestResult = handlerResult instanceof Promise ? await handlerResult : handlerResult;
								header[HeaderIndex.errno] = requestResult.errno;
								if (requestResult.errno === 0) {
									if (RequestResult.hasData(requestResult)) {
										const data = requestResult.data;
										const buffer = this.textEncoder.encode(JSON.stringify(data, undefined, 0));
										header[HeaderIndex.resultByteLength] = buffer.byteLength;
										this.requestResults.set(message.id, buffer);
									}
								}
								break;
							default:
								const typedResult = TypedResult.fromByteLength(resultKind, resultByteLength);
								const resultBuffer = typedResult.createResultArray(sharedArrayBuffer, resultOffset);
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
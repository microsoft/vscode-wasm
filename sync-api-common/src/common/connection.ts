/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import RAL from './ral';
import { Disposable } from './disposable';

export type u8 = number;
export type u16 = number;
export type u32 = number;
export type u64 = number;
export type size = u32;

export type Message = {
	method: string;
	params?: Params;
};

export type TypedArray = Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array | BigUint64Array | BigInt64Array;
namespace TypedArray {
	export function is(value: any): value is TypedArray {
		return value instanceof Uint8Array || value instanceof Int8Array || value instanceof Uint16Array || value instanceof Int16Array ||
			value instanceof Uint32Array || value instanceof Int32Array || value instanceof BigUint64Array || value instanceof BigInt64Array;
	}
	export function set(sharedArrayBuffer: SharedArrayBuffer, offset: number, data: TypedArray): void {
		if (data instanceof Uint8Array) {
			new Uint8Array(sharedArrayBuffer, offset, data.length).set(data);
		} else if (data instanceof Int8Array) {
			new Int8Array(sharedArrayBuffer, offset, data.length).set(data);
		} else if (data instanceof Uint16Array) {
			new Uint16Array(sharedArrayBuffer, offset, data.length).set(data);
		} else if (data instanceof Int16Array) {
			new Int16Array(sharedArrayBuffer, offset, data.length).set(data);
		} else if (data instanceof Uint32Array) {
			new Uint32Array(sharedArrayBuffer, offset, data.length).set(data);
		} else if (data instanceof Int32Array) {
			new Int32Array(sharedArrayBuffer, offset, data.length).set(data);
		} else if (data instanceof BigUint64Array) {
			new BigUint64Array(sharedArrayBuffer, offset, data.length).set(data);
		} else if (data instanceof BigInt64Array) {
			new BigInt64Array(sharedArrayBuffer, offset, data.length).set(data);
		} else {
			throw new Error(`Unknown type array type`);
		}
	}
}

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

type PromiseCallbacks<T> = {
	resolve: (response: T) => void;
	reject: (error: any) => void;
};

export type MessageType = {
	method: string;
	params?: null | object;
};

export type RequestType = MessageType & ({
	result?: TypedArray | object | null;
});

class NoResult {
	public static readonly kind = 0 as const;
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
	getPadding(_offset: number): number  {
		return 0;
	}
	createResultArray(sharedArrayBuffer: SharedArrayBuffer, offset: number): Uint8Array {
		return new Uint8Array(sharedArrayBuffer, offset, 0);
	}
}

export class Uint8Result {
	public static readonly kind = 1 as const;
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
		return TypedArrayResult.getPadding(offset);
	}
	createResultArray(sharedArrayBuffer: SharedArrayBuffer, offset: number): Uint8Array {
		return new Uint8Array(sharedArrayBuffer, offset, this.length);
	}
	is(value: any): value is Uint8Array {
		return value instanceof Uint8Array;
	}
}

export class Int8Result {
	public static readonly kind = 2 as const;
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
		return TypedArrayResult.getPadding(offset);
	}
	createResultArray(sharedArrayBuffer: SharedArrayBuffer, offset: number): Int8Array {
		return new Int8Array(sharedArrayBuffer, offset, this.length);
	}
	is(value: any): value is Int8Array {
		return value instanceof Int8Array;
	}
}

export class Uint16Result {
	public static readonly kind = 3 as const;
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
		return TypedArrayResult.getPadding(offset);
	}
	createResultArray(sharedArrayBuffer: SharedArrayBuffer, offset: number): Uint16Array {
		return new Uint16Array(sharedArrayBuffer, offset, this.length);
	}
	is(value: any): value is Uint16Array {
		return value instanceof Uint16Array;
	}
}

export class Int16Result {
	public static readonly kind = 4 as const;
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
		return TypedArrayResult.getPadding(offset);
	}
	createResultArray(sharedArrayBuffer: SharedArrayBuffer, offset: number): Int16Array {
		return new Int16Array(sharedArrayBuffer, offset, this.length);
	}
	is(value: any): value is Int16Array {
		return value instanceof Int16Array;
	}
}

export class Uint32Result {
	public static readonly kind = 5 as const;
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
		return TypedArrayResult.getPadding(offset);
	}
	createResultArray(sharedArrayBuffer: SharedArrayBuffer, offset: number): Uint32Array {
		return new Uint32Array(sharedArrayBuffer, offset, this.length);
	}
	is(value: any): value is Uint32Array {
		return value instanceof Uint32Array;
	}
}

export class Int32Result {
	public static readonly kind = 6 as const;
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
		return TypedArrayResult.getPadding(offset);
	}
	createResultArray(sharedArrayBuffer: SharedArrayBuffer, offset: number): Int32Array {
		return new Int32Array(sharedArrayBuffer, offset, this.length);
	}
	is(value: any): value is Int32Array {
		return value instanceof Int32Array;
	}
}

export class Uint64Result {
	public static readonly kind = 7 as const;
	#length: number;
	public static fromLength(length: number): Uint64Result {
		return new Uint64Result(length);
	}
	public static fromByteLength(byteLength: number): Uint64Result {
		if (byteLength % BigUint64Array.BYTES_PER_ELEMENT !== 0) {
			throw new Error(`Byte length must be a multiple of ${BigUint64Array.BYTES_PER_ELEMENT} but was ${byteLength}`);
		}
		return new Uint64Result(byteLength / BigUint64Array.BYTES_PER_ELEMENT);
	}
	private constructor(value: number) {
		this.#length = value;
	}
	get kind() {
		return Uint64Result.kind;
	}
	get byteLength(): number {
		return this.#length * BigUint64Array.BYTES_PER_ELEMENT;
	}
	get length(): number {
		return this.#length;
	}
	getPadding(offset: number): number  {
		return BigUint64Array.BYTES_PER_ELEMENT - (offset % BigUint64Array.BYTES_PER_ELEMENT);
	}
	createResultArray(sharedArrayBuffer: SharedArrayBuffer, offset: number): BigUint64Array {
		return new BigUint64Array(sharedArrayBuffer, offset, this.length);
	}
	is(value: any): value is BigUint64Array {
		return value instanceof BigUint64Array;
	}
}

export class Int64Result {
	public static readonly kind = 8 as const;
	#length: number;
	public static fromLength(length: number): Int64Result {
		return new Int64Result(length);
	}
	public static fromByteLength(byteLength: number): Int64Result {
		if (byteLength % BigInt64Array.BYTES_PER_ELEMENT !== 0) {
			throw new Error(`Byte length must be a multiple of ${BigInt64Array.BYTES_PER_ELEMENT} but was ${byteLength}`);
		}
		return new Int64Result(byteLength / BigInt64Array.BYTES_PER_ELEMENT);
	}
	private constructor(value: number) {
		this.#length = value;
	}
	get kind() {
		return Int64Result.kind;
	}
	get byteLength(): number {
		return this.#length * BigInt64Array.BYTES_PER_ELEMENT;
	}
	get length(): number {
		return this.#length;
	}
	getPadding(offset: number): number  {
		return BigInt64Array.BYTES_PER_ELEMENT - (offset % BigInt64Array.BYTES_PER_ELEMENT);
	}
	createResultArray(sharedArrayBuffer: SharedArrayBuffer, offset: number): BigInt64Array {
		return new BigInt64Array(sharedArrayBuffer, offset, this.length);
	}
	is(value: any): value is BigInt64Array {
		return value instanceof BigInt64Array;
	}
}

export class VariableResult<_T = undefined> {
	public static readonly kind = 9 as const;
	#mode: 'binary' | 'json';
	public constructor(mode: 'binary' | 'json') {
		this.#mode = mode;
	}
	get kind() {
		return VariableResult.kind;
	}
	get mode() {
		return this.#mode;
	}
	get byteLength(): number {
		return 0;
	}
	get length(): number {
		return 0;
	}
	getPadding(_offset: number): number  {
		return 0;
	}
}

export type TypedArrayResult = Uint8Result | Int8Result | Uint16Result | Int16Result | Uint32Result | Int32Result | Uint64Result | Int64Result;
namespace TypedArrayResult {
	export function fromByteLength(kind: number, byteLength: number): TypedArrayResult {
		switch (kind) {
			case Uint8Result.kind:
				return Uint8Result.fromByteLength(byteLength);
			case Int8Result.kind:
				return Int8Result.fromByteLength(byteLength);
			case Uint16Result.kind:
				return Uint16Result.fromByteLength(byteLength);
			case Int16Result.kind:
				return Int16Result.fromByteLength(byteLength);
			case Uint32Result.kind:
				return Uint32Result.fromByteLength(byteLength);
			case Int32Result.kind:
				return Int32Result.fromByteLength(byteLength);
			case Uint64Result.kind:
				return Uint64Result.fromByteLength(byteLength);
			case Int64Result.kind:
				return Int64Result.fromByteLength(byteLength);
			case VariableResult.kind:
				// send another request to get the result.
				throw new Error(`No result array for variable results result type.`);
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


export type ResultType = NoResult | TypedArrayResult | VariableResult<object | TypedArray>;
namespace ResultType {
	export function is(value: any): value is ResultType {
		return value instanceof Uint8Result || value instanceof Int8Result || value instanceof Uint16Result || value instanceof Int16Result ||
			value instanceof Uint32Result || value instanceof Int32Result || value instanceof Uint64Result || value instanceof Int64Result ||
			value instanceof VariableResult || value instanceof NoResult;
	}
}

type UnionToIntersection<U> =
	(U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

type MethodKeys<Messages extends MessageType> = {
	[M in Messages as M['method']]: M['method'];
};

type LengthType<T extends TypedArray> =
	T extends Uint8Array
		? Uint8Result
		: T extends Int8Array
			? Int8Result
			: T extends Uint16Array
				? Uint16Result
				: T extends Int16Array
					? Int16Result
					: T extends Uint32Array
						? Uint32Result
						: T extends Int32Array
							? Int32Result
							: T extends BigUint64Array
								? Uint64Result
								: T extends BigInt64Array
									? Int64Result
									: never;

type _SendRequestSignatures<Requests extends RequestType> = UnionToIntersection<{
 	[R in Requests as R['method']]: R['params'] extends null | undefined
	 	? R['result'] extends null | undefined
			? (method: R['method'], timeout?: number) => { errno: RPCErrno }
			: R['result'] extends TypedArray
				? (method: R['method'], resultKind: LengthType<R['result']>, timeout?: number) => { errno: 0; data: R['result'] } | { errno: RPCErrno }
				: R['result'] extends VariableResult<infer T>
					? (method: R['method'], resultKind: VariableResult<T>, timeout?: number) => { errno: 0; data: T } | { errno: RPCErrno }
					: never
		: R['result'] extends null | undefined
			? (method: R['method'], params: R['params'], timeout?: number) => { errno: RPCErrno }
			: R['result'] extends TypedArray
				? (method: R['method'], params: R['params'], resultKind: LengthType<R['result']>, timeout?: number) => { errno: 0; data: R['result'] } | { errno: RPCErrno }
				: R['result'] extends VariableResult<infer T>
					? (method: R['method'], params: R['params'], resultKind: VariableResult<T>, timeout?: number) => { errno: 0; data: T } | { errno: RPCErrno }
					: never;
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

/**
 * Errno numbers specific to the sync RPC calls. We start at 16384 to not collide
 * with POSIX error numbers.
 */
export namespace RPCErrno {

	/**
	 * No error occurred. RPC  call completed successfully.
	 */
	export const Success = 0;

	/**
	 * The sync RPC called timed out.
	 */
	export const TimedOut = 1;

	/**
	 * A unknown error has occurred.
	 */
	export const UnknownError = 16384;

	/**
	 * Fetching the lazy result from the service failed.
	 */
	export const LazyResultFailed = UnknownError + 1;

	/**
	 * No handler on the service side found.
	 */
	export const NoHandlerFound = LazyResultFailed + 1;

	/**
	 * Invalid message format.
	 */
	export const InvalidMessageFormat = NoHandlerFound + 1;

	/**
	 * Start of the custom error number range.
	 */
	export const $Custom = 32768;
}
export type RPCErrno = u32;

export class RPCError extends Error {
	public readonly errno: RPCErrno;

	public constructor(errno: RPCErrno, message?: string) {
		super(message);
		this.errno = errno;
	}
}

export interface ClientConnection<Requests extends RequestType | undefined = undefined, ReadyParams extends Params | undefined = undefined> {
	readonly sendRequest: SendRequestSignatures<Requests>;
	serviceReady(): Promise<ReadyParams>;
}

export abstract class BaseClientConnection<Requests extends RequestType | undefined = undefined,ReadyParams extends Params | undefined = undefined> implements ClientConnection<Requests, ReadyParams> {

	private id: number;
	private readonly textEncoder: RAL.TextEncoder;
	private readonly textDecoder: RAL.TextDecoder;
	private readonly readyPromise: Promise<ReadyParams>;
	private readyCallbacks: PromiseCallbacks<ReadyParams> | undefined;

	constructor() {
		this.id = 1;
		this.textEncoder = RAL().TextEncoder.create();
		this.textDecoder = RAL().TextDecoder.create();
		this.readyPromise = new Promise<ReadyParams>((resolve, reject) => {
			this.readyCallbacks = { resolve, reject };
		});
	}

	public serviceReady(): Promise<ReadyParams> {
		return this.readyPromise;
	}

	public readonly sendRequest: SendRequestSignatures<Requests> = this._sendRequest as SendRequestSignatures<Requests>;

	private _sendRequest(method: string, arg1?: Params | ResultType | number, arg2?: ResultType | number, arg3?: number): { errno: 0; data: any } | { errno: RPCErrno } {
		const id = this.id++;
		const request: Request = { id: id, method };
		let params: Params | undefined = undefined;
		let resultType: ResultType = new NoResult();
		let timeout: number | undefined = undefined;
		if (ResultType.is(arg1)) {
			resultType = arg1;
		} else if (typeof arg1 === 'number') {
			timeout = arg1;
		} else if (arg1 !== undefined || arg1 !== null) {
			params = arg1;
		}
		if (typeof arg2 === 'number') {
			timeout = arg2;
		} else if (arg2 !== undefined) {
			resultType = arg2;
		}
		if (typeof arg3 === 'number') {
			timeout = arg3;
		}
		if (params !== undefined) {
			request.params = {};
			for (const property of Object.keys(params)) {
				if (property !== 'binary') {
					request.params[property] = params[property];
				} else {
					(request.params['binary'] as unknown) = null;
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
		header[HeaderIndex.errno] = RPCErrno.Success;
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
		// Send the shared array buffer to the extension host worker
		this.postMessage(sharedArrayBuffer);

		// Wait for the answer
		const result = Atomics.wait(sync, 0, 0, timeout);
		switch (result) {
			case 'timed-out':
				return { errno: RPCErrno.TimedOut };
			case 'not-equal':
				const value = Atomics.load(sync, 0);
				// If the value === 1 the service has already
				// provided the result. Otherwise we actually
				// don't know what happened :-(.
				if (value !== 1) {
					return { errno: RPCErrno.UnknownError };
				}
		}

		const errno: RPCErrno = header[HeaderIndex.errno];
		if (errno !== 0) {
			return { errno };
		} else {
			switch(resultType.kind) {
				case NoResult.kind:
					return { errno: 0 };
				case VariableResult.kind:
					const lazyResultLength = header[HeaderIndex.resultByteLength];
					if (lazyResultLength === 0) {
						return { errno: 0, data: resultType.mode === 'binary' ? new Uint8Array(0) : '' };
					}
					const lazyResult = this._sendRequest('$/fetchResult', { resultId: id }, Uint8Result.fromLength(lazyResultLength), timeout);
					if (lazyResult.errno !== 0) {
						return { errno: lazyResult.errno };
					}
					if (RequestResult.hasData(lazyResult)) {
						try {
							// We need to slice the Uint8Array we received since it is a view onto a
							// shared array buffer and in the browser the text decoder throws when
							// reading from a Uint8Array. Since this seems to be the correct behavior
							// anyways (the array could otherwise change underneath) we do the same
							// for NodeJS
							const data = resultType.mode === 'binary'
								? lazyResult.data
								: JSON.parse(this.textDecoder.decode((lazyResult.data as Uint8Array).slice()));
							return { errno: 0, data };
						} catch (error) {
							RAL().console.error(error);
							return { errno: RPCErrno.LazyResultFailed };
						}
					} else {
						return { errno: RPCErrno.LazyResultFailed };
					}
				default:
					return { errno: 0, data: resultType.createResultArray(sharedArrayBuffer, resultOffset) };
			}
		}
	}

	protected abstract postMessage(sharedArrayBuffer: SharedArrayBuffer): any;

	protected handleMessage(message: Message): void {
		if (message.method === '$/ready') {
			this.readyCallbacks!.resolve(message.params as ReadyParams);
		}
	}
}

type _HandleRequestSignatures<Requests extends RequestType> = UnionToIntersection<{
 	[R in Requests as R['method']]: R['params'] extends null | undefined
		? R['result'] extends null | undefined
			? (method: R['method'], handler: () => { errno: RPCErrno } | Promise<{ errno: RPCErrno }>) => Disposable
			: R['result'] extends TypedArray
				? (method: R['method'], handler: (resultBuffer: R['result']) => { errno: RPCErrno } | Promise<{ errno: RPCErrno }>) => Disposable
				: R['result'] extends VariableResult<infer T>
					? (method: R['method'], handler: () => { errno: RPCErrno } | { errno: 0; data: T } | Promise<{ errno: RPCErrno }| { errno: 0; data: T }>) => Disposable
					: never
		: R['result'] extends null | undefined
			? (method: R['method'], handler: (params: R['params']) => { errno: RPCErrno } | Promise<{ errno: RPCErrno }>) => Disposable
			: R['result'] extends TypedArray
				? (method: R['method'], handler: (params: R['params'], resultBuffer: R['result']) => { errno: RPCErrno } | Promise<{ errno: RPCErrno }>) => Disposable
				: R['result'] extends VariableResult<infer T>
					? (method: R['method'], handler: (params: R['params']) => { errno: RPCErrno } | { errno: 0; data: T } | Promise<{ errno: RPCErrno }| { errno: 0; data: T }>) => Disposable
					: never
}[keyof MethodKeys<Requests>]>;

type HandleRequestSignatures<Requests extends RequestType | undefined> = [Requests] extends [RequestType] ?_HandleRequestSignatures<Requests> : undefined;

type RequestResult = { errno: 0; data: object } | { errno: RPCErrno };
export namespace RequestResult {
	export function hasData<T>(value: { errno: RPCErrno } | { errno: 0; data: T }): value is { errno: 0; data: T } {
		const candidate: { errno: RPCErrno; data?: T | null } = value;
		return candidate.errno === 0 && candidate.data !== undefined;
	}
}

type RequestHandler = {
	(arg1?: Params | TypedArray, arg2?: TypedArray): RequestResult | Promise<RequestResult>;
};

export interface ServiceConnection<RequestHandlers extends RequestType | undefined = undefined, ReadyParams extends Params | undefined = undefined> {
	readonly onRequest: HandleRequestSignatures<RequestHandlers>;
	signalReady(params: ReadyParams): void;
}

export abstract class BaseServiceConnection<RequestHandlers extends RequestType | undefined = undefined, ReadyParams extends Params | undefined = undefined> implements ServiceConnection<RequestHandlers, ReadyParams> {

	private readonly textDecoder: RAL.TextDecoder;
	private readonly textEncoder: RAL.TextEncoder;
	private readonly requestHandlers: Map<string, RequestHandler>;
	private readonly requestResults: Map<number, TypedArray>;

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
			// See above why we need to slice the Uint8Array.
			const message = JSON.parse(this.textDecoder.decode(new Uint8Array(sharedArrayBuffer, requestOffset, requestLength).slice()));
			if (Request.is(message)) {
				if (message.method === '$/fetchResult') {
					const resultId: number = message.params!.resultId as number;
					const result = this.requestResults.get(resultId);
					this.requestResults.delete(resultId);
					const resultOffset = header[HeaderIndex.resultOffset];
					const resultByteLength = header[HeaderIndex.resultByteLength];
					if (result !== undefined && result.byteLength === resultByteLength) {
						TypedArray.set(sharedArrayBuffer, resultOffset, result);
						header[HeaderIndex.errno] = RPCErrno.Success;
					} else {
						header[HeaderIndex.errno] = RPCErrno.LazyResultFailed;
					}
				} else {
					if (message.params?.binary === null) {
						const binaryParamsLength = header[HeaderIndex.binaryParamByteLength];
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
										const buffer = TypedArray.is(data)
											? data
											: this.textEncoder.encode(JSON.stringify(data, undefined, 0));
										header[HeaderIndex.resultByteLength] = buffer.byteLength;
										// We only need to keep a result which is greater than zero.
										// If it is zero we can create an empty array on the other side.
										if (buffer.byteLength > 0) {
											this.requestResults.set(message.id, buffer);
										}
									}
								}
								break;
							default:
								const typedResult = TypedArrayResult.fromByteLength(resultKind, resultByteLength);
								const resultBuffer = typedResult.createResultArray(sharedArrayBuffer, resultOffset);
								handlerResult = message.params !== undefined ? handler(message.params, resultBuffer as TypedArray) : handler(resultBuffer as TypedArray);
								requestResult = handlerResult instanceof Promise ? await handlerResult : handlerResult;
								header[HeaderIndex.errno] = requestResult.errno;
						}
					} else {
						header[HeaderIndex.errno] = RPCErrno.NoHandlerFound;
					}
				}
			} else {
				header[HeaderIndex.errno] = RPCErrno.InvalidMessageFormat;
			}
		} catch (error) {
			RAL().console.error(error);
			header[HeaderIndex.errno] = RPCErrno.UnknownError;
		}
		const sync = new Int32Array(sharedArrayBuffer, 0, 1);
		Atomics.store(sync, 0, 1);
		Atomics.notify(sync, 0);
	}

	public signalReady(params: ReadyParams): void {
		const notification: Notification = { method: '$/ready', params };
		this.postMessage(notification);
	}

	protected abstract postMessage(message: Message): void;
}
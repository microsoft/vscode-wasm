import * as $wcm from '@vscode/wasm-component-model';
import type { result } from '@vscode/wasm-component-model';
import { Poll } from './poll';
import { Streams } from './io';

export namespace Types {
	
	export type InputStream = Streams.InputStream;
	
	export type OutputStream = Streams.OutputStream;
	
	export type Pollable = Poll.Pollable;
	
	export namespace Method {
		export const get = 0 as const;
		export type get = { readonly case: typeof get } & _common;
		
		export const head = 1 as const;
		export type head = { readonly case: typeof head } & _common;
		
		export const post = 2 as const;
		export type post = { readonly case: typeof post } & _common;
		
		export const put = 3 as const;
		export type put = { readonly case: typeof put } & _common;
		
		export const delete_ = 4 as const;
		export type delete_ = { readonly case: typeof delete_ } & _common;
		
		export const connect = 5 as const;
		export type connect = { readonly case: typeof connect } & _common;
		
		export const options = 6 as const;
		export type options = { readonly case: typeof options } & _common;
		
		export const trace = 7 as const;
		export type trace = { readonly case: typeof trace } & _common;
		
		export const patch = 8 as const;
		export type patch = { readonly case: typeof patch } & _common;
		
		export const other = 9 as const;
		export type other = { readonly case: typeof other; readonly value: string } & _common;
		
		export type _ct = typeof get | typeof head | typeof post | typeof put | typeof delete_ | typeof connect | typeof options | typeof trace | typeof patch | typeof other;
		export type _vt = string | undefined;
		type _common = Omit<VariantImpl, 'case' | 'value'>;
		export function _ctor(c: _ct, v: _vt): Method {
			return new VariantImpl(c, v) as Method;
		}
		export function _get(): get {
			return new VariantImpl(get, undefined) as get;
		}
		export function _head(): head {
			return new VariantImpl(head, undefined) as head;
		}
		export function _post(): post {
			return new VariantImpl(post, undefined) as post;
		}
		export function _put(): put {
			return new VariantImpl(put, undefined) as put;
		}
		export function _delete_(): delete_ {
			return new VariantImpl(delete_, undefined) as delete_;
		}
		export function _connect(): connect {
			return new VariantImpl(connect, undefined) as connect;
		}
		export function _options(): options {
			return new VariantImpl(options, undefined) as options;
		}
		export function _trace(): trace {
			return new VariantImpl(trace, undefined) as trace;
		}
		export function _patch(): patch {
			return new VariantImpl(patch, undefined) as patch;
		}
		export function _other(value: string): other {
			return new VariantImpl(other, value) as other;
		}
		class VariantImpl {
			private readonly _case: _ct;
			private readonly _value?: _vt;
			constructor(c: _ct, value: _vt) {
				this._case = c;
				this._value = value;
			}
			get case(): _ct {
				return this._case;
			}
			get value(): _vt {
				return this._value;
			}
			get(): this is get {
				return this._case === Method.get;
			}
			head(): this is head {
				return this._case === Method.head;
			}
			post(): this is post {
				return this._case === Method.post;
			}
			put(): this is put {
				return this._case === Method.put;
			}
			delete_(): this is delete_ {
				return this._case === Method.delete_;
			}
			connect(): this is connect {
				return this._case === Method.connect;
			}
			options(): this is options {
				return this._case === Method.options;
			}
			trace(): this is trace {
				return this._case === Method.trace;
			}
			patch(): this is patch {
				return this._case === Method.patch;
			}
			other(): this is other {
				return this._case === Method.other;
			}
		}
	}
	export type Method = Method.get | Method.head | Method.post | Method.put | Method.delete_ | Method.connect | Method.options | Method.trace | Method.patch | Method.other;
	
	export namespace Scheme {
		export const HTTP = 0 as const;
		export type HTTP = { readonly case: typeof HTTP } & _common;
		
		export const HTTPS = 1 as const;
		export type HTTPS = { readonly case: typeof HTTPS } & _common;
		
		export const other = 2 as const;
		export type other = { readonly case: typeof other; readonly value: string } & _common;
		
		export type _ct = typeof HTTP | typeof HTTPS | typeof other;
		export type _vt = string | undefined;
		type _common = Omit<VariantImpl, 'case' | 'value'>;
		export function _ctor(c: _ct, v: _vt): Scheme {
			return new VariantImpl(c, v) as Scheme;
		}
		export function _HTTP(): HTTP {
			return new VariantImpl(HTTP, undefined) as HTTP;
		}
		export function _HTTPS(): HTTPS {
			return new VariantImpl(HTTPS, undefined) as HTTPS;
		}
		export function _other(value: string): other {
			return new VariantImpl(other, value) as other;
		}
		class VariantImpl {
			private readonly _case: _ct;
			private readonly _value?: _vt;
			constructor(c: _ct, value: _vt) {
				this._case = c;
				this._value = value;
			}
			get case(): _ct {
				return this._case;
			}
			get value(): _vt {
				return this._value;
			}
			HTTP(): this is HTTP {
				return this._case === Scheme.HTTP;
			}
			HTTPS(): this is HTTPS {
				return this._case === Scheme.HTTPS;
			}
			other(): this is other {
				return this._case === Scheme.other;
			}
		}
	}
	export type Scheme = Scheme.HTTP | Scheme.HTTPS | Scheme.other;
	
	export namespace Error {
		export const invalidUrl = 0 as const;
		export type invalidUrl = { readonly case: typeof invalidUrl; readonly value: string } & _common;
		
		export const timeoutError = 1 as const;
		export type timeoutError = { readonly case: typeof timeoutError; readonly value: string } & _common;
		
		export const protocolError = 2 as const;
		export type protocolError = { readonly case: typeof protocolError; readonly value: string } & _common;
		
		export const unexpectedError = 3 as const;
		export type unexpectedError = { readonly case: typeof unexpectedError; readonly value: string } & _common;
		
		export type _ct = typeof invalidUrl | typeof timeoutError | typeof protocolError | typeof unexpectedError;
		export type _vt = string | string | string | string;
		type _common = Omit<VariantImpl, 'case' | 'value'>;
		export function _ctor(c: _ct, v: _vt): Error {
			return new VariantImpl(c, v) as Error;
		}
		export function _invalidUrl(value: string): invalidUrl {
			return new VariantImpl(invalidUrl, value) as invalidUrl;
		}
		export function _timeoutError(value: string): timeoutError {
			return new VariantImpl(timeoutError, value) as timeoutError;
		}
		export function _protocolError(value: string): protocolError {
			return new VariantImpl(protocolError, value) as protocolError;
		}
		export function _unexpectedError(value: string): unexpectedError {
			return new VariantImpl(unexpectedError, value) as unexpectedError;
		}
		class VariantImpl {
			private readonly _case: _ct;
			private readonly _value: _vt;
			constructor(c: _ct, value: _vt) {
				this._case = c;
				this._value = value;
			}
			get case(): _ct {
				return this._case;
			}
			get value(): _vt {
				return this._value;
			}
			invalidUrl(): this is invalidUrl {
				return this._case === Error.invalidUrl;
			}
			timeoutError(): this is timeoutError {
				return this._case === Error.timeoutError;
			}
			protocolError(): this is protocolError {
				return this._case === Error.protocolError;
			}
			unexpectedError(): this is unexpectedError {
				return this._case === Error.unexpectedError;
			}
		}
	}
	export type Error = Error.invalidUrl | Error.timeoutError | Error.protocolError | Error.unexpectedError;
	
	export type Fields = number;
	
	export type Headers = Headers;
	
	export type Trailers = Trailers;
	
	export type IncomingStream = IncomingStream;
	
	export type OutgoingStream = OutgoingStream;
	
	export type IncomingRequest = number;
	
	export type OutgoingRequest = number;
	
	export interface RequestOptions extends $wcm.JRecord {
		connectTimeoutMs?: number | undefined;
		firstByteTimeoutMs?: number | undefined;
		betweenBytesTimeoutMs?: number | undefined;
	}
	
	export type ResponseOutparam = number;
	
	export type StatusCode = number;
	
	export type IncomingResponse = number;
	
	export type OutgoingResponse = number;
	
	export type FutureIncomingResponse = number;
	
	export declare function dropFields(fields: Fields): void;
	
	export declare function newFields(entries: [string, string][]): Fields;
	
	export declare function fieldsGet(fields: Fields, name: string): Uint8Array[];
	
	export declare function fieldsSet(fields: Fields, name: string, value: Uint8Array[]): void;
	
	export declare function fieldsDelete(fields: Fields, name: string): void;
	
	export declare function fieldsAppend(fields: Fields, name: string, value: Uint8Array): void;
	
	export declare function fieldsEntries(fields: Fields): [string, Uint8Array][];
	
	export declare function fieldsClone(fields: Fields): Fields;
	
	export declare function finishIncomingStream(s: IncomingStream): Trailers | undefined;
	
	export declare function finishOutgoingStream(s: OutgoingStream, trailers: Trailers | undefined): void;
	
	export declare function dropIncomingRequest(request: IncomingRequest): void;
	
	export declare function dropOutgoingRequest(request: OutgoingRequest): void;
	
	export declare function incomingRequestMethod(request: IncomingRequest): Method;
	
	export declare function incomingRequestPathWithQuery(request: IncomingRequest): string | undefined;
	
	export declare function incomingRequestScheme(request: IncomingRequest): Scheme | undefined;
	
	export declare function incomingRequestAuthority(request: IncomingRequest): string | undefined;
	
	export declare function incomingRequestHeaders(request: IncomingRequest): Headers;
	
	export declare function incomingRequestConsume(request: IncomingRequest): result<IncomingStream, void>;
	
	export declare function newOutgoingRequest(method: Method, pathWithQuery: string | undefined, scheme: Scheme | undefined, authority: string | undefined, headers: Headers): OutgoingRequest;
	
	export declare function outgoingRequestWrite(request: OutgoingRequest): result<OutgoingStream, void>;
	
	export declare function dropResponseOutparam(response: ResponseOutparam): void;
	
	export declare function setResponseOutparam(param: ResponseOutparam, response: result<OutgoingResponse, Error>): result<void, void>;
	
	export declare function dropIncomingResponse(response: IncomingResponse): void;
	
	export declare function dropOutgoingResponse(response: OutgoingResponse): void;
	
	export declare function incomingResponseStatus(response: IncomingResponse): StatusCode;
	
	export declare function incomingResponseHeaders(response: IncomingResponse): Headers;
	
	export declare function incomingResponseConsume(response: IncomingResponse): result<IncomingStream, void>;
	
	export declare function newOutgoingResponse(statusCode: StatusCode, headers: Headers): OutgoingResponse;
	
	export declare function outgoingResponseWrite(response: OutgoingResponse): result<OutgoingStream, void>;
	
	export declare function dropFutureIncomingResponse(f: FutureIncomingResponse): void;
	
	export declare function futureIncomingResponseGet(f: FutureIncomingResponse): result<IncomingResponse, Error> | undefined;
	
	export declare function listenToFutureIncomingResponse(f: FutureIncomingResponse): Pollable;
}

export namespace IncomingHandler {
	
	export type IncomingRequest = Types.IncomingRequest;
	
	export type ResponseOutparam = Types.ResponseOutparam;
	
	export declare function handle(request: IncomingRequest, responseOut: ResponseOutparam): void;
}

export namespace OutgoingHandler {
	
	export type OutgoingRequest = Types.OutgoingRequest;
	
	export type RequestOptions = Types.RequestOptions;
	
	export type FutureIncomingResponse = Types.FutureIncomingResponse;
	
	export declare function handle(request: OutgoingRequest, options: RequestOptions | undefined): FutureIncomingResponse;
}

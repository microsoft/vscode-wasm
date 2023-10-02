import * as $wcm from '@vscode/wasm-component-model';
import type { u32, u16, result } from '@vscode/wasm-component-model';
import { poll } from './poll';
import { io } from './io';

export namespace http {
	export namespace Types {
		
		type InputStream = io.Streams.InputStream;
		
		type OutputStream = io.Streams.OutputStream;
		
		type Pollable = poll.Poll.Pollable;
		
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
		
		export type Fields = u32;
		
		type Headers = Fields;
		
		type Trailers = Fields;
		
		export type IncomingRequest = u32;
		
		export type OutgoingRequest = u32;
		
		export interface RequestOptions extends $wcm.JRecord {
			connectTimeoutMs?: u32 | undefined;
			firstByteTimeoutMs?: u32 | undefined;
			betweenBytesTimeoutMs?: u32 | undefined;
		}
		
		export type ResponseOutparam = u32;
		
		export type StatusCode = u16;
		
		export type IncomingResponse = u32;
		
		export type IncomingBody = u32;
		
		export type FutureTrailers = u32;
		
		export type OutgoingResponse = u32;
		
		export type OutgoingBody = u32;
		
		/**
		 * The following block defines a special resource type used by the
		 * `wasi:http/outgoing-handler` interface to emulate
		 * `future<result<response, error>>` in advance of Preview3. Given a
		 * `future-incoming-response`, the client can call the non-blocking `get`
		 * method to get the result if it is available. If the result is not available,
		 * the client can call `listen` to get a `pollable` that can be passed to
		 * `io.poll.poll-oneoff`.
		 */
		export type FutureIncomingResponse = u32;
		
		export declare function dropFields(fields: Fields): void;
		
		export declare function newFields(entries: [string, Uint8Array][]): Fields;
		
		export declare function fieldsGet(fields: Fields, name: string): Uint8Array[];
		
		export declare function fieldsSet(fields: Fields, name: string, value: Uint8Array[]): void;
		
		export declare function fieldsDelete(fields: Fields, name: string): void;
		
		export declare function fieldsAppend(fields: Fields, name: string, value: Uint8Array): void;
		
		export declare function fieldsEntries(fields: Fields): [string, Uint8Array][];
		
		export declare function fieldsClone(fields: Fields): Fields;
		
		export declare function dropIncomingRequest(request: IncomingRequest): void;
		
		export declare function incomingRequestMethod(request: IncomingRequest): Method;
		
		export declare function incomingRequestPathWithQuery(request: IncomingRequest): string | undefined;
		
		export declare function incomingRequestScheme(request: IncomingRequest): Scheme | undefined;
		
		export declare function incomingRequestAuthority(request: IncomingRequest): string | undefined;
		
		export declare function incomingRequestHeaders(request: IncomingRequest): Headers;
		
		export declare function incomingRequestConsume(request: IncomingRequest): result<IncomingBody, void>;
		
		export declare function dropOutgoingRequest(request: OutgoingRequest): void;
		
		export declare function newOutgoingRequest(method: Method, pathWithQuery: string | undefined, scheme: Scheme | undefined, authority: string | undefined, headers: Headers): OutgoingRequest;
		
		export declare function outgoingRequestWrite(request: OutgoingRequest): result<OutgoingBody, void>;
		
		export declare function dropResponseOutparam(response: ResponseOutparam): void;
		
		export declare function setResponseOutparam(param: ResponseOutparam, response: result<OutgoingResponse, Error>): void;
		
		export declare function dropIncomingResponse(response: IncomingResponse): void;
		
		export declare function incomingResponseStatus(response: IncomingResponse): StatusCode;
		
		export declare function incomingResponseHeaders(response: IncomingResponse): Headers;
		
		export declare function incomingResponseConsume(response: IncomingResponse): result<IncomingBody, void>;
		
		export declare function dropIncomingBody(this_: IncomingBody): void;
		
		export declare function incomingBodyStream(this_: IncomingBody): result<InputStream, void>;
		
		export declare function incomingBodyFinish(this_: IncomingBody): FutureTrailers;
		
		export declare function dropFutureTrailers(this_: FutureTrailers): void;
		
		/**
		 * Pollable that resolves when the body has been fully read, and the trailers
		 * are ready to be consumed.
		 */
		export declare function futureTrailersSubscribe(this_: FutureTrailers): Pollable;
		
		/**
		 * Retrieve reference to trailers, if they are ready.
		 */
		export declare function futureTrailersGet(response: FutureTrailers): result<Trailers, Error> | undefined;
		
		export declare function dropOutgoingResponse(response: OutgoingResponse): void;
		
		export declare function newOutgoingResponse(statusCode: StatusCode, headers: Headers): OutgoingResponse;
		
		/**
		 * Will give the child outgoing-response at most once. subsequent calls will
		 * return an error.
		 */
		export declare function outgoingResponseWrite(this_: OutgoingResponse): result<OutgoingBody, void>;
		
		export declare function dropOutgoingBody(this_: OutgoingBody): void;
		
		/**
		 * Will give the child output-stream at most once. subsequent calls will
		 * return an error.
		 */
		export declare function outgoingBodyWrite(this_: OutgoingBody): result<OutputStream, void>;
		
		/**
		 * Finalize an outgoing body, optionally providing trailers. This must be
		 * called to signal that the response is complete. If the `outgoing-body` is
		 * dropped without calling `outgoing-body-finalize`, the implementation
		 * should treat the body as corrupted.
		 */
		export declare function outgoingBodyFinish(this_: OutgoingBody, trailers: Trailers | undefined): void;
		
		export declare function dropFutureIncomingResponse(f: FutureIncomingResponse): void;
		
		/**
		 * option indicates readiness.
		 * outer result indicates you are allowed to get the
		 * incoming-response-or-error at most once. subsequent calls after ready
		 * will return an error here.
		 * inner result indicates whether the incoming-response was available, or an
		 * error occured.
		 */
		export declare function futureIncomingResponseGet(f: FutureIncomingResponse): result<result<IncomingResponse, Error>, void> | undefined;
		
		export declare function listenToFutureIncomingResponse(f: FutureIncomingResponse): Pollable;
	}
	export type Types = Pick<typeof Types, 'dropFields' | 'newFields' | 'fieldsGet' | 'fieldsSet' | 'fieldsDelete' | 'fieldsAppend' | 'fieldsEntries' | 'fieldsClone' | 'dropIncomingRequest' | 'incomingRequestMethod' | 'incomingRequestPathWithQuery' | 'incomingRequestScheme' | 'incomingRequestAuthority' | 'incomingRequestHeaders' | 'incomingRequestConsume' | 'dropOutgoingRequest' | 'newOutgoingRequest' | 'outgoingRequestWrite' | 'dropResponseOutparam' | 'setResponseOutparam' | 'dropIncomingResponse' | 'incomingResponseStatus' | 'incomingResponseHeaders' | 'incomingResponseConsume' | 'dropIncomingBody' | 'incomingBodyStream' | 'incomingBodyFinish' | 'dropFutureTrailers' | 'futureTrailersSubscribe' | 'futureTrailersGet' | 'dropOutgoingResponse' | 'newOutgoingResponse' | 'outgoingResponseWrite' | 'dropOutgoingBody' | 'outgoingBodyWrite' | 'outgoingBodyFinish' | 'dropFutureIncomingResponse' | 'futureIncomingResponseGet' | 'listenToFutureIncomingResponse'>;
	
	export namespace IncomingHandler {
		
		type IncomingRequest = Types.IncomingRequest;
		
		type ResponseOutparam = Types.ResponseOutparam;
		
		export declare function handle(request: IncomingRequest, responseOut: ResponseOutparam): void;
	}
	export type IncomingHandler = Pick<typeof IncomingHandler, 'handle'>;
	
	export namespace OutgoingHandler {
		
		type OutgoingRequest = Types.OutgoingRequest;
		
		type RequestOptions = Types.RequestOptions;
		
		type FutureIncomingResponse = Types.FutureIncomingResponse;
		
		type Error = Types.Error;
		
		export declare function handle(request: OutgoingRequest, options: RequestOptions | undefined): result<FutureIncomingResponse, Error>;
	}
	export type OutgoingHandler = Pick<typeof OutgoingHandler, 'handle'>;
	
}

export namespace http {
	export namespace Types.$ {
		export const InputStream = io.Streams.$.InputStream;
		export const OutputStream = io.Streams.$.OutputStream;
		export const Pollable = poll.Poll.$.Pollable;
		export const Fields = $wcm.u32;
		export const Headers = Fields;
		export const Trailers = Fields;
		export const IncomingRequest = $wcm.u32;
		export const OutgoingRequest = $wcm.u32;
		export const RequestOptions = new $wcm.RecordType<http.Types.RequestOptions>([
			['connectTimeoutMs', $wcm.u32 | undefined],
			['firstByteTimeoutMs', $wcm.u32 | undefined],
			['betweenBytesTimeoutMs', $wcm.u32 | undefined],
		]);
		export const ResponseOutparam = $wcm.u32;
		export const StatusCode = $wcm.u16;
		export const IncomingResponse = $wcm.u32;
		export const IncomingBody = $wcm.u32;
		export const FutureTrailers = $wcm.u32;
		export const OutgoingResponse = $wcm.u32;
		export const OutgoingBody = $wcm.u32;
		export const FutureIncomingResponse = $wcm.u32;
	}
	export namespace IncomingHandler.$ {
		export const IncomingRequest = Types.$.IncomingRequest;
		export const ResponseOutparam = Types.$.ResponseOutparam;
	}
	export namespace OutgoingHandler.$ {
		export const OutgoingRequest = Types.$.OutgoingRequest;
		export const RequestOptions = Types.$.RequestOptions;
		export const FutureIncomingResponse = Types.$.FutureIncomingResponse;
		export const Error = Types.$.Error;
	}
}
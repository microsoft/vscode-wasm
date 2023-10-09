/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '@vscode/wasm-component-model';
import type { resource, u32, u16, result, ptr, i32, i64, f32, f64 } from '@vscode/wasm-component-model';
import { io } from './io';

export namespace http {
	export namespace Types {
		
		export type InputStream = io.Streams.InputStream;
		
		export type OutputStream = io.Streams.OutputStream;
		
		export type Pollable = io.Poll.Pollable;
		
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
		
		export type Fields = resource;
		
		export type Headers = Fields;
		
		export type Trailers = Fields;
		
		export type IncomingRequest = resource;
		
		export type OutgoingRequest = resource;
		
		export type RequestOptions = {
			connectTimeoutMs?: u32 | undefined;
			firstByteTimeoutMs?: u32 | undefined;
			betweenBytesTimeoutMs?: u32 | undefined;
		};
		
		export type ResponseOutparam = resource;
		
		export type StatusCode = u16;
		
		export type IncomingResponse = resource;
		
		export type IncomingBody = resource;
		
		export type FutureTrailers = resource;
		
		export type OutgoingResponse = resource;
		
		export type OutgoingBody = resource;
		
		/**
		 * The following block defines a special resource type used by the
		 * `wasi:http/outgoing-handler` interface to emulate
		 * `future<result<response, error>>` in advance of Preview3. Given a
		 * `future-incoming-response`, the client can call the non-blocking `get`
		 * method to get the result if it is available. If the result is not available,
		 * the client can call `listen` to get a `pollable` that can be passed to
		 * `wasi:io/poll.poll-list`.
		 */
		export type FutureIncomingResponse = resource;
		
		export declare function [constructor]fields(entries: [string, Uint8Array][]): Fields;
		
		export declare function [method]fields.get(self: Fields, name: string): Uint8Array[];
		
		export declare function [method]fields.set(self: Fields, name: string, value: Uint8Array[]): void;
		
		export declare function [method]fields.delete(self: Fields, name: string): void;
		
		export declare function [method]fields.append(self: Fields, name: string, value: Uint8Array): void;
		
		export declare function [method]fields.entries(self: Fields): [string, Uint8Array][];
		
		export declare function [method]fields.clone(self: Fields): Fields;
		
		export declare function [method]incomingRequest.method(self: IncomingRequest): Method;
		
		export declare function [method]incomingRequest.pathWithQuery(self: IncomingRequest): string | undefined;
		
		export declare function [method]incomingRequest.scheme(self: IncomingRequest): Scheme | undefined;
		
		export declare function [method]incomingRequest.authority(self: IncomingRequest): string | undefined;
		
		export declare function [method]incomingRequest.headers(self: IncomingRequest): Headers;
		
		export declare function [method]incomingRequest.consume(self: IncomingRequest): result<IncomingBody, void>;
		
		export declare function [constructor]outgoingRequest(method: Method, pathWithQuery: string | undefined, scheme: Scheme | undefined, authority: string | undefined, headers: Headers): OutgoingRequest;
		
		export declare function [method]outgoingRequest.write(self: OutgoingRequest): result<OutgoingBody, void>;
		
		export declare function [static]responseOutparam.set(param: ResponseOutparam, response: result<OutgoingResponse, Error>): void;
		
		export declare function [method]incomingResponse.status(self: IncomingResponse): StatusCode;
		
		export declare function [method]incomingResponse.headers(self: IncomingResponse): Headers;
		
		export declare function [method]incomingResponse.consume(self: IncomingResponse): result<IncomingBody, void>;
		
		export declare function [method]incomingBody.stream(self: IncomingBody): result<InputStream, void>;
		
		export declare function [static]incomingBody.finish(this_: IncomingBody): FutureTrailers;
		
		/**
		 * Pollable that resolves when the body has been fully read, and the trailers
		 * are ready to be consumed.
		 */
		export declare function [method]futureTrailers.subscribe(self: FutureTrailers): Pollable;
		
		/**
		 * Retrieve reference to trailers, if they are ready.
		 */
		export declare function [method]futureTrailers.get(self: FutureTrailers): result<Trailers, Error> | undefined;
		
		export declare function [constructor]outgoingResponse(statusCode: StatusCode, headers: Headers): OutgoingResponse;
		
		/**
		 * Will give the child outgoing-response at most once. subsequent calls will
		 * return an error.
		 */
		export declare function [method]outgoingResponse.write(self: OutgoingResponse): result<OutgoingBody, void>;
		
		/**
		 * Will give the child output-stream at most once. subsequent calls will
		 * return an error.
		 */
		export declare function [method]outgoingBody.write(self: OutgoingBody): result<OutputStream, void>;
		
		/**
		 * Finalize an outgoing body, optionally providing trailers. This must be
		 * called to signal that the response is complete. If the `outgoing-body` is
		 * dropped without calling `outgoing-body-finalize`, the implementation
		 * should treat the body as corrupted.
		 */
		export declare function [static]outgoingBody.finish(this_: OutgoingBody, trailers: Trailers | undefined): void;
		
		/**
		 * option indicates readiness.
		 * outer result indicates you are allowed to get the
		 * incoming-response-or-error at most once. subsequent calls after ready
		 * will return an error here.
		 * inner result indicates whether the incoming-response was available, or an
		 * error occured.
		 */
		export declare function [method]futureIncomingResponse.get(self: FutureIncomingResponse): result<result<IncomingResponse, Error>, void> | undefined;
		
		export declare function [method]futureIncomingResponse.subscribe(self: FutureIncomingResponse): Pollable;
	}
	export type Types = Pick<typeof Types, '[constructor]fields' | '[method]fields.get' | '[method]fields.set' | '[method]fields.delete' | '[method]fields.append' | '[method]fields.entries' | '[method]fields.clone' | '[method]incomingRequest.method' | '[method]incomingRequest.pathWithQuery' | '[method]incomingRequest.scheme' | '[method]incomingRequest.authority' | '[method]incomingRequest.headers' | '[method]incomingRequest.consume' | '[constructor]outgoingRequest' | '[method]outgoingRequest.write' | '[static]responseOutparam.set' | '[method]incomingResponse.status' | '[method]incomingResponse.headers' | '[method]incomingResponse.consume' | '[method]incomingBody.stream' | '[static]incomingBody.finish' | '[method]futureTrailers.subscribe' | '[method]futureTrailers.get' | '[constructor]outgoingResponse' | '[method]outgoingResponse.write' | '[method]outgoingBody.write' | '[static]outgoingBody.finish' | '[method]futureIncomingResponse.get' | '[method]futureIncomingResponse.subscribe'>;
	
	export namespace IncomingHandler {
		
		export type IncomingRequest = http.Types.IncomingRequest;
		
		export type ResponseOutparam = http.Types.ResponseOutparam;
		
		export declare function handle(request: IncomingRequest, responseOut: ResponseOutparam): void;
	}
	export type IncomingHandler = Pick<typeof IncomingHandler, 'handle'>;
	
	export namespace OutgoingHandler {
		
		export type OutgoingRequest = http.Types.OutgoingRequest;
		
		export type RequestOptions = http.Types.RequestOptions;
		
		export type FutureIncomingResponse = http.Types.FutureIncomingResponse;
		
		export type Error = http.Types.Error;
		
		export declare function handle(request: OutgoingRequest, options: RequestOptions | undefined): result<FutureIncomingResponse, Error>;
	}
	export type OutgoingHandler = Pick<typeof OutgoingHandler, 'handle'>;
	
}

export namespace http {
	export namespace Types.$ {
		export const InputStream = io.Streams.$.InputStream;
		export const OutputStream = io.Streams.$.OutputStream;
		export const Pollable = io.Poll.$.Pollable;
		export const Method = new $wcm.VariantType<http.Types.Method, http.Types.Method._ct, http.Types.Method._vt>([undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, $wcm.wstring], http.Types.Method._ctor);
		export const Scheme = new $wcm.VariantType<http.Types.Scheme, http.Types.Scheme._ct, http.Types.Scheme._vt>([undefined, undefined, $wcm.wstring], http.Types.Scheme._ctor);
		export const Error = new $wcm.VariantType<http.Types.Error, http.Types.Error._ct, http.Types.Error._vt>([$wcm.wstring, $wcm.wstring, $wcm.wstring, $wcm.wstring], http.Types.Error._ctor);
		export const Headers = Fields;
		export const Trailers = Fields;
		export const RequestOptions = new $wcm.RecordType<http.Types.RequestOptions>([
			['connectTimeoutMs', new $wcm.OptionType<u32>($wcm.u32)],
			['firstByteTimeoutMs', new $wcm.OptionType<u32>($wcm.u32)],
			['betweenBytesTimeoutMs', new $wcm.OptionType<u32>($wcm.u32)],
		]);
		export const StatusCode = $wcm.u16;
		export const [constructor]fields = new $wcm.FunctionType<typeof http.Types.[constructor]fields>('[constructor]fields', '[constructor]fields',[
			['entries', new $wcm.ListType<[string, Uint8Array]>(new $wcm.TupleType<[string, Uint8Array]>([$wcm.wstring, new $wcm.Uint8ArrayType()]))],
		], new $wcm.OwnType<http.Types.Fields>(Fields));
		export const [method]fields.get = new $wcm.FunctionType<typeof http.Types.[method]fields.get>('[method]fields.get', '[method]fields.get',[
			['self', new $wcm.BorrowType<http.Types.Fields>(Fields)],
			['name', $wcm.wstring],
		], new $wcm.ListType<Uint8Array>(new $wcm.Uint8ArrayType()));
		export const [method]fields.set = new $wcm.FunctionType<typeof http.Types.[method]fields.set>('[method]fields.set', '[method]fields.set',[
			['self', new $wcm.BorrowType<http.Types.Fields>(Fields)],
			['name', $wcm.wstring],
			['value', new $wcm.ListType<Uint8Array>(new $wcm.Uint8ArrayType())],
		], undefined);
		export const [method]fields.delete = new $wcm.FunctionType<typeof http.Types.[method]fields.delete>('[method]fields.delete', '[method]fields.delete',[
			['self', new $wcm.BorrowType<http.Types.Fields>(Fields)],
			['name', $wcm.wstring],
		], undefined);
		export const [method]fields.append = new $wcm.FunctionType<typeof http.Types.[method]fields.append>('[method]fields.append', '[method]fields.append',[
			['self', new $wcm.BorrowType<http.Types.Fields>(Fields)],
			['name', $wcm.wstring],
			['value', new $wcm.Uint8ArrayType()],
		], undefined);
		export const [method]fields.entries = new $wcm.FunctionType<typeof http.Types.[method]fields.entries>('[method]fields.entries', '[method]fields.entries',[
			['self', new $wcm.BorrowType<http.Types.Fields>(Fields)],
		], new $wcm.ListType<[string, Uint8Array]>(new $wcm.TupleType<[string, Uint8Array]>([$wcm.wstring, new $wcm.Uint8ArrayType()])));
		export const [method]fields.clone = new $wcm.FunctionType<typeof http.Types.[method]fields.clone>('[method]fields.clone', '[method]fields.clone',[
			['self', new $wcm.BorrowType<http.Types.Fields>(Fields)],
		], new $wcm.OwnType<http.Types.Fields>(Fields));
		export const [method]incomingRequest.method = new $wcm.FunctionType<typeof http.Types.[method]incomingRequest.method>('[method]incomingRequest.method', '[method]incoming-request.method',[
			['self', new $wcm.BorrowType<http.Types.IncomingRequest>(IncomingRequest)],
		], Method);
		export const [method]incomingRequest.pathWithQuery = new $wcm.FunctionType<typeof http.Types.[method]incomingRequest.pathWithQuery>('[method]incomingRequest.pathWithQuery', '[method]incoming-request.path-with-query',[
			['self', new $wcm.BorrowType<http.Types.IncomingRequest>(IncomingRequest)],
		], new $wcm.OptionType<string>($wcm.wstring));
		export const [method]incomingRequest.scheme = new $wcm.FunctionType<typeof http.Types.[method]incomingRequest.scheme>('[method]incomingRequest.scheme', '[method]incoming-request.scheme',[
			['self', new $wcm.BorrowType<http.Types.IncomingRequest>(IncomingRequest)],
		], new $wcm.OptionType<http.Types.Scheme>(Scheme));
		export const [method]incomingRequest.authority = new $wcm.FunctionType<typeof http.Types.[method]incomingRequest.authority>('[method]incomingRequest.authority', '[method]incoming-request.authority',[
			['self', new $wcm.BorrowType<http.Types.IncomingRequest>(IncomingRequest)],
		], new $wcm.OptionType<string>($wcm.wstring));
		export const [method]incomingRequest.headers = new $wcm.FunctionType<typeof http.Types.[method]incomingRequest.headers>('[method]incomingRequest.headers', '[method]incoming-request.headers',[
			['self', new $wcm.BorrowType<http.Types.IncomingRequest>(IncomingRequest)],
		], new $wcm.OwnType<http.Types.Headers>(Headers));
		export const [method]incomingRequest.consume = new $wcm.FunctionType<typeof http.Types.[method]incomingRequest.consume>('[method]incomingRequest.consume', '[method]incoming-request.consume',[
			['self', new $wcm.BorrowType<http.Types.IncomingRequest>(IncomingRequest)],
		], new $wcm.ResultType<http.Types.IncomingBody, void>(new $wcm.OwnType<http.Types.IncomingBody>(IncomingBody), undefined));
		export const [constructor]outgoingRequest = new $wcm.FunctionType<typeof http.Types.[constructor]outgoingRequest>('[constructor]outgoingRequest', '[constructor]outgoing-request',[
			['method', Method],
			['pathWithQuery', new $wcm.OptionType<string>($wcm.wstring)],
			['scheme', new $wcm.OptionType<http.Types.Scheme>(Scheme)],
			['authority', new $wcm.OptionType<string>($wcm.wstring)],
			['headers', new $wcm.BorrowType<http.Types.Headers>(Headers)],
		], new $wcm.OwnType<http.Types.OutgoingRequest>(OutgoingRequest));
		export const [method]outgoingRequest.write = new $wcm.FunctionType<typeof http.Types.[method]outgoingRequest.write>('[method]outgoingRequest.write', '[method]outgoing-request.write',[
			['self', new $wcm.BorrowType<http.Types.OutgoingRequest>(OutgoingRequest)],
		], new $wcm.ResultType<http.Types.OutgoingBody, void>(new $wcm.OwnType<http.Types.OutgoingBody>(OutgoingBody), undefined));
		export const [static]responseOutparam.set = new $wcm.FunctionType<typeof http.Types.[static]responseOutparam.set>('[static]responseOutparam.set', '[static]response-outparam.set',[
			['param', new $wcm.OwnType<http.Types.ResponseOutparam>(ResponseOutparam)],
			['response', new $wcm.ResultType<http.Types.OutgoingResponse, http.Types.Error>(new $wcm.OwnType<http.Types.OutgoingResponse>(OutgoingResponse), Error)],
		], undefined);
		export const [method]incomingResponse.status = new $wcm.FunctionType<typeof http.Types.[method]incomingResponse.status>('[method]incomingResponse.status', '[method]incoming-response.status',[
			['self', new $wcm.BorrowType<http.Types.IncomingResponse>(IncomingResponse)],
		], StatusCode);
		export const [method]incomingResponse.headers = new $wcm.FunctionType<typeof http.Types.[method]incomingResponse.headers>('[method]incomingResponse.headers', '[method]incoming-response.headers',[
			['self', new $wcm.BorrowType<http.Types.IncomingResponse>(IncomingResponse)],
		], new $wcm.OwnType<http.Types.Headers>(Headers));
		export const [method]incomingResponse.consume = new $wcm.FunctionType<typeof http.Types.[method]incomingResponse.consume>('[method]incomingResponse.consume', '[method]incoming-response.consume',[
			['self', new $wcm.BorrowType<http.Types.IncomingResponse>(IncomingResponse)],
		], new $wcm.ResultType<http.Types.IncomingBody, void>(new $wcm.OwnType<http.Types.IncomingBody>(IncomingBody), undefined));
		export const [method]incomingBody.stream = new $wcm.FunctionType<typeof http.Types.[method]incomingBody.stream>('[method]incomingBody.stream', '[method]incoming-body.stream',[
			['self', new $wcm.BorrowType<http.Types.IncomingBody>(IncomingBody)],
		], new $wcm.ResultType<http.Types.InputStream, void>(new $wcm.OwnType<http.Types.InputStream>(InputStream), undefined));
		export const [static]incomingBody.finish = new $wcm.FunctionType<typeof http.Types.[static]incomingBody.finish>('[static]incomingBody.finish', '[static]incoming-body.finish',[
			['this_', new $wcm.OwnType<http.Types.IncomingBody>(IncomingBody)],
		], new $wcm.OwnType<http.Types.FutureTrailers>(FutureTrailers));
		export const [method]futureTrailers.subscribe = new $wcm.FunctionType<typeof http.Types.[method]futureTrailers.subscribe>('[method]futureTrailers.subscribe', '[method]future-trailers.subscribe',[
			['self', new $wcm.BorrowType<http.Types.FutureTrailers>(FutureTrailers)],
		], new $wcm.OwnType<http.Types.Pollable>(Pollable));
		export const [method]futureTrailers.get = new $wcm.FunctionType<typeof http.Types.[method]futureTrailers.get>('[method]futureTrailers.get', '[method]future-trailers.get',[
			['self', new $wcm.BorrowType<http.Types.FutureTrailers>(FutureTrailers)],
		], new $wcm.OptionType<result<http.Types.Trailers, http.Types.Error>>(new $wcm.ResultType<http.Types.Trailers, http.Types.Error>(new $wcm.OwnType<http.Types.Trailers>(Trailers), Error)));
		export const [constructor]outgoingResponse = new $wcm.FunctionType<typeof http.Types.[constructor]outgoingResponse>('[constructor]outgoingResponse', '[constructor]outgoing-response',[
			['statusCode', StatusCode],
			['headers', new $wcm.BorrowType<http.Types.Headers>(Headers)],
		], new $wcm.OwnType<http.Types.OutgoingResponse>(OutgoingResponse));
		export const [method]outgoingResponse.write = new $wcm.FunctionType<typeof http.Types.[method]outgoingResponse.write>('[method]outgoingResponse.write', '[method]outgoing-response.write',[
			['self', new $wcm.BorrowType<http.Types.OutgoingResponse>(OutgoingResponse)],
		], new $wcm.ResultType<http.Types.OutgoingBody, void>(new $wcm.OwnType<http.Types.OutgoingBody>(OutgoingBody), undefined));
		export const [method]outgoingBody.write = new $wcm.FunctionType<typeof http.Types.[method]outgoingBody.write>('[method]outgoingBody.write', '[method]outgoing-body.write',[
			['self', new $wcm.BorrowType<http.Types.OutgoingBody>(OutgoingBody)],
		], new $wcm.ResultType<http.Types.OutputStream, void>(new $wcm.OwnType<http.Types.OutputStream>(OutputStream), undefined));
		export const [static]outgoingBody.finish = new $wcm.FunctionType<typeof http.Types.[static]outgoingBody.finish>('[static]outgoingBody.finish', '[static]outgoing-body.finish',[
			['this_', new $wcm.OwnType<http.Types.OutgoingBody>(OutgoingBody)],
			['trailers', new $wcm.OptionType<http.Types.Trailers>(new $wcm.OwnType<http.Types.Trailers>(Trailers))],
		], undefined);
		export const [method]futureIncomingResponse.get = new $wcm.FunctionType<typeof http.Types.[method]futureIncomingResponse.get>('[method]futureIncomingResponse.get', '[method]future-incoming-response.get',[
			['self', new $wcm.BorrowType<http.Types.FutureIncomingResponse>(FutureIncomingResponse)],
		], new $wcm.OptionType<result<result<http.Types.IncomingResponse, http.Types.Error>, void>>(new $wcm.ResultType<result<http.Types.IncomingResponse, http.Types.Error>, void>(new $wcm.ResultType<http.Types.IncomingResponse, http.Types.Error>(new $wcm.OwnType<http.Types.IncomingResponse>(IncomingResponse), Error), undefined)));
		export const [method]futureIncomingResponse.subscribe = new $wcm.FunctionType<typeof http.Types.[method]futureIncomingResponse.subscribe>('[method]futureIncomingResponse.subscribe', '[method]future-incoming-response.subscribe',[
			['self', new $wcm.BorrowType<http.Types.FutureIncomingResponse>(FutureIncomingResponse)],
		], new $wcm.OwnType<http.Types.Pollable>(Pollable));
	}
	export namespace Types._ {
		const allFunctions = [$.[constructor]fields, $.[method]fields.get, $.[method]fields.set, $.[method]fields.delete, $.[method]fields.append, $.[method]fields.entries, $.[method]fields.clone, $.[method]incomingRequest.method, $.[method]incomingRequest.pathWithQuery, $.[method]incomingRequest.scheme, $.[method]incomingRequest.authority, $.[method]incomingRequest.headers, $.[method]incomingRequest.consume, $.[constructor]outgoingRequest, $.[method]outgoingRequest.write, $.[static]responseOutparam.set, $.[method]incomingResponse.status, $.[method]incomingResponse.headers, $.[method]incomingResponse.consume, $.[method]incomingBody.stream, $.[static]incomingBody.finish, $.[method]futureTrailers.subscribe, $.[method]futureTrailers.get, $.[constructor]outgoingResponse, $.[method]outgoingResponse.write, $.[method]outgoingBody.write, $.[static]outgoingBody.finish, $.[method]futureIncomingResponse.get, $.[method]futureIncomingResponse.subscribe];
		export type WasmInterface = {
			'[constructor]fields': (entries_ptr: i32, entries_len: i32, result: ptr<[]>) => void;
			'[method]fields.get': (name_ptr: i32, name_len: i32, result: ptr<[ptr<i32>, i32]>) => void;
			'[method]fields.set': (name_ptr: i32, name_len: i32, value_ptr: i32, value_len: i32) => void;
			'[method]fields.delete': (name_ptr: i32, name_len: i32) => void;
			'[method]fields.append': (name_ptr: i32, name_len: i32, value_ptr: i32, value_len: i32) => void;
			'[method]fields.entries': (result: ptr<[ptr<i32>, i32]>) => void;
			'[method]fields.clone': (result: ptr<[]>) => void;
			'[method]incoming-request.method': (result: ptr<(i32 | i64 | f32 | f64)[]>) => void;
			'[method]incoming-request.path-with-query': (result: ptr<(i32 | i64 | f32 | f64)[]>) => void;
			'[method]incoming-request.scheme': (result: ptr<(i32 | i64 | f32 | f64)[]>) => void;
			'[method]incoming-request.authority': (result: ptr<(i32 | i64 | f32 | f64)[]>) => void;
			'[method]incoming-request.headers': (result: ptr<[]>) => void;
			'[method]incoming-request.consume': (result: ptr<(i32 | i64 | f32 | f64)[]>) => void;
			'[constructor]outgoing-request': (...args: (i32 | i64 | f32 | f64)[], result: ptr<[]>) => void;
			'[method]outgoing-request.write': (result: ptr<(i32 | i64 | f32 | f64)[]>) => void;
			'[static]response-outparam.set': (...args: (i32 | i64 | f32 | f64)[]) => void;
			'[method]incoming-response.status': () => i32;
			'[method]incoming-response.headers': (result: ptr<[]>) => void;
			'[method]incoming-response.consume': (result: ptr<(i32 | i64 | f32 | f64)[]>) => void;
			'[method]incoming-body.stream': (result: ptr<(i32 | i64 | f32 | f64)[]>) => void;
			'[static]incoming-body.finish': (result: ptr<[]>) => void;
			'[method]future-trailers.subscribe': (result: ptr<[]>) => void;
			'[method]future-trailers.get': (result: ptr<(i32 | i64 | f32 | f64)[]>) => void;
			'[constructor]outgoing-response': (statusCode: i32, result: ptr<[]>) => void;
			'[method]outgoing-response.write': (result: ptr<(i32 | i64 | f32 | f64)[]>) => void;
			'[method]outgoing-body.write': (result: ptr<(i32 | i64 | f32 | f64)[]>) => void;
			'[static]outgoing-body.finish': (...args: (i32 | i64 | f32 | f64)[]) => void;
			'[method]future-incoming-response.get': (result: ptr<(i32 | i64 | f32 | f64)[]>) => void;
			'[method]future-incoming-response.subscribe': (result: ptr<[]>) => void;
		};
		export function createHost<T extends $wcm.Host>(service: http.Types, context: $wcm.Context): T {
			return $wcm.Host.create<T>(allFunctions, service, context);
		}
		export function createService(wasmInterface: $wcm.WasmInterface, context: $wcm.Context): http.Types {
			return $wcm.Service.create<http.Types>(allFunctions, wasmInterface, context);
		}
	}
	export namespace IncomingHandler.$ {
		export const IncomingRequest = http.Types.$.IncomingRequest;
		export const ResponseOutparam = http.Types.$.ResponseOutparam;
		export const handle = new $wcm.FunctionType<typeof http.IncomingHandler.handle>('handle', 'handle',[
			['request', new $wcm.OwnType<http.IncomingHandler.IncomingRequest>(IncomingRequest)],
			['responseOut', new $wcm.OwnType<http.IncomingHandler.ResponseOutparam>(ResponseOutparam)],
		], undefined);
	}
	export namespace IncomingHandler._ {
		const allFunctions = [$.handle];
		export type WasmInterface = {
			'handle': () => void;
		};
		export function createHost<T extends $wcm.Host>(service: http.IncomingHandler, context: $wcm.Context): T {
			return $wcm.Host.create<T>(allFunctions, service, context);
		}
		export function createService(wasmInterface: $wcm.WasmInterface, context: $wcm.Context): http.IncomingHandler {
			return $wcm.Service.create<http.IncomingHandler>(allFunctions, wasmInterface, context);
		}
	}
	export namespace OutgoingHandler.$ {
		export const OutgoingRequest = http.Types.$.OutgoingRequest;
		export const RequestOptions = http.Types.$.RequestOptions;
		export const FutureIncomingResponse = http.Types.$.FutureIncomingResponse;
		export const Error = http.Types.$.Error;
		export const handle = new $wcm.FunctionType<typeof http.OutgoingHandler.handle>('handle', 'handle',[
			['request', new $wcm.OwnType<http.OutgoingHandler.OutgoingRequest>(OutgoingRequest)],
			['options', new $wcm.OptionType<http.OutgoingHandler.RequestOptions>(RequestOptions)],
		], new $wcm.ResultType<http.OutgoingHandler.FutureIncomingResponse, http.OutgoingHandler.Error>(new $wcm.OwnType<http.OutgoingHandler.FutureIncomingResponse>(FutureIncomingResponse), Error));
	}
	export namespace OutgoingHandler._ {
		const allFunctions = [$.handle];
		export type WasmInterface = {
			'handle': (result: ptr<(i32 | i64 | f32 | f64)[]>) => void;
		};
		export function createHost<T extends $wcm.Host>(service: http.OutgoingHandler, context: $wcm.Context): T {
			return $wcm.Host.create<T>(allFunctions, service, context);
		}
		export function createService(wasmInterface: $wcm.WasmInterface, context: $wcm.Context): http.OutgoingHandler {
			return $wcm.Service.create<http.OutgoingHandler>(allFunctions, wasmInterface, context);
		}
	}
}
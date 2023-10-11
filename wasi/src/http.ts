/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '@vscode/wasm-component-model';
import type { resource, own, borrow, result, u32, u16, i32, ptr } from '@vscode/wasm-component-model';
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
		export namespace Fields {
			
			export declare function constructor(entries: [string, Uint8Array][]): own<Fields>;
			
			export declare function get(self: borrow<Fields>, name: string): Uint8Array[];
			
			export declare function set(self: borrow<Fields>, name: string, value: Uint8Array[]): void;
			
			export declare function delete_(self: borrow<Fields>, name: string): void;
			
			export declare function append(self: borrow<Fields>, name: string, value: Uint8Array): void;
			
			export declare function entries(self: borrow<Fields>): [string, Uint8Array][];
			
			export declare function clone(self: borrow<Fields>): own<Fields>;
		}
		
		export type Headers = Fields;
		
		export type Trailers = Fields;
		
		export type IncomingRequest = resource;
		export namespace IncomingRequest {
			
			export declare function method(self: borrow<IncomingRequest>): Method;
			
			export declare function pathWithQuery(self: borrow<IncomingRequest>): string | undefined;
			
			export declare function scheme(self: borrow<IncomingRequest>): Scheme | undefined;
			
			export declare function authority(self: borrow<IncomingRequest>): string | undefined;
			
			export declare function headers(self: borrow<IncomingRequest>): own<Headers>;
			
			export declare function consume(self: borrow<IncomingRequest>): result<own<IncomingBody>, void>;
		}
		
		export type OutgoingRequest = resource;
		export namespace OutgoingRequest {
			
			export declare function constructor(method: Method, pathWithQuery: string | undefined, scheme: Scheme | undefined, authority: string | undefined, headers: borrow<Headers>): own<OutgoingRequest>;
			
			export declare function write(self: borrow<OutgoingRequest>): result<own<OutgoingBody>, void>;
		}
		
		export type RequestOptions = {
			connectTimeoutMs?: u32 | undefined;
			firstByteTimeoutMs?: u32 | undefined;
			betweenBytesTimeoutMs?: u32 | undefined;
		};
		
		export type ResponseOutparam = resource;
		export namespace ResponseOutparam {
			
			export declare function set(param: own<ResponseOutparam>, response: result<own<OutgoingResponse>, Error>): void;
		}
		
		export type StatusCode = u16;
		
		export type IncomingResponse = resource;
		export namespace IncomingResponse {
			
			export declare function status(self: borrow<IncomingResponse>): StatusCode;
			
			export declare function headers(self: borrow<IncomingResponse>): own<Headers>;
			
			export declare function consume(self: borrow<IncomingResponse>): result<own<IncomingBody>, void>;
		}
		
		export type IncomingBody = resource;
		export namespace IncomingBody {
			
			export declare function stream(self: borrow<IncomingBody>): result<own<InputStream>, void>;
			
			export declare function finish(this_: own<IncomingBody>): own<FutureTrailers>;
		}
		
		export type FutureTrailers = resource;
		export namespace FutureTrailers {
			
			/**
			 * Pollable that resolves when the body has been fully read, and the trailers
			 * are ready to be consumed.
			 */
			export declare function subscribe(self: borrow<FutureTrailers>): own<Pollable>;
			
			/**
			 * Retrieve reference to trailers, if they are ready.
			 */
			export declare function get(self: borrow<FutureTrailers>): result<own<Trailers>, Error> | undefined;
		}
		
		export type OutgoingResponse = resource;
		export namespace OutgoingResponse {
			
			export declare function constructor(statusCode: StatusCode, headers: borrow<Headers>): own<OutgoingResponse>;
			
			/**
			 * Will give the child outgoing-response at most once. subsequent calls will
			 * return an error.
			 */
			export declare function write(self: borrow<OutgoingResponse>): result<own<OutgoingBody>, void>;
		}
		
		export type OutgoingBody = resource;
		export namespace OutgoingBody {
			
			/**
			 * Will give the child output-stream at most once. subsequent calls will
			 * return an error.
			 */
			export declare function write(self: borrow<OutgoingBody>): result<own<OutputStream>, void>;
			
			/**
			 * Finalize an outgoing body, optionally providing trailers. This must be
			 * called to signal that the response is complete. If the `outgoing-body` is
			 * dropped without calling `outgoing-body-finalize`, the implementation
			 * should treat the body as corrupted.
			 */
			export declare function finish(this_: own<OutgoingBody>, trailers: own<Trailers> | undefined): void;
		}
		
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
		export namespace FutureIncomingResponse {
			
			/**
			 * option indicates readiness.
			 * outer result indicates you are allowed to get the
			 * incoming-response-or-error at most once. subsequent calls after ready
			 * will return an error here.
			 * inner result indicates whether the incoming-response was available, or an
			 * error occured.
			 */
			export declare function get(self: borrow<FutureIncomingResponse>): result<result<own<IncomingResponse>, Error>, void> | undefined;
			
			export declare function subscribe(self: borrow<FutureIncomingResponse>): own<Pollable>;
		}
	}
	export type Types = Pick<typeof Types, 'Fields' | 'IncomingRequest' | 'OutgoingRequest' | 'ResponseOutparam' | 'IncomingResponse' | 'IncomingBody' | 'FutureTrailers' | 'OutgoingResponse' | 'OutgoingBody' | 'FutureIncomingResponse'>;
	
	export namespace IncomingHandler {
		
		export type IncomingRequest = http.Types.IncomingRequest;
		
		export type ResponseOutparam = http.Types.ResponseOutparam;
		
		export declare function handle(request: own<IncomingRequest>, responseOut: own<ResponseOutparam>): void;
	}
	export type IncomingHandler = Pick<typeof IncomingHandler, 'handle'>;
	
	export namespace OutgoingHandler {
		
		export type OutgoingRequest = http.Types.OutgoingRequest;
		
		export type RequestOptions = http.Types.RequestOptions;
		
		export type FutureIncomingResponse = http.Types.FutureIncomingResponse;
		
		export type Error = http.Types.Error;
		
		export declare function handle(request: own<OutgoingRequest>, options: RequestOptions | undefined): result<own<FutureIncomingResponse>, Error>;
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
		export const Fields = new $wcm.NamespaceResourceType('Fields', 'fields');
		export const Headers = Fields;
		export const Trailers = Fields;
		export const IncomingRequest = new $wcm.NamespaceResourceType('IncomingRequest', 'incoming-request');
		export const OutgoingRequest = new $wcm.NamespaceResourceType('OutgoingRequest', 'outgoing-request');
		export const RequestOptions = new $wcm.RecordType<http.Types.RequestOptions>([
			['connectTimeoutMs', new $wcm.OptionType<u32>($wcm.u32)],
			['firstByteTimeoutMs', new $wcm.OptionType<u32>($wcm.u32)],
			['betweenBytesTimeoutMs', new $wcm.OptionType<u32>($wcm.u32)],
		]);
		export const ResponseOutparam = new $wcm.NamespaceResourceType('ResponseOutparam', 'response-outparam');
		export const StatusCode = $wcm.u16;
		export const IncomingResponse = new $wcm.NamespaceResourceType('IncomingResponse', 'incoming-response');
		export const IncomingBody = new $wcm.NamespaceResourceType('IncomingBody', 'incoming-body');
		export const FutureTrailers = new $wcm.NamespaceResourceType('FutureTrailers', 'future-trailers');
		export const OutgoingResponse = new $wcm.NamespaceResourceType('OutgoingResponse', 'outgoing-response');
		export const OutgoingBody = new $wcm.NamespaceResourceType('OutgoingBody', 'outgoing-body');
		export const FutureIncomingResponse = new $wcm.NamespaceResourceType('FutureIncomingResponse', 'future-incoming-response');
		Fields.addFunction(new $wcm.FunctionType<typeof http.Types.Fields.constructor>('constructor', '[constructor]fields', [
			['entries', new $wcm.ListType<[string, Uint8Array]>(new $wcm.TupleType<[string, Uint8Array]>([$wcm.wstring, new $wcm.Uint8ArrayType()]))],
		], new $wcm.OwnType<http.Types.Fields>(Fields)));
		Fields.addFunction(new $wcm.FunctionType<typeof http.Types.Fields.get>('get', '[method]fields.get', [
			['self', new $wcm.BorrowType<http.Types.Fields>(Fields)],
			['name', $wcm.wstring],
		], new $wcm.ListType<Uint8Array>(new $wcm.Uint8ArrayType())));
		Fields.addFunction(new $wcm.FunctionType<typeof http.Types.Fields.set>('set', '[method]fields.set', [
			['self', new $wcm.BorrowType<http.Types.Fields>(Fields)],
			['name', $wcm.wstring],
			['value', new $wcm.ListType<Uint8Array>(new $wcm.Uint8ArrayType())],
		], undefined));
		Fields.addFunction(new $wcm.FunctionType<typeof http.Types.Fields.delete_>('delete_', '[method]fields.delete', [
			['self', new $wcm.BorrowType<http.Types.Fields>(Fields)],
			['name', $wcm.wstring],
		], undefined));
		Fields.addFunction(new $wcm.FunctionType<typeof http.Types.Fields.append>('append', '[method]fields.append', [
			['self', new $wcm.BorrowType<http.Types.Fields>(Fields)],
			['name', $wcm.wstring],
			['value', new $wcm.Uint8ArrayType()],
		], undefined));
		Fields.addFunction(new $wcm.FunctionType<typeof http.Types.Fields.entries>('entries', '[method]fields.entries', [
			['self', new $wcm.BorrowType<http.Types.Fields>(Fields)],
		], new $wcm.ListType<[string, Uint8Array]>(new $wcm.TupleType<[string, Uint8Array]>([$wcm.wstring, new $wcm.Uint8ArrayType()]))));
		Fields.addFunction(new $wcm.FunctionType<typeof http.Types.Fields.clone>('clone', '[method]fields.clone', [
			['self', new $wcm.BorrowType<http.Types.Fields>(Fields)],
		], new $wcm.OwnType<http.Types.Fields>(Fields)));
		IncomingRequest.addFunction(new $wcm.FunctionType<typeof http.Types.IncomingRequest.method>('method', '[method]incoming-request.method', [
			['self', new $wcm.BorrowType<http.Types.IncomingRequest>(IncomingRequest)],
		], Method));
		IncomingRequest.addFunction(new $wcm.FunctionType<typeof http.Types.IncomingRequest.pathWithQuery>('pathWithQuery', '[method]incoming-request.path-with-query', [
			['self', new $wcm.BorrowType<http.Types.IncomingRequest>(IncomingRequest)],
		], new $wcm.OptionType<string>($wcm.wstring)));
		IncomingRequest.addFunction(new $wcm.FunctionType<typeof http.Types.IncomingRequest.scheme>('scheme', '[method]incoming-request.scheme', [
			['self', new $wcm.BorrowType<http.Types.IncomingRequest>(IncomingRequest)],
		], new $wcm.OptionType<http.Types.Scheme>(Scheme)));
		IncomingRequest.addFunction(new $wcm.FunctionType<typeof http.Types.IncomingRequest.authority>('authority', '[method]incoming-request.authority', [
			['self', new $wcm.BorrowType<http.Types.IncomingRequest>(IncomingRequest)],
		], new $wcm.OptionType<string>($wcm.wstring)));
		IncomingRequest.addFunction(new $wcm.FunctionType<typeof http.Types.IncomingRequest.headers>('headers', '[method]incoming-request.headers', [
			['self', new $wcm.BorrowType<http.Types.IncomingRequest>(IncomingRequest)],
		], new $wcm.OwnType<http.Types.Headers>(Headers)));
		IncomingRequest.addFunction(new $wcm.FunctionType<typeof http.Types.IncomingRequest.consume>('consume', '[method]incoming-request.consume', [
			['self', new $wcm.BorrowType<http.Types.IncomingRequest>(IncomingRequest)],
		], new $wcm.ResultType<own<http.Types.IncomingBody>, void>(new $wcm.OwnType<http.Types.IncomingBody>(IncomingBody), undefined)));
		OutgoingRequest.addFunction(new $wcm.FunctionType<typeof http.Types.OutgoingRequest.constructor>('constructor', '[constructor]outgoing-request', [
			['method', Method],
			['pathWithQuery', new $wcm.OptionType<string>($wcm.wstring)],
			['scheme', new $wcm.OptionType<http.Types.Scheme>(Scheme)],
			['authority', new $wcm.OptionType<string>($wcm.wstring)],
			['headers', new $wcm.BorrowType<http.Types.Headers>(Headers)],
		], new $wcm.OwnType<http.Types.OutgoingRequest>(OutgoingRequest)));
		OutgoingRequest.addFunction(new $wcm.FunctionType<typeof http.Types.OutgoingRequest.write>('write', '[method]outgoing-request.write', [
			['self', new $wcm.BorrowType<http.Types.OutgoingRequest>(OutgoingRequest)],
		], new $wcm.ResultType<own<http.Types.OutgoingBody>, void>(new $wcm.OwnType<http.Types.OutgoingBody>(OutgoingBody), undefined)));
		ResponseOutparam.addFunction(new $wcm.FunctionType<typeof http.Types.ResponseOutparam.set>('set', '[static]response-outparam.set', [
			['param', new $wcm.OwnType<http.Types.ResponseOutparam>(ResponseOutparam)],
			['response', new $wcm.ResultType<own<http.Types.OutgoingResponse>, http.Types.Error>(new $wcm.OwnType<http.Types.OutgoingResponse>(OutgoingResponse), Error)],
		], undefined));
		IncomingResponse.addFunction(new $wcm.FunctionType<typeof http.Types.IncomingResponse.status>('status', '[method]incoming-response.status', [
			['self', new $wcm.BorrowType<http.Types.IncomingResponse>(IncomingResponse)],
		], StatusCode));
		IncomingResponse.addFunction(new $wcm.FunctionType<typeof http.Types.IncomingResponse.headers>('headers', '[method]incoming-response.headers', [
			['self', new $wcm.BorrowType<http.Types.IncomingResponse>(IncomingResponse)],
		], new $wcm.OwnType<http.Types.Headers>(Headers)));
		IncomingResponse.addFunction(new $wcm.FunctionType<typeof http.Types.IncomingResponse.consume>('consume', '[method]incoming-response.consume', [
			['self', new $wcm.BorrowType<http.Types.IncomingResponse>(IncomingResponse)],
		], new $wcm.ResultType<own<http.Types.IncomingBody>, void>(new $wcm.OwnType<http.Types.IncomingBody>(IncomingBody), undefined)));
		IncomingBody.addFunction(new $wcm.FunctionType<typeof http.Types.IncomingBody.stream>('stream', '[method]incoming-body.stream', [
			['self', new $wcm.BorrowType<http.Types.IncomingBody>(IncomingBody)],
		], new $wcm.ResultType<own<http.Types.InputStream>, void>(new $wcm.OwnType<http.Types.InputStream>(InputStream), undefined)));
		IncomingBody.addFunction(new $wcm.FunctionType<typeof http.Types.IncomingBody.finish>('finish', '[static]incoming-body.finish', [
			['this_', new $wcm.OwnType<http.Types.IncomingBody>(IncomingBody)],
		], new $wcm.OwnType<http.Types.FutureTrailers>(FutureTrailers)));
		FutureTrailers.addFunction(new $wcm.FunctionType<typeof http.Types.FutureTrailers.subscribe>('subscribe', '[method]future-trailers.subscribe', [
			['self', new $wcm.BorrowType<http.Types.FutureTrailers>(FutureTrailers)],
		], new $wcm.OwnType<http.Types.Pollable>(Pollable)));
		FutureTrailers.addFunction(new $wcm.FunctionType<typeof http.Types.FutureTrailers.get>('get', '[method]future-trailers.get', [
			['self', new $wcm.BorrowType<http.Types.FutureTrailers>(FutureTrailers)],
		], new $wcm.OptionType<result<own<http.Types.Trailers>, http.Types.Error>>(new $wcm.ResultType<own<http.Types.Trailers>, http.Types.Error>(new $wcm.OwnType<http.Types.Trailers>(Trailers), Error))));
		OutgoingResponse.addFunction(new $wcm.FunctionType<typeof http.Types.OutgoingResponse.constructor>('constructor', '[constructor]outgoing-response', [
			['statusCode', StatusCode],
			['headers', new $wcm.BorrowType<http.Types.Headers>(Headers)],
		], new $wcm.OwnType<http.Types.OutgoingResponse>(OutgoingResponse)));
		OutgoingResponse.addFunction(new $wcm.FunctionType<typeof http.Types.OutgoingResponse.write>('write', '[method]outgoing-response.write', [
			['self', new $wcm.BorrowType<http.Types.OutgoingResponse>(OutgoingResponse)],
		], new $wcm.ResultType<own<http.Types.OutgoingBody>, void>(new $wcm.OwnType<http.Types.OutgoingBody>(OutgoingBody), undefined)));
		OutgoingBody.addFunction(new $wcm.FunctionType<typeof http.Types.OutgoingBody.write>('write', '[method]outgoing-body.write', [
			['self', new $wcm.BorrowType<http.Types.OutgoingBody>(OutgoingBody)],
		], new $wcm.ResultType<own<http.Types.OutputStream>, void>(new $wcm.OwnType<http.Types.OutputStream>(OutputStream), undefined)));
		OutgoingBody.addFunction(new $wcm.FunctionType<typeof http.Types.OutgoingBody.finish>('finish', '[static]outgoing-body.finish', [
			['this_', new $wcm.OwnType<http.Types.OutgoingBody>(OutgoingBody)],
			['trailers', new $wcm.OptionType<own<http.Types.Trailers>>(new $wcm.OwnType<http.Types.Trailers>(Trailers))],
		], undefined));
		FutureIncomingResponse.addFunction(new $wcm.FunctionType<typeof http.Types.FutureIncomingResponse.get>('get', '[method]future-incoming-response.get', [
			['self', new $wcm.BorrowType<http.Types.FutureIncomingResponse>(FutureIncomingResponse)],
		], new $wcm.OptionType<result<result<own<http.Types.IncomingResponse>, http.Types.Error>, void>>(new $wcm.ResultType<result<own<http.Types.IncomingResponse>, http.Types.Error>, void>(new $wcm.ResultType<own<http.Types.IncomingResponse>, http.Types.Error>(new $wcm.OwnType<http.Types.IncomingResponse>(IncomingResponse), Error), undefined))));
		FutureIncomingResponse.addFunction(new $wcm.FunctionType<typeof http.Types.FutureIncomingResponse.subscribe>('subscribe', '[method]future-incoming-response.subscribe', [
			['self', new $wcm.BorrowType<http.Types.FutureIncomingResponse>(FutureIncomingResponse)],
		], new $wcm.OwnType<http.Types.Pollable>(Pollable)));
	}
	export namespace Types._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [];
		const resources: $wcm.NamespaceResourceType[] = [$.Fields, $.IncomingRequest, $.OutgoingRequest, $.ResponseOutparam, $.IncomingResponse, $.IncomingBody, $.FutureTrailers, $.OutgoingResponse, $.OutgoingBody, $.FutureIncomingResponse];
		export type WasmInterface = {
			'[constructor]fields': (entries_ptr: i32, entries_len: i32) => i32;
			'[method]fields.get': (self: i32, name_ptr: i32, name_len: i32, result: ptr<[i32, i32]>) => void;
			'[method]fields.set': (self: i32, name_ptr: i32, name_len: i32, value_ptr: i32, value_len: i32) => void;
			'[method]fields.delete': (self: i32, name_ptr: i32, name_len: i32) => void;
			'[method]fields.append': (self: i32, name_ptr: i32, name_len: i32, value_ptr: i32, value_len: i32) => void;
			'[method]fields.entries': (self: i32, result: ptr<[i32, i32]>) => void;
			'[method]fields.clone': (self: i32) => i32;
			'[method]incoming-request.method': (self: i32, result: ptr<[i32, i32, i32]>) => void;
			'[method]incoming-request.path-with-query': (self: i32, result: ptr<[i32, i32, i32]>) => void;
			'[method]incoming-request.scheme': (self: i32, result: ptr<[i32, i32, i32, i32]>) => void;
			'[method]incoming-request.authority': (self: i32, result: ptr<[i32, i32, i32]>) => void;
			'[method]incoming-request.headers': (self: i32) => i32;
			'[method]incoming-request.consume': (self: i32, result: ptr<[i32, i32]>) => void;
			'[constructor]outgoing-request': (method_case: i32, method_0: i32, method_1: i32, pathWithQuery_case: i32, pathWithQuery_option_ptr: i32, pathWithQuery_option_len: i32, scheme_case: i32, scheme_option_case: i32, scheme_option_0: i32, scheme_option_1: i32, authority_case: i32, authority_option_ptr: i32, authority_option_len: i32, headers: i32) => i32;
			'[method]outgoing-request.write': (self: i32, result: ptr<[i32, i32]>) => void;
			'[static]response-outparam.set': (param: i32, response_case: i32, response_0: i32, response_1: i32, response_2: i32) => void;
			'[method]incoming-response.status': (self: i32) => i32;
			'[method]incoming-response.headers': (self: i32) => i32;
			'[method]incoming-response.consume': (self: i32, result: ptr<[i32, i32]>) => void;
			'[method]incoming-body.stream': (self: i32, result: ptr<[i32, i32]>) => void;
			'[static]incoming-body.finish': (this_: i32) => i32;
			'[method]future-trailers.subscribe': (self: i32) => i32;
			'[method]future-trailers.get': (self: i32, result: ptr<[i32, i32, i32, i32, i32]>) => void;
			'[constructor]outgoing-response': (statusCode: i32, headers: i32) => i32;
			'[method]outgoing-response.write': (self: i32, result: ptr<[i32, i32]>) => void;
			'[method]outgoing-body.write': (self: i32, result: ptr<[i32, i32]>) => void;
			'[static]outgoing-body.finish': (this_: i32, trailers_case: i32, trailers_option: i32) => void;
			'[method]future-incoming-response.get': (self: i32, result: ptr<[i32, i32, i32, i32, i32, i32]>) => void;
			'[method]future-incoming-response.subscribe': (self: i32) => i32;
		};
		export function createHost(service: http.Types, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context): http.Types {
			return $wcm.Service.create<http.Types>(functions, resources, wasmInterface, context);
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
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [$.handle];
		const resources: $wcm.NamespaceResourceType[] = [];
		export type WasmInterface = {
			'handle': (request: i32, responseOut: i32) => void;
		};
		export function createHost(service: http.IncomingHandler, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context): http.IncomingHandler {
			return $wcm.Service.create<http.IncomingHandler>(functions, resources, wasmInterface, context);
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
		], new $wcm.ResultType<own<http.OutgoingHandler.FutureIncomingResponse>, http.OutgoingHandler.Error>(new $wcm.OwnType<http.OutgoingHandler.FutureIncomingResponse>(FutureIncomingResponse), Error));
	}
	export namespace OutgoingHandler._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [$.handle];
		const resources: $wcm.NamespaceResourceType[] = [];
		export type WasmInterface = {
			'handle': (request: i32, options_case: i32, options_option_RequestOptions_connectTimeoutMs_case: i32, options_option_RequestOptions_connectTimeoutMs_option: i32, options_option_RequestOptions_firstByteTimeoutMs_case: i32, options_option_RequestOptions_firstByteTimeoutMs_option: i32, options_option_RequestOptions_betweenBytesTimeoutMs_case: i32, options_option_RequestOptions_betweenBytesTimeoutMs_option: i32, result: ptr<[i32, i32, i32, i32]>) => void;
		};
		export function createHost(service: http.OutgoingHandler, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context): http.OutgoingHandler {
			return $wcm.Service.create<http.OutgoingHandler>(functions, resources, wasmInterface, context);
		}
	}
}
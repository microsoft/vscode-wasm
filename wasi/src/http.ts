/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '@vscode/wasm-component-model';
import type { u32, u16, own, borrow, i32, ptr, resource, result } from '@vscode/wasm-component-model';
import { io } from './io';

export namespace http {
	export namespace Types {
		
		export type InputStream = io.Streams.InputStream;
		
		export type OutputStream = io.Streams.OutputStream;
		
		export type Pollable = io.Poll.Pollable;
		
		export namespace Method {
			export const get = 'get' as const;
			export type Get = { readonly tag: typeof get } & _common;
			export function Get(): Get {
				return new VariantImpl(get, undefined) as Get;
			}
			
			export const head = 'head' as const;
			export type Head = { readonly tag: typeof head } & _common;
			export function Head(): Head {
				return new VariantImpl(head, undefined) as Head;
			}
			
			export const post = 'post' as const;
			export type Post = { readonly tag: typeof post } & _common;
			export function Post(): Post {
				return new VariantImpl(post, undefined) as Post;
			}
			
			export const put = 'put' as const;
			export type Put = { readonly tag: typeof put } & _common;
			export function Put(): Put {
				return new VariantImpl(put, undefined) as Put;
			}
			
			export const delete_ = 'delete_' as const;
			export type Delete = { readonly tag: typeof delete_ } & _common;
			export function Delete(): Delete {
				return new VariantImpl(delete_, undefined) as Delete;
			}
			
			export const connect = 'connect' as const;
			export type Connect = { readonly tag: typeof connect } & _common;
			export function Connect(): Connect {
				return new VariantImpl(connect, undefined) as Connect;
			}
			
			export const options = 'options' as const;
			export type Options = { readonly tag: typeof options } & _common;
			export function Options(): Options {
				return new VariantImpl(options, undefined) as Options;
			}
			
			export const trace = 'trace' as const;
			export type Trace = { readonly tag: typeof trace } & _common;
			export function Trace(): Trace {
				return new VariantImpl(trace, undefined) as Trace;
			}
			
			export const patch = 'patch' as const;
			export type Patch = { readonly tag: typeof patch } & _common;
			export function Patch(): Patch {
				return new VariantImpl(patch, undefined) as Patch;
			}
			
			export const other = 'other' as const;
			export type Other = { readonly tag: typeof other; readonly value: string } & _common;
			export function Other(value: string): Other {
				return new VariantImpl(other, value) as Other;
			}
			
			export type _tt = typeof get | typeof head | typeof post | typeof put | typeof delete_ | typeof connect | typeof options | typeof trace | typeof patch | typeof other;
			export type _vt = string | undefined;
			type _common = Omit<VariantImpl, 'tag' | 'value'>;
			export function _ctor(t: _tt, v: _vt): Method {
				return new VariantImpl(t, v) as Method;
			}
			class VariantImpl {
				private readonly _tag: _tt;
				private readonly _value?: _vt;
				constructor(t: _tt, value: _vt) {
					this._tag = t;
					this._value = value;
				}
				get tag(): _tt {
					return this._tag;
				}
				get value(): _vt {
					return this._value;
				}
				isGet(): this is Get {
					return this._tag === Method.get;
				}
				isHead(): this is Head {
					return this._tag === Method.head;
				}
				isPost(): this is Post {
					return this._tag === Method.post;
				}
				isPut(): this is Put {
					return this._tag === Method.put;
				}
				isDelete(): this is Delete {
					return this._tag === Method.delete_;
				}
				isConnect(): this is Connect {
					return this._tag === Method.connect;
				}
				isOptions(): this is Options {
					return this._tag === Method.options;
				}
				isTrace(): this is Trace {
					return this._tag === Method.trace;
				}
				isPatch(): this is Patch {
					return this._tag === Method.patch;
				}
				isOther(): this is Other {
					return this._tag === Method.other;
				}
			}
		}
		export type Method = Method.Get | Method.Head | Method.Post | Method.Put | Method.Delete | Method.Connect | Method.Options | Method.Trace | Method.Patch | Method.Other;
		
		export namespace Scheme {
			export const http = 'HTTP' as const;
			export type HTTP = { readonly tag: typeof http } & _common;
			export function HTTP(): HTTP {
				return new VariantImpl(http, undefined) as HTTP;
			}
			
			export const https = 'HTTPS' as const;
			export type HTTPS = { readonly tag: typeof https } & _common;
			export function HTTPS(): HTTPS {
				return new VariantImpl(https, undefined) as HTTPS;
			}
			
			export const other = 'other' as const;
			export type Other = { readonly tag: typeof other; readonly value: string } & _common;
			export function Other(value: string): Other {
				return new VariantImpl(other, value) as Other;
			}
			
			export type _tt = typeof http | typeof https | typeof other;
			export type _vt = string | undefined;
			type _common = Omit<VariantImpl, 'tag' | 'value'>;
			export function _ctor(t: _tt, v: _vt): Scheme {
				return new VariantImpl(t, v) as Scheme;
			}
			class VariantImpl {
				private readonly _tag: _tt;
				private readonly _value?: _vt;
				constructor(t: _tt, value: _vt) {
					this._tag = t;
					this._value = value;
				}
				get tag(): _tt {
					return this._tag;
				}
				get value(): _vt {
					return this._value;
				}
				isHTTP(): this is HTTP {
					return this._tag === Scheme.http;
				}
				isHTTPS(): this is HTTPS {
					return this._tag === Scheme.https;
				}
				isOther(): this is Other {
					return this._tag === Scheme.other;
				}
			}
		}
		export type Scheme = Scheme.HTTP | Scheme.HTTPS | Scheme.Other;
		
		export namespace Error {
			export const invalidUrl = 'invalidUrl' as const;
			export type InvalidUrl = { readonly tag: typeof invalidUrl; readonly value: string } & _common;
			export function InvalidUrl(value: string): InvalidUrl {
				return new VariantImpl(invalidUrl, value) as InvalidUrl;
			}
			
			export const timeoutError = 'timeoutError' as const;
			export type TimeoutError = { readonly tag: typeof timeoutError; readonly value: string } & _common;
			export function TimeoutError(value: string): TimeoutError {
				return new VariantImpl(timeoutError, value) as TimeoutError;
			}
			
			export const protocolError = 'protocolError' as const;
			export type ProtocolError = { readonly tag: typeof protocolError; readonly value: string } & _common;
			export function ProtocolError(value: string): ProtocolError {
				return new VariantImpl(protocolError, value) as ProtocolError;
			}
			
			export const unexpectedError = 'unexpectedError' as const;
			export type UnexpectedError = { readonly tag: typeof unexpectedError; readonly value: string } & _common;
			export function UnexpectedError(value: string): UnexpectedError {
				return new VariantImpl(unexpectedError, value) as UnexpectedError;
			}
			
			export type _tt = typeof invalidUrl | typeof timeoutError | typeof protocolError | typeof unexpectedError;
			export type _vt = string | string | string | string;
			type _common = Omit<VariantImpl, 'tag' | 'value'>;
			export function _ctor(t: _tt, v: _vt): Error {
				return new VariantImpl(t, v) as Error;
			}
			class VariantImpl {
				private readonly _tag: _tt;
				private readonly _value: _vt;
				constructor(t: _tt, value: _vt) {
					this._tag = t;
					this._value = value;
				}
				get tag(): _tt {
					return this._tag;
				}
				get value(): _vt {
					return this._value;
				}
				isInvalidUrl(): this is InvalidUrl {
					return this._tag === Error.invalidUrl;
				}
				isTimeoutError(): this is TimeoutError {
					return this._tag === Error.timeoutError;
				}
				isProtocolError(): this is ProtocolError {
					return this._tag === Error.protocolError;
				}
				isUnexpectedError(): this is UnexpectedError {
					return this._tag === Error.unexpectedError;
				}
			}
		}
		export type Error = Error.InvalidUrl | Error.TimeoutError | Error.ProtocolError | Error.UnexpectedError;
		
		export type Headers = Fields;
		
		export type Trailers = Fields;
		
		export type RequestOptions = {
			connectTimeoutMs?: u32 | undefined;
			firstByteTimeoutMs?: u32 | undefined;
			betweenBytesTimeoutMs?: u32 | undefined;
		};
		
		export type StatusCode = u16;
		
		export namespace Fields {
			export type Module = {
				
				constructor(entries: [string, Uint8Array][]): own<Fields>;
				
				get(self: borrow<Fields>, name: string): Uint8Array[];
				
				set(self: borrow<Fields>, name: string, value: Uint8Array[]): void;
				
				delete_(self: borrow<Fields>, name: string): void;
				
				append(self: borrow<Fields>, name: string, value: Uint8Array): void;
				
				entries(self: borrow<Fields>): [string, Uint8Array][];
				
				clone(self: borrow<Fields>): own<Fields>;
			};
			export type Interface = $wcm.Module2Interface<Module>;
			export type Constructor = {
				new(entries: [string, Uint8Array][]): Interface;
			};
			export type Manager = $wcm.ResourceManager<Interface>;
			export type WasmInterface = {
				'[constructor]fields': (entries_ptr: i32, entries_len: i32) => i32;
				'[method]fields.get': (self: i32, name_ptr: i32, name_len: i32, result: ptr<[i32, i32]>) => void;
				'[method]fields.set': (self: i32, name_ptr: i32, name_len: i32, value_ptr: i32, value_len: i32) => void;
				'[method]fields.delete': (self: i32, name_ptr: i32, name_len: i32) => void;
				'[method]fields.append': (self: i32, name_ptr: i32, name_len: i32, value_ptr: i32, value_len: i32) => void;
				'[method]fields.entries': (self: i32, result: ptr<[i32, i32]>) => void;
				'[method]fields.clone': (self: i32) => i32;
			};
		}
		export type Fields = resource;
		
		export namespace IncomingRequest {
			export type Module = {
				
				method(self: borrow<IncomingRequest>): Method;
				
				pathWithQuery(self: borrow<IncomingRequest>): string | undefined;
				
				scheme(self: borrow<IncomingRequest>): Scheme | undefined;
				
				authority(self: borrow<IncomingRequest>): string | undefined;
				
				headers(self: borrow<IncomingRequest>): own<Headers>;
				
				consume(self: borrow<IncomingRequest>): result<own<IncomingBody>, void>;
			};
			export type Interface = $wcm.Module2Interface<Module>;
			export type Manager = $wcm.ResourceManager<Interface>;
			export type WasmInterface = {
				'[method]incoming-request.method': (self: i32, result: ptr<[i32, i32, i32]>) => void;
				'[method]incoming-request.path-with-query': (self: i32, result: ptr<[i32, i32, i32]>) => void;
				'[method]incoming-request.scheme': (self: i32, result: ptr<[i32, i32, i32, i32]>) => void;
				'[method]incoming-request.authority': (self: i32, result: ptr<[i32, i32, i32]>) => void;
				'[method]incoming-request.headers': (self: i32) => i32;
				'[method]incoming-request.consume': (self: i32, result: ptr<[i32, i32]>) => void;
			};
		}
		export type IncomingRequest = resource;
		
		export namespace OutgoingRequest {
			export type Module = {
				
				constructor(method: Method, pathWithQuery: string | undefined, scheme: Scheme | undefined, authority: string | undefined, headers: borrow<Headers>): own<OutgoingRequest>;
				
				write(self: borrow<OutgoingRequest>): result<own<OutgoingBody>, void>;
			};
			export type Interface = $wcm.Module2Interface<Module>;
			export type Constructor = {
				new(method: Method, pathWithQuery: string | undefined, scheme: Scheme | undefined, authority: string | undefined, headers: borrow<Headers>): Interface;
			};
			export type Manager = $wcm.ResourceManager<Interface>;
			export type WasmInterface = {
				'[constructor]outgoing-request': (method_case: i32, method_0: i32, method_1: i32, pathWithQuery_case: i32, pathWithQuery_option_ptr: i32, pathWithQuery_option_len: i32, scheme_case: i32, scheme_option_case: i32, scheme_option_0: i32, scheme_option_1: i32, authority_case: i32, authority_option_ptr: i32, authority_option_len: i32, headers: i32) => i32;
				'[method]outgoing-request.write': (self: i32, result: ptr<[i32, i32]>) => void;
			};
		}
		export type OutgoingRequest = resource;
		
		export namespace ResponseOutparam {
			export type Module = {
				
				set(param: own<ResponseOutparam>, response: result<own<OutgoingResponse>, Error>): void;
			};
			export type Interface = $wcm.Module2Interface<Module>;
			export type Manager = $wcm.ResourceManager<Interface>;
			export type WasmInterface = {
				'[static]response-outparam.set': (param: i32, response_case: i32, response_0: i32, response_1: i32, response_2: i32) => void;
			};
		}
		export type ResponseOutparam = resource;
		
		export namespace IncomingResponse {
			export type Module = {
				
				status(self: borrow<IncomingResponse>): StatusCode;
				
				headers(self: borrow<IncomingResponse>): own<Headers>;
				
				consume(self: borrow<IncomingResponse>): result<own<IncomingBody>, void>;
			};
			export type Interface = $wcm.Module2Interface<Module>;
			export type Manager = $wcm.ResourceManager<Interface>;
			export type WasmInterface = {
				'[method]incoming-response.status': (self: i32) => i32;
				'[method]incoming-response.headers': (self: i32) => i32;
				'[method]incoming-response.consume': (self: i32, result: ptr<[i32, i32]>) => void;
			};
		}
		export type IncomingResponse = resource;
		
		export namespace IncomingBody {
			export type Module = {
				
				stream(self: borrow<IncomingBody>): result<own<InputStream>, void>;
				
				finish(this_: own<IncomingBody>): own<FutureTrailers>;
			};
			export type Interface = $wcm.Module2Interface<Module>;
			export type Manager = $wcm.ResourceManager<Interface>;
			export type WasmInterface = {
				'[method]incoming-body.stream': (self: i32, result: ptr<[i32, i32]>) => void;
				'[static]incoming-body.finish': (this_: i32) => i32;
			};
		}
		export type IncomingBody = resource;
		
		export namespace FutureTrailers {
			export type Module = {
				
				/**
				 * Pollable that resolves when the body has been fully read, and the trailers
				 * are ready to be consumed.
				 */
				subscribe(self: borrow<FutureTrailers>): own<Pollable>;
				
				/**
				 * Retrieve reference to trailers, if they are ready.
				 */
				get(self: borrow<FutureTrailers>): result<own<Trailers>, Error> | undefined;
			};
			export type Interface = $wcm.Module2Interface<Module>;
			export type Manager = $wcm.ResourceManager<Interface>;
			export type WasmInterface = {
				'[method]future-trailers.subscribe': (self: i32) => i32;
				'[method]future-trailers.get': (self: i32, result: ptr<[i32, i32, i32, i32, i32]>) => void;
			};
		}
		export type FutureTrailers = resource;
		
		export namespace OutgoingResponse {
			export type Module = {
				
				constructor(statusCode: StatusCode, headers: borrow<Headers>): own<OutgoingResponse>;
				
				/**
				 * Will give the child outgoing-response at most once. subsequent calls will
				 * return an error.
				 */
				write(self: borrow<OutgoingResponse>): result<own<OutgoingBody>, void>;
			};
			export type Interface = $wcm.Module2Interface<Module>;
			export type Constructor = {
				new(statusCode: StatusCode, headers: borrow<Headers>): Interface;
			};
			export type Manager = $wcm.ResourceManager<Interface>;
			export type WasmInterface = {
				'[constructor]outgoing-response': (statusCode: i32, headers: i32) => i32;
				'[method]outgoing-response.write': (self: i32, result: ptr<[i32, i32]>) => void;
			};
		}
		export type OutgoingResponse = resource;
		
		export namespace OutgoingBody {
			export type Module = {
				
				/**
				 * Will give the child output-stream at most once. subsequent calls will
				 * return an error.
				 */
				write(self: borrow<OutgoingBody>): result<own<OutputStream>, void>;
				
				/**
				 * Finalize an outgoing body, optionally providing trailers. This must be
				 * called to signal that the response is complete. If the `outgoing-body` is
				 * dropped without calling `outgoing-body-finalize`, the implementation
				 * should treat the body as corrupted.
				 */
				finish(this_: own<OutgoingBody>, trailers: own<Trailers> | undefined): void;
			};
			export type Interface = $wcm.Module2Interface<Module>;
			export type Manager = $wcm.ResourceManager<Interface>;
			export type WasmInterface = {
				'[method]outgoing-body.write': (self: i32, result: ptr<[i32, i32]>) => void;
				'[static]outgoing-body.finish': (this_: i32, trailers_case: i32, trailers_option: i32) => void;
			};
		}
		export type OutgoingBody = resource;
		
		export namespace FutureIncomingResponse {
			export type Module = {
				
				/**
				 * option indicates readiness.
				 * outer result indicates you are allowed to get the
				 * incoming-response-or-error at most once. subsequent calls after ready
				 * will return an error here.
				 * inner result indicates whether the incoming-response was available, or an
				 * error occured.
				 */
				get(self: borrow<FutureIncomingResponse>): result<result<own<IncomingResponse>, Error>, void> | undefined;
				
				subscribe(self: borrow<FutureIncomingResponse>): own<Pollable>;
			};
			export type Interface = $wcm.Module2Interface<Module>;
			export type Manager = $wcm.ResourceManager<Interface>;
			export type WasmInterface = {
				'[method]future-incoming-response.get': (self: i32, result: ptr<[i32, i32, i32, i32, i32, i32]>) => void;
				'[method]future-incoming-response.subscribe': (self: i32) => i32;
			};
		}
		export type FutureIncomingResponse = resource;
	}
	export type Types<F extends http.Types.Fields.Module | http.Types.Fields.Constructor | http.Types.Fields.Manager = http.Types.Fields.Module | http.Types.Fields.Constructor | http.Types.Fields.Manager, IR extends http.Types.IncomingRequest.Module | http.Types.IncomingRequest.Manager = http.Types.IncomingRequest.Module | http.Types.IncomingRequest.Manager, OR extends http.Types.OutgoingRequest.Module | http.Types.OutgoingRequest.Constructor | http.Types.OutgoingRequest.Manager = http.Types.OutgoingRequest.Module | http.Types.OutgoingRequest.Constructor | http.Types.OutgoingRequest.Manager, RO extends http.Types.ResponseOutparam.Module | http.Types.ResponseOutparam.Manager = http.Types.ResponseOutparam.Module | http.Types.ResponseOutparam.Manager, IR1 extends http.Types.IncomingResponse.Module | http.Types.IncomingResponse.Manager = http.Types.IncomingResponse.Module | http.Types.IncomingResponse.Manager, IB extends http.Types.IncomingBody.Module | http.Types.IncomingBody.Manager = http.Types.IncomingBody.Module | http.Types.IncomingBody.Manager, FT extends http.Types.FutureTrailers.Module | http.Types.FutureTrailers.Manager = http.Types.FutureTrailers.Module | http.Types.FutureTrailers.Manager, OR1 extends http.Types.OutgoingResponse.Module | http.Types.OutgoingResponse.Constructor | http.Types.OutgoingResponse.Manager = http.Types.OutgoingResponse.Module | http.Types.OutgoingResponse.Constructor | http.Types.OutgoingResponse.Manager, OB extends http.Types.OutgoingBody.Module | http.Types.OutgoingBody.Manager = http.Types.OutgoingBody.Module | http.Types.OutgoingBody.Manager, FIR extends http.Types.FutureIncomingResponse.Module | http.Types.FutureIncomingResponse.Manager = http.Types.FutureIncomingResponse.Module | http.Types.FutureIncomingResponse.Manager> = {
		Fields: F;
		IncomingRequest: IR;
		OutgoingRequest: OR;
		ResponseOutparam: RO;
		IncomingResponse: IR1;
		IncomingBody: IB;
		FutureTrailers: FT;
		OutgoingResponse: OR1;
		OutgoingBody: OB;
		FutureIncomingResponse: FIR;
	};
	
	export namespace IncomingHandler {
		
		export type IncomingRequest = http.Types.IncomingRequest;
		
		export type ResponseOutparam = http.Types.ResponseOutparam;
		
		export type handle = (request: own<IncomingRequest>, responseOut: own<ResponseOutparam>) => void;
	}
	export type IncomingHandler = {
		handle: IncomingHandler.handle;
	};
	
	export namespace OutgoingHandler {
		
		export type OutgoingRequest = http.Types.OutgoingRequest;
		
		export type RequestOptions = http.Types.RequestOptions;
		
		export type FutureIncomingResponse = http.Types.FutureIncomingResponse;
		
		export type Error = http.Types.Error;
		
		export type handle = (request: own<OutgoingRequest>, options: RequestOptions | undefined) => result<own<FutureIncomingResponse>, Error>;
	}
	export type OutgoingHandler = {
		handle: OutgoingHandler.handle;
	};
	
}

export namespace http {
	export namespace Types.$ {
		export const InputStream = io.Streams.$.InputStream;
		export const OutputStream = io.Streams.$.OutputStream;
		export const Pollable = io.Poll.$.Pollable;
		export const Method = new $wcm.VariantType<Types.Method, Types.Method._tt, Types.Method._vt>([['get', undefined], ['head', undefined], ['post', undefined], ['put', undefined], ['delete_', undefined], ['connect', undefined], ['options', undefined], ['trace', undefined], ['patch', undefined], ['other', $wcm.wstring]], Types.Method._ctor);
		export const Scheme = new $wcm.VariantType<Types.Scheme, Types.Scheme._tt, Types.Scheme._vt>([['HTTP', undefined], ['HTTPS', undefined], ['other', $wcm.wstring]], Types.Scheme._ctor);
		export const Error = new $wcm.VariantType<Types.Error, Types.Error._tt, Types.Error._vt>([['invalidUrl', $wcm.wstring], ['timeoutError', $wcm.wstring], ['protocolError', $wcm.wstring], ['unexpectedError', $wcm.wstring]], Types.Error._ctor);
		export const Fields = new $wcm.ResourceType('fields');
		export const Headers = Fields;
		export const Trailers = Fields;
		export const IncomingRequest = new $wcm.ResourceType('incoming-request');
		export const OutgoingRequest = new $wcm.ResourceType('outgoing-request');
		export const RequestOptions = new $wcm.RecordType<Types.RequestOptions>([
			['connectTimeoutMs', new $wcm.OptionType<u32>($wcm.u32)],
			['firstByteTimeoutMs', new $wcm.OptionType<u32>($wcm.u32)],
			['betweenBytesTimeoutMs', new $wcm.OptionType<u32>($wcm.u32)],
		]);
		export const ResponseOutparam = new $wcm.ResourceType('response-outparam');
		export const StatusCode = $wcm.u16;
		export const IncomingResponse = new $wcm.ResourceType('incoming-response');
		export const IncomingBody = new $wcm.ResourceType('incoming-body');
		export const FutureTrailers = new $wcm.ResourceType('future-trailers');
		export const OutgoingResponse = new $wcm.ResourceType('outgoing-response');
		export const OutgoingBody = new $wcm.ResourceType('outgoing-body');
		export const FutureIncomingResponse = new $wcm.ResourceType('future-incoming-response');
		Fields.addFunction('constructor', new $wcm.FunctionType<Types.Fields.Module['constructor']>('[constructor]fields', [
			['entries', new $wcm.ListType<[string, Uint8Array]>(new $wcm.TupleType<[string, Uint8Array]>([$wcm.wstring, new $wcm.Uint8ArrayType()]))],
		], new $wcm.OwnType<http.Types.Fields>(Fields)));
		Fields.addFunction('get', new $wcm.FunctionType<Types.Fields.Module['get']>('[method]fields.get', [
			['self', new $wcm.BorrowType<http.Types.Fields>(Fields)],
			['name', $wcm.wstring],
		], new $wcm.ListType<Uint8Array>(new $wcm.Uint8ArrayType())));
		Fields.addFunction('set', new $wcm.FunctionType<Types.Fields.Module['set']>('[method]fields.set', [
			['self', new $wcm.BorrowType<http.Types.Fields>(Fields)],
			['name', $wcm.wstring],
			['value', new $wcm.ListType<Uint8Array>(new $wcm.Uint8ArrayType())],
		], undefined));
		Fields.addFunction('delete_', new $wcm.FunctionType<Types.Fields.Module['delete_']>('[method]fields.delete', [
			['self', new $wcm.BorrowType<http.Types.Fields>(Fields)],
			['name', $wcm.wstring],
		], undefined));
		Fields.addFunction('append', new $wcm.FunctionType<Types.Fields.Module['append']>('[method]fields.append', [
			['self', new $wcm.BorrowType<http.Types.Fields>(Fields)],
			['name', $wcm.wstring],
			['value', new $wcm.Uint8ArrayType()],
		], undefined));
		Fields.addFunction('entries', new $wcm.FunctionType<Types.Fields.Module['entries']>('[method]fields.entries', [
			['self', new $wcm.BorrowType<http.Types.Fields>(Fields)],
		], new $wcm.ListType<[string, Uint8Array]>(new $wcm.TupleType<[string, Uint8Array]>([$wcm.wstring, new $wcm.Uint8ArrayType()]))));
		Fields.addFunction('clone', new $wcm.FunctionType<Types.Fields.Module['clone']>('[method]fields.clone', [
			['self', new $wcm.BorrowType<http.Types.Fields>(Fields)],
		], new $wcm.OwnType<http.Types.Fields>(Fields)));
		IncomingRequest.addFunction('method', new $wcm.FunctionType<Types.IncomingRequest.Module['method']>('[method]incoming-request.method', [
			['self', new $wcm.BorrowType<http.Types.IncomingRequest>(IncomingRequest)],
		], Method));
		IncomingRequest.addFunction('pathWithQuery', new $wcm.FunctionType<Types.IncomingRequest.Module['pathWithQuery']>('[method]incoming-request.path-with-query', [
			['self', new $wcm.BorrowType<http.Types.IncomingRequest>(IncomingRequest)],
		], new $wcm.OptionType<string>($wcm.wstring)));
		IncomingRequest.addFunction('scheme', new $wcm.FunctionType<Types.IncomingRequest.Module['scheme']>('[method]incoming-request.scheme', [
			['self', new $wcm.BorrowType<http.Types.IncomingRequest>(IncomingRequest)],
		], new $wcm.OptionType<http.Types.Scheme>(Scheme)));
		IncomingRequest.addFunction('authority', new $wcm.FunctionType<Types.IncomingRequest.Module['authority']>('[method]incoming-request.authority', [
			['self', new $wcm.BorrowType<http.Types.IncomingRequest>(IncomingRequest)],
		], new $wcm.OptionType<string>($wcm.wstring)));
		IncomingRequest.addFunction('headers', new $wcm.FunctionType<Types.IncomingRequest.Module['headers']>('[method]incoming-request.headers', [
			['self', new $wcm.BorrowType<http.Types.IncomingRequest>(IncomingRequest)],
		], new $wcm.OwnType<http.Types.Headers>(Headers)));
		IncomingRequest.addFunction('consume', new $wcm.FunctionType<Types.IncomingRequest.Module['consume']>('[method]incoming-request.consume', [
			['self', new $wcm.BorrowType<http.Types.IncomingRequest>(IncomingRequest)],
		], new $wcm.ResultType<own<http.Types.IncomingBody>, void>(new $wcm.OwnType<http.Types.IncomingBody>(IncomingBody), undefined)));
		OutgoingRequest.addFunction('constructor', new $wcm.FunctionType<Types.OutgoingRequest.Module['constructor']>('[constructor]outgoing-request', [
			['method', Method],
			['pathWithQuery', new $wcm.OptionType<string>($wcm.wstring)],
			['scheme', new $wcm.OptionType<http.Types.Scheme>(Scheme)],
			['authority', new $wcm.OptionType<string>($wcm.wstring)],
			['headers', new $wcm.BorrowType<http.Types.Headers>(Headers)],
		], new $wcm.OwnType<http.Types.OutgoingRequest>(OutgoingRequest)));
		OutgoingRequest.addFunction('write', new $wcm.FunctionType<Types.OutgoingRequest.Module['write']>('[method]outgoing-request.write', [
			['self', new $wcm.BorrowType<http.Types.OutgoingRequest>(OutgoingRequest)],
		], new $wcm.ResultType<own<http.Types.OutgoingBody>, void>(new $wcm.OwnType<http.Types.OutgoingBody>(OutgoingBody), undefined)));
		ResponseOutparam.addFunction('set', new $wcm.FunctionType<Types.ResponseOutparam.Module['set']>('[static]response-outparam.set', [
			['param', new $wcm.OwnType<http.Types.ResponseOutparam>(ResponseOutparam)],
			['response', new $wcm.ResultType<own<http.Types.OutgoingResponse>, http.Types.Error>(new $wcm.OwnType<http.Types.OutgoingResponse>(OutgoingResponse), Error)],
		], undefined));
		IncomingResponse.addFunction('status', new $wcm.FunctionType<Types.IncomingResponse.Module['status']>('[method]incoming-response.status', [
			['self', new $wcm.BorrowType<http.Types.IncomingResponse>(IncomingResponse)],
		], StatusCode));
		IncomingResponse.addFunction('headers', new $wcm.FunctionType<Types.IncomingResponse.Module['headers']>('[method]incoming-response.headers', [
			['self', new $wcm.BorrowType<http.Types.IncomingResponse>(IncomingResponse)],
		], new $wcm.OwnType<http.Types.Headers>(Headers)));
		IncomingResponse.addFunction('consume', new $wcm.FunctionType<Types.IncomingResponse.Module['consume']>('[method]incoming-response.consume', [
			['self', new $wcm.BorrowType<http.Types.IncomingResponse>(IncomingResponse)],
		], new $wcm.ResultType<own<http.Types.IncomingBody>, void>(new $wcm.OwnType<http.Types.IncomingBody>(IncomingBody), undefined)));
		IncomingBody.addFunction('stream', new $wcm.FunctionType<Types.IncomingBody.Module['stream']>('[method]incoming-body.stream', [
			['self', new $wcm.BorrowType<http.Types.IncomingBody>(IncomingBody)],
		], new $wcm.ResultType<own<http.Types.InputStream>, void>(new $wcm.OwnType<http.Types.InputStream>(InputStream), undefined)));
		IncomingBody.addFunction('finish', new $wcm.FunctionType<Types.IncomingBody.Module['finish']>('[static]incoming-body.finish', [
			['this_', new $wcm.OwnType<http.Types.IncomingBody>(IncomingBody)],
		], new $wcm.OwnType<http.Types.FutureTrailers>(FutureTrailers)));
		FutureTrailers.addFunction('subscribe', new $wcm.FunctionType<Types.FutureTrailers.Module['subscribe']>('[method]future-trailers.subscribe', [
			['self', new $wcm.BorrowType<http.Types.FutureTrailers>(FutureTrailers)],
		], new $wcm.OwnType<http.Types.Pollable>(Pollable)));
		FutureTrailers.addFunction('get', new $wcm.FunctionType<Types.FutureTrailers.Module['get']>('[method]future-trailers.get', [
			['self', new $wcm.BorrowType<http.Types.FutureTrailers>(FutureTrailers)],
		], new $wcm.OptionType<result<own<http.Types.Trailers>, http.Types.Error>>(new $wcm.ResultType<own<http.Types.Trailers>, http.Types.Error>(new $wcm.OwnType<http.Types.Trailers>(Trailers), Error))));
		OutgoingResponse.addFunction('constructor', new $wcm.FunctionType<Types.OutgoingResponse.Module['constructor']>('[constructor]outgoing-response', [
			['statusCode', StatusCode],
			['headers', new $wcm.BorrowType<http.Types.Headers>(Headers)],
		], new $wcm.OwnType<http.Types.OutgoingResponse>(OutgoingResponse)));
		OutgoingResponse.addFunction('write', new $wcm.FunctionType<Types.OutgoingResponse.Module['write']>('[method]outgoing-response.write', [
			['self', new $wcm.BorrowType<http.Types.OutgoingResponse>(OutgoingResponse)],
		], new $wcm.ResultType<own<http.Types.OutgoingBody>, void>(new $wcm.OwnType<http.Types.OutgoingBody>(OutgoingBody), undefined)));
		OutgoingBody.addFunction('write', new $wcm.FunctionType<Types.OutgoingBody.Module['write']>('[method]outgoing-body.write', [
			['self', new $wcm.BorrowType<http.Types.OutgoingBody>(OutgoingBody)],
		], new $wcm.ResultType<own<http.Types.OutputStream>, void>(new $wcm.OwnType<http.Types.OutputStream>(OutputStream), undefined)));
		OutgoingBody.addFunction('finish', new $wcm.FunctionType<Types.OutgoingBody.Module['finish']>('[static]outgoing-body.finish', [
			['this_', new $wcm.OwnType<http.Types.OutgoingBody>(OutgoingBody)],
			['trailers', new $wcm.OptionType<own<http.Types.Trailers>>(new $wcm.OwnType<http.Types.Trailers>(Trailers))],
		], undefined));
		FutureIncomingResponse.addFunction('get', new $wcm.FunctionType<Types.FutureIncomingResponse.Module['get']>('[method]future-incoming-response.get', [
			['self', new $wcm.BorrowType<http.Types.FutureIncomingResponse>(FutureIncomingResponse)],
		], new $wcm.OptionType<result<result<own<http.Types.IncomingResponse>, http.Types.Error>, void>>(new $wcm.ResultType<result<own<http.Types.IncomingResponse>, http.Types.Error>, void>(new $wcm.ResultType<own<http.Types.IncomingResponse>, http.Types.Error>(new $wcm.OwnType<http.Types.IncomingResponse>(IncomingResponse), Error), undefined))));
		FutureIncomingResponse.addFunction('subscribe', new $wcm.FunctionType<Types.FutureIncomingResponse.Module['subscribe']>('[method]future-incoming-response.subscribe', [
			['self', new $wcm.BorrowType<http.Types.FutureIncomingResponse>(FutureIncomingResponse)],
		], new $wcm.OwnType<http.Types.Pollable>(Pollable)));
	}
	export namespace Types._ {
		export const id = 'wasi:http/types' as const;
		export const witName = 'types' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['InputStream', $.InputStream],
			['OutputStream', $.OutputStream],
			['Pollable', $.Pollable],
			['Method', $.Method],
			['Scheme', $.Scheme],
			['Error', $.Error],
			['Headers', $.Headers],
			['Trailers', $.Trailers],
			['RequestOptions', $.RequestOptions],
			['StatusCode', $.StatusCode],
			['Fields', $.Fields],
			['IncomingRequest', $.IncomingRequest],
			['OutgoingRequest', $.OutgoingRequest],
			['ResponseOutparam', $.ResponseOutparam],
			['IncomingResponse', $.IncomingResponse],
			['IncomingBody', $.IncomingBody],
			['FutureTrailers', $.FutureTrailers],
			['OutgoingResponse', $.OutgoingResponse],
			['OutgoingBody', $.OutgoingBody],
			['FutureIncomingResponse', $.FutureIncomingResponse]
		]);
		export const functions: Map<string, $wcm.FunctionType<$wcm.ServiceFunction>> = new Map([
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map([
			['Fields', $.Fields],
			['IncomingRequest', $.IncomingRequest],
			['OutgoingRequest', $.OutgoingRequest],
			['ResponseOutparam', $.ResponseOutparam],
			['IncomingResponse', $.IncomingResponse],
			['IncomingBody', $.IncomingBody],
			['FutureTrailers', $.FutureTrailers],
			['OutgoingResponse', $.OutgoingResponse],
			['OutgoingBody', $.OutgoingBody],
			['FutureIncomingResponse', $.FutureIncomingResponse]
		]);
		export type WasmInterface = {
		} & http.Types.Fields.WasmInterface & http.Types.IncomingRequest.WasmInterface & http.Types.OutgoingRequest.WasmInterface & http.Types.ResponseOutparam.WasmInterface & http.Types.IncomingResponse.WasmInterface & http.Types.IncomingBody.WasmInterface & http.Types.FutureTrailers.WasmInterface & http.Types.OutgoingResponse.WasmInterface & http.Types.OutgoingBody.WasmInterface & http.Types.FutureIncomingResponse.WasmInterface;
		export namespace Fields  {
			export function Module(wasmInterface: WasmInterface, context: $wcm.Context): http.Types.Fields.Module {
				return $wcm.Module.create<http.Types.Fields.Module>($.Fields, wasmInterface, context);
			}
			class Impl implements http.Types.Fields.Interface {
				private readonly _handle: http.Types.Fields;
				private readonly _module: http.Types.Fields.Module;
				constructor(entries: [string, Uint8Array][], module: http.Types.Fields.Module) {
					this._module = module;
					this._handle = module.constructor(entries);
				}
				public get(name: string): Uint8Array[] {
					return this._module.get(this._handle, name);
				}
				public set(name: string, value: Uint8Array[]): void {
					return this._module.set(this._handle, name, value);
				}
				public delete_(name: string): void {
					return this._module.delete_(this._handle, name);
				}
				public append(name: string, value: Uint8Array): void {
					return this._module.append(this._handle, name, value);
				}
				public entries(): [string, Uint8Array][] {
					return this._module.entries(this._handle);
				}
				public clone(): own<Fields> {
					return this._module.clone(this._handle);
				}
			}
			export function Class(wasmInterface: WasmInterface, context: $wcm.Context): http.Types.Fields.Constructor {
				return class extends Impl {
					constructor(entries: [string, Uint8Array][]) {
						super(entries, Module(wasmInterface, context));
					}
				};
			}
			export function Manager(): http.Types.Fields.Manager {
				return new $wcm.ResourceManager<http.Types.Fields.Interface>();
			}
		}
		export namespace IncomingRequest  {
			export function Module(wasmInterface: WasmInterface, context: $wcm.Context): http.Types.IncomingRequest.Module {
				return $wcm.Module.create<http.Types.IncomingRequest.Module>($.IncomingRequest, wasmInterface, context);
			}
			export function Manager(): http.Types.IncomingRequest.Manager {
				return new $wcm.ResourceManager<http.Types.IncomingRequest.Interface>();
			}
		}
		export namespace OutgoingRequest  {
			export function Module(wasmInterface: WasmInterface, context: $wcm.Context): http.Types.OutgoingRequest.Module {
				return $wcm.Module.create<http.Types.OutgoingRequest.Module>($.OutgoingRequest, wasmInterface, context);
			}
			class Impl implements http.Types.OutgoingRequest.Interface {
				private readonly _handle: http.Types.OutgoingRequest;
				private readonly _module: http.Types.OutgoingRequest.Module;
				constructor(method: Method, pathWithQuery: string | undefined, scheme: Scheme | undefined, authority: string | undefined, headers: borrow<Headers>, module: http.Types.OutgoingRequest.Module) {
					this._module = module;
					this._handle = module.constructor(method, pathWithQuery, scheme, authority, headers);
				}
				public write(): result<own<OutgoingBody>, void> {
					return this._module.write(this._handle);
				}
			}
			export function Class(wasmInterface: WasmInterface, context: $wcm.Context): http.Types.OutgoingRequest.Constructor {
				return class extends Impl {
					constructor(method: Method, pathWithQuery: string | undefined, scheme: Scheme | undefined, authority: string | undefined, headers: borrow<Headers>) {
						super(method, pathWithQuery, scheme, authority, headers, Module(wasmInterface, context));
					}
				};
			}
			export function Manager(): http.Types.OutgoingRequest.Manager {
				return new $wcm.ResourceManager<http.Types.OutgoingRequest.Interface>();
			}
		}
		export namespace ResponseOutparam  {
			export function Module(wasmInterface: WasmInterface, context: $wcm.Context): http.Types.ResponseOutparam.Module {
				return $wcm.Module.create<http.Types.ResponseOutparam.Module>($.ResponseOutparam, wasmInterface, context);
			}
			export function Manager(): http.Types.ResponseOutparam.Manager {
				return new $wcm.ResourceManager<http.Types.ResponseOutparam.Interface>();
			}
		}
		export namespace IncomingResponse  {
			export function Module(wasmInterface: WasmInterface, context: $wcm.Context): http.Types.IncomingResponse.Module {
				return $wcm.Module.create<http.Types.IncomingResponse.Module>($.IncomingResponse, wasmInterface, context);
			}
			export function Manager(): http.Types.IncomingResponse.Manager {
				return new $wcm.ResourceManager<http.Types.IncomingResponse.Interface>();
			}
		}
		export namespace IncomingBody  {
			export function Module(wasmInterface: WasmInterface, context: $wcm.Context): http.Types.IncomingBody.Module {
				return $wcm.Module.create<http.Types.IncomingBody.Module>($.IncomingBody, wasmInterface, context);
			}
			export function Manager(): http.Types.IncomingBody.Manager {
				return new $wcm.ResourceManager<http.Types.IncomingBody.Interface>();
			}
		}
		export namespace FutureTrailers  {
			export function Module(wasmInterface: WasmInterface, context: $wcm.Context): http.Types.FutureTrailers.Module {
				return $wcm.Module.create<http.Types.FutureTrailers.Module>($.FutureTrailers, wasmInterface, context);
			}
			export function Manager(): http.Types.FutureTrailers.Manager {
				return new $wcm.ResourceManager<http.Types.FutureTrailers.Interface>();
			}
		}
		export namespace OutgoingResponse  {
			export function Module(wasmInterface: WasmInterface, context: $wcm.Context): http.Types.OutgoingResponse.Module {
				return $wcm.Module.create<http.Types.OutgoingResponse.Module>($.OutgoingResponse, wasmInterface, context);
			}
			class Impl implements http.Types.OutgoingResponse.Interface {
				private readonly _handle: http.Types.OutgoingResponse;
				private readonly _module: http.Types.OutgoingResponse.Module;
				constructor(statusCode: StatusCode, headers: borrow<Headers>, module: http.Types.OutgoingResponse.Module) {
					this._module = module;
					this._handle = module.constructor(statusCode, headers);
				}
				public write(): result<own<OutgoingBody>, void> {
					return this._module.write(this._handle);
				}
			}
			export function Class(wasmInterface: WasmInterface, context: $wcm.Context): http.Types.OutgoingResponse.Constructor {
				return class extends Impl {
					constructor(statusCode: StatusCode, headers: borrow<Headers>) {
						super(statusCode, headers, Module(wasmInterface, context));
					}
				};
			}
			export function Manager(): http.Types.OutgoingResponse.Manager {
				return new $wcm.ResourceManager<http.Types.OutgoingResponse.Interface>();
			}
		}
		export namespace OutgoingBody  {
			export function Module(wasmInterface: WasmInterface, context: $wcm.Context): http.Types.OutgoingBody.Module {
				return $wcm.Module.create<http.Types.OutgoingBody.Module>($.OutgoingBody, wasmInterface, context);
			}
			export function Manager(): http.Types.OutgoingBody.Manager {
				return new $wcm.ResourceManager<http.Types.OutgoingBody.Interface>();
			}
		}
		export namespace FutureIncomingResponse  {
			export function Module(wasmInterface: WasmInterface, context: $wcm.Context): http.Types.FutureIncomingResponse.Module {
				return $wcm.Module.create<http.Types.FutureIncomingResponse.Module>($.FutureIncomingResponse, wasmInterface, context);
			}
			export function Manager(): http.Types.FutureIncomingResponse.Manager {
				return new $wcm.ResourceManager<http.Types.FutureIncomingResponse.Interface>();
			}
		}
		export function createHost(service: http.Types, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService<F extends http.Types.Fields.Module | http.Types.Fields.Constructor | http.Types.Fields.Manager, IR extends http.Types.IncomingRequest.Module | http.Types.IncomingRequest.Manager, OR extends http.Types.OutgoingRequest.Module | http.Types.OutgoingRequest.Constructor | http.Types.OutgoingRequest.Manager, RO extends http.Types.ResponseOutparam.Module | http.Types.ResponseOutparam.Manager, IR1 extends http.Types.IncomingResponse.Module | http.Types.IncomingResponse.Manager, IB extends http.Types.IncomingBody.Module | http.Types.IncomingBody.Manager, FT extends http.Types.FutureTrailers.Module | http.Types.FutureTrailers.Manager, OR1 extends http.Types.OutgoingResponse.Module | http.Types.OutgoingResponse.Constructor | http.Types.OutgoingResponse.Manager, OB extends http.Types.OutgoingBody.Module | http.Types.OutgoingBody.Manager, FIR extends http.Types.FutureIncomingResponse.Module | http.Types.FutureIncomingResponse.Manager>(f: $wcm.ResourceKind<F>, ir: $wcm.ResourceKind<IR>, or: $wcm.ResourceKind<OR>, ro: $wcm.ResourceKind<RO>, ir1: $wcm.ResourceKind<IR1>, ib: $wcm.ResourceKind<IB>, ft: $wcm.ResourceKind<FT>, or1: $wcm.ResourceKind<OR1>, ob: $wcm.ResourceKind<OB>, fir: $wcm.ResourceKind<FIR>, wasmInterface: WasmInterface, context: $wcm.Context): http.Types<F, IR, OR, RO, IR1, IB, FT, OR1, OB, FIR> {
			return $wcm.Service.create<http.Types<F, IR, OR, RO, IR1, IB, FT, OR1, OB, FIR>>(functions, [['Fields', $.Fields, f], ['IncomingRequest', $.IncomingRequest, ir], ['OutgoingRequest', $.OutgoingRequest, or], ['ResponseOutparam', $.ResponseOutparam, ro], ['IncomingResponse', $.IncomingResponse, ir1], ['IncomingBody', $.IncomingBody, ib], ['FutureTrailers', $.FutureTrailers, ft], ['OutgoingResponse', $.OutgoingResponse, or1], ['OutgoingBody', $.OutgoingBody, ob], ['FutureIncomingResponse', $.FutureIncomingResponse, fir]], wasmInterface, context);
		}
		type ClassService = http.Types<http.Types.Fields.Constructor, http.Types.IncomingRequest.Manager, http.Types.OutgoingRequest.Constructor, http.Types.ResponseOutparam.Manager, http.Types.IncomingResponse.Manager, http.Types.IncomingBody.Manager, http.Types.FutureTrailers.Manager, http.Types.OutgoingResponse.Constructor, http.Types.OutgoingBody.Manager, http.Types.FutureIncomingResponse.Manager>;
		export function createClassService(wasmInterface: WasmInterface, context: $wcm.Context): ClassService {
			return $wcm.Service.create<ClassService>(functions, [['Fields', $.Fields, Fields.Class], ['IncomingRequest', $.IncomingRequest, IncomingRequest.Manager], ['OutgoingRequest', $.OutgoingRequest, OutgoingRequest.Class], ['ResponseOutparam', $.ResponseOutparam, ResponseOutparam.Manager], ['IncomingResponse', $.IncomingResponse, IncomingResponse.Manager], ['IncomingBody', $.IncomingBody, IncomingBody.Manager], ['FutureTrailers', $.FutureTrailers, FutureTrailers.Manager], ['OutgoingResponse', $.OutgoingResponse, OutgoingResponse.Class], ['OutgoingBody', $.OutgoingBody, OutgoingBody.Manager], ['FutureIncomingResponse', $.FutureIncomingResponse, FutureIncomingResponse.Manager]], wasmInterface, context);
		}
		type ModuleService = http.Types<http.Types.Fields.Module, http.Types.IncomingRequest.Module, http.Types.OutgoingRequest.Module, http.Types.ResponseOutparam.Module, http.Types.IncomingResponse.Module, http.Types.IncomingBody.Module, http.Types.FutureTrailers.Module, http.Types.OutgoingResponse.Module, http.Types.OutgoingBody.Module, http.Types.FutureIncomingResponse.Module>;
		export function createModuleService(wasmInterface: WasmInterface, context: $wcm.Context): ModuleService {
			return $wcm.Service.create<ModuleService>(functions, [['Fields', $.Fields, Fields.Module], ['IncomingRequest', $.IncomingRequest, IncomingRequest.Module], ['OutgoingRequest', $.OutgoingRequest, OutgoingRequest.Module], ['ResponseOutparam', $.ResponseOutparam, ResponseOutparam.Module], ['IncomingResponse', $.IncomingResponse, IncomingResponse.Module], ['IncomingBody', $.IncomingBody, IncomingBody.Module], ['FutureTrailers', $.FutureTrailers, FutureTrailers.Module], ['OutgoingResponse', $.OutgoingResponse, OutgoingResponse.Module], ['OutgoingBody', $.OutgoingBody, OutgoingBody.Module], ['FutureIncomingResponse', $.FutureIncomingResponse, FutureIncomingResponse.Module]], wasmInterface, context);
		}
	}
	
	export namespace IncomingHandler.$ {
		export const IncomingRequest = http.Types.$.IncomingRequest;
		export const ResponseOutparam = http.Types.$.ResponseOutparam;
		export const handle = new $wcm.FunctionType<IncomingHandler.handle>('handle',[
			['request', new $wcm.OwnType<http.IncomingHandler.IncomingRequest>(IncomingRequest)],
			['responseOut', new $wcm.OwnType<http.IncomingHandler.ResponseOutparam>(ResponseOutparam)],
		], undefined);
	}
	export namespace IncomingHandler._ {
		export const id = 'wasi:http/incoming-handler' as const;
		export const witName = 'incoming-handler' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['IncomingRequest', $.IncomingRequest],
			['ResponseOutparam', $.ResponseOutparam]
		]);
		export const functions: Map<string, $wcm.FunctionType<$wcm.ServiceFunction>> = new Map([
			['handle', $.handle]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map([
		]);
		export type WasmInterface = {
			'handle': (request: i32, responseOut: i32) => void;
		};
		export function createHost(service: http.IncomingHandler, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context): http.IncomingHandler {
			return $wcm.Service.create<http.IncomingHandler>(functions, [], wasmInterface, context);
		}
	}
	
	export namespace OutgoingHandler.$ {
		export const OutgoingRequest = http.Types.$.OutgoingRequest;
		export const RequestOptions = http.Types.$.RequestOptions;
		export const FutureIncomingResponse = http.Types.$.FutureIncomingResponse;
		export const Error = http.Types.$.Error;
		export const handle = new $wcm.FunctionType<OutgoingHandler.handle>('handle',[
			['request', new $wcm.OwnType<http.OutgoingHandler.OutgoingRequest>(OutgoingRequest)],
			['options', new $wcm.OptionType<http.OutgoingHandler.RequestOptions>(RequestOptions)],
		], new $wcm.ResultType<own<http.OutgoingHandler.FutureIncomingResponse>, http.OutgoingHandler.Error>(new $wcm.OwnType<http.OutgoingHandler.FutureIncomingResponse>(FutureIncomingResponse), Error));
	}
	export namespace OutgoingHandler._ {
		export const id = 'wasi:http/outgoing-handler' as const;
		export const witName = 'outgoing-handler' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['OutgoingRequest', $.OutgoingRequest],
			['RequestOptions', $.RequestOptions],
			['FutureIncomingResponse', $.FutureIncomingResponse],
			['Error', $.Error]
		]);
		export const functions: Map<string, $wcm.FunctionType<$wcm.ServiceFunction>> = new Map([
			['handle', $.handle]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map([
		]);
		export type WasmInterface = {
			'handle': (request: i32, options_case: i32, options_option_RequestOptions_connectTimeoutMs_case: i32, options_option_RequestOptions_connectTimeoutMs_option: i32, options_option_RequestOptions_firstByteTimeoutMs_case: i32, options_option_RequestOptions_firstByteTimeoutMs_option: i32, options_option_RequestOptions_betweenBytesTimeoutMs_case: i32, options_option_RequestOptions_betweenBytesTimeoutMs_option: i32, result: ptr<[i32, i32, i32, i32]>) => void;
		};
		export function createHost(service: http.OutgoingHandler, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context): http.OutgoingHandler {
			return $wcm.Service.create<http.OutgoingHandler>(functions, [], wasmInterface, context);
		}
	}
}

export namespace http._ {
	export const witName = 'wasi:http' as const;
	export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
		['Types', Types._],
		['IncomingHandler', IncomingHandler._],
		['OutgoingHandler', OutgoingHandler._]
	]);
}
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '@vscode/wasm-component-model';
import type { u16, u8, u32, u64, own, result, borrow, resource, option, i32, ptr, i64 } from '@vscode/wasm-component-model';
import { io } from './io';
import { clocks } from './clocks';

export namespace http {
	/**
	 * This interface defines all of the types and methods for implementing
	 * HTTP Requests and Responses, both incoming and outgoing, as well as
	 * their headers, trailers, and bodies.
	 */
	export namespace Types {
		
		export type Duration = clocks.MonotonicClock.Duration;
		
		export type InputStream = io.Streams.InputStream;
		
		export type OutputStream = io.Streams.OutputStream;
		
		export type StreamError = io.Streams.Error;
		
		export type Pollable = io.Poll.Pollable;
		
		
		/**
		 * This type corresponds to HTTP standard Methods.
		 */
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
		
		
		/**
		 * This type corresponds to HTTP standard Related Schemes.
		 */
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
		
		/**
		 * Defines the case payload type for `DNS-error` above:
		 */
		export type DNSErrorPayload = {
			rcode?: string | undefined;
			infoCode?: u16 | undefined;
		};
		
		/**
		 * Defines the case payload type for `TLS-alert-received` above:
		 */
		export type TLSAlertReceivedPayload = {
			alertId?: u8 | undefined;
			alertMessage?: string | undefined;
		};
		
		/**
		 * Defines the case payload type for `HTTP-response-{header,trailer}-size` above:
		 */
		export type FieldSizePayload = {
			fieldName?: string | undefined;
			fieldSize?: u32 | undefined;
		};
		
		
		/**
		 * These cases are inspired by the IANA HTTP Proxy Error Types:
		 * https://www.iana.org/assignments/http-proxy-status/http-proxy-status.xhtml#table-http-proxy-error-types
		 */
		export namespace ErrorCode {
			export const dNSTimeout = 'DNSTimeout' as const;
			export type DNSTimeout = { readonly tag: typeof dNSTimeout } & _common;
			export function DNSTimeout(): DNSTimeout {
				return new VariantImpl(dNSTimeout, undefined) as DNSTimeout;
			}
			
			export const dNSError = 'DNSError' as const;
			export type DNSError = { readonly tag: typeof dNSError; readonly value: DNSErrorPayload } & _common;
			export function DNSError(value: DNSErrorPayload): DNSError {
				return new VariantImpl(dNSError, value) as DNSError;
			}
			
			export const destinationNotFound = 'destinationNotFound' as const;
			export type DestinationNotFound = { readonly tag: typeof destinationNotFound } & _common;
			export function DestinationNotFound(): DestinationNotFound {
				return new VariantImpl(destinationNotFound, undefined) as DestinationNotFound;
			}
			
			export const destinationUnavailable = 'destinationUnavailable' as const;
			export type DestinationUnavailable = { readonly tag: typeof destinationUnavailable } & _common;
			export function DestinationUnavailable(): DestinationUnavailable {
				return new VariantImpl(destinationUnavailable, undefined) as DestinationUnavailable;
			}
			
			export const destinationIPProhibited = 'destinationIPProhibited' as const;
			export type DestinationIPProhibited = { readonly tag: typeof destinationIPProhibited } & _common;
			export function DestinationIPProhibited(): DestinationIPProhibited {
				return new VariantImpl(destinationIPProhibited, undefined) as DestinationIPProhibited;
			}
			
			export const destinationIPUnroutable = 'destinationIPUnroutable' as const;
			export type DestinationIPUnroutable = { readonly tag: typeof destinationIPUnroutable } & _common;
			export function DestinationIPUnroutable(): DestinationIPUnroutable {
				return new VariantImpl(destinationIPUnroutable, undefined) as DestinationIPUnroutable;
			}
			
			export const connectionRefused = 'connectionRefused' as const;
			export type ConnectionRefused = { readonly tag: typeof connectionRefused } & _common;
			export function ConnectionRefused(): ConnectionRefused {
				return new VariantImpl(connectionRefused, undefined) as ConnectionRefused;
			}
			
			export const connectionTerminated = 'connectionTerminated' as const;
			export type ConnectionTerminated = { readonly tag: typeof connectionTerminated } & _common;
			export function ConnectionTerminated(): ConnectionTerminated {
				return new VariantImpl(connectionTerminated, undefined) as ConnectionTerminated;
			}
			
			export const connectionTimeout = 'connectionTimeout' as const;
			export type ConnectionTimeout = { readonly tag: typeof connectionTimeout } & _common;
			export function ConnectionTimeout(): ConnectionTimeout {
				return new VariantImpl(connectionTimeout, undefined) as ConnectionTimeout;
			}
			
			export const connectionReadTimeout = 'connectionReadTimeout' as const;
			export type ConnectionReadTimeout = { readonly tag: typeof connectionReadTimeout } & _common;
			export function ConnectionReadTimeout(): ConnectionReadTimeout {
				return new VariantImpl(connectionReadTimeout, undefined) as ConnectionReadTimeout;
			}
			
			export const connectionWriteTimeout = 'connectionWriteTimeout' as const;
			export type ConnectionWriteTimeout = { readonly tag: typeof connectionWriteTimeout } & _common;
			export function ConnectionWriteTimeout(): ConnectionWriteTimeout {
				return new VariantImpl(connectionWriteTimeout, undefined) as ConnectionWriteTimeout;
			}
			
			export const connectionLimitReached = 'connectionLimitReached' as const;
			export type ConnectionLimitReached = { readonly tag: typeof connectionLimitReached } & _common;
			export function ConnectionLimitReached(): ConnectionLimitReached {
				return new VariantImpl(connectionLimitReached, undefined) as ConnectionLimitReached;
			}
			
			export const tLSProtocolError = 'TLSProtocolError' as const;
			export type TLSProtocolError = { readonly tag: typeof tLSProtocolError } & _common;
			export function TLSProtocolError(): TLSProtocolError {
				return new VariantImpl(tLSProtocolError, undefined) as TLSProtocolError;
			}
			
			export const tLSCertificateError = 'TLSCertificateError' as const;
			export type TLSCertificateError = { readonly tag: typeof tLSCertificateError } & _common;
			export function TLSCertificateError(): TLSCertificateError {
				return new VariantImpl(tLSCertificateError, undefined) as TLSCertificateError;
			}
			
			export const tLSAlertReceived = 'TLSAlertReceived' as const;
			export type TLSAlertReceived = { readonly tag: typeof tLSAlertReceived; readonly value: TLSAlertReceivedPayload } & _common;
			export function TLSAlertReceived(value: TLSAlertReceivedPayload): TLSAlertReceived {
				return new VariantImpl(tLSAlertReceived, value) as TLSAlertReceived;
			}
			
			export const hTTPRequestDenied = 'HTTPRequestDenied' as const;
			export type HTTPRequestDenied = { readonly tag: typeof hTTPRequestDenied } & _common;
			export function HTTPRequestDenied(): HTTPRequestDenied {
				return new VariantImpl(hTTPRequestDenied, undefined) as HTTPRequestDenied;
			}
			
			export const hTTPRequestLengthRequired = 'HTTPRequestLengthRequired' as const;
			export type HTTPRequestLengthRequired = { readonly tag: typeof hTTPRequestLengthRequired } & _common;
			export function HTTPRequestLengthRequired(): HTTPRequestLengthRequired {
				return new VariantImpl(hTTPRequestLengthRequired, undefined) as HTTPRequestLengthRequired;
			}
			
			export const hTTPRequestBodySize = 'HTTPRequestBodySize' as const;
			export type HTTPRequestBodySize = { readonly tag: typeof hTTPRequestBodySize; readonly value: u64 | undefined } & _common;
			export function HTTPRequestBodySize(value: u64 | undefined): HTTPRequestBodySize {
				return new VariantImpl(hTTPRequestBodySize, value) as HTTPRequestBodySize;
			}
			
			export const hTTPRequestMethodInvalid = 'HTTPRequestMethodInvalid' as const;
			export type HTTPRequestMethodInvalid = { readonly tag: typeof hTTPRequestMethodInvalid } & _common;
			export function HTTPRequestMethodInvalid(): HTTPRequestMethodInvalid {
				return new VariantImpl(hTTPRequestMethodInvalid, undefined) as HTTPRequestMethodInvalid;
			}
			
			export const hTTPRequestURIInvalid = 'HTTPRequestURIInvalid' as const;
			export type HTTPRequestURIInvalid = { readonly tag: typeof hTTPRequestURIInvalid } & _common;
			export function HTTPRequestURIInvalid(): HTTPRequestURIInvalid {
				return new VariantImpl(hTTPRequestURIInvalid, undefined) as HTTPRequestURIInvalid;
			}
			
			export const hTTPRequestURITooLong = 'HTTPRequestURITooLong' as const;
			export type HTTPRequestURITooLong = { readonly tag: typeof hTTPRequestURITooLong } & _common;
			export function HTTPRequestURITooLong(): HTTPRequestURITooLong {
				return new VariantImpl(hTTPRequestURITooLong, undefined) as HTTPRequestURITooLong;
			}
			
			export const hTTPRequestHeaderSectionSize = 'HTTPRequestHeaderSectionSize' as const;
			export type HTTPRequestHeaderSectionSize = { readonly tag: typeof hTTPRequestHeaderSectionSize; readonly value: u32 | undefined } & _common;
			export function HTTPRequestHeaderSectionSize(value: u32 | undefined): HTTPRequestHeaderSectionSize {
				return new VariantImpl(hTTPRequestHeaderSectionSize, value) as HTTPRequestHeaderSectionSize;
			}
			
			export const hTTPRequestHeaderSize = 'HTTPRequestHeaderSize' as const;
			export type HTTPRequestHeaderSize = { readonly tag: typeof hTTPRequestHeaderSize; readonly value: FieldSizePayload | undefined } & _common;
			export function HTTPRequestHeaderSize(value: FieldSizePayload | undefined): HTTPRequestHeaderSize {
				return new VariantImpl(hTTPRequestHeaderSize, value) as HTTPRequestHeaderSize;
			}
			
			export const hTTPRequestTrailerSectionSize = 'HTTPRequestTrailerSectionSize' as const;
			export type HTTPRequestTrailerSectionSize = { readonly tag: typeof hTTPRequestTrailerSectionSize; readonly value: u32 | undefined } & _common;
			export function HTTPRequestTrailerSectionSize(value: u32 | undefined): HTTPRequestTrailerSectionSize {
				return new VariantImpl(hTTPRequestTrailerSectionSize, value) as HTTPRequestTrailerSectionSize;
			}
			
			export const hTTPRequestTrailerSize = 'HTTPRequestTrailerSize' as const;
			export type HTTPRequestTrailerSize = { readonly tag: typeof hTTPRequestTrailerSize; readonly value: FieldSizePayload } & _common;
			export function HTTPRequestTrailerSize(value: FieldSizePayload): HTTPRequestTrailerSize {
				return new VariantImpl(hTTPRequestTrailerSize, value) as HTTPRequestTrailerSize;
			}
			
			export const hTTPResponseIncomplete = 'HTTPResponseIncomplete' as const;
			export type HTTPResponseIncomplete = { readonly tag: typeof hTTPResponseIncomplete } & _common;
			export function HTTPResponseIncomplete(): HTTPResponseIncomplete {
				return new VariantImpl(hTTPResponseIncomplete, undefined) as HTTPResponseIncomplete;
			}
			
			export const hTTPResponseHeaderSectionSize = 'HTTPResponseHeaderSectionSize' as const;
			export type HTTPResponseHeaderSectionSize = { readonly tag: typeof hTTPResponseHeaderSectionSize; readonly value: u32 | undefined } & _common;
			export function HTTPResponseHeaderSectionSize(value: u32 | undefined): HTTPResponseHeaderSectionSize {
				return new VariantImpl(hTTPResponseHeaderSectionSize, value) as HTTPResponseHeaderSectionSize;
			}
			
			export const hTTPResponseHeaderSize = 'HTTPResponseHeaderSize' as const;
			export type HTTPResponseHeaderSize = { readonly tag: typeof hTTPResponseHeaderSize; readonly value: FieldSizePayload } & _common;
			export function HTTPResponseHeaderSize(value: FieldSizePayload): HTTPResponseHeaderSize {
				return new VariantImpl(hTTPResponseHeaderSize, value) as HTTPResponseHeaderSize;
			}
			
			export const hTTPResponseBodySize = 'HTTPResponseBodySize' as const;
			export type HTTPResponseBodySize = { readonly tag: typeof hTTPResponseBodySize; readonly value: u64 | undefined } & _common;
			export function HTTPResponseBodySize(value: u64 | undefined): HTTPResponseBodySize {
				return new VariantImpl(hTTPResponseBodySize, value) as HTTPResponseBodySize;
			}
			
			export const hTTPResponseTrailerSectionSize = 'HTTPResponseTrailerSectionSize' as const;
			export type HTTPResponseTrailerSectionSize = { readonly tag: typeof hTTPResponseTrailerSectionSize; readonly value: u32 | undefined } & _common;
			export function HTTPResponseTrailerSectionSize(value: u32 | undefined): HTTPResponseTrailerSectionSize {
				return new VariantImpl(hTTPResponseTrailerSectionSize, value) as HTTPResponseTrailerSectionSize;
			}
			
			export const hTTPResponseTrailerSize = 'HTTPResponseTrailerSize' as const;
			export type HTTPResponseTrailerSize = { readonly tag: typeof hTTPResponseTrailerSize; readonly value: FieldSizePayload } & _common;
			export function HTTPResponseTrailerSize(value: FieldSizePayload): HTTPResponseTrailerSize {
				return new VariantImpl(hTTPResponseTrailerSize, value) as HTTPResponseTrailerSize;
			}
			
			export const hTTPResponseTransferCoding = 'HTTPResponseTransferCoding' as const;
			export type HTTPResponseTransferCoding = { readonly tag: typeof hTTPResponseTransferCoding; readonly value: string | undefined } & _common;
			export function HTTPResponseTransferCoding(value: string | undefined): HTTPResponseTransferCoding {
				return new VariantImpl(hTTPResponseTransferCoding, value) as HTTPResponseTransferCoding;
			}
			
			export const hTTPResponseContentCoding = 'HTTPResponseContentCoding' as const;
			export type HTTPResponseContentCoding = { readonly tag: typeof hTTPResponseContentCoding; readonly value: string | undefined } & _common;
			export function HTTPResponseContentCoding(value: string | undefined): HTTPResponseContentCoding {
				return new VariantImpl(hTTPResponseContentCoding, value) as HTTPResponseContentCoding;
			}
			
			export const hTTPResponseTimeout = 'HTTPResponseTimeout' as const;
			export type HTTPResponseTimeout = { readonly tag: typeof hTTPResponseTimeout } & _common;
			export function HTTPResponseTimeout(): HTTPResponseTimeout {
				return new VariantImpl(hTTPResponseTimeout, undefined) as HTTPResponseTimeout;
			}
			
			export const hTTPUpgradeFailed = 'HTTPUpgradeFailed' as const;
			export type HTTPUpgradeFailed = { readonly tag: typeof hTTPUpgradeFailed } & _common;
			export function HTTPUpgradeFailed(): HTTPUpgradeFailed {
				return new VariantImpl(hTTPUpgradeFailed, undefined) as HTTPUpgradeFailed;
			}
			
			export const hTTPProtocolError = 'HTTPProtocolError' as const;
			export type HTTPProtocolError = { readonly tag: typeof hTTPProtocolError } & _common;
			export function HTTPProtocolError(): HTTPProtocolError {
				return new VariantImpl(hTTPProtocolError, undefined) as HTTPProtocolError;
			}
			
			export const loopDetected = 'loopDetected' as const;
			export type LoopDetected = { readonly tag: typeof loopDetected } & _common;
			export function LoopDetected(): LoopDetected {
				return new VariantImpl(loopDetected, undefined) as LoopDetected;
			}
			
			export const configurationError = 'configurationError' as const;
			export type ConfigurationError = { readonly tag: typeof configurationError } & _common;
			export function ConfigurationError(): ConfigurationError {
				return new VariantImpl(configurationError, undefined) as ConfigurationError;
			}
			
			
			/**
			 * This is a catch-all error for anything that doesn't fit cleanly into a
			 * more specific case. It also includes an optional string for an
			 * unstructured description of the error. Users should not depend on the
			 * string for diagnosing errors, as it's not required to be consistent
			 * between implementations.
			 */
			export const internalError = 'internalError' as const;
			export type InternalError = { readonly tag: typeof internalError; readonly value: string | undefined } & _common;
			export function InternalError(value: string | undefined): InternalError {
				return new VariantImpl(internalError, value) as InternalError;
			}
			
			export type _tt = typeof dNSTimeout | typeof dNSError | typeof destinationNotFound | typeof destinationUnavailable | typeof destinationIPProhibited | typeof destinationIPUnroutable | typeof connectionRefused | typeof connectionTerminated | typeof connectionTimeout | typeof connectionReadTimeout | typeof connectionWriteTimeout | typeof connectionLimitReached | typeof tLSProtocolError | typeof tLSCertificateError | typeof tLSAlertReceived | typeof hTTPRequestDenied | typeof hTTPRequestLengthRequired | typeof hTTPRequestBodySize | typeof hTTPRequestMethodInvalid | typeof hTTPRequestURIInvalid | typeof hTTPRequestURITooLong | typeof hTTPRequestHeaderSectionSize | typeof hTTPRequestHeaderSize | typeof hTTPRequestTrailerSectionSize | typeof hTTPRequestTrailerSize | typeof hTTPResponseIncomplete | typeof hTTPResponseHeaderSectionSize | typeof hTTPResponseHeaderSize | typeof hTTPResponseBodySize | typeof hTTPResponseTrailerSectionSize | typeof hTTPResponseTrailerSize | typeof hTTPResponseTransferCoding | typeof hTTPResponseContentCoding | typeof hTTPResponseTimeout | typeof hTTPUpgradeFailed | typeof hTTPProtocolError | typeof loopDetected | typeof configurationError | typeof internalError;
			export type _vt = DNSErrorPayload | TLSAlertReceivedPayload | u64 | undefined | u32 | undefined | FieldSizePayload | undefined | u32 | undefined | FieldSizePayload | u32 | undefined | FieldSizePayload | u64 | undefined | u32 | undefined | FieldSizePayload | string | undefined | string | undefined | string | undefined | undefined;
			type _common = Omit<VariantImpl, 'tag' | 'value'>;
			export function _ctor(t: _tt, v: _vt): ErrorCode {
				return new VariantImpl(t, v) as ErrorCode;
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
				isDNSTimeout(): this is DNSTimeout {
					return this._tag === ErrorCode.dNSTimeout;
				}
				isDNSError(): this is DNSError {
					return this._tag === ErrorCode.dNSError;
				}
				isDestinationNotFound(): this is DestinationNotFound {
					return this._tag === ErrorCode.destinationNotFound;
				}
				isDestinationUnavailable(): this is DestinationUnavailable {
					return this._tag === ErrorCode.destinationUnavailable;
				}
				isDestinationIPProhibited(): this is DestinationIPProhibited {
					return this._tag === ErrorCode.destinationIPProhibited;
				}
				isDestinationIPUnroutable(): this is DestinationIPUnroutable {
					return this._tag === ErrorCode.destinationIPUnroutable;
				}
				isConnectionRefused(): this is ConnectionRefused {
					return this._tag === ErrorCode.connectionRefused;
				}
				isConnectionTerminated(): this is ConnectionTerminated {
					return this._tag === ErrorCode.connectionTerminated;
				}
				isConnectionTimeout(): this is ConnectionTimeout {
					return this._tag === ErrorCode.connectionTimeout;
				}
				isConnectionReadTimeout(): this is ConnectionReadTimeout {
					return this._tag === ErrorCode.connectionReadTimeout;
				}
				isConnectionWriteTimeout(): this is ConnectionWriteTimeout {
					return this._tag === ErrorCode.connectionWriteTimeout;
				}
				isConnectionLimitReached(): this is ConnectionLimitReached {
					return this._tag === ErrorCode.connectionLimitReached;
				}
				isTLSProtocolError(): this is TLSProtocolError {
					return this._tag === ErrorCode.tLSProtocolError;
				}
				isTLSCertificateError(): this is TLSCertificateError {
					return this._tag === ErrorCode.tLSCertificateError;
				}
				isTLSAlertReceived(): this is TLSAlertReceived {
					return this._tag === ErrorCode.tLSAlertReceived;
				}
				isHTTPRequestDenied(): this is HTTPRequestDenied {
					return this._tag === ErrorCode.hTTPRequestDenied;
				}
				isHTTPRequestLengthRequired(): this is HTTPRequestLengthRequired {
					return this._tag === ErrorCode.hTTPRequestLengthRequired;
				}
				isHTTPRequestBodySize(): this is HTTPRequestBodySize {
					return this._tag === ErrorCode.hTTPRequestBodySize;
				}
				isHTTPRequestMethodInvalid(): this is HTTPRequestMethodInvalid {
					return this._tag === ErrorCode.hTTPRequestMethodInvalid;
				}
				isHTTPRequestURIInvalid(): this is HTTPRequestURIInvalid {
					return this._tag === ErrorCode.hTTPRequestURIInvalid;
				}
				isHTTPRequestURITooLong(): this is HTTPRequestURITooLong {
					return this._tag === ErrorCode.hTTPRequestURITooLong;
				}
				isHTTPRequestHeaderSectionSize(): this is HTTPRequestHeaderSectionSize {
					return this._tag === ErrorCode.hTTPRequestHeaderSectionSize;
				}
				isHTTPRequestHeaderSize(): this is HTTPRequestHeaderSize {
					return this._tag === ErrorCode.hTTPRequestHeaderSize;
				}
				isHTTPRequestTrailerSectionSize(): this is HTTPRequestTrailerSectionSize {
					return this._tag === ErrorCode.hTTPRequestTrailerSectionSize;
				}
				isHTTPRequestTrailerSize(): this is HTTPRequestTrailerSize {
					return this._tag === ErrorCode.hTTPRequestTrailerSize;
				}
				isHTTPResponseIncomplete(): this is HTTPResponseIncomplete {
					return this._tag === ErrorCode.hTTPResponseIncomplete;
				}
				isHTTPResponseHeaderSectionSize(): this is HTTPResponseHeaderSectionSize {
					return this._tag === ErrorCode.hTTPResponseHeaderSectionSize;
				}
				isHTTPResponseHeaderSize(): this is HTTPResponseHeaderSize {
					return this._tag === ErrorCode.hTTPResponseHeaderSize;
				}
				isHTTPResponseBodySize(): this is HTTPResponseBodySize {
					return this._tag === ErrorCode.hTTPResponseBodySize;
				}
				isHTTPResponseTrailerSectionSize(): this is HTTPResponseTrailerSectionSize {
					return this._tag === ErrorCode.hTTPResponseTrailerSectionSize;
				}
				isHTTPResponseTrailerSize(): this is HTTPResponseTrailerSize {
					return this._tag === ErrorCode.hTTPResponseTrailerSize;
				}
				isHTTPResponseTransferCoding(): this is HTTPResponseTransferCoding {
					return this._tag === ErrorCode.hTTPResponseTransferCoding;
				}
				isHTTPResponseContentCoding(): this is HTTPResponseContentCoding {
					return this._tag === ErrorCode.hTTPResponseContentCoding;
				}
				isHTTPResponseTimeout(): this is HTTPResponseTimeout {
					return this._tag === ErrorCode.hTTPResponseTimeout;
				}
				isHTTPUpgradeFailed(): this is HTTPUpgradeFailed {
					return this._tag === ErrorCode.hTTPUpgradeFailed;
				}
				isHTTPProtocolError(): this is HTTPProtocolError {
					return this._tag === ErrorCode.hTTPProtocolError;
				}
				isLoopDetected(): this is LoopDetected {
					return this._tag === ErrorCode.loopDetected;
				}
				isConfigurationError(): this is ConfigurationError {
					return this._tag === ErrorCode.configurationError;
				}
				isInternalError(): this is InternalError {
					return this._tag === ErrorCode.internalError;
				}
			}
		}
		export type ErrorCode = ErrorCode.DNSTimeout | ErrorCode.DNSError | ErrorCode.DestinationNotFound | ErrorCode.DestinationUnavailable | ErrorCode.DestinationIPProhibited | ErrorCode.DestinationIPUnroutable | ErrorCode.ConnectionRefused | ErrorCode.ConnectionTerminated | ErrorCode.ConnectionTimeout | ErrorCode.ConnectionReadTimeout | ErrorCode.ConnectionWriteTimeout | ErrorCode.ConnectionLimitReached | ErrorCode.TLSProtocolError | ErrorCode.TLSCertificateError | ErrorCode.TLSAlertReceived | ErrorCode.HTTPRequestDenied | ErrorCode.HTTPRequestLengthRequired | ErrorCode.HTTPRequestBodySize | ErrorCode.HTTPRequestMethodInvalid | ErrorCode.HTTPRequestURIInvalid | ErrorCode.HTTPRequestURITooLong | ErrorCode.HTTPRequestHeaderSectionSize | ErrorCode.HTTPRequestHeaderSize | ErrorCode.HTTPRequestTrailerSectionSize | ErrorCode.HTTPRequestTrailerSize | ErrorCode.HTTPResponseIncomplete | ErrorCode.HTTPResponseHeaderSectionSize | ErrorCode.HTTPResponseHeaderSize | ErrorCode.HTTPResponseBodySize | ErrorCode.HTTPResponseTrailerSectionSize | ErrorCode.HTTPResponseTrailerSize | ErrorCode.HTTPResponseTransferCoding | ErrorCode.HTTPResponseContentCoding | ErrorCode.HTTPResponseTimeout | ErrorCode.HTTPUpgradeFailed | ErrorCode.HTTPProtocolError | ErrorCode.LoopDetected | ErrorCode.ConfigurationError | ErrorCode.InternalError;
		
		
		/**
		 * This type enumerates the different kinds of errors that may occur when
		 * setting or appending to a `fields` resource.
		 */
		export namespace HeaderError {
			
			/**
			 * This error indicates that a `field-key` or `field-value` was
			 * syntactically invalid when used with an operation that sets headers in a
			 * `fields`.
			 */
			export const invalidSyntax = 'invalidSyntax' as const;
			export type InvalidSyntax = { readonly tag: typeof invalidSyntax } & _common;
			export function InvalidSyntax(): InvalidSyntax {
				return new VariantImpl(invalidSyntax, undefined) as InvalidSyntax;
			}
			
			
			/**
			 * This error indicates that a forbidden `field-key` was used when trying
			 * to set a header in a `fields`.
			 */
			export const forbidden = 'forbidden' as const;
			export type Forbidden = { readonly tag: typeof forbidden } & _common;
			export function Forbidden(): Forbidden {
				return new VariantImpl(forbidden, undefined) as Forbidden;
			}
			
			
			/**
			 * This error indicates that the operation on the `fields` was not
			 * permitted because the fields are immutable.
			 */
			export const immutable = 'immutable' as const;
			export type Immutable = { readonly tag: typeof immutable } & _common;
			export function Immutable(): Immutable {
				return new VariantImpl(immutable, undefined) as Immutable;
			}
			
			export type _tt = typeof invalidSyntax | typeof forbidden | typeof immutable;
			export type _vt = undefined;
			type _common = Omit<VariantImpl, 'tag' | 'value'>;
			export function _ctor(t: _tt, v: _vt): HeaderError {
				return new VariantImpl(t, v) as HeaderError;
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
				isInvalidSyntax(): this is InvalidSyntax {
					return this._tag === HeaderError.invalidSyntax;
				}
				isForbidden(): this is Forbidden {
					return this._tag === HeaderError.forbidden;
				}
				isImmutable(): this is Immutable {
					return this._tag === HeaderError.immutable;
				}
			}
		}
		export type HeaderError = HeaderError.InvalidSyntax | HeaderError.Forbidden | HeaderError.Immutable;
		
		/**
		 * Field keys are always strings.
		 */
		export type FieldKey = string;
		
		/**
		 * Field values should always be ASCII strings. However, in
		 * reality, HTTP implementations often have to interpret malformed values,
		 * so they are provided as a list of bytes.
		 */
		export type FieldValue = Uint8Array;
		
		/**
		 * Headers is an alias for Fields.
		 */
		export type Headers = Fields;
		
		/**
		 * Trailers is an alias for Fields.
		 */
		export type Trailers = Fields;
		
		/**
		 * This type corresponds to the HTTP standard Status Code.
		 */
		export type StatusCode = u16;
		
		export namespace Fields {
			export type Module = {
				
				/**
				 * Construct an empty HTTP Fields.
				 */
				constructor(): own<Fields>;
				
				/**
				 * Construct an HTTP Fields.
				 * 
				 * The list represents each key-value pair in the Fields. Keys
				 * which have multiple values are represented by multiple entries in this
				 * list with the same key.
				 * 
				 * The tuple is a pair of the field key, represented as a string, and
				 * Value, represented as a list of bytes. In a valid Fields, all keys
				 * and values are valid UTF-8 strings. However, values are not always
				 * well-formed, so they are represented as a raw list of bytes.
				 * 
				 * An error result will be returned if any header or value was
				 * syntactically invalid, or if a header was forbidden.
				 */
				fromList(entries: [FieldKey, FieldValue][]): result<own<Fields>, HeaderError>;
				
				/**
				 * Get all of the values corresponding to a key.
				 */
				get(self: borrow<Fields>, name: FieldKey): FieldValue[];
				
				/**
				 * Set all of the values for a key. Clears any existing values for that
				 * key, if they have been set.
				 */
				set(self: borrow<Fields>, name: FieldKey, value: FieldValue[]): result<void, HeaderError>;
				
				/**
				 * Delete all values for a key. Does nothing if no values for the key
				 * exist.
				 */
				delete_(self: borrow<Fields>, name: FieldKey): result<void, HeaderError>;
				
				/**
				 * Append a value for a key. Does not change or delete any existing
				 * values for that key.
				 */
				append(self: borrow<Fields>, name: FieldKey, value: FieldValue): result<void, HeaderError>;
				
				/**
				 * Retrieve the full set of keys and values in the Fields. Like the
				 * constructor, the list represents each key-value pair.
				 * 
				 * The outer list represents each key-value pair in the Fields. Keys
				 * which have multiple values are represented by multiple entries in this
				 * list with the same key.
				 */
				entries(self: borrow<Fields>): [FieldKey, FieldValue][];
				
				/**
				 * Make a deep copy of the Fields. Equivelant in behavior to calling the
				 * `fields` constructor on the return value of `entries`
				 */
				clone(self: borrow<Fields>): own<Fields>;
			};
			export interface Interface {
				get(name: FieldKey): FieldValue[];
				set(name: FieldKey, value: FieldValue[]): result<void, HeaderError>;
				delete_(name: FieldKey): result<void, HeaderError>;
				append(name: FieldKey, value: FieldValue): result<void, HeaderError>;
				entries(): [FieldKey, FieldValue][];
				clone(): own<Fields>;
			}
			export type Constructor = {
				new(): Interface;
				fromList(entries: [FieldKey, FieldValue][]): result<own<Fields>, HeaderError>;
			};
			export type Manager = $wcm.ResourceManager<Interface>;
		}
		export type Fields = resource;
		
		export namespace IncomingRequest {
			export type Module = {
				
				/**
				 * Returns the method of the incoming request.
				 */
				method(self: borrow<IncomingRequest>): Method;
				
				/**
				 * Returns the path with query parameters from the request, as a string.
				 */
				pathWithQuery(self: borrow<IncomingRequest>): string | undefined;
				
				/**
				 * Returns the protocol scheme from the request.
				 */
				scheme(self: borrow<IncomingRequest>): Scheme | undefined;
				
				/**
				 * Returns the authority from the request, if it was present.
				 */
				authority(self: borrow<IncomingRequest>): string | undefined;
				
				/**
				 * Returns the `headers` from the request.
				 * 
				 * The `headers` returned are a child resource: it must be dropped before
				 * the parent `incoming-request` is dropped. Dropping this
				 * `incoming-request` before all children are dropped will trap.
				 */
				headers(self: borrow<IncomingRequest>): own<Headers>;
				
				/**
				 * Gives the `incoming-body` associated with this request. Will only
				 * return success at most once, and subsequent calls will return error.
				 */
				consume(self: borrow<IncomingRequest>): result<own<IncomingBody>, void>;
			};
			export interface Interface {
				method(): Method;
				pathWithQuery(): string | undefined;
				scheme(): Scheme | undefined;
				authority(): string | undefined;
				headers(): own<Headers>;
				consume(): result<own<IncomingBody>, void>;
			}
			export type Manager = $wcm.ResourceManager<Interface>;
		}
		export type IncomingRequest = resource;
		
		export namespace OutgoingRequest {
			export type Module = {
				
				/**
				 * Construct a new `outgoing-request` with a default `method` of `GET`, and
				 * `none` values for `path-with-query`, `scheme`, and `authority`.
				 * 
				 * * `headers` is the HTTP Headers for the Request.
				 * 
				 * It is possible to construct, or manipulate with the accessor functions
				 * below, an `outgoing-request` with an invalid combination of `scheme`
				 * and `authority`, or `headers` which are not permitted to be sent.
				 * It is the obligation of the `outgoing-handler.handle` implementation
				 * to reject invalid constructions of `outgoing-request`.
				 */
				constructor(headers: own<Headers>): own<OutgoingRequest>;
				
				/**
				 * Returns the resource corresponding to the outgoing Body for this
				 * Request.
				 * 
				 * Returns success on the first call: the `outgoing-body` resource for
				 * this `outgoing-response` can be retrieved at most once. Subsequent
				 * calls will return error.
				 */
				body(self: borrow<OutgoingRequest>): result<own<OutgoingBody>, void>;
				
				/**
				 * Get the Method for the Request.
				 */
				method(self: borrow<OutgoingRequest>): Method;
				
				/**
				 * Set the Method for the Request. Fails if the string present in a
				 * `method.other` argument is not a syntactically valid method.
				 */
				setMethod(self: borrow<OutgoingRequest>, method: Method): result<void, void>;
				
				/**
				 * Get the combination of the HTTP Path and Query for the Request.
				 * When `none`, this represents an empty Path and empty Query.
				 */
				pathWithQuery(self: borrow<OutgoingRequest>): string | undefined;
				
				/**
				 * Set the combination of the HTTP Path and Query for the Request.
				 * When `none`, this represents an empty Path and empty Query. Fails is the
				 * string given is not a syntactically valid path and query uri component.
				 */
				setPathWithQuery(self: borrow<OutgoingRequest>, pathWithQuery: string | undefined): result<void, void>;
				
				/**
				 * Get the HTTP Related Scheme for the Request. When `none`, the
				 * implementation may choose an appropriate default scheme.
				 */
				scheme(self: borrow<OutgoingRequest>): Scheme | undefined;
				
				/**
				 * Set the HTTP Related Scheme for the Request. When `none`, the
				 * implementation may choose an appropriate default scheme. Fails if the
				 * string given is not a syntactically valid uri scheme.
				 */
				setScheme(self: borrow<OutgoingRequest>, scheme: Scheme | undefined): result<void, void>;
				
				/**
				 * Get the HTTP Authority for the Request. A value of `none` may be used
				 * with Related Schemes which do not require an Authority. The HTTP and
				 * HTTPS schemes always require an authority.
				 */
				authority(self: borrow<OutgoingRequest>): string | undefined;
				
				/**
				 * Set the HTTP Authority for the Request. A value of `none` may be used
				 * with Related Schemes which do not require an Authority. The HTTP and
				 * HTTPS schemes always require an authority. Fails if the string given is
				 * not a syntactically valid uri authority.
				 */
				setAuthority(self: borrow<OutgoingRequest>, authority: string | undefined): result<void, void>;
				
				/**
				 * Get the headers associated with the Request.
				 * 
				 * This headers resource is a child: it must be dropped before the parent
				 * `outgoing-request` is dropped, or its ownership is transfered to
				 * another component by e.g. `outgoing-handler.handle`.
				 */
				headers(self: borrow<OutgoingRequest>): own<Headers>;
			};
			export interface Interface {
				body(): result<own<OutgoingBody>, void>;
				method(): Method;
				setMethod(method: Method): result<void, void>;
				pathWithQuery(): string | undefined;
				setPathWithQuery(pathWithQuery: string | undefined): result<void, void>;
				scheme(): Scheme | undefined;
				setScheme(scheme: Scheme | undefined): result<void, void>;
				authority(): string | undefined;
				setAuthority(authority: string | undefined): result<void, void>;
				headers(): own<Headers>;
			}
			export type Constructor = {
				new(headers: own<Headers>): Interface;
			};
			export type Manager = $wcm.ResourceManager<Interface>;
		}
		export type OutgoingRequest = resource;
		
		export namespace RequestOptions {
			export type Module = {
				
				/**
				 * Construct a default `request-options` value.
				 */
				constructor(): own<RequestOptions>;
				
				/**
				 * The timeout for the initial connect to the HTTP Server.
				 */
				connectTimeoutMs(self: borrow<RequestOptions>): Duration | undefined;
				
				/**
				 * Set the timeout for the initial connect to the HTTP Server. An error
				 * return value indicates that this timeout is not supported.
				 */
				setConnectTimeoutMs(self: borrow<RequestOptions>, ms: Duration | undefined): result<void, void>;
				
				/**
				 * The timeout for receiving the first byte of the Response body.
				 */
				firstByteTimeoutMs(self: borrow<RequestOptions>): Duration | undefined;
				
				/**
				 * Set the timeout for receiving the first byte of the Response body. An
				 * error return value indicates that this timeout is not supported.
				 */
				setFirstByteTimeoutMs(self: borrow<RequestOptions>, ms: Duration | undefined): result<void, void>;
				
				/**
				 * The timeout for receiving subsequent chunks of bytes in the Response
				 * body stream.
				 */
				betweenBytesTimeoutMs(self: borrow<RequestOptions>): Duration | undefined;
				
				/**
				 * Set the timeout for receiving subsequent chunks of bytes in the Response
				 * body stream. An error return value indicates that this timeout is not
				 * supported.
				 */
				setBetweenBytesTimeoutMs(self: borrow<RequestOptions>, ms: Duration | undefined): result<void, void>;
			};
			export interface Interface {
				connectTimeoutMs(): Duration | undefined;
				setConnectTimeoutMs(ms: Duration | undefined): result<void, void>;
				firstByteTimeoutMs(): Duration | undefined;
				setFirstByteTimeoutMs(ms: Duration | undefined): result<void, void>;
				betweenBytesTimeoutMs(): Duration | undefined;
				setBetweenBytesTimeoutMs(ms: Duration | undefined): result<void, void>;
			}
			export type Constructor = {
				new(): Interface;
			};
			export type Manager = $wcm.ResourceManager<Interface>;
		}
		export type RequestOptions = resource;
		
		export namespace ResponseOutparam {
			export type Module = {
				
				/**
				 * Set the value of the `response-outparam` to either send a response,
				 * or indicate an error.
				 * 
				 * This method consumes the `response-outparam` to ensure that it is
				 * called at most once. If it is never called, the implementation
				 * will respond with an error.
				 * 
				 * The user may provide an `error` to `response` to allow the
				 * implementation determine how to respond with an HTTP error response.
				 */
				set(param: own<ResponseOutparam>, response: result<own<OutgoingResponse>, ErrorCode>): void;
			};
			export interface Interface {
			}
			export type Constructor = {
				set(param: own<ResponseOutparam>, response: result<own<OutgoingResponse>, ErrorCode>): void;
			};
			export type Manager = $wcm.ResourceManager<Interface>;
		}
		export type ResponseOutparam = resource;
		
		export namespace IncomingResponse {
			export type Module = {
				
				/**
				 * Returns the status code from the incoming response.
				 */
				status(self: borrow<IncomingResponse>): StatusCode;
				
				/**
				 * Returns the headers from the incoming response.
				 */
				headers(self: borrow<IncomingResponse>): own<Headers>;
				
				/**
				 * Returns the incoming body. May be called at most once. Returns error
				 * if called additional times.
				 */
				consume(self: borrow<IncomingResponse>): result<own<IncomingBody>, void>;
			};
			export interface Interface {
				status(): StatusCode;
				headers(): own<Headers>;
				consume(): result<own<IncomingBody>, void>;
			}
			export type Manager = $wcm.ResourceManager<Interface>;
		}
		export type IncomingResponse = resource;
		
		export namespace IncomingBody {
			export type Module = {
				
				/**
				 * Returns the contents of the body, as a stream of bytes.
				 * 
				 * Returns success on first call: the stream representing the contents
				 * can be retrieved at most once. Subsequent calls will return error.
				 * 
				 * The returned `input-stream` resource is a child: it must be dropped
				 * before the parent `incoming-body` is dropped, or consumed by
				 * `incoming-body.finish`.
				 * 
				 * This invariant ensures that the implementation can determine whether
				 * the user is consuming the contents of the body, waiting on the
				 * `future-trailers` to be ready, or neither. This allows for network
				 * backpressure is to be applied when the user is consuming the body,
				 * and for that backpressure to not inhibit delivery of the trailers if
				 * the user does not read the entire body.
				 */
				stream(self: borrow<IncomingBody>): result<own<InputStream>, void>;
				
				/**
				 * Takes ownership of `incoming-body`, and returns a `future-trailers`.
				 * This function will trap if the `input-stream` child is still alive.
				 */
				finish(this_: own<IncomingBody>): own<FutureTrailers>;
			};
			export interface Interface {
				stream(): result<own<InputStream>, void>;
			}
			export type Constructor = {
				finish(this_: own<IncomingBody>): own<FutureTrailers>;
			};
			export type Manager = $wcm.ResourceManager<Interface>;
		}
		export type IncomingBody = resource;
		
		export namespace FutureTrailers {
			export type Module = {
				
				/**
				 * Returns a pollable which becomes ready when either the trailers have
				 * been received, or an error has occured. When this pollable is ready,
				 * the `get` method will return `some`.
				 */
				subscribe(self: borrow<FutureTrailers>): own<Pollable>;
				
				/**
				 * Returns the contents of the trailers, or an error which occured,
				 * once the future is ready.
				 * 
				 * The outer `option` represents future readiness. Users can wait on this
				 * `option` to become `some` using the `subscribe` method.
				 * 
				 * The `result` represents that either the HTTP Request or Response body,
				 * as well as any trailers, were received successfully, or that an error
				 * occured receiving them. The optional `trailers` indicates whether or not
				 * trailers were present in the body.
				 */
				get(self: borrow<FutureTrailers>): result<own<Trailers> | undefined, ErrorCode> | undefined;
			};
			export interface Interface {
				subscribe(): own<Pollable>;
				get(): result<own<Trailers> | undefined, ErrorCode> | undefined;
			}
			export type Manager = $wcm.ResourceManager<Interface>;
		}
		export type FutureTrailers = resource;
		
		export namespace OutgoingResponse {
			export type Module = {
				
				/**
				 * Construct an `outgoing-response`, with a default `status-code` of `200`.
				 * If a different `status-code` is needed, it must be set via the
				 * `set-status-code` method.
				 * 
				 * * `headers` is the HTTP Headers for the Response.
				 */
				constructor(headers: own<Headers>): own<OutgoingResponse>;
				
				/**
				 * Get the HTTP Status Code for the Response.
				 */
				statusCode(self: borrow<OutgoingResponse>): StatusCode;
				
				/**
				 * Set the HTTP Status Code for the Response. Fails if the status-code
				 * given is not a valid http status code.
				 */
				setStatusCode(self: borrow<OutgoingResponse>, statusCode: StatusCode): result<void, void>;
				
				/**
				 * Get the headers associated with the Request.
				 * 
				 * This headers resource is a child: it must be dropped before the parent
				 * `outgoing-request` is dropped, or its ownership is transfered to
				 * another component by e.g. `outgoing-handler.handle`.
				 */
				headers(self: borrow<OutgoingResponse>): own<Headers>;
				
				/**
				 * Returns the resource corresponding to the outgoing Body for this Response.
				 * 
				 * Returns success on the first call: the `outgoing-body` resource for
				 * this `outgoing-response` can be retrieved at most once. Subsequent
				 * calls will return error.
				 */
				body(self: borrow<OutgoingResponse>): result<own<OutgoingBody>, void>;
			};
			export interface Interface {
				statusCode(): StatusCode;
				setStatusCode(statusCode: StatusCode): result<void, void>;
				headers(): own<Headers>;
				body(): result<own<OutgoingBody>, void>;
			}
			export type Constructor = {
				new(headers: own<Headers>): Interface;
			};
			export type Manager = $wcm.ResourceManager<Interface>;
		}
		export type OutgoingResponse = resource;
		
		export namespace OutgoingBody {
			export type Module = {
				
				/**
				 * Returns a stream for writing the body contents.
				 * 
				 * The returned `output-stream` is a child resource: it must be dropped
				 * before the parent `outgoing-body` resource is dropped (or finished),
				 * otherwise the `outgoing-body` drop or `finish` will trap.
				 * 
				 * Returns success on the first call: the `output-stream` resource for
				 * this `outgoing-body` may be retrieved at most once. Subsequent calls
				 * will return error.
				 */
				write(self: borrow<OutgoingBody>): result<own<OutputStream>, void>;
				
				/**
				 * Finalize an outgoing body, optionally providing trailers. This must be
				 * called to signal that the response is complete. If the `outgoing-body`
				 * is dropped without calling `outgoing-body.finalize`, the implementation
				 * should treat the body as corrupted.
				 */
				finish(this_: own<OutgoingBody>, trailers: own<Trailers> | undefined): void;
			};
			export interface Interface {
				write(): result<own<OutputStream>, void>;
			}
			export type Constructor = {
				finish(this_: own<OutgoingBody>, trailers: own<Trailers> | undefined): void;
			};
			export type Manager = $wcm.ResourceManager<Interface>;
		}
		export type OutgoingBody = resource;
		
		export namespace FutureIncomingResponse {
			export type Module = {
				
				/**
				 * Returns a pollable which becomes ready when either the Response has
				 * been received, or an error has occured. When this pollable is ready,
				 * the `get` method will return `some`.
				 */
				subscribe(self: borrow<FutureIncomingResponse>): own<Pollable>;
				
				/**
				 * Returns the incoming HTTP Response, or an error, once one is ready.
				 * 
				 * The outer `option` represents future readiness. Users can wait on this
				 * `option` to become `some` using the `subscribe` method.
				 * 
				 * The outer `result` is used to retrieve the response or error at most
				 * once. It will be success on the first call in which the outer option
				 * is `some`, and error on subsequent calls.
				 * 
				 * The inner `result` represents that either the incoming HTTP Response
				 * status and headers have recieved successfully, or that an error
				 * occured. Errors may also occur while consuming the response body,
				 * but those will be reported by the `incoming-body` and its
				 * `output-stream` child.
				 */
				get(self: borrow<FutureIncomingResponse>): result<result<own<IncomingResponse>, ErrorCode>, void> | undefined;
			};
			export interface Interface {
				subscribe(): own<Pollable>;
				get(): result<result<own<IncomingResponse>, ErrorCode>, void> | undefined;
			}
			export type Manager = $wcm.ResourceManager<Interface>;
		}
		export type FutureIncomingResponse = resource;
		
		/**
		 * Attempts to extract a http-related `error` from the stream `error`
		 * provided.
		 * 
		 * Stream operations which return `stream-error::last-operation-failed` have
		 * a payload with more information about the operation that failed. This
		 * payload can be passed through to this function to see if there's
		 * http-related information about the error to return.
		 * 
		 * Note that this function is fallible because not all stream-related errors
		 * are http-related errors.
		 */
		export type httpErrorCode = (err: borrow<StreamError>) => ErrorCode | undefined;
	}
	export type Types<F extends http.Types.Fields.Module | http.Types.Fields.Constructor | http.Types.Fields.Manager = http.Types.Fields.Module | http.Types.Fields.Constructor | http.Types.Fields.Manager, IR extends http.Types.IncomingRequest.Module | http.Types.IncomingRequest.Manager = http.Types.IncomingRequest.Module | http.Types.IncomingRequest.Manager, OR extends http.Types.OutgoingRequest.Module | http.Types.OutgoingRequest.Constructor | http.Types.OutgoingRequest.Manager = http.Types.OutgoingRequest.Module | http.Types.OutgoingRequest.Constructor | http.Types.OutgoingRequest.Manager, RO extends http.Types.RequestOptions.Module | http.Types.RequestOptions.Constructor | http.Types.RequestOptions.Manager = http.Types.RequestOptions.Module | http.Types.RequestOptions.Constructor | http.Types.RequestOptions.Manager, RO1 extends http.Types.ResponseOutparam.Module | http.Types.ResponseOutparam.Manager = http.Types.ResponseOutparam.Module | http.Types.ResponseOutparam.Manager, IR1 extends http.Types.IncomingResponse.Module | http.Types.IncomingResponse.Manager = http.Types.IncomingResponse.Module | http.Types.IncomingResponse.Manager, IB extends http.Types.IncomingBody.Module | http.Types.IncomingBody.Manager = http.Types.IncomingBody.Module | http.Types.IncomingBody.Manager, FT extends http.Types.FutureTrailers.Module | http.Types.FutureTrailers.Manager = http.Types.FutureTrailers.Module | http.Types.FutureTrailers.Manager, OR1 extends http.Types.OutgoingResponse.Module | http.Types.OutgoingResponse.Constructor | http.Types.OutgoingResponse.Manager = http.Types.OutgoingResponse.Module | http.Types.OutgoingResponse.Constructor | http.Types.OutgoingResponse.Manager, OB extends http.Types.OutgoingBody.Module | http.Types.OutgoingBody.Manager = http.Types.OutgoingBody.Module | http.Types.OutgoingBody.Manager, FIR extends http.Types.FutureIncomingResponse.Module | http.Types.FutureIncomingResponse.Manager = http.Types.FutureIncomingResponse.Module | http.Types.FutureIncomingResponse.Manager> = {
		Fields: F;
		IncomingRequest: IR;
		OutgoingRequest: OR;
		RequestOptions: RO;
		ResponseOutparam: RO1;
		IncomingResponse: IR1;
		IncomingBody: IB;
		FutureTrailers: FT;
		OutgoingResponse: OR1;
		OutgoingBody: OB;
		FutureIncomingResponse: FIR;
		httpErrorCode: Types.httpErrorCode;
	};
	
	/**
	 * This interface defines a handler of incoming HTTP Requests. It should
	 * be exported by components which can respond to HTTP Requests.
	 */
	export namespace IncomingHandler {
		
		export type IncomingRequest = http.Types.IncomingRequest;
		
		export type ResponseOutparam = http.Types.ResponseOutparam;
		
		/**
		 * This function is invoked with an incoming HTTP Request, and a resource
		 * `response-outparam` which provides the capability to reply with an HTTP
		 * Response. The response is sent by calling the `response-outparam.set`
		 * method, which allows execution to continue after the response has been
		 * sent. This enables both streaming to the response body, and performing other
		 * work.
		 * 
		 * The implementor of this function must write a response to the
		 * `response-outparam` before returning, or else the caller will respond
		 * with an error on its behalf.
		 */
		export type handle = (request: own<IncomingRequest>, responseOut: own<ResponseOutparam>) => void;
	}
	export type IncomingHandler = {
		handle: IncomingHandler.handle;
	};
	
	/**
	 * This interface defines a handler of outgoing HTTP Requests. It should be
	 * imported by components which wish to make HTTP Requests.
	 */
	export namespace OutgoingHandler {
		
		export type OutgoingRequest = http.Types.OutgoingRequest;
		
		export type RequestOptions = http.Types.RequestOptions;
		
		export type FutureIncomingResponse = http.Types.FutureIncomingResponse;
		
		export type ErrorCode = http.Types.ErrorCode;
		
		/**
		 * This function is invoked with an outgoing HTTP Request, and it returns
		 * a resource `future-incoming-response` which represents an HTTP Response
		 * which may arrive in the future.
		 * 
		 * The `options` argument accepts optional parameters for the HTTP
		 * protocol's transport layer.
		 * 
		 * This function may return an error if the `outgoing-request` is invalid
		 * or not allowed to be made. Otherwise, protocol errors are reported
		 * through the `future-incoming-response`.
		 */
		export type handle = (request: own<OutgoingRequest>, options: own<RequestOptions> | undefined) => result<own<FutureIncomingResponse>, ErrorCode>;
	}
	export type OutgoingHandler = {
		handle: OutgoingHandler.handle;
	};
	
}
export type http<T extends http.Types = http.Types> = {
	Types?: T;
	IncomingHandler?: http.IncomingHandler;
	OutgoingHandler?: http.OutgoingHandler;
};

export namespace http {
	export namespace Types.$ {
		export const Duration = clocks.MonotonicClock.$.Duration;
		export const InputStream = io.Streams.$.InputStream;
		export const OutputStream = io.Streams.$.OutputStream;
		export const StreamError = io.Streams.$.Error;
		export const Pollable = io.Poll.$.Pollable;
		export const Method = new $wcm.VariantType<http.Types.Method, http.Types.Method._tt, http.Types.Method._vt>([['get', undefined], ['head', undefined], ['post', undefined], ['put', undefined], ['delete_', undefined], ['connect', undefined], ['options', undefined], ['trace', undefined], ['patch', undefined], ['other', $wcm.wstring]], http.Types.Method._ctor);
		export const Scheme = new $wcm.VariantType<http.Types.Scheme, http.Types.Scheme._tt, http.Types.Scheme._vt>([['HTTP', undefined], ['HTTPS', undefined], ['other', $wcm.wstring]], http.Types.Scheme._ctor);
		export const DNSErrorPayload = new $wcm.RecordType<http.Types.DNSErrorPayload>([
			['rcode', new $wcm.OptionType<string>($wcm.wstring)],
			['infoCode', new $wcm.OptionType<u16>($wcm.u16)],
		]);
		export const TLSAlertReceivedPayload = new $wcm.RecordType<http.Types.TLSAlertReceivedPayload>([
			['alertId', new $wcm.OptionType<u8>($wcm.u8)],
			['alertMessage', new $wcm.OptionType<string>($wcm.wstring)],
		]);
		export const FieldSizePayload = new $wcm.RecordType<http.Types.FieldSizePayload>([
			['fieldName', new $wcm.OptionType<string>($wcm.wstring)],
			['fieldSize', new $wcm.OptionType<u32>($wcm.u32)],
		]);
		export const ErrorCode = new $wcm.VariantType<http.Types.ErrorCode, http.Types.ErrorCode._tt, http.Types.ErrorCode._vt>([['DNSTimeout', undefined], ['DNSError', DNSErrorPayload], ['destinationNotFound', undefined], ['destinationUnavailable', undefined], ['destinationIPProhibited', undefined], ['destinationIPUnroutable', undefined], ['connectionRefused', undefined], ['connectionTerminated', undefined], ['connectionTimeout', undefined], ['connectionReadTimeout', undefined], ['connectionWriteTimeout', undefined], ['connectionLimitReached', undefined], ['TLSProtocolError', undefined], ['TLSCertificateError', undefined], ['TLSAlertReceived', TLSAlertReceivedPayload], ['HTTPRequestDenied', undefined], ['HTTPRequestLengthRequired', undefined], ['HTTPRequestBodySize', new $wcm.OptionType<u64>($wcm.u64)], ['HTTPRequestMethodInvalid', undefined], ['HTTPRequestURIInvalid', undefined], ['HTTPRequestURITooLong', undefined], ['HTTPRequestHeaderSectionSize', new $wcm.OptionType<u32>($wcm.u32)], ['HTTPRequestHeaderSize', new $wcm.OptionType<http.Types.FieldSizePayload>(FieldSizePayload)], ['HTTPRequestTrailerSectionSize', new $wcm.OptionType<u32>($wcm.u32)], ['HTTPRequestTrailerSize', FieldSizePayload], ['HTTPResponseIncomplete', undefined], ['HTTPResponseHeaderSectionSize', new $wcm.OptionType<u32>($wcm.u32)], ['HTTPResponseHeaderSize', FieldSizePayload], ['HTTPResponseBodySize', new $wcm.OptionType<u64>($wcm.u64)], ['HTTPResponseTrailerSectionSize', new $wcm.OptionType<u32>($wcm.u32)], ['HTTPResponseTrailerSize', FieldSizePayload], ['HTTPResponseTransferCoding', new $wcm.OptionType<string>($wcm.wstring)], ['HTTPResponseContentCoding', new $wcm.OptionType<string>($wcm.wstring)], ['HTTPResponseTimeout', undefined], ['HTTPUpgradeFailed', undefined], ['HTTPProtocolError', undefined], ['loopDetected', undefined], ['configurationError', undefined], ['internalError', new $wcm.OptionType<string>($wcm.wstring)]], http.Types.ErrorCode._ctor);
		export const HeaderError = new $wcm.VariantType<http.Types.HeaderError, http.Types.HeaderError._tt, http.Types.HeaderError._vt>([['invalidSyntax', undefined], ['forbidden', undefined], ['immutable', undefined]], http.Types.HeaderError._ctor);
		export const FieldKey = $wcm.wstring;
		export const FieldValue = new $wcm.Uint8ArrayType();
		export const Fields = new $wcm.ResourceType('fields');
		export const Headers = Fields;
		export const Trailers = Fields;
		export const IncomingRequest = new $wcm.ResourceType('incoming-request');
		export const OutgoingRequest = new $wcm.ResourceType('outgoing-request');
		export const RequestOptions = new $wcm.ResourceType('request-options');
		export const ResponseOutparam = new $wcm.ResourceType('response-outparam');
		export const StatusCode = $wcm.u16;
		export const IncomingResponse = new $wcm.ResourceType('incoming-response');
		export const IncomingBody = new $wcm.ResourceType('incoming-body');
		export const FutureTrailers = new $wcm.ResourceType('future-trailers');
		export const OutgoingResponse = new $wcm.ResourceType('outgoing-response');
		export const OutgoingBody = new $wcm.ResourceType('outgoing-body');
		export const FutureIncomingResponse = new $wcm.ResourceType('future-incoming-response');
		Fields.addFunction('constructor', new $wcm.FunctionType<http.Types.Fields.Module['constructor']>('[constructor]fields', [], new $wcm.OwnType<http.Types.Fields>(Fields)));
		Fields.addFunction('fromList', new $wcm.FunctionType<http.Types.Fields.Module['fromList']>('[static]fields.from-list', [
			['entries', new $wcm.ListType<[http.Types.FieldKey, Uint8Array]>(new $wcm.TupleType<[http.Types.FieldKey, Uint8Array]>([FieldKey, FieldValue]))],
		], new $wcm.ResultType<own<http.Types.Fields>, http.Types.HeaderError>(new $wcm.OwnType<http.Types.Fields>(Fields), HeaderError)));
		Fields.addFunction('get', new $wcm.FunctionType<http.Types.Fields.Module['get']>('[method]fields.get', [
			['self', new $wcm.BorrowType<http.Types.Fields>(Fields)],
			['name', FieldKey],
		], new $wcm.ListType<Uint8Array>(FieldValue)));
		Fields.addFunction('set', new $wcm.FunctionType<http.Types.Fields.Module['set']>('[method]fields.set', [
			['self', new $wcm.BorrowType<http.Types.Fields>(Fields)],
			['name', FieldKey],
			['value', new $wcm.ListType<Uint8Array>(FieldValue)],
		], new $wcm.ResultType<void, http.Types.HeaderError>(undefined, HeaderError)));
		Fields.addFunction('delete_', new $wcm.FunctionType<http.Types.Fields.Module['delete_']>('[method]fields.delete', [
			['self', new $wcm.BorrowType<http.Types.Fields>(Fields)],
			['name', FieldKey],
		], new $wcm.ResultType<void, http.Types.HeaderError>(undefined, HeaderError)));
		Fields.addFunction('append', new $wcm.FunctionType<http.Types.Fields.Module['append']>('[method]fields.append', [
			['self', new $wcm.BorrowType<http.Types.Fields>(Fields)],
			['name', FieldKey],
			['value', FieldValue],
		], new $wcm.ResultType<void, http.Types.HeaderError>(undefined, HeaderError)));
		Fields.addFunction('entries', new $wcm.FunctionType<http.Types.Fields.Module['entries']>('[method]fields.entries', [
			['self', new $wcm.BorrowType<http.Types.Fields>(Fields)],
		], new $wcm.ListType<[http.Types.FieldKey, Uint8Array]>(new $wcm.TupleType<[http.Types.FieldKey, Uint8Array]>([FieldKey, FieldValue]))));
		Fields.addFunction('clone', new $wcm.FunctionType<http.Types.Fields.Module['clone']>('[method]fields.clone', [
			['self', new $wcm.BorrowType<http.Types.Fields>(Fields)],
		], new $wcm.OwnType<http.Types.Fields>(Fields)));
		IncomingRequest.addFunction('method', new $wcm.FunctionType<http.Types.IncomingRequest.Module['method']>('[method]incoming-request.method', [
			['self', new $wcm.BorrowType<http.Types.IncomingRequest>(IncomingRequest)],
		], Method));
		IncomingRequest.addFunction('pathWithQuery', new $wcm.FunctionType<http.Types.IncomingRequest.Module['pathWithQuery']>('[method]incoming-request.path-with-query', [
			['self', new $wcm.BorrowType<http.Types.IncomingRequest>(IncomingRequest)],
		], new $wcm.OptionType<string>($wcm.wstring)));
		IncomingRequest.addFunction('scheme', new $wcm.FunctionType<http.Types.IncomingRequest.Module['scheme']>('[method]incoming-request.scheme', [
			['self', new $wcm.BorrowType<http.Types.IncomingRequest>(IncomingRequest)],
		], new $wcm.OptionType<http.Types.Scheme>(Scheme)));
		IncomingRequest.addFunction('authority', new $wcm.FunctionType<http.Types.IncomingRequest.Module['authority']>('[method]incoming-request.authority', [
			['self', new $wcm.BorrowType<http.Types.IncomingRequest>(IncomingRequest)],
		], new $wcm.OptionType<string>($wcm.wstring)));
		IncomingRequest.addFunction('headers', new $wcm.FunctionType<http.Types.IncomingRequest.Module['headers']>('[method]incoming-request.headers', [
			['self', new $wcm.BorrowType<http.Types.IncomingRequest>(IncomingRequest)],
		], new $wcm.OwnType<http.Types.Headers>(Headers)));
		IncomingRequest.addFunction('consume', new $wcm.FunctionType<http.Types.IncomingRequest.Module['consume']>('[method]incoming-request.consume', [
			['self', new $wcm.BorrowType<http.Types.IncomingRequest>(IncomingRequest)],
		], new $wcm.ResultType<own<http.Types.IncomingBody>, void>(new $wcm.OwnType<http.Types.IncomingBody>(IncomingBody), undefined)));
		OutgoingRequest.addFunction('constructor', new $wcm.FunctionType<http.Types.OutgoingRequest.Module['constructor']>('[constructor]outgoing-request', [
			['headers', new $wcm.OwnType<http.Types.Headers>(Headers)],
		], new $wcm.OwnType<http.Types.OutgoingRequest>(OutgoingRequest)));
		OutgoingRequest.addFunction('body', new $wcm.FunctionType<http.Types.OutgoingRequest.Module['body']>('[method]outgoing-request.body', [
			['self', new $wcm.BorrowType<http.Types.OutgoingRequest>(OutgoingRequest)],
		], new $wcm.ResultType<own<http.Types.OutgoingBody>, void>(new $wcm.OwnType<http.Types.OutgoingBody>(OutgoingBody), undefined)));
		OutgoingRequest.addFunction('method', new $wcm.FunctionType<http.Types.OutgoingRequest.Module['method']>('[method]outgoing-request.method', [
			['self', new $wcm.BorrowType<http.Types.OutgoingRequest>(OutgoingRequest)],
		], Method));
		OutgoingRequest.addFunction('setMethod', new $wcm.FunctionType<http.Types.OutgoingRequest.Module['setMethod']>('[method]outgoing-request.set-method', [
			['self', new $wcm.BorrowType<http.Types.OutgoingRequest>(OutgoingRequest)],
			['method', Method],
		], new $wcm.ResultType<void, void>(undefined, undefined)));
		OutgoingRequest.addFunction('pathWithQuery', new $wcm.FunctionType<http.Types.OutgoingRequest.Module['pathWithQuery']>('[method]outgoing-request.path-with-query', [
			['self', new $wcm.BorrowType<http.Types.OutgoingRequest>(OutgoingRequest)],
		], new $wcm.OptionType<string>($wcm.wstring)));
		OutgoingRequest.addFunction('setPathWithQuery', new $wcm.FunctionType<http.Types.OutgoingRequest.Module['setPathWithQuery']>('[method]outgoing-request.set-path-with-query', [
			['self', new $wcm.BorrowType<http.Types.OutgoingRequest>(OutgoingRequest)],
			['pathWithQuery', new $wcm.OptionType<string>($wcm.wstring)],
		], new $wcm.ResultType<void, void>(undefined, undefined)));
		OutgoingRequest.addFunction('scheme', new $wcm.FunctionType<http.Types.OutgoingRequest.Module['scheme']>('[method]outgoing-request.scheme', [
			['self', new $wcm.BorrowType<http.Types.OutgoingRequest>(OutgoingRequest)],
		], new $wcm.OptionType<http.Types.Scheme>(Scheme)));
		OutgoingRequest.addFunction('setScheme', new $wcm.FunctionType<http.Types.OutgoingRequest.Module['setScheme']>('[method]outgoing-request.set-scheme', [
			['self', new $wcm.BorrowType<http.Types.OutgoingRequest>(OutgoingRequest)],
			['scheme', new $wcm.OptionType<http.Types.Scheme>(Scheme)],
		], new $wcm.ResultType<void, void>(undefined, undefined)));
		OutgoingRequest.addFunction('authority', new $wcm.FunctionType<http.Types.OutgoingRequest.Module['authority']>('[method]outgoing-request.authority', [
			['self', new $wcm.BorrowType<http.Types.OutgoingRequest>(OutgoingRequest)],
		], new $wcm.OptionType<string>($wcm.wstring)));
		OutgoingRequest.addFunction('setAuthority', new $wcm.FunctionType<http.Types.OutgoingRequest.Module['setAuthority']>('[method]outgoing-request.set-authority', [
			['self', new $wcm.BorrowType<http.Types.OutgoingRequest>(OutgoingRequest)],
			['authority', new $wcm.OptionType<string>($wcm.wstring)],
		], new $wcm.ResultType<void, void>(undefined, undefined)));
		OutgoingRequest.addFunction('headers', new $wcm.FunctionType<http.Types.OutgoingRequest.Module['headers']>('[method]outgoing-request.headers', [
			['self', new $wcm.BorrowType<http.Types.OutgoingRequest>(OutgoingRequest)],
		], new $wcm.OwnType<http.Types.Headers>(Headers)));
		RequestOptions.addFunction('constructor', new $wcm.FunctionType<http.Types.RequestOptions.Module['constructor']>('[constructor]request-options', [], new $wcm.OwnType<http.Types.RequestOptions>(RequestOptions)));
		RequestOptions.addFunction('connectTimeoutMs', new $wcm.FunctionType<http.Types.RequestOptions.Module['connectTimeoutMs']>('[method]request-options.connect-timeout-ms', [
			['self', new $wcm.BorrowType<http.Types.RequestOptions>(RequestOptions)],
		], new $wcm.OptionType<http.Types.Duration>(Duration)));
		RequestOptions.addFunction('setConnectTimeoutMs', new $wcm.FunctionType<http.Types.RequestOptions.Module['setConnectTimeoutMs']>('[method]request-options.set-connect-timeout-ms', [
			['self', new $wcm.BorrowType<http.Types.RequestOptions>(RequestOptions)],
			['ms', new $wcm.OptionType<http.Types.Duration>(Duration)],
		], new $wcm.ResultType<void, void>(undefined, undefined)));
		RequestOptions.addFunction('firstByteTimeoutMs', new $wcm.FunctionType<http.Types.RequestOptions.Module['firstByteTimeoutMs']>('[method]request-options.first-byte-timeout-ms', [
			['self', new $wcm.BorrowType<http.Types.RequestOptions>(RequestOptions)],
		], new $wcm.OptionType<http.Types.Duration>(Duration)));
		RequestOptions.addFunction('setFirstByteTimeoutMs', new $wcm.FunctionType<http.Types.RequestOptions.Module['setFirstByteTimeoutMs']>('[method]request-options.set-first-byte-timeout-ms', [
			['self', new $wcm.BorrowType<http.Types.RequestOptions>(RequestOptions)],
			['ms', new $wcm.OptionType<http.Types.Duration>(Duration)],
		], new $wcm.ResultType<void, void>(undefined, undefined)));
		RequestOptions.addFunction('betweenBytesTimeoutMs', new $wcm.FunctionType<http.Types.RequestOptions.Module['betweenBytesTimeoutMs']>('[method]request-options.between-bytes-timeout-ms', [
			['self', new $wcm.BorrowType<http.Types.RequestOptions>(RequestOptions)],
		], new $wcm.OptionType<http.Types.Duration>(Duration)));
		RequestOptions.addFunction('setBetweenBytesTimeoutMs', new $wcm.FunctionType<http.Types.RequestOptions.Module['setBetweenBytesTimeoutMs']>('[method]request-options.set-between-bytes-timeout-ms', [
			['self', new $wcm.BorrowType<http.Types.RequestOptions>(RequestOptions)],
			['ms', new $wcm.OptionType<http.Types.Duration>(Duration)],
		], new $wcm.ResultType<void, void>(undefined, undefined)));
		ResponseOutparam.addFunction('set', new $wcm.FunctionType<http.Types.ResponseOutparam.Module['set']>('[static]response-outparam.set', [
			['param', new $wcm.OwnType<http.Types.ResponseOutparam>(ResponseOutparam)],
			['response', new $wcm.ResultType<own<http.Types.OutgoingResponse>, http.Types.ErrorCode>(new $wcm.OwnType<http.Types.OutgoingResponse>(OutgoingResponse), ErrorCode)],
		], undefined));
		IncomingResponse.addFunction('status', new $wcm.FunctionType<http.Types.IncomingResponse.Module['status']>('[method]incoming-response.status', [
			['self', new $wcm.BorrowType<http.Types.IncomingResponse>(IncomingResponse)],
		], StatusCode));
		IncomingResponse.addFunction('headers', new $wcm.FunctionType<http.Types.IncomingResponse.Module['headers']>('[method]incoming-response.headers', [
			['self', new $wcm.BorrowType<http.Types.IncomingResponse>(IncomingResponse)],
		], new $wcm.OwnType<http.Types.Headers>(Headers)));
		IncomingResponse.addFunction('consume', new $wcm.FunctionType<http.Types.IncomingResponse.Module['consume']>('[method]incoming-response.consume', [
			['self', new $wcm.BorrowType<http.Types.IncomingResponse>(IncomingResponse)],
		], new $wcm.ResultType<own<http.Types.IncomingBody>, void>(new $wcm.OwnType<http.Types.IncomingBody>(IncomingBody), undefined)));
		IncomingBody.addFunction('stream', new $wcm.FunctionType<http.Types.IncomingBody.Module['stream']>('[method]incoming-body.stream', [
			['self', new $wcm.BorrowType<http.Types.IncomingBody>(IncomingBody)],
		], new $wcm.ResultType<own<http.Types.InputStream>, void>(new $wcm.OwnType<http.Types.InputStream>(InputStream), undefined)));
		IncomingBody.addFunction('finish', new $wcm.FunctionType<http.Types.IncomingBody.Module['finish']>('[static]incoming-body.finish', [
			['this_', new $wcm.OwnType<http.Types.IncomingBody>(IncomingBody)],
		], new $wcm.OwnType<http.Types.FutureTrailers>(FutureTrailers)));
		FutureTrailers.addFunction('subscribe', new $wcm.FunctionType<http.Types.FutureTrailers.Module['subscribe']>('[method]future-trailers.subscribe', [
			['self', new $wcm.BorrowType<http.Types.FutureTrailers>(FutureTrailers)],
		], new $wcm.OwnType<http.Types.Pollable>(Pollable)));
		FutureTrailers.addFunction('get', new $wcm.FunctionType<http.Types.FutureTrailers.Module['get']>('[method]future-trailers.get', [
			['self', new $wcm.BorrowType<http.Types.FutureTrailers>(FutureTrailers)],
		], new $wcm.OptionType<result<option<own<http.Types.Trailers>>, http.Types.ErrorCode>>(new $wcm.ResultType<option<own<http.Types.Trailers>>, http.Types.ErrorCode>(new $wcm.OptionType<own<http.Types.Trailers>>(new $wcm.OwnType<http.Types.Trailers>(Trailers)), ErrorCode))));
		OutgoingResponse.addFunction('constructor', new $wcm.FunctionType<http.Types.OutgoingResponse.Module['constructor']>('[constructor]outgoing-response', [
			['headers', new $wcm.OwnType<http.Types.Headers>(Headers)],
		], new $wcm.OwnType<http.Types.OutgoingResponse>(OutgoingResponse)));
		OutgoingResponse.addFunction('statusCode', new $wcm.FunctionType<http.Types.OutgoingResponse.Module['statusCode']>('[method]outgoing-response.status-code', [
			['self', new $wcm.BorrowType<http.Types.OutgoingResponse>(OutgoingResponse)],
		], StatusCode));
		OutgoingResponse.addFunction('setStatusCode', new $wcm.FunctionType<http.Types.OutgoingResponse.Module['setStatusCode']>('[method]outgoing-response.set-status-code', [
			['self', new $wcm.BorrowType<http.Types.OutgoingResponse>(OutgoingResponse)],
			['statusCode', StatusCode],
		], new $wcm.ResultType<void, void>(undefined, undefined)));
		OutgoingResponse.addFunction('headers', new $wcm.FunctionType<http.Types.OutgoingResponse.Module['headers']>('[method]outgoing-response.headers', [
			['self', new $wcm.BorrowType<http.Types.OutgoingResponse>(OutgoingResponse)],
		], new $wcm.OwnType<http.Types.Headers>(Headers)));
		OutgoingResponse.addFunction('body', new $wcm.FunctionType<http.Types.OutgoingResponse.Module['body']>('[method]outgoing-response.body', [
			['self', new $wcm.BorrowType<http.Types.OutgoingResponse>(OutgoingResponse)],
		], new $wcm.ResultType<own<http.Types.OutgoingBody>, void>(new $wcm.OwnType<http.Types.OutgoingBody>(OutgoingBody), undefined)));
		OutgoingBody.addFunction('write', new $wcm.FunctionType<http.Types.OutgoingBody.Module['write']>('[method]outgoing-body.write', [
			['self', new $wcm.BorrowType<http.Types.OutgoingBody>(OutgoingBody)],
		], new $wcm.ResultType<own<http.Types.OutputStream>, void>(new $wcm.OwnType<http.Types.OutputStream>(OutputStream), undefined)));
		OutgoingBody.addFunction('finish', new $wcm.FunctionType<http.Types.OutgoingBody.Module['finish']>('[static]outgoing-body.finish', [
			['this_', new $wcm.OwnType<http.Types.OutgoingBody>(OutgoingBody)],
			['trailers', new $wcm.OptionType<own<http.Types.Trailers>>(new $wcm.OwnType<http.Types.Trailers>(Trailers))],
		], undefined));
		FutureIncomingResponse.addFunction('subscribe', new $wcm.FunctionType<http.Types.FutureIncomingResponse.Module['subscribe']>('[method]future-incoming-response.subscribe', [
			['self', new $wcm.BorrowType<http.Types.FutureIncomingResponse>(FutureIncomingResponse)],
		], new $wcm.OwnType<http.Types.Pollable>(Pollable)));
		FutureIncomingResponse.addFunction('get', new $wcm.FunctionType<http.Types.FutureIncomingResponse.Module['get']>('[method]future-incoming-response.get', [
			['self', new $wcm.BorrowType<http.Types.FutureIncomingResponse>(FutureIncomingResponse)],
		], new $wcm.OptionType<result<result<own<http.Types.IncomingResponse>, http.Types.ErrorCode>, void>>(new $wcm.ResultType<result<own<http.Types.IncomingResponse>, http.Types.ErrorCode>, void>(new $wcm.ResultType<own<http.Types.IncomingResponse>, http.Types.ErrorCode>(new $wcm.OwnType<http.Types.IncomingResponse>(IncomingResponse), ErrorCode), undefined))));
		export const httpErrorCode = new $wcm.FunctionType<http.Types.httpErrorCode>('http-error-code',[
			['err', new $wcm.BorrowType<http.Types.StreamError>(StreamError)],
		], new $wcm.OptionType<http.Types.ErrorCode>(ErrorCode));
	}
	export namespace Types._ {
		export const id = 'wasi:http/types' as const;
		export const witName = 'types' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['Duration', $.Duration],
			['InputStream', $.InputStream],
			['OutputStream', $.OutputStream],
			['StreamError', $.StreamError],
			['Pollable', $.Pollable],
			['Method', $.Method],
			['Scheme', $.Scheme],
			['DNSErrorPayload', $.DNSErrorPayload],
			['TLSAlertReceivedPayload', $.TLSAlertReceivedPayload],
			['FieldSizePayload', $.FieldSizePayload],
			['ErrorCode', $.ErrorCode],
			['HeaderError', $.HeaderError],
			['FieldKey', $.FieldKey],
			['FieldValue', $.FieldValue],
			['Headers', $.Headers],
			['Trailers', $.Trailers],
			['StatusCode', $.StatusCode],
			['Fields', $.Fields],
			['IncomingRequest', $.IncomingRequest],
			['OutgoingRequest', $.OutgoingRequest],
			['RequestOptions', $.RequestOptions],
			['ResponseOutparam', $.ResponseOutparam],
			['IncomingResponse', $.IncomingResponse],
			['IncomingBody', $.IncomingBody],
			['FutureTrailers', $.FutureTrailers],
			['OutgoingResponse', $.OutgoingResponse],
			['OutgoingBody', $.OutgoingBody],
			['FutureIncomingResponse', $.FutureIncomingResponse]
		]);
		export const functions: Map<string, $wcm.FunctionType<$wcm.ServiceFunction>> = new Map([
			['httpErrorCode', $.httpErrorCode]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map([
			['Fields', $.Fields],
			['IncomingRequest', $.IncomingRequest],
			['OutgoingRequest', $.OutgoingRequest],
			['RequestOptions', $.RequestOptions],
			['ResponseOutparam', $.ResponseOutparam],
			['IncomingResponse', $.IncomingResponse],
			['IncomingBody', $.IncomingBody],
			['FutureTrailers', $.FutureTrailers],
			['OutgoingResponse', $.OutgoingResponse],
			['OutgoingBody', $.OutgoingBody],
			['FutureIncomingResponse', $.FutureIncomingResponse]
		]);
		export namespace Fields {
			export type WasmInterface = {
				'[constructor]fields': () => i32;
				'[static]fields.from-list': (entries_ptr: i32, entries_len: i32, result: ptr<[i32, i32]>) => void;
				'[method]fields.get': (self: i32, name_ptr: i32, name_len: i32, result: ptr<[i32, i32]>) => void;
				'[method]fields.set': (self: i32, name_ptr: i32, name_len: i32, value_ptr: i32, value_len: i32, result: ptr<[i32, i32]>) => void;
				'[method]fields.delete': (self: i32, name_ptr: i32, name_len: i32, result: ptr<[i32, i32]>) => void;
				'[method]fields.append': (self: i32, name_ptr: i32, name_len: i32, value_ptr: i32, value_len: i32, result: ptr<[i32, i32]>) => void;
				'[method]fields.entries': (self: i32, result: ptr<[i32, i32]>) => void;
				'[method]fields.clone': (self: i32) => i32;
			};
		}
		export namespace IncomingRequest {
			export type WasmInterface = {
				'[method]incoming-request.method': (self: i32, result: ptr<[i32, i32, i32]>) => void;
				'[method]incoming-request.path-with-query': (self: i32, result: ptr<[i32, i32, i32]>) => void;
				'[method]incoming-request.scheme': (self: i32, result: ptr<[i32, i32, i32, i32]>) => void;
				'[method]incoming-request.authority': (self: i32, result: ptr<[i32, i32, i32]>) => void;
				'[method]incoming-request.headers': (self: i32) => i32;
				'[method]incoming-request.consume': (self: i32, result: ptr<[i32, i32]>) => void;
			};
		}
		export namespace OutgoingRequest {
			export type WasmInterface = {
				'[constructor]outgoing-request': (headers: i32) => i32;
				'[method]outgoing-request.body': (self: i32, result: ptr<[i32, i32]>) => void;
				'[method]outgoing-request.method': (self: i32, result: ptr<[i32, i32, i32]>) => void;
				'[method]outgoing-request.set-method': (self: i32, method_case: i32, method_0: i32, method_1: i32) => i32;
				'[method]outgoing-request.path-with-query': (self: i32, result: ptr<[i32, i32, i32]>) => void;
				'[method]outgoing-request.set-path-with-query': (self: i32, pathWithQuery_case: i32, pathWithQuery_option_ptr: i32, pathWithQuery_option_len: i32) => i32;
				'[method]outgoing-request.scheme': (self: i32, result: ptr<[i32, i32, i32, i32]>) => void;
				'[method]outgoing-request.set-scheme': (self: i32, scheme_case: i32, scheme_option_case: i32, scheme_option_0: i32, scheme_option_1: i32) => i32;
				'[method]outgoing-request.authority': (self: i32, result: ptr<[i32, i32, i32]>) => void;
				'[method]outgoing-request.set-authority': (self: i32, authority_case: i32, authority_option_ptr: i32, authority_option_len: i32) => i32;
				'[method]outgoing-request.headers': (self: i32) => i32;
			};
		}
		export namespace RequestOptions {
			export type WasmInterface = {
				'[constructor]request-options': () => i32;
				'[method]request-options.connect-timeout-ms': (self: i32, result: ptr<[i32, i64]>) => void;
				'[method]request-options.set-connect-timeout-ms': (self: i32, ms_case: i32, ms_option_Duration: i64) => i32;
				'[method]request-options.first-byte-timeout-ms': (self: i32, result: ptr<[i32, i64]>) => void;
				'[method]request-options.set-first-byte-timeout-ms': (self: i32, ms_case: i32, ms_option_Duration: i64) => i32;
				'[method]request-options.between-bytes-timeout-ms': (self: i32, result: ptr<[i32, i64]>) => void;
				'[method]request-options.set-between-bytes-timeout-ms': (self: i32, ms_case: i32, ms_option_Duration: i64) => i32;
			};
		}
		export namespace ResponseOutparam {
			export type WasmInterface = {
				'[static]response-outparam.set': (param: i32, response_case: i32, response_0: i32, response_1: i32, response_2: i64, response_3: i32, response_4: i32, response_5: i32, response_6: i32) => void;
			};
		}
		export namespace IncomingResponse {
			export type WasmInterface = {
				'[method]incoming-response.status': (self: i32) => i32;
				'[method]incoming-response.headers': (self: i32) => i32;
				'[method]incoming-response.consume': (self: i32, result: ptr<[i32, i32]>) => void;
			};
		}
		export namespace IncomingBody {
			export type WasmInterface = {
				'[method]incoming-body.stream': (self: i32, result: ptr<[i32, i32]>) => void;
				'[static]incoming-body.finish': (this_: i32) => i32;
			};
		}
		export namespace FutureTrailers {
			export type WasmInterface = {
				'[method]future-trailers.subscribe': (self: i32) => i32;
				'[method]future-trailers.get': (self: i32, result: ptr<[i32, i32, i32, i32, i64, i32, i32, i32, i32]>) => void;
			};
		}
		export namespace OutgoingResponse {
			export type WasmInterface = {
				'[constructor]outgoing-response': (headers: i32) => i32;
				'[method]outgoing-response.status-code': (self: i32) => i32;
				'[method]outgoing-response.set-status-code': (self: i32, statusCode: i32) => i32;
				'[method]outgoing-response.headers': (self: i32) => i32;
				'[method]outgoing-response.body': (self: i32, result: ptr<[i32, i32]>) => void;
			};
		}
		export namespace OutgoingBody {
			export type WasmInterface = {
				'[method]outgoing-body.write': (self: i32, result: ptr<[i32, i32]>) => void;
				'[static]outgoing-body.finish': (this_: i32, trailers_case: i32, trailers_option: i32) => void;
			};
		}
		export namespace FutureIncomingResponse {
			export type WasmInterface = {
				'[method]future-incoming-response.subscribe': (self: i32) => i32;
				'[method]future-incoming-response.get': (self: i32, result: ptr<[i32, i32, i32, i32, i32, i64, i32, i32, i32, i32]>) => void;
			};
		}
		export type WasmInterface = {
			'http-error-code': (err: i32, result: ptr<[i32, i32, i32, i64, i32, i32, i32, i32]>) => void;
		} & Fields.WasmInterface & IncomingRequest.WasmInterface & OutgoingRequest.WasmInterface & RequestOptions.WasmInterface & ResponseOutparam.WasmInterface & IncomingResponse.WasmInterface & IncomingBody.WasmInterface & FutureTrailers.WasmInterface & OutgoingResponse.WasmInterface & OutgoingBody.WasmInterface & FutureIncomingResponse.WasmInterface;
		export namespace Fields  {
			export function Module(wasmInterface: WasmInterface, context: $wcm.Context): http.Types.Fields.Module {
				return $wcm.Module.create<http.Types.Fields.Module>($.Fields, wasmInterface, context);
			}
			class Impl implements http.Types.Fields.Interface {
				private readonly _handle: http.Types.Fields;
				private readonly _module: http.Types.Fields.Module;
				constructor(module: http.Types.Fields.Module) {
					this._module = module;
					this._handle = module.constructor();
				}
				public get(name: FieldKey): FieldValue[] {
					return this._module.get(this._handle, name);
				}
				public set(name: FieldKey, value: FieldValue[]): result<void, HeaderError> {
					return this._module.set(this._handle, name, value);
				}
				public delete_(name: FieldKey): result<void, HeaderError> {
					return this._module.delete_(this._handle, name);
				}
				public append(name: FieldKey, value: FieldValue): result<void, HeaderError> {
					return this._module.append(this._handle, name, value);
				}
				public entries(): [FieldKey, FieldValue][] {
					return this._module.entries(this._handle);
				}
				public clone(): own<Fields> {
					return this._module.clone(this._handle);
				}
			}
			export function Class(wasmInterface: WasmInterface, context: $wcm.Context): http.Types.Fields.Constructor {
				const module = Module(wasmInterface, context);
				return class extends Impl {
					constructor() {
						super(module);
					}
					static fromList(entries: [FieldKey, FieldValue][]): result<own<Fields>, HeaderError> {
						return module.fromList(entries);
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
				constructor(headers: own<Headers>, module: http.Types.OutgoingRequest.Module) {
					this._module = module;
					this._handle = module.constructor(headers);
				}
				public body(): result<own<OutgoingBody>, void> {
					return this._module.body(this._handle);
				}
				public method(): Method {
					return this._module.method(this._handle);
				}
				public setMethod(method: Method): result<void, void> {
					return this._module.setMethod(this._handle, method);
				}
				public pathWithQuery(): string | undefined {
					return this._module.pathWithQuery(this._handle);
				}
				public setPathWithQuery(pathWithQuery: string | undefined): result<void, void> {
					return this._module.setPathWithQuery(this._handle, pathWithQuery);
				}
				public scheme(): Scheme | undefined {
					return this._module.scheme(this._handle);
				}
				public setScheme(scheme: Scheme | undefined): result<void, void> {
					return this._module.setScheme(this._handle, scheme);
				}
				public authority(): string | undefined {
					return this._module.authority(this._handle);
				}
				public setAuthority(authority: string | undefined): result<void, void> {
					return this._module.setAuthority(this._handle, authority);
				}
				public headers(): own<Headers> {
					return this._module.headers(this._handle);
				}
			}
			export function Class(wasmInterface: WasmInterface, context: $wcm.Context): http.Types.OutgoingRequest.Constructor {
				const module = Module(wasmInterface, context);
				return class extends Impl {
					constructor(headers: own<Headers>) {
						super(headers, module);
					}
				};
			}
			export function Manager(): http.Types.OutgoingRequest.Manager {
				return new $wcm.ResourceManager<http.Types.OutgoingRequest.Interface>();
			}
		}
		export namespace RequestOptions  {
			export function Module(wasmInterface: WasmInterface, context: $wcm.Context): http.Types.RequestOptions.Module {
				return $wcm.Module.create<http.Types.RequestOptions.Module>($.RequestOptions, wasmInterface, context);
			}
			class Impl implements http.Types.RequestOptions.Interface {
				private readonly _handle: http.Types.RequestOptions;
				private readonly _module: http.Types.RequestOptions.Module;
				constructor(module: http.Types.RequestOptions.Module) {
					this._module = module;
					this._handle = module.constructor();
				}
				public connectTimeoutMs(): Duration | undefined {
					return this._module.connectTimeoutMs(this._handle);
				}
				public setConnectTimeoutMs(ms: Duration | undefined): result<void, void> {
					return this._module.setConnectTimeoutMs(this._handle, ms);
				}
				public firstByteTimeoutMs(): Duration | undefined {
					return this._module.firstByteTimeoutMs(this._handle);
				}
				public setFirstByteTimeoutMs(ms: Duration | undefined): result<void, void> {
					return this._module.setFirstByteTimeoutMs(this._handle, ms);
				}
				public betweenBytesTimeoutMs(): Duration | undefined {
					return this._module.betweenBytesTimeoutMs(this._handle);
				}
				public setBetweenBytesTimeoutMs(ms: Duration | undefined): result<void, void> {
					return this._module.setBetweenBytesTimeoutMs(this._handle, ms);
				}
			}
			export function Class(wasmInterface: WasmInterface, context: $wcm.Context): http.Types.RequestOptions.Constructor {
				const module = Module(wasmInterface, context);
				return class extends Impl {
					constructor() {
						super(module);
					}
				};
			}
			export function Manager(): http.Types.RequestOptions.Manager {
				return new $wcm.ResourceManager<http.Types.RequestOptions.Interface>();
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
				constructor(headers: own<Headers>, module: http.Types.OutgoingResponse.Module) {
					this._module = module;
					this._handle = module.constructor(headers);
				}
				public statusCode(): StatusCode {
					return this._module.statusCode(this._handle);
				}
				public setStatusCode(statusCode: StatusCode): result<void, void> {
					return this._module.setStatusCode(this._handle, statusCode);
				}
				public headers(): own<Headers> {
					return this._module.headers(this._handle);
				}
				public body(): result<own<OutgoingBody>, void> {
					return this._module.body(this._handle);
				}
			}
			export function Class(wasmInterface: WasmInterface, context: $wcm.Context): http.Types.OutgoingResponse.Constructor {
				const module = Module(wasmInterface, context);
				return class extends Impl {
					constructor(headers: own<Headers>) {
						super(headers, module);
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
		export type ClassService = http.Types<http.Types.Fields.Constructor, http.Types.IncomingRequest.Manager, http.Types.OutgoingRequest.Constructor, http.Types.RequestOptions.Constructor, http.Types.ResponseOutparam.Manager, http.Types.IncomingResponse.Manager, http.Types.IncomingBody.Manager, http.Types.FutureTrailers.Manager, http.Types.OutgoingResponse.Constructor, http.Types.OutgoingBody.Manager, http.Types.FutureIncomingResponse.Manager>;
		export type ModuleService = http.Types<http.Types.Fields.Module, http.Types.IncomingRequest.Module, http.Types.OutgoingRequest.Module, http.Types.RequestOptions.Module, http.Types.ResponseOutparam.Module, http.Types.IncomingResponse.Module, http.Types.IncomingBody.Module, http.Types.FutureTrailers.Module, http.Types.OutgoingResponse.Module, http.Types.OutgoingBody.Module, http.Types.FutureIncomingResponse.Module>;
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind?: $wcm.ResourceKind.class): ClassService;
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind: $wcm.ResourceKind.module): ModuleService;
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind: $wcm.ResourceKind): http.Types;
		export function createService<F extends http.Types.Fields.Module | http.Types.Fields.Constructor | http.Types.Fields.Manager, IR extends http.Types.IncomingRequest.Module | http.Types.IncomingRequest.Manager, OR extends http.Types.OutgoingRequest.Module | http.Types.OutgoingRequest.Constructor | http.Types.OutgoingRequest.Manager, RO extends http.Types.RequestOptions.Module | http.Types.RequestOptions.Constructor | http.Types.RequestOptions.Manager, RO1 extends http.Types.ResponseOutparam.Module | http.Types.ResponseOutparam.Manager, IR1 extends http.Types.IncomingResponse.Module | http.Types.IncomingResponse.Manager, IB extends http.Types.IncomingBody.Module | http.Types.IncomingBody.Manager, FT extends http.Types.FutureTrailers.Module | http.Types.FutureTrailers.Manager, OR1 extends http.Types.OutgoingResponse.Module | http.Types.OutgoingResponse.Constructor | http.Types.OutgoingResponse.Manager, OB extends http.Types.OutgoingBody.Module | http.Types.OutgoingBody.Manager, FIR extends http.Types.FutureIncomingResponse.Module | http.Types.FutureIncomingResponse.Manager>(wasmInterface: WasmInterface, context: $wcm.Context, f: $wcm.ResourceTag<F>, ir: $wcm.ResourceTag<IR>, or: $wcm.ResourceTag<OR>, ro: $wcm.ResourceTag<RO>, ro1: $wcm.ResourceTag<RO1>, ir1: $wcm.ResourceTag<IR1>, ib: $wcm.ResourceTag<IB>, ft: $wcm.ResourceTag<FT>, or1: $wcm.ResourceTag<OR1>, ob: $wcm.ResourceTag<OB>, fir: $wcm.ResourceTag<FIR>): http.Types<F, IR, OR, RO, RO1, IR1, IB, FT, OR1, OB, FIR>;
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, f?: $wcm.ResourceTag<any> | $wcm.ResourceKind, ir?: $wcm.ResourceTag<any>, or?: $wcm.ResourceTag<any>, ro?: $wcm.ResourceTag<any>, ro1?: $wcm.ResourceTag<any>, ir1?: $wcm.ResourceTag<any>, ib?: $wcm.ResourceTag<any>, ft?: $wcm.ResourceTag<any>, or1?: $wcm.ResourceTag<any>, ob?: $wcm.ResourceTag<any>, fir?: $wcm.ResourceTag<any>): http.Types {
			f = f ?? $wcm.ResourceKind.class;
			if (f === $wcm.ResourceKind.class) {
				return $wcm.Service.create<ClassService>(functions, [['Fields', $.Fields, Fields.Class], ['IncomingRequest', $.IncomingRequest, IncomingRequest.Manager], ['OutgoingRequest', $.OutgoingRequest, OutgoingRequest.Class], ['RequestOptions', $.RequestOptions, RequestOptions.Class], ['ResponseOutparam', $.ResponseOutparam, ResponseOutparam.Manager], ['IncomingResponse', $.IncomingResponse, IncomingResponse.Manager], ['IncomingBody', $.IncomingBody, IncomingBody.Manager], ['FutureTrailers', $.FutureTrailers, FutureTrailers.Manager], ['OutgoingResponse', $.OutgoingResponse, OutgoingResponse.Class], ['OutgoingBody', $.OutgoingBody, OutgoingBody.Manager], ['FutureIncomingResponse', $.FutureIncomingResponse, FutureIncomingResponse.Manager]], wasmInterface, context);
			} else if (f === $wcm.ResourceKind.module) {
				return $wcm.Service.create<ModuleService>(functions, [['Fields', $.Fields, Fields.Module], ['IncomingRequest', $.IncomingRequest, IncomingRequest.Module], ['OutgoingRequest', $.OutgoingRequest, OutgoingRequest.Module], ['RequestOptions', $.RequestOptions, RequestOptions.Module], ['ResponseOutparam', $.ResponseOutparam, ResponseOutparam.Module], ['IncomingResponse', $.IncomingResponse, IncomingResponse.Module], ['IncomingBody', $.IncomingBody, IncomingBody.Module], ['FutureTrailers', $.FutureTrailers, FutureTrailers.Module], ['OutgoingResponse', $.OutgoingResponse, OutgoingResponse.Module], ['OutgoingBody', $.OutgoingBody, OutgoingBody.Module], ['FutureIncomingResponse', $.FutureIncomingResponse, FutureIncomingResponse.Module]], wasmInterface, context);
			} else {
				return $wcm.Service.create<http.Types>(functions, [['Fields', $.Fields, f!], ['IncomingRequest', $.IncomingRequest, ir!], ['OutgoingRequest', $.OutgoingRequest, or!], ['RequestOptions', $.RequestOptions, ro!], ['ResponseOutparam', $.ResponseOutparam, ro1!], ['IncomingResponse', $.IncomingResponse, ir1!], ['IncomingBody', $.IncomingBody, ib!], ['FutureTrailers', $.FutureTrailers, ft!], ['OutgoingResponse', $.OutgoingResponse, or1!], ['OutgoingBody', $.OutgoingBody, ob!], ['FutureIncomingResponse', $.FutureIncomingResponse, fir!]], wasmInterface, context);
			}
		}
	}
	
	export namespace IncomingHandler.$ {
		export const IncomingRequest = http.Types.$.IncomingRequest;
		export const ResponseOutparam = http.Types.$.ResponseOutparam;
		export const handle = new $wcm.FunctionType<http.IncomingHandler.handle>('handle',[
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
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, _kind?: $wcm.ResourceKind): http.IncomingHandler {
			return $wcm.Service.create<http.IncomingHandler>(functions, [], wasmInterface, context);
		}
	}
	
	export namespace OutgoingHandler.$ {
		export const OutgoingRequest = http.Types.$.OutgoingRequest;
		export const RequestOptions = http.Types.$.RequestOptions;
		export const FutureIncomingResponse = http.Types.$.FutureIncomingResponse;
		export const ErrorCode = http.Types.$.ErrorCode;
		export const handle = new $wcm.FunctionType<http.OutgoingHandler.handle>('handle',[
			['request', new $wcm.OwnType<http.OutgoingHandler.OutgoingRequest>(OutgoingRequest)],
			['options', new $wcm.OptionType<own<http.OutgoingHandler.RequestOptions>>(new $wcm.OwnType<http.OutgoingHandler.RequestOptions>(RequestOptions))],
		], new $wcm.ResultType<own<http.OutgoingHandler.FutureIncomingResponse>, http.OutgoingHandler.ErrorCode>(new $wcm.OwnType<http.OutgoingHandler.FutureIncomingResponse>(FutureIncomingResponse), ErrorCode));
	}
	export namespace OutgoingHandler._ {
		export const id = 'wasi:http/outgoing-handler' as const;
		export const witName = 'outgoing-handler' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['OutgoingRequest', $.OutgoingRequest],
			['RequestOptions', $.RequestOptions],
			['FutureIncomingResponse', $.FutureIncomingResponse],
			['ErrorCode', $.ErrorCode]
		]);
		export const functions: Map<string, $wcm.FunctionType<$wcm.ServiceFunction>> = new Map([
			['handle', $.handle]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map([
		]);
		export type WasmInterface = {
			'handle': (request: i32, options_case: i32, options_option: i32, result: ptr<[i32, i32, i32, i64, i32, i32, i32, i32]>) => void;
		};
		export function createHost(service: http.OutgoingHandler, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, _kind?: $wcm.ResourceKind): http.OutgoingHandler {
			return $wcm.Service.create<http.OutgoingHandler>(functions, [], wasmInterface, context);
		}
	}
}

export namespace http._ {
	export const id = 'wasi:http' as const;
	export const witName = 'http' as const;
	export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
		['Types', Types._],
		['IncomingHandler', IncomingHandler._],
		['OutgoingHandler', OutgoingHandler._]
	]);
	export type WasmInterface = {
		'wasi:http/types'?: Types._.WasmInterface;
		'wasi:http/incoming-handler'?: IncomingHandler._.WasmInterface;
		'wasi:http/outgoing-handler'?: OutgoingHandler._.WasmInterface;
	};
	export function createHost(service: http, context: $wcm.Context): WasmInterface {
		const result: WasmInterface = Object.create(null);
		if (service.Types !== undefined) {
			result['wasi:http/types'] = Types._.createHost(service.Types, context);
		}
		if (service.IncomingHandler !== undefined) {
			result['wasi:http/incoming-handler'] = IncomingHandler._.createHost(service.IncomingHandler, context);
		}
		if (service.OutgoingHandler !== undefined) {
			result['wasi:http/outgoing-handler'] = OutgoingHandler._.createHost(service.OutgoingHandler, context);
		}
		return result;
	}
	export type ClassService = http<http.Types._.ClassService>;
	export type ModuleService = http<http.Types._.ModuleService>;
	export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind?: $wcm.ResourceKind.class): ClassService;
	export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind: $wcm.ResourceKind.module): ModuleService;
	export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind: $wcm.ResourceKind): http;
	export function createService<T extends http.Types>(wasmInterface: WasmInterface, context: $wcm.Context, t: http.Types): http<T>;
	export function createService(wasmInterface: WasmInterface, context: $wcm.Context, t?: http.Types | $wcm.ResourceKind): http {
		const result: http = Object.create(null);
		t = t ?? $wcm.ResourceKind.class;
		if (t === $wcm.ResourceKind.class || t === $wcm.ResourceKind.module) {
			if (wasmInterface['wasi:http/types'] !== undefined) {
				result.Types = Types._.createService(wasmInterface['wasi:http/types'], context, t);
			}
			if (wasmInterface['wasi:http/incoming-handler'] !== undefined) {
				result.IncomingHandler = IncomingHandler._.createService(wasmInterface['wasi:http/incoming-handler'], context, t);
			}
			if (wasmInterface['wasi:http/outgoing-handler'] !== undefined) {
				result.OutgoingHandler = OutgoingHandler._.createService(wasmInterface['wasi:http/outgoing-handler'], context, t);
			}
		} else {
			if (wasmInterface['wasi:http/types'] !== undefined) {
				result.Types = t;
			}
			if (wasmInterface['wasi:http/incoming-handler'] !== undefined) {
				result.IncomingHandler = IncomingHandler._.createService(wasmInterface['wasi:http/incoming-handler'], context);
			}
			if (wasmInterface['wasi:http/outgoing-handler'] !== undefined) {
				result.OutgoingHandler = OutgoingHandler._.createService(wasmInterface['wasi:http/outgoing-handler'], context);
			}
		}
		return result;
	}
}
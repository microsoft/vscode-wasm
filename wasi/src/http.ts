/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/* eslint-disable @typescript-eslint/ban-types */
import * as $wcm from '@vscode/wasm-component-model';
import type { u16, u8, u32, u64, result, own, borrow, option, i32, ptr, i64 } from '@vscode/wasm-component-model';
import { cli } from './cli';
import { random } from './random';
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

		export type IoError = io.Error.Error;

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

			export const delete_ = 'delete' as const;
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
			export interface Interface extends $wcm.Resource {
				/**
				 * Get all of the values corresponding to a key. If the key is not present
				 * in this `fields`, an empty list is returned. However, if the key is
				 * present but empty, this is represented by a list with one or more
				 * empty field-values present.
				 */
				get(name: FieldKey): FieldValue[];

				/**
				 * Returns `true` when the key is present in this `fields`. If the key is
				 * syntactically invalid, `false` is returned.
				 */
				has(name: FieldKey): boolean;

				/**
				 * Set all of the values for a key. Clears any existing values for that
				 * key, if they have been set.
				 * 
				 * Fails with `header-error.immutable` if the `fields` are immutable.
				 */
				set(name: FieldKey, value: FieldValue[]): result<void, HeaderError>;

				/**
				 * Delete all values for a key. Does nothing if no values for the key
				 * exist.
				 * 
				 * Fails with `header-error.immutable` if the `fields` are immutable.
				 */
				delete(name: FieldKey): result<void, HeaderError>;

				/**
				 * Append a value for a key. Does not change or delete any existing
				 * values for that key.
				 * 
				 * Fails with `header-error.immutable` if the `fields` are immutable.
				 */
				append(name: FieldKey, value: FieldValue): result<void, HeaderError>;

				/**
				 * Retrieve the full set of keys and values in the Fields. Like the
				 * constructor, the list represents each key-value pair.
				 * 
				 * The outer list represents each key-value pair in the Fields. Keys
				 * which have multiple values are represented by multiple entries in this
				 * list with the same key.
				 */
				entries(): [FieldKey, FieldValue][];

				/**
				 * Make a deep copy of the Fields. Equivelant in behavior to calling the
				 * `fields` constructor on the return value of `entries`. The resulting
				 * `fields` is mutable.
				 */
				clone(): own<Fields>;
			}
			export type Statics = {
				$new?(): Interface;
				fromList(entries: [FieldKey, FieldValue][]): result<own<Fields>, HeaderError>;
			};
			export type Class = Statics & {
				new(): Interface;
			};
		}
		export type Fields = Fields.Interface;

		export namespace IncomingRequest {
			export interface Interface extends $wcm.Resource {
				/**
				 * Returns the method of the incoming request.
				 */
				method(): Method;

				/**
				 * Returns the path with query parameters from the request, as a string.
				 */
				pathWithQuery(): string | undefined;

				/**
				 * Returns the protocol scheme from the request.
				 */
				scheme(): Scheme | undefined;

				/**
				 * Returns the authority from the request, if it was present.
				 */
				authority(): string | undefined;

				/**
				 * Get the `headers` associated with the request.
				 * 
				 * The returned `headers` resource is immutable: `set`, `append`, and
				 * `delete` operations will fail with `header-error.immutable`.
				 * 
				 * The `headers` returned are a child resource: it must be dropped before
				 * the parent `incoming-request` is dropped. Dropping this
				 * `incoming-request` before all children are dropped will trap.
				 */
				headers(): own<Headers>;

				/**
				 * Gives the `incoming-body` associated with this request. Will only
				 * return success at most once, and subsequent calls will return error.
				 */
				consume(): result<own<IncomingBody>, void>;
			}
			export type Statics = {
			};
			export type Class = Statics & {
			};
		}
		export type IncomingRequest = IncomingRequest.Interface;

		export namespace OutgoingRequest {
			export interface Interface extends $wcm.Resource {
				/**
				 * Returns the resource corresponding to the outgoing Body for this
				 * Request.
				 * 
				 * Returns success on the first call: the `outgoing-body` resource for
				 * this `outgoing-request` can be retrieved at most once. Subsequent
				 * calls will return error.
				 */
				body(): result<own<OutgoingBody>, void>;

				/**
				 * Get the Method for the Request.
				 */
				method(): Method;

				/**
				 * Set the Method for the Request. Fails if the string present in a
				 * `method.other` argument is not a syntactically valid method.
				 */
				setMethod(method: Method): result<void, void>;

				/**
				 * Get the combination of the HTTP Path and Query for the Request.
				 * When `none`, this represents an empty Path and empty Query.
				 */
				pathWithQuery(): string | undefined;

				/**
				 * Set the combination of the HTTP Path and Query for the Request.
				 * When `none`, this represents an empty Path and empty Query. Fails is the
				 * string given is not a syntactically valid path and query uri component.
				 */
				setPathWithQuery(pathWithQuery: string | undefined): result<void, void>;

				/**
				 * Get the HTTP Related Scheme for the Request. When `none`, the
				 * implementation may choose an appropriate default scheme.
				 */
				scheme(): Scheme | undefined;

				/**
				 * Set the HTTP Related Scheme for the Request. When `none`, the
				 * implementation may choose an appropriate default scheme. Fails if the
				 * string given is not a syntactically valid uri scheme.
				 */
				setScheme(scheme: Scheme | undefined): result<void, void>;

				/**
				 * Get the HTTP Authority for the Request. A value of `none` may be used
				 * with Related Schemes which do not require an Authority. The HTTP and
				 * HTTPS schemes always require an authority.
				 */
				authority(): string | undefined;

				/**
				 * Set the HTTP Authority for the Request. A value of `none` may be used
				 * with Related Schemes which do not require an Authority. The HTTP and
				 * HTTPS schemes always require an authority. Fails if the string given is
				 * not a syntactically valid uri authority.
				 */
				setAuthority(authority: string | undefined): result<void, void>;

				/**
				 * Get the headers associated with the Request.
				 * 
				 * The returned `headers` resource is immutable: `set`, `append`, and
				 * `delete` operations will fail with `header-error.immutable`.
				 * 
				 * This headers resource is a child: it must be dropped before the parent
				 * `outgoing-request` is dropped, or its ownership is transfered to
				 * another component by e.g. `outgoing-handler.handle`.
				 */
				headers(): own<Headers>;
			}
			export type Statics = {
				$new?(headers: own<Headers>): Interface;
			};
			export type Class = Statics & {
				new(headers: own<Headers>): Interface;
			};
		}
		export type OutgoingRequest = OutgoingRequest.Interface;

		export namespace RequestOptions {
			export interface Interface extends $wcm.Resource {
				/**
				 * The timeout for the initial connect to the HTTP Server.
				 */
				connectTimeout(): Duration | undefined;

				/**
				 * Set the timeout for the initial connect to the HTTP Server. An error
				 * return value indicates that this timeout is not supported.
				 */
				setConnectTimeout(duration: Duration | undefined): result<void, void>;

				/**
				 * The timeout for receiving the first byte of the Response body.
				 */
				firstByteTimeout(): Duration | undefined;

				/**
				 * Set the timeout for receiving the first byte of the Response body. An
				 * error return value indicates that this timeout is not supported.
				 */
				setFirstByteTimeout(duration: Duration | undefined): result<void, void>;

				/**
				 * The timeout for receiving subsequent chunks of bytes in the Response
				 * body stream.
				 */
				betweenBytesTimeout(): Duration | undefined;

				/**
				 * Set the timeout for receiving subsequent chunks of bytes in the Response
				 * body stream. An error return value indicates that this timeout is not
				 * supported.
				 */
				setBetweenBytesTimeout(duration: Duration | undefined): result<void, void>;
			}
			export type Statics = {
				$new?(): Interface;
			};
			export type Class = Statics & {
				new(): Interface;
			};
		}
		export type RequestOptions = RequestOptions.Interface;

		export namespace ResponseOutparam {
			export interface Interface extends $wcm.Resource {
			}
			export type Statics = {
				set(param: own<ResponseOutparam>, response: result<own<OutgoingResponse>, ErrorCode>): void;
			};
			export type Class = Statics & {
			};
		}
		export type ResponseOutparam = ResponseOutparam.Interface;

		export namespace IncomingResponse {
			export interface Interface extends $wcm.Resource {
				/**
				 * Returns the status code from the incoming response.
				 */
				status(): StatusCode;

				/**
				 * Returns the headers from the incoming response.
				 * 
				 * The returned `headers` resource is immutable: `set`, `append`, and
				 * `delete` operations will fail with `header-error.immutable`.
				 * 
				 * This headers resource is a child: it must be dropped before the parent
				 * `incoming-response` is dropped.
				 */
				headers(): own<Headers>;

				/**
				 * Returns the incoming body. May be called at most once. Returns error
				 * if called additional times.
				 */
				consume(): result<own<IncomingBody>, void>;
			}
			export type Statics = {
			};
			export type Class = Statics & {
			};
		}
		export type IncomingResponse = IncomingResponse.Interface;

		export namespace IncomingBody {
			export interface Interface extends $wcm.Resource {
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
				stream(): result<own<InputStream>, void>;
			}
			export type Statics = {
				finish(this_: own<IncomingBody>): own<FutureTrailers>;
			};
			export type Class = Statics & {
			};
		}
		export type IncomingBody = IncomingBody.Interface;

		export namespace FutureTrailers {
			export interface Interface extends $wcm.Resource {
				/**
				 * Returns a pollable which becomes ready when either the trailers have
				 * been received, or an error has occured. When this pollable is ready,
				 * the `get` method will return `some`.
				 */
				subscribe(): own<Pollable>;

				/**
				 * Returns the contents of the trailers, or an error which occured,
				 * once the future is ready.
				 * 
				 * The outer `option` represents future readiness. Users can wait on this
				 * `option` to become `some` using the `subscribe` method.
				 * 
				 * The outer `result` is used to retrieve the trailers or error at most
				 * once. It will be success on the first call in which the outer option
				 * is `some`, and error on subsequent calls.
				 * 
				 * The inner `result` represents that either the HTTP Request or Response
				 * body, as well as any trailers, were received successfully, or that an
				 * error occured receiving them. The optional `trailers` indicates whether
				 * or not trailers were present in the body.
				 * 
				 * When some `trailers` are returned by this method, the `trailers`
				 * resource is immutable, and a child. Use of the `set`, `append`, or
				 * `delete` methods will return an error, and the resource must be
				 * dropped before the parent `future-trailers` is dropped.
				 */
				get(): result<result<own<Trailers> | undefined, ErrorCode>, void> | undefined;
			}
			export type Statics = {
			};
			export type Class = Statics & {
			};
		}
		export type FutureTrailers = FutureTrailers.Interface;

		export namespace OutgoingResponse {
			export interface Interface extends $wcm.Resource {
				/**
				 * Get the HTTP Status Code for the Response.
				 */
				statusCode(): StatusCode;

				/**
				 * Set the HTTP Status Code for the Response. Fails if the status-code
				 * given is not a valid http status code.
				 */
				setStatusCode(statusCode: StatusCode): result<void, void>;

				/**
				 * Get the headers associated with the Request.
				 * 
				 * The returned `headers` resource is immutable: `set`, `append`, and
				 * `delete` operations will fail with `header-error.immutable`.
				 * 
				 * This headers resource is a child: it must be dropped before the parent
				 * `outgoing-request` is dropped, or its ownership is transfered to
				 * another component by e.g. `outgoing-handler.handle`.
				 */
				headers(): own<Headers>;

				/**
				 * Returns the resource corresponding to the outgoing Body for this Response.
				 * 
				 * Returns success on the first call: the `outgoing-body` resource for
				 * this `outgoing-response` can be retrieved at most once. Subsequent
				 * calls will return error.
				 */
				body(): result<own<OutgoingBody>, void>;
			}
			export type Statics = {
				$new?(headers: own<Headers>): Interface;
			};
			export type Class = Statics & {
				new(headers: own<Headers>): Interface;
			};
		}
		export type OutgoingResponse = OutgoingResponse.Interface;

		export namespace OutgoingBody {
			export interface Interface extends $wcm.Resource {
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
				write(): result<own<OutputStream>, void>;
			}
			export type Statics = {
				finish(this_: own<OutgoingBody>, trailers: own<Trailers> | undefined): result<void, ErrorCode>;
			};
			export type Class = Statics & {
			};
		}
		export type OutgoingBody = OutgoingBody.Interface;

		export namespace FutureIncomingResponse {
			export interface Interface extends $wcm.Resource {
				/**
				 * Returns a pollable which becomes ready when either the Response has
				 * been received, or an error has occured. When this pollable is ready,
				 * the `get` method will return `some`.
				 */
				subscribe(): own<Pollable>;

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
				get(): result<result<own<IncomingResponse>, ErrorCode>, void> | undefined;
			}
			export type Statics = {
			};
			export type Class = Statics & {
			};
		}
		export type FutureIncomingResponse = FutureIncomingResponse.Interface;

		/**
		 * Attempts to extract a http-related `error` from the wasi:io `error`
		 * provided.
		 * 
		 * Stream operations which return
		 * `wasi:io/stream/stream-error::last-operation-failed` have a payload of
		 * type `wasi:io/error/error` with more information about the operation
		 * that failed. This payload can be passed through to this function to see
		 * if there's http-related information about the error to return.
		 * 
		 * Note that this function is fallible because not all io-errors are
		 * http-related errors.
		 */
		export type httpErrorCode = (err: borrow<IoError>) => ErrorCode | undefined;
	}
	export type Types = {
		Fields: Types.Fields.Class;
		IncomingRequest: Types.IncomingRequest.Class;
		OutgoingRequest: Types.OutgoingRequest.Class;
		RequestOptions: Types.RequestOptions.Class;
		ResponseOutparam: Types.ResponseOutparam.Class;
		IncomingResponse: Types.IncomingResponse.Class;
		IncomingBody: Types.IncomingBody.Class;
		FutureTrailers: Types.FutureTrailers.Class;
		OutgoingResponse: Types.OutgoingResponse.Class;
		OutgoingBody: Types.OutgoingBody.Class;
		FutureIncomingResponse: Types.FutureIncomingResponse.Class;
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
	export namespace proxy {
		export type Imports = {
			random: random.Random;
			error: io.Error;
			poll: io.Poll;
			streams: io.Streams;
			stdout: cli.Stdout;
			stderr: cli.Stderr;
			stdin: cli.Stdin;
			monotonicClock: clocks.MonotonicClock;
			types: http.Types;
			outgoingHandler: http.OutgoingHandler;
			wallClock: clocks.WallClock;
		};
		export namespace Imports {
			export type Promisified = $wcm.$imports.Promisify<Imports>;
		}
		export namespace imports {
			export type Promisify<T> = $wcm.$imports.Promisify<T>;
		}
		export type Exports = {
			incomingHandler: http.IncomingHandler;
		};
		export namespace Exports {
			export type Promisified = $wcm.$exports.Promisify<Exports>;
		}
		export namespace exports {
			export type Promisify<T> = $wcm.$exports.Promisify<T>;
		}
	}
}

export namespace http {
	export namespace Types.$ {
		export const Duration = clocks.MonotonicClock.$.Duration;
		export const InputStream = io.Streams.$.InputStream;
		export const OutputStream = io.Streams.$.OutputStream;
		export const IoError = io.Error.$.Error;
		export const Pollable = io.Poll.$.Pollable;
		export const Method = new $wcm.VariantType<http.Types.Method, http.Types.Method._tt, http.Types.Method._vt>([['get', undefined], ['head', undefined], ['post', undefined], ['put', undefined], ['delete', undefined], ['connect', undefined], ['options', undefined], ['trace', undefined], ['patch', undefined], ['other', $wcm.wstring]], http.Types.Method._ctor);
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
		export const Fields = new $wcm.ResourceType<http.Types.Fields>('fields', 'wasi:http@0.2.0/types/fields');
		export const Fields_Handle = new $wcm.ResourceHandleType('fields');
		export const Headers = Fields;
		export const Trailers = Fields;
		export const IncomingRequest = new $wcm.ResourceType<http.Types.IncomingRequest>('incoming-request', 'wasi:http@0.2.0/types/incoming-request');
		export const IncomingRequest_Handle = new $wcm.ResourceHandleType('incoming-request');
		export const OutgoingRequest = new $wcm.ResourceType<http.Types.OutgoingRequest>('outgoing-request', 'wasi:http@0.2.0/types/outgoing-request');
		export const OutgoingRequest_Handle = new $wcm.ResourceHandleType('outgoing-request');
		export const RequestOptions = new $wcm.ResourceType<http.Types.RequestOptions>('request-options', 'wasi:http@0.2.0/types/request-options');
		export const RequestOptions_Handle = new $wcm.ResourceHandleType('request-options');
		export const ResponseOutparam = new $wcm.ResourceType<http.Types.ResponseOutparam>('response-outparam', 'wasi:http@0.2.0/types/response-outparam');
		export const ResponseOutparam_Handle = new $wcm.ResourceHandleType('response-outparam');
		export const StatusCode = $wcm.u16;
		export const IncomingResponse = new $wcm.ResourceType<http.Types.IncomingResponse>('incoming-response', 'wasi:http@0.2.0/types/incoming-response');
		export const IncomingResponse_Handle = new $wcm.ResourceHandleType('incoming-response');
		export const IncomingBody = new $wcm.ResourceType<http.Types.IncomingBody>('incoming-body', 'wasi:http@0.2.0/types/incoming-body');
		export const IncomingBody_Handle = new $wcm.ResourceHandleType('incoming-body');
		export const FutureTrailers = new $wcm.ResourceType<http.Types.FutureTrailers>('future-trailers', 'wasi:http@0.2.0/types/future-trailers');
		export const FutureTrailers_Handle = new $wcm.ResourceHandleType('future-trailers');
		export const OutgoingResponse = new $wcm.ResourceType<http.Types.OutgoingResponse>('outgoing-response', 'wasi:http@0.2.0/types/outgoing-response');
		export const OutgoingResponse_Handle = new $wcm.ResourceHandleType('outgoing-response');
		export const OutgoingBody = new $wcm.ResourceType<http.Types.OutgoingBody>('outgoing-body', 'wasi:http@0.2.0/types/outgoing-body');
		export const OutgoingBody_Handle = new $wcm.ResourceHandleType('outgoing-body');
		export const FutureIncomingResponse = new $wcm.ResourceType<http.Types.FutureIncomingResponse>('future-incoming-response', 'wasi:http@0.2.0/types/future-incoming-response');
		export const FutureIncomingResponse_Handle = new $wcm.ResourceHandleType('future-incoming-response');
		Fields.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]fields', [['inst', Fields]]));
		Fields.addConstructor('constructor', new $wcm.ConstructorType<http.Types.Fields.Class['constructor']>('[constructor]fields', [], new $wcm.OwnType(Fields_Handle)));
		Fields.addStaticMethod('fromList', new $wcm.StaticMethodType<http.Types.Fields.Statics['fromList']>('[static]fields.from-list', [
			['entries', new $wcm.ListType<[http.Types.FieldKey, Uint8Array]>(new $wcm.TupleType<[http.Types.FieldKey, Uint8Array]>([FieldKey, FieldValue]))],
		], new $wcm.ResultType<own<http.Types.Fields>, http.Types.HeaderError>(new $wcm.OwnType<http.Types.Fields>(Fields), HeaderError)));
		Fields.addMethod('get', new $wcm.MethodType<http.Types.Fields.Interface['get']>('[method]fields.get', [
			['name', FieldKey],
		], new $wcm.ListType<Uint8Array>(FieldValue)));
		Fields.addMethod('has', new $wcm.MethodType<http.Types.Fields.Interface['has']>('[method]fields.has', [
			['name', FieldKey],
		], $wcm.bool));
		Fields.addMethod('set', new $wcm.MethodType<http.Types.Fields.Interface['set']>('[method]fields.set', [
			['name', FieldKey],
			['value', new $wcm.ListType<Uint8Array>(FieldValue)],
		], new $wcm.ResultType<void, http.Types.HeaderError>(undefined, HeaderError)));
		Fields.addMethod('delete', new $wcm.MethodType<http.Types.Fields.Interface['delete']>('[method]fields.delete', [
			['name', FieldKey],
		], new $wcm.ResultType<void, http.Types.HeaderError>(undefined, HeaderError)));
		Fields.addMethod('append', new $wcm.MethodType<http.Types.Fields.Interface['append']>('[method]fields.append', [
			['name', FieldKey],
			['value', FieldValue],
		], new $wcm.ResultType<void, http.Types.HeaderError>(undefined, HeaderError)));
		Fields.addMethod('entries', new $wcm.MethodType<http.Types.Fields.Interface['entries']>('[method]fields.entries', [], new $wcm.ListType<[http.Types.FieldKey, Uint8Array]>(new $wcm.TupleType<[http.Types.FieldKey, Uint8Array]>([FieldKey, FieldValue]))));
		Fields.addMethod('clone', new $wcm.MethodType<http.Types.Fields.Interface['clone']>('[method]fields.clone', [], new $wcm.OwnType<http.Types.Fields>(Fields)));
		IncomingRequest.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]incoming-request', [['inst', IncomingRequest]]));
		IncomingRequest.addMethod('method', new $wcm.MethodType<http.Types.IncomingRequest.Interface['method']>('[method]incoming-request.method', [], Method));
		IncomingRequest.addMethod('pathWithQuery', new $wcm.MethodType<http.Types.IncomingRequest.Interface['pathWithQuery']>('[method]incoming-request.path-with-query', [], new $wcm.OptionType<string>($wcm.wstring)));
		IncomingRequest.addMethod('scheme', new $wcm.MethodType<http.Types.IncomingRequest.Interface['scheme']>('[method]incoming-request.scheme', [], new $wcm.OptionType<http.Types.Scheme>(Scheme)));
		IncomingRequest.addMethod('authority', new $wcm.MethodType<http.Types.IncomingRequest.Interface['authority']>('[method]incoming-request.authority', [], new $wcm.OptionType<string>($wcm.wstring)));
		IncomingRequest.addMethod('headers', new $wcm.MethodType<http.Types.IncomingRequest.Interface['headers']>('[method]incoming-request.headers', [], new $wcm.OwnType<http.Types.Headers>(Headers)));
		IncomingRequest.addMethod('consume', new $wcm.MethodType<http.Types.IncomingRequest.Interface['consume']>('[method]incoming-request.consume', [], new $wcm.ResultType<own<http.Types.IncomingBody>, void>(new $wcm.OwnType<http.Types.IncomingBody>(IncomingBody), undefined)));
		OutgoingRequest.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]outgoing-request', [['inst', OutgoingRequest]]));
		OutgoingRequest.addConstructor('constructor', new $wcm.ConstructorType<http.Types.OutgoingRequest.Class['constructor']>('[constructor]outgoing-request', [
			['headers', new $wcm.OwnType<http.Types.Headers>(Headers)],
		], new $wcm.OwnType(OutgoingRequest_Handle)));
		OutgoingRequest.addMethod('body', new $wcm.MethodType<http.Types.OutgoingRequest.Interface['body']>('[method]outgoing-request.body', [], new $wcm.ResultType<own<http.Types.OutgoingBody>, void>(new $wcm.OwnType<http.Types.OutgoingBody>(OutgoingBody), undefined)));
		OutgoingRequest.addMethod('method', new $wcm.MethodType<http.Types.OutgoingRequest.Interface['method']>('[method]outgoing-request.method', [], Method));
		OutgoingRequest.addMethod('setMethod', new $wcm.MethodType<http.Types.OutgoingRequest.Interface['setMethod']>('[method]outgoing-request.set-method', [
			['method', Method],
		], new $wcm.ResultType<void, void>(undefined, undefined)));
		OutgoingRequest.addMethod('pathWithQuery', new $wcm.MethodType<http.Types.OutgoingRequest.Interface['pathWithQuery']>('[method]outgoing-request.path-with-query', [], new $wcm.OptionType<string>($wcm.wstring)));
		OutgoingRequest.addMethod('setPathWithQuery', new $wcm.MethodType<http.Types.OutgoingRequest.Interface['setPathWithQuery']>('[method]outgoing-request.set-path-with-query', [
			['pathWithQuery', new $wcm.OptionType<string>($wcm.wstring)],
		], new $wcm.ResultType<void, void>(undefined, undefined)));
		OutgoingRequest.addMethod('scheme', new $wcm.MethodType<http.Types.OutgoingRequest.Interface['scheme']>('[method]outgoing-request.scheme', [], new $wcm.OptionType<http.Types.Scheme>(Scheme)));
		OutgoingRequest.addMethod('setScheme', new $wcm.MethodType<http.Types.OutgoingRequest.Interface['setScheme']>('[method]outgoing-request.set-scheme', [
			['scheme', new $wcm.OptionType<http.Types.Scheme>(Scheme)],
		], new $wcm.ResultType<void, void>(undefined, undefined)));
		OutgoingRequest.addMethod('authority', new $wcm.MethodType<http.Types.OutgoingRequest.Interface['authority']>('[method]outgoing-request.authority', [], new $wcm.OptionType<string>($wcm.wstring)));
		OutgoingRequest.addMethod('setAuthority', new $wcm.MethodType<http.Types.OutgoingRequest.Interface['setAuthority']>('[method]outgoing-request.set-authority', [
			['authority', new $wcm.OptionType<string>($wcm.wstring)],
		], new $wcm.ResultType<void, void>(undefined, undefined)));
		OutgoingRequest.addMethod('headers', new $wcm.MethodType<http.Types.OutgoingRequest.Interface['headers']>('[method]outgoing-request.headers', [], new $wcm.OwnType<http.Types.Headers>(Headers)));
		RequestOptions.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]request-options', [['inst', RequestOptions]]));
		RequestOptions.addConstructor('constructor', new $wcm.ConstructorType<http.Types.RequestOptions.Class['constructor']>('[constructor]request-options', [], new $wcm.OwnType(RequestOptions_Handle)));
		RequestOptions.addMethod('connectTimeout', new $wcm.MethodType<http.Types.RequestOptions.Interface['connectTimeout']>('[method]request-options.connect-timeout', [], new $wcm.OptionType<http.Types.Duration>(Duration)));
		RequestOptions.addMethod('setConnectTimeout', new $wcm.MethodType<http.Types.RequestOptions.Interface['setConnectTimeout']>('[method]request-options.set-connect-timeout', [
			['duration', new $wcm.OptionType<http.Types.Duration>(Duration)],
		], new $wcm.ResultType<void, void>(undefined, undefined)));
		RequestOptions.addMethod('firstByteTimeout', new $wcm.MethodType<http.Types.RequestOptions.Interface['firstByteTimeout']>('[method]request-options.first-byte-timeout', [], new $wcm.OptionType<http.Types.Duration>(Duration)));
		RequestOptions.addMethod('setFirstByteTimeout', new $wcm.MethodType<http.Types.RequestOptions.Interface['setFirstByteTimeout']>('[method]request-options.set-first-byte-timeout', [
			['duration', new $wcm.OptionType<http.Types.Duration>(Duration)],
		], new $wcm.ResultType<void, void>(undefined, undefined)));
		RequestOptions.addMethod('betweenBytesTimeout', new $wcm.MethodType<http.Types.RequestOptions.Interface['betweenBytesTimeout']>('[method]request-options.between-bytes-timeout', [], new $wcm.OptionType<http.Types.Duration>(Duration)));
		RequestOptions.addMethod('setBetweenBytesTimeout', new $wcm.MethodType<http.Types.RequestOptions.Interface['setBetweenBytesTimeout']>('[method]request-options.set-between-bytes-timeout', [
			['duration', new $wcm.OptionType<http.Types.Duration>(Duration)],
		], new $wcm.ResultType<void, void>(undefined, undefined)));
		ResponseOutparam.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]response-outparam', [['inst', ResponseOutparam]]));
		ResponseOutparam.addStaticMethod('set', new $wcm.StaticMethodType<http.Types.ResponseOutparam.Statics['set']>('[static]response-outparam.set', [
			['param', new $wcm.OwnType<http.Types.ResponseOutparam>(ResponseOutparam)],
			['response', new $wcm.ResultType<own<http.Types.OutgoingResponse>, http.Types.ErrorCode>(new $wcm.OwnType<http.Types.OutgoingResponse>(OutgoingResponse), ErrorCode)],
		], undefined));
		IncomingResponse.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]incoming-response', [['inst', IncomingResponse]]));
		IncomingResponse.addMethod('status', new $wcm.MethodType<http.Types.IncomingResponse.Interface['status']>('[method]incoming-response.status', [], StatusCode));
		IncomingResponse.addMethod('headers', new $wcm.MethodType<http.Types.IncomingResponse.Interface['headers']>('[method]incoming-response.headers', [], new $wcm.OwnType<http.Types.Headers>(Headers)));
		IncomingResponse.addMethod('consume', new $wcm.MethodType<http.Types.IncomingResponse.Interface['consume']>('[method]incoming-response.consume', [], new $wcm.ResultType<own<http.Types.IncomingBody>, void>(new $wcm.OwnType<http.Types.IncomingBody>(IncomingBody), undefined)));
		IncomingBody.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]incoming-body', [['inst', IncomingBody]]));
		IncomingBody.addMethod('stream', new $wcm.MethodType<http.Types.IncomingBody.Interface['stream']>('[method]incoming-body.stream', [], new $wcm.ResultType<own<http.Types.InputStream>, void>(new $wcm.OwnType<http.Types.InputStream>(InputStream), undefined)));
		IncomingBody.addStaticMethod('finish', new $wcm.StaticMethodType<http.Types.IncomingBody.Statics['finish']>('[static]incoming-body.finish', [
			['this_', new $wcm.OwnType<http.Types.IncomingBody>(IncomingBody)],
		], new $wcm.OwnType<http.Types.FutureTrailers>(FutureTrailers)));
		FutureTrailers.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]future-trailers', [['inst', FutureTrailers]]));
		FutureTrailers.addMethod('subscribe', new $wcm.MethodType<http.Types.FutureTrailers.Interface['subscribe']>('[method]future-trailers.subscribe', [], new $wcm.OwnType<http.Types.Pollable>(Pollable)));
		FutureTrailers.addMethod('get', new $wcm.MethodType<http.Types.FutureTrailers.Interface['get']>('[method]future-trailers.get', [], new $wcm.OptionType<result<result<option<own<http.Types.Trailers>>, http.Types.ErrorCode>, void>>(new $wcm.ResultType<result<option<own<http.Types.Trailers>>, http.Types.ErrorCode>, void>(new $wcm.ResultType<option<own<http.Types.Trailers>>, http.Types.ErrorCode>(new $wcm.OptionType<own<http.Types.Trailers>>(new $wcm.OwnType<http.Types.Trailers>(Trailers)), ErrorCode), undefined))));
		OutgoingResponse.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]outgoing-response', [['inst', OutgoingResponse]]));
		OutgoingResponse.addConstructor('constructor', new $wcm.ConstructorType<http.Types.OutgoingResponse.Class['constructor']>('[constructor]outgoing-response', [
			['headers', new $wcm.OwnType<http.Types.Headers>(Headers)],
		], new $wcm.OwnType(OutgoingResponse_Handle)));
		OutgoingResponse.addMethod('statusCode', new $wcm.MethodType<http.Types.OutgoingResponse.Interface['statusCode']>('[method]outgoing-response.status-code', [], StatusCode));
		OutgoingResponse.addMethod('setStatusCode', new $wcm.MethodType<http.Types.OutgoingResponse.Interface['setStatusCode']>('[method]outgoing-response.set-status-code', [
			['statusCode', StatusCode],
		], new $wcm.ResultType<void, void>(undefined, undefined)));
		OutgoingResponse.addMethod('headers', new $wcm.MethodType<http.Types.OutgoingResponse.Interface['headers']>('[method]outgoing-response.headers', [], new $wcm.OwnType<http.Types.Headers>(Headers)));
		OutgoingResponse.addMethod('body', new $wcm.MethodType<http.Types.OutgoingResponse.Interface['body']>('[method]outgoing-response.body', [], new $wcm.ResultType<own<http.Types.OutgoingBody>, void>(new $wcm.OwnType<http.Types.OutgoingBody>(OutgoingBody), undefined)));
		OutgoingBody.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]outgoing-body', [['inst', OutgoingBody]]));
		OutgoingBody.addMethod('write', new $wcm.MethodType<http.Types.OutgoingBody.Interface['write']>('[method]outgoing-body.write', [], new $wcm.ResultType<own<http.Types.OutputStream>, void>(new $wcm.OwnType<http.Types.OutputStream>(OutputStream), undefined)));
		OutgoingBody.addStaticMethod('finish', new $wcm.StaticMethodType<http.Types.OutgoingBody.Statics['finish']>('[static]outgoing-body.finish', [
			['this_', new $wcm.OwnType<http.Types.OutgoingBody>(OutgoingBody)],
			['trailers', new $wcm.OptionType<own<http.Types.Trailers>>(new $wcm.OwnType<http.Types.Trailers>(Trailers))],
		], new $wcm.ResultType<void, http.Types.ErrorCode>(undefined, ErrorCode)));
		FutureIncomingResponse.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]future-incoming-response', [['inst', FutureIncomingResponse]]));
		FutureIncomingResponse.addMethod('subscribe', new $wcm.MethodType<http.Types.FutureIncomingResponse.Interface['subscribe']>('[method]future-incoming-response.subscribe', [], new $wcm.OwnType<http.Types.Pollable>(Pollable)));
		FutureIncomingResponse.addMethod('get', new $wcm.MethodType<http.Types.FutureIncomingResponse.Interface['get']>('[method]future-incoming-response.get', [], new $wcm.OptionType<result<result<own<http.Types.IncomingResponse>, http.Types.ErrorCode>, void>>(new $wcm.ResultType<result<own<http.Types.IncomingResponse>, http.Types.ErrorCode>, void>(new $wcm.ResultType<own<http.Types.IncomingResponse>, http.Types.ErrorCode>(new $wcm.OwnType<http.Types.IncomingResponse>(IncomingResponse), ErrorCode), undefined))));
		export const httpErrorCode = new $wcm.FunctionType<http.Types.httpErrorCode>('http-error-code',[
			['err', new $wcm.BorrowType<http.Types.IoError>(IoError)],
		], new $wcm.OptionType<http.Types.ErrorCode>(ErrorCode));
	}
	export namespace Types._ {
		export const id = 'wasi:http/types@0.2.0' as const;
		export const witName = 'types' as const;
		export namespace Fields {
			export type WasmInterface = {
				'[constructor]fields': () => i32;
				'[static]fields.from-list': (entries_ptr: i32, entries_len: i32, result: ptr<result<own<Fields>, HeaderError>>) => void;
				'[method]fields.get': (self: i32, name_ptr: i32, name_len: i32, result: ptr<FieldValue[]>) => void;
				'[method]fields.has': (self: i32, name_ptr: i32, name_len: i32) => i32;
				'[method]fields.set': (self: i32, name_ptr: i32, name_len: i32, value_ptr: i32, value_len: i32, result: ptr<result<void, HeaderError>>) => void;
				'[method]fields.delete': (self: i32, name_ptr: i32, name_len: i32, result: ptr<result<void, HeaderError>>) => void;
				'[method]fields.append': (self: i32, name_ptr: i32, name_len: i32, value_ptr: i32, value_len: i32, result: ptr<result<void, HeaderError>>) => void;
				'[method]fields.entries': (self: i32, result: ptr<[FieldKey, FieldValue][]>) => void;
				'[method]fields.clone': (self: i32) => i32;
			};
			export namespace imports {
				export type WasmInterface = Fields.WasmInterface & { '[resource-drop]fields': (self: i32) => void };
			}
			export namespace exports {
				export type WasmInterface = Fields.WasmInterface & { '[dtor]fields': (self: i32) => void };
			}
		}
		export namespace IncomingRequest {
			export type WasmInterface = {
				'[method]incoming-request.method': (self: i32, result: ptr<Method>) => void;
				'[method]incoming-request.path-with-query': (self: i32, result: ptr<string | undefined>) => void;
				'[method]incoming-request.scheme': (self: i32, result: ptr<Scheme | undefined>) => void;
				'[method]incoming-request.authority': (self: i32, result: ptr<string | undefined>) => void;
				'[method]incoming-request.headers': (self: i32) => i32;
				'[method]incoming-request.consume': (self: i32, result: ptr<result<own<IncomingBody>, void>>) => void;
			};
			export namespace imports {
				export type WasmInterface = IncomingRequest.WasmInterface & { '[resource-drop]incoming-request': (self: i32) => void };
			}
			export namespace exports {
				export type WasmInterface = IncomingRequest.WasmInterface & { '[dtor]incoming-request': (self: i32) => void };
			}
		}
		export namespace OutgoingRequest {
			export type WasmInterface = {
				'[constructor]outgoing-request': (headers: i32) => i32;
				'[method]outgoing-request.body': (self: i32, result: ptr<result<own<OutgoingBody>, void>>) => void;
				'[method]outgoing-request.method': (self: i32, result: ptr<Method>) => void;
				'[method]outgoing-request.set-method': (self: i32, method_case: i32, method_0: i32, method_1: i32) => i32;
				'[method]outgoing-request.path-with-query': (self: i32, result: ptr<string | undefined>) => void;
				'[method]outgoing-request.set-path-with-query': (self: i32, pathWithQuery_case: i32, pathWithQuery_option_ptr: i32, pathWithQuery_option_len: i32) => i32;
				'[method]outgoing-request.scheme': (self: i32, result: ptr<Scheme | undefined>) => void;
				'[method]outgoing-request.set-scheme': (self: i32, scheme_case: i32, scheme_option_case: i32, scheme_option_0: i32, scheme_option_1: i32) => i32;
				'[method]outgoing-request.authority': (self: i32, result: ptr<string | undefined>) => void;
				'[method]outgoing-request.set-authority': (self: i32, authority_case: i32, authority_option_ptr: i32, authority_option_len: i32) => i32;
				'[method]outgoing-request.headers': (self: i32) => i32;
			};
			export namespace imports {
				export type WasmInterface = OutgoingRequest.WasmInterface & { '[resource-drop]outgoing-request': (self: i32) => void };
			}
			export namespace exports {
				export type WasmInterface = OutgoingRequest.WasmInterface & { '[dtor]outgoing-request': (self: i32) => void };
			}
		}
		export namespace RequestOptions {
			export type WasmInterface = {
				'[constructor]request-options': () => i32;
				'[method]request-options.connect-timeout': (self: i32, result: ptr<Duration | undefined>) => void;
				'[method]request-options.set-connect-timeout': (self: i32, duration_case: i32, duration_option_Duration: i64) => i32;
				'[method]request-options.first-byte-timeout': (self: i32, result: ptr<Duration | undefined>) => void;
				'[method]request-options.set-first-byte-timeout': (self: i32, duration_case: i32, duration_option_Duration: i64) => i32;
				'[method]request-options.between-bytes-timeout': (self: i32, result: ptr<Duration | undefined>) => void;
				'[method]request-options.set-between-bytes-timeout': (self: i32, duration_case: i32, duration_option_Duration: i64) => i32;
			};
			export namespace imports {
				export type WasmInterface = RequestOptions.WasmInterface & { '[resource-drop]request-options': (self: i32) => void };
			}
			export namespace exports {
				export type WasmInterface = RequestOptions.WasmInterface & { '[dtor]request-options': (self: i32) => void };
			}
		}
		export namespace ResponseOutparam {
			export type WasmInterface = {
				'[static]response-outparam.set': (param: i32, response_case: i32, response_0: i32, response_1: i32, response_2: i64, response_3: i32, response_4: i32, response_5: i32, response_6: i32) => void;
			};
			export namespace imports {
				export type WasmInterface = ResponseOutparam.WasmInterface & { '[resource-drop]response-outparam': (self: i32) => void };
			}
			export namespace exports {
				export type WasmInterface = ResponseOutparam.WasmInterface & { '[dtor]response-outparam': (self: i32) => void };
			}
		}
		export namespace IncomingResponse {
			export type WasmInterface = {
				'[method]incoming-response.status': (self: i32) => i32;
				'[method]incoming-response.headers': (self: i32) => i32;
				'[method]incoming-response.consume': (self: i32, result: ptr<result<own<IncomingBody>, void>>) => void;
			};
			export namespace imports {
				export type WasmInterface = IncomingResponse.WasmInterface & { '[resource-drop]incoming-response': (self: i32) => void };
			}
			export namespace exports {
				export type WasmInterface = IncomingResponse.WasmInterface & { '[dtor]incoming-response': (self: i32) => void };
			}
		}
		export namespace IncomingBody {
			export type WasmInterface = {
				'[method]incoming-body.stream': (self: i32, result: ptr<result<own<InputStream>, void>>) => void;
				'[static]incoming-body.finish': (this_: i32) => i32;
			};
			export namespace imports {
				export type WasmInterface = IncomingBody.WasmInterface & { '[resource-drop]incoming-body': (self: i32) => void };
			}
			export namespace exports {
				export type WasmInterface = IncomingBody.WasmInterface & { '[dtor]incoming-body': (self: i32) => void };
			}
		}
		export namespace FutureTrailers {
			export type WasmInterface = {
				'[method]future-trailers.subscribe': (self: i32) => i32;
				'[method]future-trailers.get': (self: i32, result: ptr<result<result<own<Trailers> | undefined, ErrorCode>, void> | undefined>) => void;
			};
			export namespace imports {
				export type WasmInterface = FutureTrailers.WasmInterface & { '[resource-drop]future-trailers': (self: i32) => void };
			}
			export namespace exports {
				export type WasmInterface = FutureTrailers.WasmInterface & { '[dtor]future-trailers': (self: i32) => void };
			}
		}
		export namespace OutgoingResponse {
			export type WasmInterface = {
				'[constructor]outgoing-response': (headers: i32) => i32;
				'[method]outgoing-response.status-code': (self: i32) => i32;
				'[method]outgoing-response.set-status-code': (self: i32, statusCode: i32) => i32;
				'[method]outgoing-response.headers': (self: i32) => i32;
				'[method]outgoing-response.body': (self: i32, result: ptr<result<own<OutgoingBody>, void>>) => void;
			};
			export namespace imports {
				export type WasmInterface = OutgoingResponse.WasmInterface & { '[resource-drop]outgoing-response': (self: i32) => void };
			}
			export namespace exports {
				export type WasmInterface = OutgoingResponse.WasmInterface & { '[dtor]outgoing-response': (self: i32) => void };
			}
		}
		export namespace OutgoingBody {
			export type WasmInterface = {
				'[method]outgoing-body.write': (self: i32, result: ptr<result<own<OutputStream>, void>>) => void;
				'[static]outgoing-body.finish': (this_: i32, trailers_case: i32, trailers_option: i32, result: ptr<result<void, ErrorCode>>) => void;
			};
			export namespace imports {
				export type WasmInterface = OutgoingBody.WasmInterface & { '[resource-drop]outgoing-body': (self: i32) => void };
			}
			export namespace exports {
				export type WasmInterface = OutgoingBody.WasmInterface & { '[dtor]outgoing-body': (self: i32) => void };
			}
		}
		export namespace FutureIncomingResponse {
			export type WasmInterface = {
				'[method]future-incoming-response.subscribe': (self: i32) => i32;
				'[method]future-incoming-response.get': (self: i32, result: ptr<result<result<own<IncomingResponse>, ErrorCode>, void> | undefined>) => void;
			};
			export namespace imports {
				export type WasmInterface = FutureIncomingResponse.WasmInterface & { '[resource-drop]future-incoming-response': (self: i32) => void };
			}
			export namespace exports {
				export type WasmInterface = FutureIncomingResponse.WasmInterface & { '[dtor]future-incoming-response': (self: i32) => void };
			}
		}
		export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
			['Duration', $.Duration],
			['InputStream', $.InputStream],
			['OutputStream', $.OutputStream],
			['IoError', $.IoError],
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
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['httpErrorCode', $.httpErrorCode]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map<string, $wcm.ResourceType>([
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
		export type WasmInterface = {
			'http-error-code': (err: i32, result: ptr<ErrorCode | undefined>) => void;
		};
		export namespace imports {
			export type WasmInterface = _.WasmInterface & Fields.imports.WasmInterface & IncomingRequest.imports.WasmInterface & OutgoingRequest.imports.WasmInterface & RequestOptions.imports.WasmInterface & ResponseOutparam.imports.WasmInterface & IncomingResponse.imports.WasmInterface & IncomingBody.imports.WasmInterface & FutureTrailers.imports.WasmInterface & OutgoingResponse.imports.WasmInterface & OutgoingBody.imports.WasmInterface & FutureIncomingResponse.imports.WasmInterface;
		}
		export namespace exports {
			export type WasmInterface = _.WasmInterface & Fields.exports.WasmInterface & IncomingRequest.exports.WasmInterface & OutgoingRequest.exports.WasmInterface & RequestOptions.exports.WasmInterface & ResponseOutparam.exports.WasmInterface & IncomingResponse.exports.WasmInterface & IncomingBody.exports.WasmInterface & FutureTrailers.exports.WasmInterface & OutgoingResponse.exports.WasmInterface & OutgoingBody.exports.WasmInterface & FutureIncomingResponse.exports.WasmInterface;
			export namespace imports {
				export type WasmInterface = {
					'[resource-new]fields': (rep: i32) => i32;
					'[resource-rep]fields': (handle: i32) => i32;
					'[resource-drop]fields': (handle: i32) => void;
					'[resource-new]incoming-request': (rep: i32) => i32;
					'[resource-rep]incoming-request': (handle: i32) => i32;
					'[resource-drop]incoming-request': (handle: i32) => void;
					'[resource-new]outgoing-request': (rep: i32) => i32;
					'[resource-rep]outgoing-request': (handle: i32) => i32;
					'[resource-drop]outgoing-request': (handle: i32) => void;
					'[resource-new]request-options': (rep: i32) => i32;
					'[resource-rep]request-options': (handle: i32) => i32;
					'[resource-drop]request-options': (handle: i32) => void;
					'[resource-new]response-outparam': (rep: i32) => i32;
					'[resource-rep]response-outparam': (handle: i32) => i32;
					'[resource-drop]response-outparam': (handle: i32) => void;
					'[resource-new]incoming-response': (rep: i32) => i32;
					'[resource-rep]incoming-response': (handle: i32) => i32;
					'[resource-drop]incoming-response': (handle: i32) => void;
					'[resource-new]incoming-body': (rep: i32) => i32;
					'[resource-rep]incoming-body': (handle: i32) => i32;
					'[resource-drop]incoming-body': (handle: i32) => void;
					'[resource-new]future-trailers': (rep: i32) => i32;
					'[resource-rep]future-trailers': (handle: i32) => i32;
					'[resource-drop]future-trailers': (handle: i32) => void;
					'[resource-new]outgoing-response': (rep: i32) => i32;
					'[resource-rep]outgoing-response': (handle: i32) => i32;
					'[resource-drop]outgoing-response': (handle: i32) => void;
					'[resource-new]outgoing-body': (rep: i32) => i32;
					'[resource-rep]outgoing-body': (handle: i32) => i32;
					'[resource-drop]outgoing-body': (handle: i32) => void;
					'[resource-new]future-incoming-response': (rep: i32) => i32;
					'[resource-rep]future-incoming-response': (handle: i32) => i32;
					'[resource-drop]future-incoming-response': (handle: i32) => void;
				};
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
		export const id = 'wasi:http/incoming-handler@0.2.0' as const;
		export const witName = 'incoming-handler' as const;
		export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
			['IncomingRequest', $.IncomingRequest],
			['ResponseOutparam', $.ResponseOutparam]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['handle', $.handle]
		]);
		export type WasmInterface = {
			'handle': (request: i32, responseOut: i32) => void;
		};
		export namespace imports {
			export type WasmInterface = _.WasmInterface;
		}
		export namespace exports {
			export type WasmInterface = _.WasmInterface;
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
		export const id = 'wasi:http/outgoing-handler@0.2.0' as const;
		export const witName = 'outgoing-handler' as const;
		export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
			['OutgoingRequest', $.OutgoingRequest],
			['RequestOptions', $.RequestOptions],
			['FutureIncomingResponse', $.FutureIncomingResponse],
			['ErrorCode', $.ErrorCode]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['handle', $.handle]
		]);
		export type WasmInterface = {
			'handle': (request: i32, options_case: i32, options_option: i32, result: ptr<result<own<FutureIncomingResponse>, ErrorCode>>) => void;
		};
		export namespace imports {
			export type WasmInterface = _.WasmInterface;
		}
		export namespace exports {
			export type WasmInterface = _.WasmInterface;
		}
	}
	export namespace proxy.$ {
	}
	export namespace proxy._ {
		export const id = 'wasi:http/proxy@0.2.0' as const;
		export const witName = 'proxy' as const;
		export namespace imports {
			export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
				['random.Random', random.Random._],
				['io.Error', io.Error._],
				['io.Poll', io.Poll._],
				['io.Streams', io.Streams._],
				['cli.Stdout', cli.Stdout._],
				['cli.Stderr', cli.Stderr._],
				['cli.Stdin', cli.Stdin._],
				['clocks.MonotonicClock', clocks.MonotonicClock._],
				['Types', Types._],
				['OutgoingHandler', OutgoingHandler._],
				['clocks.WallClock', clocks.WallClock._]
			]);
			export function create(service: proxy.Imports, context: $wcm.WasmContext): Imports {
				return $wcm.$imports.create<Imports>(_, service, context);
			}
			export function loop(service: proxy.Imports, context: $wcm.WasmContext): proxy.Imports {
				return $wcm.$imports.loop<proxy.Imports>(_, service, context);
			}
		}
		export type Imports = {
			'wasi:random/random@0.2.0': random.Random._.imports.WasmInterface;
			'wasi:io/error@0.2.0': io.Error._.imports.WasmInterface;
			'wasi:io/poll@0.2.0': io.Poll._.imports.WasmInterface;
			'wasi:io/streams@0.2.0': io.Streams._.imports.WasmInterface;
			'wasi:cli/stdout@0.2.0': cli.Stdout._.imports.WasmInterface;
			'wasi:cli/stderr@0.2.0': cli.Stderr._.imports.WasmInterface;
			'wasi:cli/stdin@0.2.0': cli.Stdin._.imports.WasmInterface;
			'wasi:clocks/monotonic-clock@0.2.0': clocks.MonotonicClock._.imports.WasmInterface;
			'wasi:http/types@0.2.0': http.Types._.imports.WasmInterface;
			'wasi:http/outgoing-handler@0.2.0': http.OutgoingHandler._.imports.WasmInterface;
			'wasi:clocks/wall-clock@0.2.0': clocks.WallClock._.imports.WasmInterface;
		};
		export namespace exports {
			export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
				['IncomingHandler', IncomingHandler._]
			]);
			export function bind(exports: Exports, context: $wcm.WasmContext): proxy.Exports {
				return $wcm.$exports.bind<proxy.Exports>(_, exports, context);
			}
		}
		export type Exports = {
			'wasi:http/incoming-handler@0.2.0#handle': (request: i32, responseOut: i32) => void;
		};
		export function bind(service: proxy.Imports, code: $wcm.Code, context?: $wcm.ComponentModelContext): Promise<proxy.Exports>;
		export function bind(service: proxy.Imports.Promisified, code: $wcm.Code, port: $wcm.RAL.ConnectionPort, context?: $wcm.ComponentModelContext): Promise<proxy.Exports.Promisified>;
		export function bind(service: proxy.Imports | proxy.Imports.Promisified, code: $wcm.Code, portOrContext?: $wcm.RAL.ConnectionPort | $wcm.ComponentModelContext, context?: $wcm.ComponentModelContext | undefined): Promise<proxy.Exports> | Promise<proxy.Exports.Promisified> {
			return $wcm.$main.bind(_, service, code, portOrContext, context);
		}
	}
}

export namespace http._ {
	export const version = '0.2.0' as const;
	export const id = 'wasi:http@0.2.0' as const;
	export const witName = 'http' as const;
	export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
		['Types', Types._],
		['IncomingHandler', IncomingHandler._],
		['OutgoingHandler', OutgoingHandler._]
	]);
	export const worlds: Map<string, $wcm.WorldType> = new Map<string, $wcm.WorldType>([
		['proxy', proxy._],
	]);
}
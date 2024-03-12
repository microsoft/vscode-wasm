/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '@vscode/wasm-component-model';
import type { borrow, own, u64, result, i32, ptr, i64 } from '@vscode/wasm-component-model';

export namespace io {
	export namespace Error {
		export namespace Error {
			export interface Interface {
				$handle?: $wcm.ResourceHandle;

				/**
				 * Returns a string that is suitable to assist humans in debugging
				 * this error.
				 *
				 * WARNING: The returned string should not be consumed mechanically!
				 * It may change across platforms, hosts, or other implementation
				 * details. Parsing this string is a major platform-compatibility
				 * hazard.
				 */
				toDebugString(): string;
			}
			export type Statics = {
				$drop(inst: Interface): void;
			};
			export type Class = Statics & {
			};
		}
		export type Error = Error.Interface;
	}
	export type Error = {
		Error: Error.Error.Class;
	};

	/**
	 * A poll API intended to let users wait for I/O events on multiple handles
	 * at once.
	 */
	export namespace Poll {
		export namespace Pollable {
			export interface Interface {
				$handle?: $wcm.ResourceHandle;

				/**
				 * Return the readiness of a pollable. This function never blocks.
				 *
				 * Returns `true` when the pollable is ready, and `false` otherwise.
				 */
				ready(): boolean;

				/**
				 * `block` returns immediately if the pollable is ready, and otherwise
				 * blocks until ready.
				 *
				 * This function is equivalent to calling `poll.poll` on a list
				 * containing only this pollable.
				 */
				block(): void;
			}
			export type Statics = {
				$drop(inst: Interface): void;
			};
			export type Class = Statics & {
			};
		}
		export type Pollable = Pollable.Interface;

		/**
		 * Poll for completion on a set of pollables.
		 *
		 * This function takes a list of pollables, which identify I/O sources of
		 * interest, and waits until one or more of the events is ready for I/O.
		 *
		 * The result `list<u32>` contains one or more indices of handles in the
		 * argument list that is ready for I/O.
		 *
		 * This function traps if either:
		 * - the list is empty, or:
		 * - the list contains more elements than can be indexed with a `u32` value.
		 *
		 * A timeout can be implemented by adding a pollable from the
		 * wasi-clocks API to the list.
		 *
		 * This function does not return a `result`; polling in itself does not
		 * do any I/O so it doesn't fail. If any of the I/O sources identified by
		 * the pollables has an error, it is indicated by marking the source as
		 * being reaedy for I/O.
		 */
		export type poll = (in_: borrow<Pollable>[]) => Uint32Array;
	}
	export type Poll = {
		Pollable: Poll.Pollable.Class;
		poll: Poll.poll;
	};

	/**
	 * WASI I/O is an I/O abstraction API which is currently focused on providing
	 * stream types.
	 *
	 * In the future, the component model is expected to add built-in stream types;
	 * when it does, they are expected to subsume this API.
	 */
	export namespace Streams {
		export type Error = io.Error.Error;

		export type Pollable = io.Poll.Pollable;


		/**
		 * An error for input-stream and output-stream operations.
		 */
		export namespace StreamError {

			/**
			 * The last operation (a write or flush) failed before completion.
			 *
			 * More information is available in the `error` payload.
			 */
			export const lastOperationFailed = 'lastOperationFailed' as const;
			export type LastOperationFailed = { readonly tag: typeof lastOperationFailed; readonly value: own<Error> } & _common;
			export function LastOperationFailed(value: own<Error>): LastOperationFailed {
				return new VariantImpl(lastOperationFailed, value) as LastOperationFailed;
			}


			/**
			 * The stream is closed: no more input will be accepted by the
			 * stream. A closed output-stream will return this error on all
			 * future operations.
			 */
			export const closed = 'closed' as const;
			export type Closed = { readonly tag: typeof closed } & _common;
			export function Closed(): Closed {
				return new VariantImpl(closed, undefined) as Closed;
			}

			export type _tt = typeof lastOperationFailed | typeof closed;
			export type _vt = own<Error> | undefined;
			type _common = Omit<VariantImpl, 'tag' | 'value'>;
			export function _ctor(t: _tt, v: _vt): StreamError {
				return new VariantImpl(t, v) as StreamError;
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
				isLastOperationFailed(): this is LastOperationFailed {
					return this._tag === StreamError.lastOperationFailed;
				}
				isClosed(): this is Closed {
					return this._tag === StreamError.closed;
				}
			}
		}
		export type StreamError = StreamError.LastOperationFailed | StreamError.Closed;

		export namespace InputStream {
			export interface Interface {
				$handle?: $wcm.ResourceHandle;

				/**
				 * Perform a non-blocking read from the stream.
				 *
				 * When the source of a `read` is binary data, the bytes from the source
				 * are returned verbatim. When the source of a `read` is known to the
				 * implementation to be text, bytes containing the UTF-8 encoding of the
				 * text are returned.
				 *
				 * This function returns a list of bytes containing the read data,
				 * when successful. The returned list will contain up to `len` bytes;
				 * it may return fewer than requested, but not more. The list is
				 * empty when no bytes are available for reading at this time. The
				 * pollable given by `subscribe` will be ready when more bytes are
				 * available.
				 *
				 * This function fails with a `stream-error` when the operation
				 * encounters an error, giving `last-operation-failed`, or when the
				 * stream is closed, giving `closed`.
				 *
				 * When the caller gives a `len` of 0, it represents a request to
				 * read 0 bytes. If the stream is still open, this call should
				 * succeed and return an empty list, or otherwise fail with `closed`.
				 *
				 * The `len` parameter is a `u64`, which could represent a list of u8 which
				 * is not possible to allocate in wasm32, or not desirable to allocate as
				 * as a return value by the callee. The callee may return a list of bytes
				 * less than `len` in size while more bytes are available for reading.
				 */
				read(len: u64): result<Uint8Array, StreamError>;

				/**
				 * Read bytes from a stream, after blocking until at least one byte can
				 * be read. Except for blocking, behavior is identical to `read`.
				 */
				blockingRead(len: u64): result<Uint8Array, StreamError>;

				/**
				 * Skip bytes from a stream. Returns number of bytes skipped.
				 *
				 * Behaves identical to `read`, except instead of returning a list
				 * of bytes, returns the number of bytes consumed from the stream.
				 */
				skip(len: u64): result<u64, StreamError>;

				/**
				 * Skip bytes from a stream, after blocking until at least one byte
				 * can be skipped. Except for blocking behavior, identical to `skip`.
				 */
				blockingSkip(len: u64): result<u64, StreamError>;

				/**
				 * Create a `pollable` which will resolve once either the specified stream
				 * has bytes available to read or the other end of the stream has been
				 * closed.
				 * The created `pollable` is a child resource of the `input-stream`.
				 * Implementations may trap if the `input-stream` is dropped before
				 * all derived `pollable`s created with this function are dropped.
				 */
				subscribe(): own<Pollable>;
			}
			export type Statics = {
				$drop(inst: Interface): void;
			};
			export type Class = Statics & {
			};
		}
		export type InputStream = InputStream.Interface;

		export namespace OutputStream {
			export interface Interface {
				$handle?: $wcm.ResourceHandle;

				/**
				 * Check readiness for writing. This function never blocks.
				 *
				 * Returns the number of bytes permitted for the next call to `write`,
				 * or an error. Calling `write` with more bytes than this function has
				 * permitted will trap.
				 *
				 * When this function returns 0 bytes, the `subscribe` pollable will
				 * become ready when this function will report at least 1 byte, or an
				 * error.
				 */
				checkWrite(): result<u64, StreamError>;

				/**
				 * Perform a write. This function never blocks.
				 *
				 * When the destination of a `write` is binary data, the bytes from
				 * `contents` are written verbatim. When the destination of a `write` is
				 * known to the implementation to be text, the bytes of `contents` are
				 * transcoded from UTF-8 into the encoding of the destination and then
				 * written.
				 *
				 * Precondition: check-write gave permit of Ok(n) and contents has a
				 * length of less than or equal to n. Otherwise, this function will trap.
				 *
				 * returns Err(closed) without writing if the stream has closed since
				 * the last call to check-write provided a permit.
				 */
				write(contents: Uint8Array): result<void, StreamError>;

				/**
				 * Perform a write of up to 4096 bytes, and then flush the stream. Block
				 * until all of these operations are complete, or an error occurs.
				 *
				 * This is a convenience wrapper around the use of `check-write`,
				 * `subscribe`, `write`, and `flush`, and is implemented with the
				 * following pseudo-code:
				 *
				 * ```text
				 * let pollable = this.subscribe();
				 * while !contents.is_empty() {
				 * // Wait for the stream to become writable
				 * pollable.block();
				 * let Ok(n) = this.check-write(); // eliding error handling
				 * let len = min(n, contents.len());
				 * let (chunk, rest) = contents.split_at(len);
				 * this.write(chunk  );            // eliding error handling
				 * contents = rest;
				 * }
				 * this.flush();
				 * // Wait for completion of `flush`
				 * pollable.block();
				 * // Check for any errors that arose during `flush`
				 * let _ = this.check-write();         // eliding error handling
				 * ```
				 */
				blockingWriteAndFlush(contents: Uint8Array): result<void, StreamError>;

				/**
				 * Request to flush buffered output. This function never blocks.
				 *
				 * This tells the output-stream that the caller intends any buffered
				 * output to be flushed. the output which is expected to be flushed
				 * is all that has been passed to `write` prior to this call.
				 *
				 * Upon calling this function, the `output-stream` will not accept any
				 * writes (`check-write` will return `ok(0)`) until the flush has
				 * completed. The `subscribe` pollable will become ready when the
				 * flush has completed and the stream can accept more writes.
				 */
				flush(): result<void, StreamError>;

				/**
				 * Request to flush buffered output, and block until flush completes
				 * and stream is ready for writing again.
				 */
				blockingFlush(): result<void, StreamError>;

				/**
				 * Create a `pollable` which will resolve once the output-stream
				 * is ready for more writing, or an error has occured. When this
				 * pollable is ready, `check-write` will return `ok(n)` with n>0, or an
				 * error.
				 *
				 * If the stream is closed, this pollable is always ready immediately.
				 *
				 * The created `pollable` is a child resource of the `output-stream`.
				 * Implementations may trap if the `output-stream` is dropped before
				 * all derived `pollable`s created with this function are dropped.
				 */
				subscribe(): own<Pollable>;

				/**
				 * Write zeroes to a stream.
				 *
				 * This should be used precisely like `write` with the exact same
				 * preconditions (must use check-write first), but instead of
				 * passing a list of bytes, you simply pass the number of zero-bytes
				 * that should be written.
				 */
				writeZeroes(len: u64): result<void, StreamError>;

				/**
				 * Perform a write of up to 4096 zeroes, and then flush the stream.
				 * Block until all of these operations are complete, or an error
				 * occurs.
				 *
				 * This is a convenience wrapper around the use of `check-write`,
				 * `subscribe`, `write-zeroes`, and `flush`, and is implemented with
				 * the following pseudo-code:
				 *
				 * ```text
				 * let pollable = this.subscribe();
				 * while num_zeroes != 0 {
				 * // Wait for the stream to become writable
				 * pollable.block();
				 * let Ok(n) = this.check-write(); // eliding error handling
				 * let len = min(n, num_zeroes);
				 * this.write-zeroes(len);         // eliding error handling
				 * num_zeroes -= len;
				 * }
				 * this.flush();
				 * // Wait for completion of `flush`
				 * pollable.block();
				 * // Check for any errors that arose during `flush`
				 * let _ = this.check-write();         // eliding error handling
				 * ```
				 */
				blockingWriteZeroesAndFlush(len: u64): result<void, StreamError>;

				/**
				 * Read from one stream and write to another.
				 *
				 * The behavior of splice is equivelant to:
				 * 1. calling `check-write` on the `output-stream`
				 * 2. calling `read` on the `input-stream` with the smaller of the
				 * `check-write` permitted length and the `len` provided to `splice`
				 * 3. calling `write` on the `output-stream` with that read data.
				 *
				 * Any error reported by the call to `check-write`, `read`, or
				 * `write` ends the splice and reports that error.
				 *
				 * This function returns the number of bytes transferred; it may be less
				 * than `len`.
				 */
				splice(src: borrow<InputStream>, len: u64): result<u64, StreamError>;

				/**
				 * Read from one stream and write to another, with blocking.
				 *
				 * This is similar to `splice`, except that it blocks until the
				 * `output-stream` is ready for writing, and the `input-stream`
				 * is ready for reading, before performing the `splice`.
				 */
				blockingSplice(src: borrow<InputStream>, len: u64): result<u64, StreamError>;
			}
			export type Statics = {
				$drop(inst: Interface): void;
			};
			export type Class = Statics & {
			};
		}
		export type OutputStream = OutputStream.Interface;
	}
	export type Streams = {
		InputStream: Streams.InputStream.Class;
		OutputStream: Streams.OutputStream.Class;
	};
}

export namespace io {
	export namespace Error.$ {
		export const Error = new $wcm.ResourceType<io.Error.Error>('error', 'wasi:io/error/error');
		export const Error_Handle = new $wcm.ResourceHandleType('error');
		Error.addCallable('toDebugString', new $wcm.MethodType<io.Error.Error.Interface['toDebugString']>('[method]error.to-debug-string', [
			['self', new $wcm.BorrowType<io.Error.Error>(Error)],
		], $wcm.wstring));
		Error.addCallable('$drop', new $wcm.DestructorType<io.Error.Error.Statics['$drop']>('[resource-drop]error', [['inst', Error]]));
	}
	export namespace Error._ {
		export const id = 'wasi:io/error@0.2.0' as const;
		export const witName = 'error' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['Error', $.Error]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map<string, $wcm.ResourceType>([
			['Error', $.Error]
		]);
		export namespace Error {
			export type WasmInterface = {
				'[method]error.to-debug-string': (self: i32, result: ptr<string>) => void;
				'[resource-drop]error': (self: i32) => void;
			};
			type ObjectModule = {
				toDebugString(self: Error): string;
			};
			type ClassModule = {
				$drop(self: Error): void;
			};
			class Impl extends $wcm.Resource implements io.Error.Error.Interface {
				private readonly _om: ObjectModule;
				constructor(om: ObjectModule) {
					super();
					this._om = om;
				}
				public toDebugString(): string {
					return this._om.toDebugString(this);
				}
			}
			export function Class(wasmInterface: WasmInterface, context: $wcm.WasmContext): io.Error.Error.Class {
				const resource = io.Error.$.Error;
				const om: ObjectModule = $wcm.Module.createObjectModule(resource, wasmInterface, context);
				const cm: ClassModule = $wcm.Module.createClassModule(resource, wasmInterface, context);
				return class extends Impl {
					constructor() {
						super(om);
					}
					public static $drop(self: Error): void {
						return cm.$drop(self);
					}
				};
			}
		}
		export type WasmInterface = {
		} & Error.WasmInterface;
		export function createImports(service: io.Error, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Imports.create<WasmInterface>(undefined, resources, service, context);
		}
		export function filterExports(exports: object, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Exports.filter<WasmInterface>(exports, undefined, resources, id, io._.version, context);
		}
		export function bindExports(wasmInterface: WasmInterface, context: $wcm.WasmContext): io.Error {
			return $wcm.Exports.bind<io.Error>(undefined, [['Error', $.Error, Error.Class]], wasmInterface, context);
		}
	}

	export namespace Poll.$ {
		export const Pollable = new $wcm.ResourceType<io.Poll.Pollable>('pollable', 'wasi:io/poll/pollable');
		export const Pollable_Handle = new $wcm.ResourceHandleType('pollable');
		Pollable.addCallable('ready', new $wcm.MethodType<io.Poll.Pollable.Interface['ready']>('[method]pollable.ready', [
			['self', new $wcm.BorrowType<io.Poll.Pollable>(Pollable)],
		], $wcm.bool));
		Pollable.addCallable('block', new $wcm.MethodType<io.Poll.Pollable.Interface['block']>('[method]pollable.block', [
			['self', new $wcm.BorrowType<io.Poll.Pollable>(Pollable)],
		], undefined));
		Pollable.addCallable('$drop', new $wcm.DestructorType<io.Poll.Pollable.Statics['$drop']>('[resource-drop]pollable', [['inst', Pollable]]));
		export const poll = new $wcm.FunctionType<io.Poll.poll>('poll',[
			['in_', new $wcm.ListType<borrow<io.Poll.Pollable>>(new $wcm.BorrowType<io.Poll.Pollable>(Pollable))],
		], new $wcm.Uint32ArrayType());
	}
	export namespace Poll._ {
		export const id = 'wasi:io/poll@0.2.0' as const;
		export const witName = 'poll' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['Pollable', $.Pollable]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['poll', $.poll]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map<string, $wcm.ResourceType>([
			['Pollable', $.Pollable]
		]);
		export namespace Pollable {
			export type WasmInterface = {
				'[method]pollable.ready': (self: i32) => i32;
				'[method]pollable.block': (self: i32) => void;
				'[resource-drop]pollable': (self: i32) => void;
			};
			type ObjectModule = {
				ready(self: Pollable): boolean;
				block(self: Pollable): void;
			};
			type ClassModule = {
				$drop(self: Pollable): void;
			};
			class Impl extends $wcm.Resource implements io.Poll.Pollable.Interface {
				private readonly _om: ObjectModule;
				constructor(om: ObjectModule) {
					super();
					this._om = om;
				}
				public ready(): boolean {
					return this._om.ready(this);
				}
				public block(): void {
					return this._om.block(this);
				}
			}
			export function Class(wasmInterface: WasmInterface, context: $wcm.WasmContext): io.Poll.Pollable.Class {
				const resource = io.Poll.$.Pollable;
				const om: ObjectModule = $wcm.Module.createObjectModule(resource, wasmInterface, context);
				const cm: ClassModule = $wcm.Module.createClassModule(resource, wasmInterface, context);
				return class extends Impl {
					constructor() {
						super(om);
					}
					public static $drop(self: Pollable): void {
						return cm.$drop(self);
					}
				};
			}
		}
		export type WasmInterface = {
			'poll': (in__ptr: i32, in__len: i32, result: ptr<Uint32Array>) => void;
		} & Pollable.WasmInterface;
		export function createImports(service: io.Poll, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Imports.create<WasmInterface>(functions, resources, service, context);
		}
		export function filterExports(exports: object, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Exports.filter<WasmInterface>(exports, functions, resources, id, io._.version, context);
		}
		export function bindExports(wasmInterface: WasmInterface, context: $wcm.WasmContext): io.Poll {
			return $wcm.Exports.bind<io.Poll>(functions, [['Pollable', $.Pollable, Pollable.Class]], wasmInterface, context);
		}
	}

	export namespace Streams.$ {
		export const Error = io.Error.$.Error;
		export const Pollable = io.Poll.$.Pollable;
		export const StreamError = new $wcm.VariantType<io.Streams.StreamError, io.Streams.StreamError._tt, io.Streams.StreamError._vt>([['lastOperationFailed', new $wcm.OwnType<io.Streams.Error>(Error)], ['closed', undefined]], io.Streams.StreamError._ctor);
		export const InputStream = new $wcm.ResourceType<io.Streams.InputStream>('input-stream', 'wasi:io/streams/input-stream');
		export const InputStream_Handle = new $wcm.ResourceHandleType('input-stream');
		export const OutputStream = new $wcm.ResourceType<io.Streams.OutputStream>('output-stream', 'wasi:io/streams/output-stream');
		export const OutputStream_Handle = new $wcm.ResourceHandleType('output-stream');
		InputStream.addCallable('read', new $wcm.MethodType<io.Streams.InputStream.Interface['read']>('[method]input-stream.read', [
			['self', new $wcm.BorrowType<io.Streams.InputStream>(InputStream)],
			['len', $wcm.u64],
		], new $wcm.ResultType<Uint8Array, io.Streams.StreamError>(new $wcm.Uint8ArrayType(), StreamError)));
		InputStream.addCallable('blockingRead', new $wcm.MethodType<io.Streams.InputStream.Interface['blockingRead']>('[method]input-stream.blocking-read', [
			['self', new $wcm.BorrowType<io.Streams.InputStream>(InputStream)],
			['len', $wcm.u64],
		], new $wcm.ResultType<Uint8Array, io.Streams.StreamError>(new $wcm.Uint8ArrayType(), StreamError)));
		InputStream.addCallable('skip', new $wcm.MethodType<io.Streams.InputStream.Interface['skip']>('[method]input-stream.skip', [
			['self', new $wcm.BorrowType<io.Streams.InputStream>(InputStream)],
			['len', $wcm.u64],
		], new $wcm.ResultType<u64, io.Streams.StreamError>($wcm.u64, StreamError)));
		InputStream.addCallable('blockingSkip', new $wcm.MethodType<io.Streams.InputStream.Interface['blockingSkip']>('[method]input-stream.blocking-skip', [
			['self', new $wcm.BorrowType<io.Streams.InputStream>(InputStream)],
			['len', $wcm.u64],
		], new $wcm.ResultType<u64, io.Streams.StreamError>($wcm.u64, StreamError)));
		InputStream.addCallable('subscribe', new $wcm.MethodType<io.Streams.InputStream.Interface['subscribe']>('[method]input-stream.subscribe', [
			['self', new $wcm.BorrowType<io.Streams.InputStream>(InputStream)],
		], new $wcm.OwnType<io.Streams.Pollable>(Pollable)));
		InputStream.addCallable('$drop', new $wcm.DestructorType<io.Streams.InputStream.Statics['$drop']>('[resource-drop]input-stream', [['inst', InputStream]]));
		OutputStream.addCallable('checkWrite', new $wcm.MethodType<io.Streams.OutputStream.Interface['checkWrite']>('[method]output-stream.check-write', [
			['self', new $wcm.BorrowType<io.Streams.OutputStream>(OutputStream)],
		], new $wcm.ResultType<u64, io.Streams.StreamError>($wcm.u64, StreamError)));
		OutputStream.addCallable('write', new $wcm.MethodType<io.Streams.OutputStream.Interface['write']>('[method]output-stream.write', [
			['self', new $wcm.BorrowType<io.Streams.OutputStream>(OutputStream)],
			['contents', new $wcm.Uint8ArrayType()],
		], new $wcm.ResultType<void, io.Streams.StreamError>(undefined, StreamError)));
		OutputStream.addCallable('blockingWriteAndFlush', new $wcm.MethodType<io.Streams.OutputStream.Interface['blockingWriteAndFlush']>('[method]output-stream.blocking-write-and-flush', [
			['self', new $wcm.BorrowType<io.Streams.OutputStream>(OutputStream)],
			['contents', new $wcm.Uint8ArrayType()],
		], new $wcm.ResultType<void, io.Streams.StreamError>(undefined, StreamError)));
		OutputStream.addCallable('flush', new $wcm.MethodType<io.Streams.OutputStream.Interface['flush']>('[method]output-stream.flush', [
			['self', new $wcm.BorrowType<io.Streams.OutputStream>(OutputStream)],
		], new $wcm.ResultType<void, io.Streams.StreamError>(undefined, StreamError)));
		OutputStream.addCallable('blockingFlush', new $wcm.MethodType<io.Streams.OutputStream.Interface['blockingFlush']>('[method]output-stream.blocking-flush', [
			['self', new $wcm.BorrowType<io.Streams.OutputStream>(OutputStream)],
		], new $wcm.ResultType<void, io.Streams.StreamError>(undefined, StreamError)));
		OutputStream.addCallable('subscribe', new $wcm.MethodType<io.Streams.OutputStream.Interface['subscribe']>('[method]output-stream.subscribe', [
			['self', new $wcm.BorrowType<io.Streams.OutputStream>(OutputStream)],
		], new $wcm.OwnType<io.Streams.Pollable>(Pollable)));
		OutputStream.addCallable('writeZeroes', new $wcm.MethodType<io.Streams.OutputStream.Interface['writeZeroes']>('[method]output-stream.write-zeroes', [
			['self', new $wcm.BorrowType<io.Streams.OutputStream>(OutputStream)],
			['len', $wcm.u64],
		], new $wcm.ResultType<void, io.Streams.StreamError>(undefined, StreamError)));
		OutputStream.addCallable('blockingWriteZeroesAndFlush', new $wcm.MethodType<io.Streams.OutputStream.Interface['blockingWriteZeroesAndFlush']>('[method]output-stream.blocking-write-zeroes-and-flush', [
			['self', new $wcm.BorrowType<io.Streams.OutputStream>(OutputStream)],
			['len', $wcm.u64],
		], new $wcm.ResultType<void, io.Streams.StreamError>(undefined, StreamError)));
		OutputStream.addCallable('splice', new $wcm.MethodType<io.Streams.OutputStream.Interface['splice']>('[method]output-stream.splice', [
			['self', new $wcm.BorrowType<io.Streams.OutputStream>(OutputStream)],
			['src', new $wcm.BorrowType<io.Streams.InputStream>(InputStream)],
			['len', $wcm.u64],
		], new $wcm.ResultType<u64, io.Streams.StreamError>($wcm.u64, StreamError)));
		OutputStream.addCallable('blockingSplice', new $wcm.MethodType<io.Streams.OutputStream.Interface['blockingSplice']>('[method]output-stream.blocking-splice', [
			['self', new $wcm.BorrowType<io.Streams.OutputStream>(OutputStream)],
			['src', new $wcm.BorrowType<io.Streams.InputStream>(InputStream)],
			['len', $wcm.u64],
		], new $wcm.ResultType<u64, io.Streams.StreamError>($wcm.u64, StreamError)));
		OutputStream.addCallable('$drop', new $wcm.DestructorType<io.Streams.OutputStream.Statics['$drop']>('[resource-drop]output-stream', [['inst', OutputStream]]));
	}
	export namespace Streams._ {
		export const id = 'wasi:io/streams@0.2.0' as const;
		export const witName = 'streams' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['Error', $.Error],
			['Pollable', $.Pollable],
			['StreamError', $.StreamError],
			['InputStream', $.InputStream],
			['OutputStream', $.OutputStream]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map<string, $wcm.ResourceType>([
			['InputStream', $.InputStream],
			['OutputStream', $.OutputStream]
		]);
		export namespace InputStream {
			export type WasmInterface = {
				'[method]input-stream.read': (self: i32, len: i64, result: ptr<result<Uint8Array, StreamError>>) => void;
				'[method]input-stream.blocking-read': (self: i32, len: i64, result: ptr<result<Uint8Array, StreamError>>) => void;
				'[method]input-stream.skip': (self: i32, len: i64, result: ptr<result<u64, StreamError>>) => void;
				'[method]input-stream.blocking-skip': (self: i32, len: i64, result: ptr<result<u64, StreamError>>) => void;
				'[method]input-stream.subscribe': (self: i32) => i32;
				'[resource-drop]input-stream': (self: i32) => void;
			};
			type ObjectModule = {
				read(self: InputStream, len: u64): result<Uint8Array, StreamError>;
				blockingRead(self: InputStream, len: u64): result<Uint8Array, StreamError>;
				skip(self: InputStream, len: u64): result<u64, StreamError>;
				blockingSkip(self: InputStream, len: u64): result<u64, StreamError>;
				subscribe(self: InputStream): own<Pollable>;
			};
			type ClassModule = {
				$drop(self: InputStream): void;
			};
			class Impl extends $wcm.Resource implements io.Streams.InputStream.Interface {
				private readonly _om: ObjectModule;
				constructor(om: ObjectModule) {
					super();
					this._om = om;
				}
				public read(len: u64): result<Uint8Array, StreamError> {
					return this._om.read(this, len);
				}
				public blockingRead(len: u64): result<Uint8Array, StreamError> {
					return this._om.blockingRead(this, len);
				}
				public skip(len: u64): result<u64, StreamError> {
					return this._om.skip(this, len);
				}
				public blockingSkip(len: u64): result<u64, StreamError> {
					return this._om.blockingSkip(this, len);
				}
				public subscribe(): own<Pollable> {
					return this._om.subscribe(this);
				}
			}
			export function Class(wasmInterface: WasmInterface, context: $wcm.WasmContext): io.Streams.InputStream.Class {
				const resource = io.Streams.$.InputStream;
				const om: ObjectModule = $wcm.Module.createObjectModule(resource, wasmInterface, context);
				const cm: ClassModule = $wcm.Module.createClassModule(resource, wasmInterface, context);
				return class extends Impl {
					constructor() {
						super(om);
					}
					public static $drop(self: InputStream): void {
						return cm.$drop(self);
					}
				};
			}
		}
		export namespace OutputStream {
			export type WasmInterface = {
				'[method]output-stream.check-write': (self: i32, result: ptr<result<u64, StreamError>>) => void;
				'[method]output-stream.write': (self: i32, contents_ptr: i32, contents_len: i32, result: ptr<result<void, StreamError>>) => void;
				'[method]output-stream.blocking-write-and-flush': (self: i32, contents_ptr: i32, contents_len: i32, result: ptr<result<void, StreamError>>) => void;
				'[method]output-stream.flush': (self: i32, result: ptr<result<void, StreamError>>) => void;
				'[method]output-stream.blocking-flush': (self: i32, result: ptr<result<void, StreamError>>) => void;
				'[method]output-stream.subscribe': (self: i32) => i32;
				'[method]output-stream.write-zeroes': (self: i32, len: i64, result: ptr<result<void, StreamError>>) => void;
				'[method]output-stream.blocking-write-zeroes-and-flush': (self: i32, len: i64, result: ptr<result<void, StreamError>>) => void;
				'[method]output-stream.splice': (self: i32, src: i32, len: i64, result: ptr<result<u64, StreamError>>) => void;
				'[method]output-stream.blocking-splice': (self: i32, src: i32, len: i64, result: ptr<result<u64, StreamError>>) => void;
				'[resource-drop]output-stream': (self: i32) => void;
			};
			type ObjectModule = {
				checkWrite(self: OutputStream): result<u64, StreamError>;
				write(self: OutputStream, contents: Uint8Array): result<void, StreamError>;
				blockingWriteAndFlush(self: OutputStream, contents: Uint8Array): result<void, StreamError>;
				flush(self: OutputStream): result<void, StreamError>;
				blockingFlush(self: OutputStream): result<void, StreamError>;
				subscribe(self: OutputStream): own<Pollable>;
				writeZeroes(self: OutputStream, len: u64): result<void, StreamError>;
				blockingWriteZeroesAndFlush(self: OutputStream, len: u64): result<void, StreamError>;
				splice(self: OutputStream, src: borrow<InputStream>, len: u64): result<u64, StreamError>;
				blockingSplice(self: OutputStream, src: borrow<InputStream>, len: u64): result<u64, StreamError>;
			};
			type ClassModule = {
				$drop(self: OutputStream): void;
			};
			class Impl extends $wcm.Resource implements io.Streams.OutputStream.Interface {
				private readonly _om: ObjectModule;
				constructor(om: ObjectModule) {
					super();
					this._om = om;
				}
				public checkWrite(): result<u64, StreamError> {
					return this._om.checkWrite(this);
				}
				public write(contents: Uint8Array): result<void, StreamError> {
					return this._om.write(this, contents);
				}
				public blockingWriteAndFlush(contents: Uint8Array): result<void, StreamError> {
					return this._om.blockingWriteAndFlush(this, contents);
				}
				public flush(): result<void, StreamError> {
					return this._om.flush(this);
				}
				public blockingFlush(): result<void, StreamError> {
					return this._om.blockingFlush(this);
				}
				public subscribe(): own<Pollable> {
					return this._om.subscribe(this);
				}
				public writeZeroes(len: u64): result<void, StreamError> {
					return this._om.writeZeroes(this, len);
				}
				public blockingWriteZeroesAndFlush(len: u64): result<void, StreamError> {
					return this._om.blockingWriteZeroesAndFlush(this, len);
				}
				public splice(src: borrow<InputStream>, len: u64): result<u64, StreamError> {
					return this._om.splice(this, src, len);
				}
				public blockingSplice(src: borrow<InputStream>, len: u64): result<u64, StreamError> {
					return this._om.blockingSplice(this, src, len);
				}
			}
			export function Class(wasmInterface: WasmInterface, context: $wcm.WasmContext): io.Streams.OutputStream.Class {
				const resource = io.Streams.$.OutputStream;
				const om: ObjectModule = $wcm.Module.createObjectModule(resource, wasmInterface, context);
				const cm: ClassModule = $wcm.Module.createClassModule(resource, wasmInterface, context);
				return class extends Impl {
					constructor() {
						super(om);
					}
					public static $drop(self: OutputStream): void {
						return cm.$drop(self);
					}
				};
			}
		}
		export type WasmInterface = {
		} & InputStream.WasmInterface & OutputStream.WasmInterface;
		export function createImports(service: io.Streams, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Imports.create<WasmInterface>(undefined, resources, service, context);
		}
		export function filterExports(exports: object, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Exports.filter<WasmInterface>(exports, undefined, resources, id, io._.version, context);
		}
		export function bindExports(wasmInterface: WasmInterface, context: $wcm.WasmContext): io.Streams {
			return $wcm.Exports.bind<io.Streams>(undefined, [['InputStream', $.InputStream, InputStream.Class], ['OutputStream', $.OutputStream, OutputStream.Class]], wasmInterface, context);
		}
	}
}

export namespace io._ {
	export const version = '0.2.0' as const;
	export const id = 'wasi:io@0.2.0' as const;
	export const witName = 'io' as const;
	export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
		['Error', Error._],
		['Poll', Poll._],
		['Streams', Streams._]
	]);
}
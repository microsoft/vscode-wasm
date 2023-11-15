/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '@vscode/wasm-component-model';
import type { borrow, resource, own, u64, result, i32, ptr, i64 } from '@vscode/wasm-component-model';

export namespace io {
	export namespace Error {
		
		export namespace Error {
			export type Module = {
				
				/**
				 * Returns a string that is suitable to assist humans in debugging
				 * this error.
				 * 
				 * WARNING: The returned string should not be consumed mechanically!
				 * It may change across platforms, hosts, or other implementation
				 * details. Parsing this string is a major platform-compatibility
				 * hazard.
				 */
				toDebugString(self: borrow<Error>): string;
			};
			export interface Interface {
				toDebugString(): string;
			}
			export type Manager = $wcm.ResourceManager<Interface>;
		}
		export type Error = resource;
	}
	export type Error<E extends io.Error.Error.Module | io.Error.Error.Manager = io.Error.Error.Module | io.Error.Error.Manager> = {
		Error: E;
	};
	
	/**
	 * A poll API intended to let users wait for I/O events on multiple handles
	 * at once.
	 */
	export namespace Poll {
		
		export namespace Pollable {
			export type Module = {
				
				/**
				 * Return the readiness of a pollable. This function never blocks.
				 * 
				 * Returns `true` when the pollable is ready, and `false` otherwise.
				 */
				ready(self: borrow<Pollable>): boolean;
				
				/**
				 * `block` returns immediately if the pollable is ready, and otherwise
				 * blocks until ready.
				 * 
				 * This function is equivalent to calling `poll.poll` on a list
				 * containing only this pollable.
				 */
				block(self: borrow<Pollable>): void;
			};
			export interface Interface {
				ready(): boolean;
				block(): void;
			}
			export type Manager = $wcm.ResourceManager<Interface>;
		}
		export type Pollable = resource;
		
		/**
		 * Poll for completion on a set of pollables.
		 * 
		 * This function takes a list of pollables, which identify I/O sources of
		 * interest, and waits until one or more of the events is ready for I/O.
		 * 
		 * The result `list<u32>` contains one or more indices of handles in the
		 * argument list that is ready for I/O.
		 * 
		 * If the list contains more elements than can be indexed with a `u32`
		 * value, this function traps.
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
	export type Poll<P extends io.Poll.Pollable.Module | io.Poll.Pollable.Manager = io.Poll.Pollable.Module | io.Poll.Pollable.Manager> = {
		Pollable: P;
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
			export type Module = {
				
				/**
				 * Perform a non-blocking read from the stream.
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
				read(self: borrow<InputStream>, len: u64): result<Uint8Array, StreamError>;
				
				/**
				 * Read bytes from a stream, after blocking until at least one byte can
				 * be read. Except for blocking, behavior is identical to `read`.
				 */
				blockingRead(self: borrow<InputStream>, len: u64): result<Uint8Array, StreamError>;
				
				/**
				 * Skip bytes from a stream. Returns number of bytes skipped.
				 * 
				 * Behaves identical to `read`, except instead of returning a list
				 * of bytes, returns the number of bytes consumed from the stream.
				 */
				skip(self: borrow<InputStream>, len: u64): result<u64, StreamError>;
				
				/**
				 * Skip bytes from a stream, after blocking until at least one byte
				 * can be skipped. Except for blocking behavior, identical to `skip`.
				 */
				blockingSkip(self: borrow<InputStream>, len: u64): result<u64, StreamError>;
				
				/**
				 * Create a `pollable` which will resolve once either the specified stream
				 * has bytes available to read or the other end of the stream has been
				 * closed.
				 * The created `pollable` is a child resource of the `input-stream`.
				 * Implementations may trap if the `input-stream` is dropped before
				 * all derived `pollable`s created with this function are dropped.
				 */
				subscribe(self: borrow<InputStream>): own<Pollable>;
			};
			export interface Interface {
				read(len: u64): result<Uint8Array, StreamError>;
				blockingRead(len: u64): result<Uint8Array, StreamError>;
				skip(len: u64): result<u64, StreamError>;
				blockingSkip(len: u64): result<u64, StreamError>;
				subscribe(): own<Pollable>;
			}
			export type Manager = $wcm.ResourceManager<Interface>;
		}
		export type InputStream = resource;
		
		export namespace OutputStream {
			export type Module = {
				
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
				checkWrite(self: borrow<OutputStream>): result<u64, StreamError>;
				
				/**
				 * Perform a write. This function never blocks.
				 * 
				 * Precondition: check-write gave permit of Ok(n) and contents has a
				 * length of less than or equal to n. Otherwise, this function will trap.
				 * 
				 * returns Err(closed) without writing if the stream has closed since
				 * the last call to check-write provided a permit.
				 */
				write(self: borrow<OutputStream>, contents: Uint8Array): result<void, StreamError>;
				
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
				 * poll-one(pollable);
				 * let Ok(n) = this.check-write(); // eliding error handling
				 * let len = min(n, contents.len());
				 * let (chunk, rest) = contents.split_at(len);
				 * this.write(chunk  );            // eliding error handling
				 * contents = rest;
				 * }
				 * this.flush();
				 * // Wait for completion of `flush`
				 * poll-one(pollable);
				 * // Check for any errors that arose during `flush`
				 * let _ = this.check-write();         // eliding error handling
				 * ```
				 */
				blockingWriteAndFlush(self: borrow<OutputStream>, contents: Uint8Array): result<void, StreamError>;
				
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
				flush(self: borrow<OutputStream>): result<void, StreamError>;
				
				/**
				 * Request to flush buffered output, and block until flush completes
				 * and stream is ready for writing again.
				 */
				blockingFlush(self: borrow<OutputStream>): result<void, StreamError>;
				
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
				subscribe(self: borrow<OutputStream>): own<Pollable>;
				
				/**
				 * Write zeroes to a stream.
				 * 
				 * this should be used precisely like `write` with the exact same
				 * preconditions (must use check-write first), but instead of
				 * passing a list of bytes, you simply pass the number of zero-bytes
				 * that should be written.
				 */
				writeZeroes(self: borrow<OutputStream>, len: u64): result<void, StreamError>;
				
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
				 * poll-one(pollable);
				 * let Ok(n) = this.check-write(); // eliding error handling
				 * let len = min(n, num_zeroes);
				 * this.write-zeroes(len);         // eliding error handling
				 * num_zeroes -= len;
				 * }
				 * this.flush();
				 * // Wait for completion of `flush`
				 * poll-one(pollable);
				 * // Check for any errors that arose during `flush`
				 * let _ = this.check-write();         // eliding error handling
				 * ```
				 */
				blockingWriteZeroesAndFlush(self: borrow<OutputStream>, len: u64): result<void, StreamError>;
				
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
				splice(self: borrow<OutputStream>, src: borrow<InputStream>, len: u64): result<u64, StreamError>;
				
				/**
				 * Read from one stream and write to another, with blocking.
				 * 
				 * This is similar to `splice`, except that it blocks until the
				 * `output-stream` is ready for writing, and the `input-stream`
				 * is ready for reading, before performing the `splice`.
				 */
				blockingSplice(self: borrow<OutputStream>, src: borrow<InputStream>, len: u64): result<u64, StreamError>;
			};
			export interface Interface {
				checkWrite(): result<u64, StreamError>;
				write(contents: Uint8Array): result<void, StreamError>;
				blockingWriteAndFlush(contents: Uint8Array): result<void, StreamError>;
				flush(): result<void, StreamError>;
				blockingFlush(): result<void, StreamError>;
				subscribe(): own<Pollable>;
				writeZeroes(len: u64): result<void, StreamError>;
				blockingWriteZeroesAndFlush(len: u64): result<void, StreamError>;
				splice(src: borrow<InputStream>, len: u64): result<u64, StreamError>;
				blockingSplice(src: borrow<InputStream>, len: u64): result<u64, StreamError>;
			}
			export type Manager = $wcm.ResourceManager<Interface>;
		}
		export type OutputStream = resource;
	}
	export type Streams<IS extends io.Streams.InputStream.Module | io.Streams.InputStream.Manager = io.Streams.InputStream.Module | io.Streams.InputStream.Manager, OS extends io.Streams.OutputStream.Module | io.Streams.OutputStream.Manager = io.Streams.OutputStream.Module | io.Streams.OutputStream.Manager> = {
		InputStream: IS;
		OutputStream: OS;
	};
	
}
export type io<E extends io.Error = io.Error, P extends io.Poll = io.Poll, S extends io.Streams = io.Streams> = {
	Error?: E;
	Poll?: P;
	Streams?: S;
};

export namespace io {
	export namespace Error.$ {
		export const Error = new $wcm.ResourceType('error');
		Error.addFunction('toDebugString', new $wcm.FunctionType<io.Error.Error.Module['toDebugString']>('[method]error.to-debug-string', [
			['self', new $wcm.BorrowType<io.Error.Error>(Error)],
		], $wcm.wstring));
	}
	export namespace Error._ {
		export const id = 'wasi:io/error' as const;
		export const witName = 'error' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['Error', $.Error]
		]);
		export const functions: Map<string, $wcm.FunctionType<$wcm.ServiceFunction>> = new Map([
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map([
			['Error', $.Error]
		]);
		export namespace Error {
			export type WasmInterface = {
				'[method]error.to-debug-string': (self: i32, result: ptr<[i32, i32]>) => void;
			};
		}
		export type WasmInterface = {
		} & Error.WasmInterface;
		export namespace Error  {
			export function Module(wasmInterface: WasmInterface, context: $wcm.Context): io.Error.Error.Module {
				return $wcm.Module.create<io.Error.Error.Module>($.Error, wasmInterface, context);
			}
			export function Manager(): io.Error.Error.Manager {
				return new $wcm.ResourceManager<io.Error.Error.Interface>();
			}
		}
		export function createHost(service: io.Error, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export type ClassService = io.Error<io.Error.Error.Manager>;
		export type ModuleService = io.Error<io.Error.Error.Module>;
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind?: $wcm.ResourceKind.class): ClassService;
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind: $wcm.ResourceKind.module): ModuleService;
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind: $wcm.ResourceKind): io.Error;
		export function createService<E extends io.Error.Error.Module | io.Error.Error.Manager>(wasmInterface: WasmInterface, context: $wcm.Context, e: $wcm.ResourceTag<E>): io.Error<E>;
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, e?: $wcm.ResourceTag<any> | $wcm.ResourceKind): io.Error {
			e = e ?? $wcm.ResourceKind.class;
			if (e === $wcm.ResourceKind.class) {
				return $wcm.Service.create<ClassService>(functions, [['Error', $.Error, Error.Manager]], wasmInterface, context);
			} else if (e === $wcm.ResourceKind.module) {
				return $wcm.Service.create<ModuleService>(functions, [['Error', $.Error, Error.Module]], wasmInterface, context);
			} else {
				return $wcm.Service.create<io.Error>(functions, [['Error', $.Error, e!]], wasmInterface, context);
			}
		}
	}
	
	export namespace Poll.$ {
		export const Pollable = new $wcm.ResourceType('pollable');
		Pollable.addFunction('ready', new $wcm.FunctionType<io.Poll.Pollable.Module['ready']>('[method]pollable.ready', [
			['self', new $wcm.BorrowType<io.Poll.Pollable>(Pollable)],
		], $wcm.bool));
		Pollable.addFunction('block', new $wcm.FunctionType<io.Poll.Pollable.Module['block']>('[method]pollable.block', [
			['self', new $wcm.BorrowType<io.Poll.Pollable>(Pollable)],
		], undefined));
		export const poll = new $wcm.FunctionType<io.Poll.poll>('poll',[
			['in_', new $wcm.ListType<borrow<io.Poll.Pollable>>(new $wcm.BorrowType<io.Poll.Pollable>(Pollable))],
		], new $wcm.Uint32ArrayType());
	}
	export namespace Poll._ {
		export const id = 'wasi:io/poll' as const;
		export const witName = 'poll' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['Pollable', $.Pollable]
		]);
		export const functions: Map<string, $wcm.FunctionType<$wcm.ServiceFunction>> = new Map([
			['poll', $.poll]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map([
			['Pollable', $.Pollable]
		]);
		export namespace Pollable {
			export type WasmInterface = {
				'[method]pollable.ready': (self: i32) => i32;
				'[method]pollable.block': (self: i32) => void;
			};
		}
		export type WasmInterface = {
			'poll': (in__ptr: i32, in__len: i32, result: ptr<[i32, i32]>) => void;
		} & Pollable.WasmInterface;
		export namespace Pollable  {
			export function Module(wasmInterface: WasmInterface, context: $wcm.Context): io.Poll.Pollable.Module {
				return $wcm.Module.create<io.Poll.Pollable.Module>($.Pollable, wasmInterface, context);
			}
			export function Manager(): io.Poll.Pollable.Manager {
				return new $wcm.ResourceManager<io.Poll.Pollable.Interface>();
			}
		}
		export function createHost(service: io.Poll, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export type ClassService = io.Poll<io.Poll.Pollable.Manager>;
		export type ModuleService = io.Poll<io.Poll.Pollable.Module>;
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind?: $wcm.ResourceKind.class): ClassService;
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind: $wcm.ResourceKind.module): ModuleService;
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind: $wcm.ResourceKind): io.Poll;
		export function createService<P extends io.Poll.Pollable.Module | io.Poll.Pollable.Manager>(wasmInterface: WasmInterface, context: $wcm.Context, p: $wcm.ResourceTag<P>): io.Poll<P>;
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, p?: $wcm.ResourceTag<any> | $wcm.ResourceKind): io.Poll {
			p = p ?? $wcm.ResourceKind.class;
			if (p === $wcm.ResourceKind.class) {
				return $wcm.Service.create<ClassService>(functions, [['Pollable', $.Pollable, Pollable.Manager]], wasmInterface, context);
			} else if (p === $wcm.ResourceKind.module) {
				return $wcm.Service.create<ModuleService>(functions, [['Pollable', $.Pollable, Pollable.Module]], wasmInterface, context);
			} else {
				return $wcm.Service.create<io.Poll>(functions, [['Pollable', $.Pollable, p!]], wasmInterface, context);
			}
		}
	}
	
	export namespace Streams.$ {
		export const Error = io.Error.$.Error;
		export const Pollable = io.Poll.$.Pollable;
		export const StreamError = new $wcm.VariantType<io.Streams.StreamError, io.Streams.StreamError._tt, io.Streams.StreamError._vt>([['lastOperationFailed', new $wcm.OwnType<io.Streams.Error>(Error)], ['closed', undefined]], io.Streams.StreamError._ctor);
		export const InputStream = new $wcm.ResourceType('input-stream');
		export const OutputStream = new $wcm.ResourceType('output-stream');
		InputStream.addFunction('read', new $wcm.FunctionType<io.Streams.InputStream.Module['read']>('[method]input-stream.read', [
			['self', new $wcm.BorrowType<io.Streams.InputStream>(InputStream)],
			['len', $wcm.u64],
		], new $wcm.ResultType<Uint8Array, io.Streams.StreamError>(new $wcm.Uint8ArrayType(), StreamError)));
		InputStream.addFunction('blockingRead', new $wcm.FunctionType<io.Streams.InputStream.Module['blockingRead']>('[method]input-stream.blocking-read', [
			['self', new $wcm.BorrowType<io.Streams.InputStream>(InputStream)],
			['len', $wcm.u64],
		], new $wcm.ResultType<Uint8Array, io.Streams.StreamError>(new $wcm.Uint8ArrayType(), StreamError)));
		InputStream.addFunction('skip', new $wcm.FunctionType<io.Streams.InputStream.Module['skip']>('[method]input-stream.skip', [
			['self', new $wcm.BorrowType<io.Streams.InputStream>(InputStream)],
			['len', $wcm.u64],
		], new $wcm.ResultType<u64, io.Streams.StreamError>($wcm.u64, StreamError)));
		InputStream.addFunction('blockingSkip', new $wcm.FunctionType<io.Streams.InputStream.Module['blockingSkip']>('[method]input-stream.blocking-skip', [
			['self', new $wcm.BorrowType<io.Streams.InputStream>(InputStream)],
			['len', $wcm.u64],
		], new $wcm.ResultType<u64, io.Streams.StreamError>($wcm.u64, StreamError)));
		InputStream.addFunction('subscribe', new $wcm.FunctionType<io.Streams.InputStream.Module['subscribe']>('[method]input-stream.subscribe', [
			['self', new $wcm.BorrowType<io.Streams.InputStream>(InputStream)],
		], new $wcm.OwnType<io.Streams.Pollable>(Pollable)));
		OutputStream.addFunction('checkWrite', new $wcm.FunctionType<io.Streams.OutputStream.Module['checkWrite']>('[method]output-stream.check-write', [
			['self', new $wcm.BorrowType<io.Streams.OutputStream>(OutputStream)],
		], new $wcm.ResultType<u64, io.Streams.StreamError>($wcm.u64, StreamError)));
		OutputStream.addFunction('write', new $wcm.FunctionType<io.Streams.OutputStream.Module['write']>('[method]output-stream.write', [
			['self', new $wcm.BorrowType<io.Streams.OutputStream>(OutputStream)],
			['contents', new $wcm.Uint8ArrayType()],
		], new $wcm.ResultType<void, io.Streams.StreamError>(undefined, StreamError)));
		OutputStream.addFunction('blockingWriteAndFlush', new $wcm.FunctionType<io.Streams.OutputStream.Module['blockingWriteAndFlush']>('[method]output-stream.blocking-write-and-flush', [
			['self', new $wcm.BorrowType<io.Streams.OutputStream>(OutputStream)],
			['contents', new $wcm.Uint8ArrayType()],
		], new $wcm.ResultType<void, io.Streams.StreamError>(undefined, StreamError)));
		OutputStream.addFunction('flush', new $wcm.FunctionType<io.Streams.OutputStream.Module['flush']>('[method]output-stream.flush', [
			['self', new $wcm.BorrowType<io.Streams.OutputStream>(OutputStream)],
		], new $wcm.ResultType<void, io.Streams.StreamError>(undefined, StreamError)));
		OutputStream.addFunction('blockingFlush', new $wcm.FunctionType<io.Streams.OutputStream.Module['blockingFlush']>('[method]output-stream.blocking-flush', [
			['self', new $wcm.BorrowType<io.Streams.OutputStream>(OutputStream)],
		], new $wcm.ResultType<void, io.Streams.StreamError>(undefined, StreamError)));
		OutputStream.addFunction('subscribe', new $wcm.FunctionType<io.Streams.OutputStream.Module['subscribe']>('[method]output-stream.subscribe', [
			['self', new $wcm.BorrowType<io.Streams.OutputStream>(OutputStream)],
		], new $wcm.OwnType<io.Streams.Pollable>(Pollable)));
		OutputStream.addFunction('writeZeroes', new $wcm.FunctionType<io.Streams.OutputStream.Module['writeZeroes']>('[method]output-stream.write-zeroes', [
			['self', new $wcm.BorrowType<io.Streams.OutputStream>(OutputStream)],
			['len', $wcm.u64],
		], new $wcm.ResultType<void, io.Streams.StreamError>(undefined, StreamError)));
		OutputStream.addFunction('blockingWriteZeroesAndFlush', new $wcm.FunctionType<io.Streams.OutputStream.Module['blockingWriteZeroesAndFlush']>('[method]output-stream.blocking-write-zeroes-and-flush', [
			['self', new $wcm.BorrowType<io.Streams.OutputStream>(OutputStream)],
			['len', $wcm.u64],
		], new $wcm.ResultType<void, io.Streams.StreamError>(undefined, StreamError)));
		OutputStream.addFunction('splice', new $wcm.FunctionType<io.Streams.OutputStream.Module['splice']>('[method]output-stream.splice', [
			['self', new $wcm.BorrowType<io.Streams.OutputStream>(OutputStream)],
			['src', new $wcm.BorrowType<io.Streams.InputStream>(InputStream)],
			['len', $wcm.u64],
		], new $wcm.ResultType<u64, io.Streams.StreamError>($wcm.u64, StreamError)));
		OutputStream.addFunction('blockingSplice', new $wcm.FunctionType<io.Streams.OutputStream.Module['blockingSplice']>('[method]output-stream.blocking-splice', [
			['self', new $wcm.BorrowType<io.Streams.OutputStream>(OutputStream)],
			['src', new $wcm.BorrowType<io.Streams.InputStream>(InputStream)],
			['len', $wcm.u64],
		], new $wcm.ResultType<u64, io.Streams.StreamError>($wcm.u64, StreamError)));
	}
	export namespace Streams._ {
		export const id = 'wasi:io/streams' as const;
		export const witName = 'streams' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['Error', $.Error],
			['Pollable', $.Pollable],
			['StreamError', $.StreamError],
			['InputStream', $.InputStream],
			['OutputStream', $.OutputStream]
		]);
		export const functions: Map<string, $wcm.FunctionType<$wcm.ServiceFunction>> = new Map([
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map([
			['InputStream', $.InputStream],
			['OutputStream', $.OutputStream]
		]);
		export namespace InputStream {
			export type WasmInterface = {
				'[method]input-stream.read': (self: i32, len: i64, result: ptr<[i32, i32, i32]>) => void;
				'[method]input-stream.blocking-read': (self: i32, len: i64, result: ptr<[i32, i32, i32]>) => void;
				'[method]input-stream.skip': (self: i32, len: i64, result: ptr<[i32, i64, i32]>) => void;
				'[method]input-stream.blocking-skip': (self: i32, len: i64, result: ptr<[i32, i64, i32]>) => void;
				'[method]input-stream.subscribe': (self: i32) => i32;
			};
		}
		export namespace OutputStream {
			export type WasmInterface = {
				'[method]output-stream.check-write': (self: i32, result: ptr<[i32, i64, i32]>) => void;
				'[method]output-stream.write': (self: i32, contents_ptr: i32, contents_len: i32, result: ptr<[i32, i32, i32]>) => void;
				'[method]output-stream.blocking-write-and-flush': (self: i32, contents_ptr: i32, contents_len: i32, result: ptr<[i32, i32, i32]>) => void;
				'[method]output-stream.flush': (self: i32, result: ptr<[i32, i32, i32]>) => void;
				'[method]output-stream.blocking-flush': (self: i32, result: ptr<[i32, i32, i32]>) => void;
				'[method]output-stream.subscribe': (self: i32) => i32;
				'[method]output-stream.write-zeroes': (self: i32, len: i64, result: ptr<[i32, i32, i32]>) => void;
				'[method]output-stream.blocking-write-zeroes-and-flush': (self: i32, len: i64, result: ptr<[i32, i32, i32]>) => void;
				'[method]output-stream.splice': (self: i32, src: i32, len: i64, result: ptr<[i32, i64, i32]>) => void;
				'[method]output-stream.blocking-splice': (self: i32, src: i32, len: i64, result: ptr<[i32, i64, i32]>) => void;
			};
		}
		export type WasmInterface = {
		} & InputStream.WasmInterface & OutputStream.WasmInterface;
		export namespace InputStream  {
			export function Module(wasmInterface: WasmInterface, context: $wcm.Context): io.Streams.InputStream.Module {
				return $wcm.Module.create<io.Streams.InputStream.Module>($.InputStream, wasmInterface, context);
			}
			export function Manager(): io.Streams.InputStream.Manager {
				return new $wcm.ResourceManager<io.Streams.InputStream.Interface>();
			}
		}
		export namespace OutputStream  {
			export function Module(wasmInterface: WasmInterface, context: $wcm.Context): io.Streams.OutputStream.Module {
				return $wcm.Module.create<io.Streams.OutputStream.Module>($.OutputStream, wasmInterface, context);
			}
			export function Manager(): io.Streams.OutputStream.Manager {
				return new $wcm.ResourceManager<io.Streams.OutputStream.Interface>();
			}
		}
		export function createHost(service: io.Streams, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export type ClassService = io.Streams<io.Streams.InputStream.Manager, io.Streams.OutputStream.Manager>;
		export type ModuleService = io.Streams<io.Streams.InputStream.Module, io.Streams.OutputStream.Module>;
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind?: $wcm.ResourceKind.class): ClassService;
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind: $wcm.ResourceKind.module): ModuleService;
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind: $wcm.ResourceKind): io.Streams;
		export function createService<IS extends io.Streams.InputStream.Module | io.Streams.InputStream.Manager, OS extends io.Streams.OutputStream.Module | io.Streams.OutputStream.Manager>(wasmInterface: WasmInterface, context: $wcm.Context, is: $wcm.ResourceTag<IS>, os: $wcm.ResourceTag<OS>): io.Streams<IS, OS>;
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, is?: $wcm.ResourceTag<any> | $wcm.ResourceKind, os?: $wcm.ResourceTag<any>): io.Streams {
			is = is ?? $wcm.ResourceKind.class;
			if (is === $wcm.ResourceKind.class) {
				return $wcm.Service.create<ClassService>(functions, [['InputStream', $.InputStream, InputStream.Manager], ['OutputStream', $.OutputStream, OutputStream.Manager]], wasmInterface, context);
			} else if (is === $wcm.ResourceKind.module) {
				return $wcm.Service.create<ModuleService>(functions, [['InputStream', $.InputStream, InputStream.Module], ['OutputStream', $.OutputStream, OutputStream.Module]], wasmInterface, context);
			} else {
				return $wcm.Service.create<io.Streams>(functions, [['InputStream', $.InputStream, is!], ['OutputStream', $.OutputStream, os!]], wasmInterface, context);
			}
		}
	}
}

export namespace io._ {
	export const id = 'wasi:io' as const;
	export const witName = 'io' as const;
	export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
		['Error', Error._],
		['Poll', Poll._],
		['Streams', Streams._]
	]);
	export type WasmInterface = {
		'wasi:io/error'?: Error._.WasmInterface;
		'wasi:io/poll'?: Poll._.WasmInterface;
		'wasi:io/streams'?: Streams._.WasmInterface;
	};
	export function createHost(service: io, context: $wcm.Context): WasmInterface {
		const result: WasmInterface = Object.create(null);
		if (service.Error !== undefined) {
			result['wasi:io/error'] = Error._.createHost(service.Error, context);
		}
		if (service.Poll !== undefined) {
			result['wasi:io/poll'] = Poll._.createHost(service.Poll, context);
		}
		if (service.Streams !== undefined) {
			result['wasi:io/streams'] = Streams._.createHost(service.Streams, context);
		}
		return result;
	}
	export type ClassService = io<io.Error._.ClassService, io.Poll._.ClassService, io.Streams._.ClassService>;
	export type ModuleService = io<io.Error._.ModuleService, io.Poll._.ModuleService, io.Streams._.ModuleService>;
	export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind?: $wcm.ResourceKind.class): ClassService;
	export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind: $wcm.ResourceKind.module): ModuleService;
	export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind: $wcm.ResourceKind): io;
	export function createService<E extends io.Error, P extends io.Poll, S extends io.Streams>(wasmInterface: WasmInterface, context: $wcm.Context, e: io.Error, p: io.Poll, s: io.Streams): io<E, P, S>;
	export function createService(wasmInterface: WasmInterface, context: $wcm.Context, e?: io.Error | $wcm.ResourceKind, p?: io.Poll, s?: io.Streams): io {
		const result: io = Object.create(null);
		e = e ?? $wcm.ResourceKind.class;
		if (e === $wcm.ResourceKind.class || e === $wcm.ResourceKind.module) {
			if (wasmInterface['wasi:io/error'] !== undefined) {
				result.Error = Error._.createService(wasmInterface['wasi:io/error'], context, e);
			}
			if (wasmInterface['wasi:io/poll'] !== undefined) {
				result.Poll = Poll._.createService(wasmInterface['wasi:io/poll'], context, e);
			}
			if (wasmInterface['wasi:io/streams'] !== undefined) {
				result.Streams = Streams._.createService(wasmInterface['wasi:io/streams'], context, e);
			}
		} else {
			if (wasmInterface['wasi:io/error'] !== undefined) {
				result.Error = e;
			}
			if (wasmInterface['wasi:io/poll'] !== undefined) {
				result.Poll = p;
			}
			if (wasmInterface['wasi:io/streams'] !== undefined) {
				result.Streams = s;
			}
		}
		return result;
	}
}
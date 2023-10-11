/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '@vscode/wasm-component-model';
import type { resource, borrow, own, u64, result, i32, ptr, i64 } from '@vscode/wasm-component-model';

export namespace io {
	/**
	 * A poll API intended to let users wait for I/O events on multiple handles
	 * at once.
	 */
	export namespace Poll {
		
		/**
		 * A "pollable" handle.
		 */
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
		export declare function pollList(in_: borrow<Pollable>[]): Uint32Array;
		
		/**
		 * Poll for completion on a single pollable.
		 * 
		 * This function is similar to `poll-list`, but operates on only a single
		 * pollable. When it returns, the handle is ready for I/O.
		 */
		export declare function pollOne(in_: borrow<Pollable>): void;
	}
	export type Poll = Pick<typeof Poll, 'pollList' | 'pollOne'>;
	
	/**
	 * WASI I/O is an I/O abstraction API which is currently focused on providing
	 * stream types.
	 * 
	 * In the future, the component model is expected to add built-in stream types;
	 * when it does, they are expected to subsume this API.
	 */
	export namespace Streams {
		
		export type Pollable = io.Poll.Pollable;
		
		/**
		 * Contextual error information about the last failure that happened on
		 * a read, write, or flush from an `input-stream` or `output-stream`.
		 * 
		 * This type is returned through the `stream-error` type whenever an
		 * operation on a stream directly fails or an error is discovered
		 * after-the-fact, for example when a write's failure shows up through a
		 * later `flush` or `check-write`.
		 * 
		 * Interfaces such as `wasi:filesystem/types` provide functionality to
		 * further "downcast" this error into interface-specific error information.
		 */
		export type Error = resource;
		export namespace Error {
			
			/**
			 * Returns a string that's suitable to assist humans in debugging this
			 * error.
			 * 
			 * The returned string will change across platforms and hosts which
			 * means that parsing it, for example, would be a
			 * platform-compatibility hazard.
			 */
			export declare function toDebugString(self: borrow<Error>): string;
		}
		
		/**
		 * An error for input-stream and output-stream operations.
		 */
		export namespace StreamError {
			
			/**
			 * The last operation (a write or flush) failed before completion.
			 * 
			 * More information is available in the `error` payload.
			 */
			export const lastOperationFailed = 0 as const;
			export type lastOperationFailed = { readonly case: typeof lastOperationFailed; readonly value: own<Error> } & _common;
			
			
			/**
			 * The stream is closed: no more input will be accepted by the
			 * stream. A closed output-stream will return this error on all
			 * future operations.
			 */
			export const closed = 1 as const;
			export type closed = { readonly case: typeof closed } & _common;
			
			export type _ct = typeof lastOperationFailed | typeof closed;
			export type _vt = own<Error> | undefined;
			type _common = Omit<VariantImpl, 'case' | 'value'>;
			export function _ctor(c: _ct, v: _vt): StreamError {
				return new VariantImpl(c, v) as StreamError;
			}
			export function _lastOperationFailed(value: own<Error>): lastOperationFailed {
				return new VariantImpl(lastOperationFailed, value) as lastOperationFailed;
			}
			export function _closed(): closed {
				return new VariantImpl(closed, undefined) as closed;
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
				lastOperationFailed(): this is lastOperationFailed {
					return this._case === StreamError.lastOperationFailed;
				}
				closed(): this is closed {
					return this._case === StreamError.closed;
				}
			}
		}
		export type StreamError = StreamError.lastOperationFailed | StreamError.closed;
		
		/**
		 * An input bytestream.
		 * 
		 * `input-stream`s are *non-blocking* to the extent practical on underlying
		 * platforms. I/O operations always return promptly; if fewer bytes are
		 * promptly available than requested, they return the number of bytes promptly
		 * available, which could even be zero. To wait for data to be available,
		 * use the `subscribe` function to obtain a `pollable` which can be polled
		 * for using `wasi:io/poll`.
		 */
		export type InputStream = resource;
		export namespace InputStream {
			
			/**
			 * Perform a non-blocking read from the stream.
			 * 
			 * This function returns a list of bytes containing the data that was
			 * read, along with a `stream-status` which, indicates whether further
			 * reads are expected to produce data. The returned list will contain up to
			 * `len` bytes; it may return fewer than requested, but not more. An
			 * empty list and `stream-status:open` indicates no more data is
			 * available at this time, and that the pollable given by `subscribe`
			 * will be ready when more data is available.
			 * 
			 * Once a stream has reached the end, subsequent calls to `read` or
			 * `skip` will always report `stream-status:ended` rather than producing more
			 * data.
			 * 
			 * When the caller gives a `len` of 0, it represents a request to read 0
			 * bytes. This read should  always succeed and return an empty list and
			 * the current `stream-status`.
			 * 
			 * The `len` parameter is a `u64`, which could represent a list of u8 which
			 * is not possible to allocate in wasm32, or not desirable to allocate as
			 * as a return value by the callee. The callee may return a list of bytes
			 * less than `len` in size while more bytes are available for reading.
			 */
			export declare function read(self: borrow<InputStream>, len: u64): result<Uint8Array, StreamError>;
			
			/**
			 * Read bytes from a stream, after blocking until at least one byte can
			 * be read. Except for blocking, identical to `read`.
			 */
			export declare function blockingRead(self: borrow<InputStream>, len: u64): result<Uint8Array, StreamError>;
			
			/**
			 * Skip bytes from a stream.
			 * 
			 * This is similar to the `read` function, but avoids copying the
			 * bytes into the instance.
			 * 
			 * Once a stream has reached the end, subsequent calls to read or
			 * `skip` will always report end-of-stream rather than producing more
			 * data.
			 * 
			 * This function returns the number of bytes skipped, along with a
			 * `stream-status` indicating whether the end of the stream was
			 * reached. The returned value will be at most `len`; it may be less.
			 */
			export declare function skip(self: borrow<InputStream>, len: u64): result<u64, StreamError>;
			
			/**
			 * Skip bytes from a stream, after blocking until at least one byte
			 * can be skipped. Except for blocking behavior, identical to `skip`.
			 */
			export declare function blockingSkip(self: borrow<InputStream>, len: u64): result<u64, StreamError>;
			
			/**
			 * Create a `pollable` which will resolve once either the specified stream
			 * has bytes available to read or the other end of the stream has been
			 * closed.
			 * The created `pollable` is a child resource of the `input-stream`.
			 * Implementations may trap if the `input-stream` is dropped before
			 * all derived `pollable`s created with this function are dropped.
			 */
			export declare function subscribe(self: borrow<InputStream>): own<Pollable>;
		}
		
		/**
		 * An output bytestream.
		 * 
		 * `output-stream`s are *non-blocking* to the extent practical on
		 * underlying platforms. Except where specified otherwise, I/O operations also
		 * always return promptly, after the number of bytes that can be written
		 * promptly, which could even be zero. To wait for the stream to be ready to
		 * accept data, the `subscribe` function to obtain a `pollable` which can be
		 * polled for using `wasi:io/poll`.
		 */
		export type OutputStream = resource;
		export namespace OutputStream {
			
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
			export declare function checkWrite(self: borrow<OutputStream>): result<u64, StreamError>;
			
			/**
			 * Perform a write. This function never blocks.
			 * 
			 * Precondition: check-write gave permit of Ok(n) and contents has a
			 * length of less than or equal to n. Otherwise, this function will trap.
			 * 
			 * returns Err(closed) without writing if the stream has closed since
			 * the last call to check-write provided a permit.
			 */
			export declare function write(self: borrow<OutputStream>, contents: Uint8Array): result<void, StreamError>;
			
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
			export declare function blockingWriteAndFlush(self: borrow<OutputStream>, contents: Uint8Array): result<void, StreamError>;
			
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
			export declare function flush(self: borrow<OutputStream>): result<void, StreamError>;
			
			/**
			 * Request to flush buffered output, and block until flush completes
			 * and stream is ready for writing again.
			 */
			export declare function blockingFlush(self: borrow<OutputStream>): result<void, StreamError>;
			
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
			export declare function subscribe(self: borrow<OutputStream>): own<Pollable>;
			
			/**
			 * Write zeroes to a stream.
			 * 
			 * this should be used precisely like `write` with the exact same
			 * preconditions (must use check-write first), but instead of
			 * passing a list of bytes, you simply pass the number of zero-bytes
			 * that should be written.
			 */
			export declare function writeZeroes(self: borrow<OutputStream>, len: u64): result<void, StreamError>;
			
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
			export declare function blockingWriteZeroesAndFlush(self: borrow<OutputStream>, len: u64): result<void, StreamError>;
			
			/**
			 * Read from one stream and write to another.
			 * 
			 * This function returns the number of bytes transferred; it may be less
			 * than `len`.
			 * 
			 * Unlike other I/O functions, this function blocks until all the data
			 * read from the input stream has been written to the output stream.
			 */
			export declare function splice(self: borrow<OutputStream>, src: own<InputStream>, len: u64): result<u64, StreamError>;
			
			/**
			 * Read from one stream and write to another, with blocking.
			 * 
			 * This is similar to `splice`, except that it blocks until at least
			 * one byte can be read.
			 */
			export declare function blockingSplice(self: borrow<OutputStream>, src: own<InputStream>, len: u64): result<u64, StreamError>;
			
			/**
			 * Forward the entire contents of an input stream to an output stream.
			 * 
			 * This function repeatedly reads from the input stream and writes
			 * the data to the output stream, until the end of the input stream
			 * is reached, or an error is encountered.
			 * 
			 * Unlike other I/O functions, this function blocks until the end
			 * of the input stream is seen and all the data has been written to
			 * the output stream.
			 * 
			 * This function returns the number of bytes transferred, and the status of
			 * the output stream.
			 */
			export declare function forward(self: borrow<OutputStream>, src: own<InputStream>): result<u64, StreamError>;
		}
	}
	export type Streams = Pick<typeof Streams, 'Error' | 'InputStream' | 'OutputStream'>;
	
}

export namespace io {
	export namespace Poll.$ {
		export const Pollable = new $wcm.NamespaceResourceType('Pollable', 'pollable');
		export const pollList = new $wcm.FunctionType<typeof io.Poll.pollList>('pollList', 'poll-list',[
			['in_', new $wcm.ListType<borrow<io.Poll.Pollable>>(new $wcm.BorrowType<io.Poll.Pollable>(Pollable))],
		], new $wcm.Uint32ArrayType());
		export const pollOne = new $wcm.FunctionType<typeof io.Poll.pollOne>('pollOne', 'poll-one',[
			['in_', new $wcm.BorrowType<io.Poll.Pollable>(Pollable)],
		], undefined);
	}
	export namespace Poll._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [$.pollList, $.pollOne];
		const resources: $wcm.NamespaceResourceType[] = [$.Pollable];
		export type WasmInterface = {
			'poll-list': (in__ptr: i32, in__len: i32, result: ptr<[i32, i32]>) => void;
			'poll-one': (in_: i32) => void;
		};
		export function createHost(service: io.Poll, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context): io.Poll {
			return $wcm.Service.create<io.Poll>(functions, resources, wasmInterface, context);
		}
	}
	export namespace Streams.$ {
		export const Pollable = io.Poll.$.Pollable;
		export const Error = new $wcm.NamespaceResourceType('Error', 'error');
		export const StreamError = new $wcm.VariantType<io.Streams.StreamError, io.Streams.StreamError._ct, io.Streams.StreamError._vt>([new $wcm.OwnType<io.Streams.Error>(Error), undefined], io.Streams.StreamError._ctor);
		export const InputStream = new $wcm.NamespaceResourceType('InputStream', 'input-stream');
		export const OutputStream = new $wcm.NamespaceResourceType('OutputStream', 'output-stream');
		Error.addFunction(new $wcm.FunctionType<typeof io.Streams.Error.toDebugString>('toDebugString', '[method]error.to-debug-string', [
			['self', new $wcm.BorrowType<io.Streams.Error>(Error)],
		], $wcm.wstring));
		InputStream.addFunction(new $wcm.FunctionType<typeof io.Streams.InputStream.read>('read', '[method]input-stream.read', [
			['self', new $wcm.BorrowType<io.Streams.InputStream>(InputStream)],
			['len', $wcm.u64],
		], new $wcm.ResultType<Uint8Array, io.Streams.StreamError>(new $wcm.Uint8ArrayType(), StreamError)));
		InputStream.addFunction(new $wcm.FunctionType<typeof io.Streams.InputStream.blockingRead>('blockingRead', '[method]input-stream.blocking-read', [
			['self', new $wcm.BorrowType<io.Streams.InputStream>(InputStream)],
			['len', $wcm.u64],
		], new $wcm.ResultType<Uint8Array, io.Streams.StreamError>(new $wcm.Uint8ArrayType(), StreamError)));
		InputStream.addFunction(new $wcm.FunctionType<typeof io.Streams.InputStream.skip>('skip', '[method]input-stream.skip', [
			['self', new $wcm.BorrowType<io.Streams.InputStream>(InputStream)],
			['len', $wcm.u64],
		], new $wcm.ResultType<u64, io.Streams.StreamError>($wcm.u64, StreamError)));
		InputStream.addFunction(new $wcm.FunctionType<typeof io.Streams.InputStream.blockingSkip>('blockingSkip', '[method]input-stream.blocking-skip', [
			['self', new $wcm.BorrowType<io.Streams.InputStream>(InputStream)],
			['len', $wcm.u64],
		], new $wcm.ResultType<u64, io.Streams.StreamError>($wcm.u64, StreamError)));
		InputStream.addFunction(new $wcm.FunctionType<typeof io.Streams.InputStream.subscribe>('subscribe', '[method]input-stream.subscribe', [
			['self', new $wcm.BorrowType<io.Streams.InputStream>(InputStream)],
		], new $wcm.OwnType<io.Streams.Pollable>(Pollable)));
		OutputStream.addFunction(new $wcm.FunctionType<typeof io.Streams.OutputStream.checkWrite>('checkWrite', '[method]output-stream.check-write', [
			['self', new $wcm.BorrowType<io.Streams.OutputStream>(OutputStream)],
		], new $wcm.ResultType<u64, io.Streams.StreamError>($wcm.u64, StreamError)));
		OutputStream.addFunction(new $wcm.FunctionType<typeof io.Streams.OutputStream.write>('write', '[method]output-stream.write', [
			['self', new $wcm.BorrowType<io.Streams.OutputStream>(OutputStream)],
			['contents', new $wcm.Uint8ArrayType()],
		], new $wcm.ResultType<void, io.Streams.StreamError>(undefined, StreamError)));
		OutputStream.addFunction(new $wcm.FunctionType<typeof io.Streams.OutputStream.blockingWriteAndFlush>('blockingWriteAndFlush', '[method]output-stream.blocking-write-and-flush', [
			['self', new $wcm.BorrowType<io.Streams.OutputStream>(OutputStream)],
			['contents', new $wcm.Uint8ArrayType()],
		], new $wcm.ResultType<void, io.Streams.StreamError>(undefined, StreamError)));
		OutputStream.addFunction(new $wcm.FunctionType<typeof io.Streams.OutputStream.flush>('flush', '[method]output-stream.flush', [
			['self', new $wcm.BorrowType<io.Streams.OutputStream>(OutputStream)],
		], new $wcm.ResultType<void, io.Streams.StreamError>(undefined, StreamError)));
		OutputStream.addFunction(new $wcm.FunctionType<typeof io.Streams.OutputStream.blockingFlush>('blockingFlush', '[method]output-stream.blocking-flush', [
			['self', new $wcm.BorrowType<io.Streams.OutputStream>(OutputStream)],
		], new $wcm.ResultType<void, io.Streams.StreamError>(undefined, StreamError)));
		OutputStream.addFunction(new $wcm.FunctionType<typeof io.Streams.OutputStream.subscribe>('subscribe', '[method]output-stream.subscribe', [
			['self', new $wcm.BorrowType<io.Streams.OutputStream>(OutputStream)],
		], new $wcm.OwnType<io.Streams.Pollable>(Pollable)));
		OutputStream.addFunction(new $wcm.FunctionType<typeof io.Streams.OutputStream.writeZeroes>('writeZeroes', '[method]output-stream.write-zeroes', [
			['self', new $wcm.BorrowType<io.Streams.OutputStream>(OutputStream)],
			['len', $wcm.u64],
		], new $wcm.ResultType<void, io.Streams.StreamError>(undefined, StreamError)));
		OutputStream.addFunction(new $wcm.FunctionType<typeof io.Streams.OutputStream.blockingWriteZeroesAndFlush>('blockingWriteZeroesAndFlush', '[method]output-stream.blocking-write-zeroes-and-flush', [
			['self', new $wcm.BorrowType<io.Streams.OutputStream>(OutputStream)],
			['len', $wcm.u64],
		], new $wcm.ResultType<void, io.Streams.StreamError>(undefined, StreamError)));
		OutputStream.addFunction(new $wcm.FunctionType<typeof io.Streams.OutputStream.splice>('splice', '[method]output-stream.splice', [
			['self', new $wcm.BorrowType<io.Streams.OutputStream>(OutputStream)],
			['src', new $wcm.OwnType<io.Streams.InputStream>(InputStream)],
			['len', $wcm.u64],
		], new $wcm.ResultType<u64, io.Streams.StreamError>($wcm.u64, StreamError)));
		OutputStream.addFunction(new $wcm.FunctionType<typeof io.Streams.OutputStream.blockingSplice>('blockingSplice', '[method]output-stream.blocking-splice', [
			['self', new $wcm.BorrowType<io.Streams.OutputStream>(OutputStream)],
			['src', new $wcm.OwnType<io.Streams.InputStream>(InputStream)],
			['len', $wcm.u64],
		], new $wcm.ResultType<u64, io.Streams.StreamError>($wcm.u64, StreamError)));
		OutputStream.addFunction(new $wcm.FunctionType<typeof io.Streams.OutputStream.forward>('forward', '[method]output-stream.forward', [
			['self', new $wcm.BorrowType<io.Streams.OutputStream>(OutputStream)],
			['src', new $wcm.OwnType<io.Streams.InputStream>(InputStream)],
		], new $wcm.ResultType<u64, io.Streams.StreamError>($wcm.u64, StreamError)));
	}
	export namespace Streams._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [];
		const resources: $wcm.NamespaceResourceType[] = [$.Error, $.InputStream, $.OutputStream];
		export type WasmInterface = {
			'[method]error.to-debug-string': (self: i32, result: ptr<[i32, i32]>) => void;
			'[method]input-stream.read': (self: i32, len: i64, result: ptr<[i32, i32, i32]>) => void;
			'[method]input-stream.blocking-read': (self: i32, len: i64, result: ptr<[i32, i32, i32]>) => void;
			'[method]input-stream.skip': (self: i32, len: i64, result: ptr<[i32, i64, i32]>) => void;
			'[method]input-stream.blocking-skip': (self: i32, len: i64, result: ptr<[i32, i64, i32]>) => void;
			'[method]input-stream.subscribe': (self: i32) => i32;
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
			'[method]output-stream.forward': (self: i32, src: i32, result: ptr<[i32, i64, i32]>) => void;
		};
		export function createHost(service: io.Streams, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context): io.Streams {
			return $wcm.Service.create<io.Streams>(functions, resources, wasmInterface, context);
		}
	}
}
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '@vscode/wasm-component-model';
import type { u32, u64, result, i32, i64, f32, f64, ptr } from '@vscode/wasm-component-model';
import { poll } from './poll';

export namespace io {
	/**
	 * WASI I/O is an I/O abstraction API which is currently focused on providing
	 * stream types.
	 * 
	 * In the future, the component model is expected to add built-in stream types;
	 * when it does, they are expected to subsume this API.
	 */
	export namespace Streams {
		
		export type Pollable = poll.Poll.Pollable;
		
		/**
		 * Streams provide a sequence of data and then end; once they end, they
		 * no longer provide any further data.
		 * 
		 * For example, a stream reading from a file ends when the stream reaches
		 * the end of the file. For another example, a stream reading from a
		 * socket ends when the socket is closed.
		 */
		export enum StreamStatus {
			open = 0,
			ended = 1,
		}
		
		/**
		 * An input bytestream. In the future, this will be replaced by handle
		 * types.
		 * 
		 * `input-stream`s are *non-blocking* to the extent practical on underlying
		 * platforms. I/O operations always return promptly; if fewer bytes are
		 * promptly available than requested, they return the number of bytes promptly
		 * available, which could even be zero. To wait for data to be available,
		 * use the `subscribe-to-input-stream` function to obtain a `pollable` which
		 * can be polled for using `wasi:poll/poll.poll_oneoff`.
		 * 
		 * And at present, it is a `u32` instead of being an actual handle, until
		 * the wit-bindgen implementation of handles and resources is ready.
		 * 
		 * This [represents a resource](https://github.com/WebAssembly/WASI/blob/main/docs/WitInWasi.md#Resources).
		 */
		export type InputStream = u32;
		
		/**
		 * An output bytestream. In the future, this will be replaced by handle
		 * types.
		 * 
		 * `output-stream`s are *non-blocking* to the extent practical on
		 * underlying platforms. Except where specified otherwise, I/O operations also
		 * always return promptly, after the number of bytes that can be written
		 * promptly, which could even be zero. To wait for the stream to be ready to
		 * accept data, the `subscribe-to-output-stream` function to obtain a
		 * `pollable` which can be polled for using `wasi:poll`.
		 * 
		 * And at present, it is a `u32` instead of being an actual handle, until
		 * the wit-bindgen implementation of handles and resources is ready.
		 * 
		 * This [represents a resource](https://github.com/WebAssembly/WASI/blob/main/docs/WitInWasi.md#Resources).
		 */
		export type OutputStream = u32;
		
		/**
		 * An error for output-stream operations.
		 * 
		 * Contrary to input-streams, a closed output-stream is reported using
		 * an error.
		 */
		export enum WriteError {
			lastOperationFailed = 0,
			closed = 1,
		}
		
		/**
		 * Perform a non-blocking read from the stream.
		 * 
		 * This function returns a list of bytes containing the data that was
		 * read, along with a `stream-status` which, indicates whether further
		 * reads are expected to produce data. The returned list will contain up to
		 * `len` bytes; it may return fewer than requested, but not more. An
		 * empty list and `stream-status:open` indicates no more data is
		 * available at this time, and that the pollable given by
		 * `subscribe-to-input-stream` will be ready when more data is available.
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
		export declare function read(this_: InputStream, len: u64): result<[Uint8Array, StreamStatus], void>;
		
		/**
		 * Read bytes from a stream, after blocking until at least one byte can
		 * be read. Except for blocking, identical to `read`.
		 */
		export declare function blockingRead(this_: InputStream, len: u64): result<[Uint8Array, StreamStatus], void>;
		
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
		export declare function skip(this_: InputStream, len: u64): result<[u64, StreamStatus], void>;
		
		/**
		 * Skip bytes from a stream, after blocking until at least one byte
		 * can be skipped. Except for blocking behavior, identical to `skip`.
		 */
		export declare function blockingSkip(this_: InputStream, len: u64): result<[u64, StreamStatus], void>;
		
		/**
		 * Create a `pollable` which will resolve once either the specified stream
		 * has bytes available to read or the other end of the stream has been
		 * closed.
		 * The created `pollable` is a child resource of the `input-stream`.
		 * Implementations may trap if the `input-stream` is dropped before
		 * all derived `pollable`s created with this function are dropped.
		 */
		export declare function subscribeToInputStream(this_: InputStream): Pollable;
		
		/**
		 * Dispose of the specified `input-stream`, after which it may no longer
		 * be used.
		 * Implementations may trap if this `input-stream` is dropped while child
		 * `pollable` resources are still alive.
		 * After this `input-stream` is dropped, implementations may report any
		 * corresponding `output-stream` has `stream-state.closed`.
		 */
		export declare function dropInputStream(this_: InputStream): void;
		
		/**
		 * Check readiness for writing. This function never blocks.
		 * 
		 * Returns the number of bytes permitted for the next call to `write`,
		 * or an error. Calling `write` with more bytes than this function has
		 * permitted will trap.
		 * 
		 * When this function returns 0 bytes, the `subscribe-to-output-stream`
		 * pollable will become ready when this function will report at least
		 * 1 byte, or an error.
		 */
		export declare function checkWrite(this_: OutputStream): result<u64, WriteError>;
		
		/**
		 * Perform a write. This function never blocks.
		 * 
		 * Precondition: check-write gave permit of Ok(n) and contents has a
		 * length of less than or equal to n. Otherwise, this function will trap.
		 * 
		 * returns Err(closed) without writing if the stream has closed since
		 * the last call to check-write provided a permit.
		 */
		export declare function write(this_: OutputStream, contents: Uint8Array): result<void, WriteError>;
		
		/**
		 * Perform a write of up to 4096 bytes, and then flush the stream. Block
		 * until all of these operations are complete, or an error occurs.
		 * 
		 * This is a convenience wrapper around the use of `check-write`,
		 * `subscribe-to-output-stream`, `write`, and `flush`, and is implemented
		 * with the following pseudo-code:
		 * 
		 * ```text
		 * let pollable = subscribe-to-output-stream(this);
		 * while !contents.is_empty() {
		 * // Wait for the stream to become writable
		 * poll-oneoff(pollable);
		 * let Ok(n) = check-write(this); // eliding error handling
		 * let len = min(n, contents.len());
		 * let (chunk, rest) = contents.split_at(len);
		 * write(this, chunk);            // eliding error handling
		 * contents = rest;
		 * }
		 * flush(this);
		 * // Wait for completion of `flush`
		 * poll-oneoff(pollable);
		 * // Check for any errors that arose during `flush`
		 * let _ = check-write(this);       // eliding error handling
		 * ```
		 */
		export declare function blockingWriteAndFlush(this_: OutputStream, contents: Uint8Array): result<void, WriteError>;
		
		/**
		 * Request to flush buffered output. This function never blocks.
		 * 
		 * This tells the output-stream that the caller intends any buffered
		 * output to be flushed. the output which is expected to be flushed
		 * is all that has been passed to `write` prior to this call.
		 * 
		 * Upon calling this function, the `output-stream` will not accept any
		 * writes (`check-write` will return `ok(0)`) until the flush has
		 * completed. The `subscribe-to-output-stream` pollable will become ready
		 * when the flush has completed and the stream can accept more writes.
		 */
		export declare function flush(this_: OutputStream): result<void, WriteError>;
		
		/**
		 * Request to flush buffered output, and block until flush completes
		 * and stream is ready for writing again.
		 */
		export declare function blockingFlush(this_: OutputStream): result<void, WriteError>;
		
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
		export declare function subscribeToOutputStream(this_: OutputStream): Pollable;
		
		/**
		 * Write zeroes to a stream.
		 * 
		 * this should be used precisely like `write` with the exact same
		 * preconditions (must use check-write first), but instead of
		 * passing a list of bytes, you simply pass the number of zero-bytes
		 * that should be written.
		 */
		export declare function writeZeroes(this_: OutputStream, len: u64): result<void, WriteError>;
		
		/**
		 * Read from one stream and write to another.
		 * 
		 * This function returns the number of bytes transferred; it may be less
		 * than `len`.
		 * 
		 * Unlike other I/O functions, this function blocks until all the data
		 * read from the input stream has been written to the output stream.
		 */
		export declare function splice(this_: OutputStream, src: InputStream, len: u64): result<[u64, StreamStatus], void>;
		
		/**
		 * Read from one stream and write to another, with blocking.
		 * 
		 * This is similar to `splice`, except that it blocks until at least
		 * one byte can be read.
		 */
		export declare function blockingSplice(this_: OutputStream, src: InputStream, len: u64): result<[u64, StreamStatus], void>;
		
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
		export declare function forward(this_: OutputStream, src: InputStream): result<[u64, StreamStatus], void>;
		
		/**
		 * Dispose of the specified `output-stream`, after which it may no longer
		 * be used.
		 * Implementations may trap if this `output-stream` is dropped while
		 * child `pollable` resources are still alive.
		 * After this `output-stream` is dropped, implementations may report any
		 * corresponding `input-stream` has `stream-state.closed`.
		 */
		export declare function dropOutputStream(this_: OutputStream): void;
	}
	export type Streams = Pick<typeof Streams, 'read' | 'blockingRead' | 'skip' | 'blockingSkip' | 'subscribeToInputStream' | 'dropInputStream' | 'checkWrite' | 'write' | 'blockingWriteAndFlush' | 'flush' | 'blockingFlush' | 'subscribeToOutputStream' | 'writeZeroes' | 'splice' | 'blockingSplice' | 'forward' | 'dropOutputStream'>;
	
}

export namespace io {
	export namespace Streams.$ {
		export const Pollable = poll.Poll.$.Pollable;
		export const StreamStatus = new $wcm.EnumType<io.Streams.StreamStatus>(2);
		export const InputStream = $wcm.u32;
		export const OutputStream = $wcm.u32;
		export const WriteError = new $wcm.EnumType<io.Streams.WriteError>(2);
		export const read = new $wcm.FunctionType<typeof io.Streams.read>('read', 'read',[
			['this_', InputStream],
			['len', $wcm.u64],
		], new $wcm.ResultType<[Uint8Array, io.Streams.StreamStatus], void>(new $wcm.TupleType<[Uint8Array, io.Streams.StreamStatus]>([new $wcm.Uint8ArrayType(), StreamStatus]), undefined));
		export const blockingRead = new $wcm.FunctionType<typeof io.Streams.blockingRead>('blockingRead', 'blocking-read',[
			['this_', InputStream],
			['len', $wcm.u64],
		], new $wcm.ResultType<[Uint8Array, io.Streams.StreamStatus], void>(new $wcm.TupleType<[Uint8Array, io.Streams.StreamStatus]>([new $wcm.Uint8ArrayType(), StreamStatus]), undefined));
		export const skip = new $wcm.FunctionType<typeof io.Streams.skip>('skip', 'skip',[
			['this_', InputStream],
			['len', $wcm.u64],
		], new $wcm.ResultType<[u64, io.Streams.StreamStatus], void>(new $wcm.TupleType<[u64, io.Streams.StreamStatus]>([$wcm.u64, StreamStatus]), undefined));
		export const blockingSkip = new $wcm.FunctionType<typeof io.Streams.blockingSkip>('blockingSkip', 'blocking-skip',[
			['this_', InputStream],
			['len', $wcm.u64],
		], new $wcm.ResultType<[u64, io.Streams.StreamStatus], void>(new $wcm.TupleType<[u64, io.Streams.StreamStatus]>([$wcm.u64, StreamStatus]), undefined));
		export const subscribeToInputStream = new $wcm.FunctionType<typeof io.Streams.subscribeToInputStream>('subscribeToInputStream', 'subscribe-to-input-stream',[
			['this_', InputStream],
		], Pollable);
		export const dropInputStream = new $wcm.FunctionType<typeof io.Streams.dropInputStream>('dropInputStream', 'drop-input-stream',[
			['this_', InputStream],
		], undefined);
		export const checkWrite = new $wcm.FunctionType<typeof io.Streams.checkWrite>('checkWrite', 'check-write',[
			['this_', OutputStream],
		], new $wcm.ResultType<u64, io.Streams.WriteError>($wcm.u64, WriteError));
		export const write = new $wcm.FunctionType<typeof io.Streams.write>('write', 'write',[
			['this_', OutputStream],
			['contents', new $wcm.Uint8ArrayType()],
		], new $wcm.ResultType<void, io.Streams.WriteError>(undefined, WriteError));
		export const blockingWriteAndFlush = new $wcm.FunctionType<typeof io.Streams.blockingWriteAndFlush>('blockingWriteAndFlush', 'blocking-write-and-flush',[
			['this_', OutputStream],
			['contents', new $wcm.Uint8ArrayType()],
		], new $wcm.ResultType<void, io.Streams.WriteError>(undefined, WriteError));
		export const flush = new $wcm.FunctionType<typeof io.Streams.flush>('flush', 'flush',[
			['this_', OutputStream],
		], new $wcm.ResultType<void, io.Streams.WriteError>(undefined, WriteError));
		export const blockingFlush = new $wcm.FunctionType<typeof io.Streams.blockingFlush>('blockingFlush', 'blocking-flush',[
			['this_', OutputStream],
		], new $wcm.ResultType<void, io.Streams.WriteError>(undefined, WriteError));
		export const subscribeToOutputStream = new $wcm.FunctionType<typeof io.Streams.subscribeToOutputStream>('subscribeToOutputStream', 'subscribe-to-output-stream',[
			['this_', OutputStream],
		], Pollable);
		export const writeZeroes = new $wcm.FunctionType<typeof io.Streams.writeZeroes>('writeZeroes', 'write-zeroes',[
			['this_', OutputStream],
			['len', $wcm.u64],
		], new $wcm.ResultType<void, io.Streams.WriteError>(undefined, WriteError));
		export const splice = new $wcm.FunctionType<typeof io.Streams.splice>('splice', 'splice',[
			['this_', OutputStream],
			['src', InputStream],
			['len', $wcm.u64],
		], new $wcm.ResultType<[u64, io.Streams.StreamStatus], void>(new $wcm.TupleType<[u64, io.Streams.StreamStatus]>([$wcm.u64, StreamStatus]), undefined));
		export const blockingSplice = new $wcm.FunctionType<typeof io.Streams.blockingSplice>('blockingSplice', 'blocking-splice',[
			['this_', OutputStream],
			['src', InputStream],
			['len', $wcm.u64],
		], new $wcm.ResultType<[u64, io.Streams.StreamStatus], void>(new $wcm.TupleType<[u64, io.Streams.StreamStatus]>([$wcm.u64, StreamStatus]), undefined));
		export const forward = new $wcm.FunctionType<typeof io.Streams.forward>('forward', 'forward',[
			['this_', OutputStream],
			['src', InputStream],
		], new $wcm.ResultType<[u64, io.Streams.StreamStatus], void>(new $wcm.TupleType<[u64, io.Streams.StreamStatus]>([$wcm.u64, StreamStatus]), undefined));
		export const dropOutputStream = new $wcm.FunctionType<typeof io.Streams.dropOutputStream>('dropOutputStream', 'drop-output-stream',[
			['this_', OutputStream],
		], undefined);
	}
	export namespace Streams._ {
		const allFunctions = [$.read, $.blockingRead, $.skip, $.blockingSkip, $.subscribeToInputStream, $.dropInputStream, $.checkWrite, $.write, $.blockingWriteAndFlush, $.flush, $.blockingFlush, $.subscribeToOutputStream, $.writeZeroes, $.splice, $.blockingSplice, $.forward, $.dropOutputStream];
		export type WasmInterface = {
			'read': (result: ptr<(i32 | i64 | f32 | f64)[]>) => void;
			'blocking-read': (result: ptr<(i32 | i64 | f32 | f64)[]>) => void;
			'skip': (result: ptr<(i32 | i64 | f32 | f64)[]>) => void;
			'blocking-skip': (result: ptr<(i32 | i64 | f32 | f64)[]>) => void;
			'subscribe-to-input-stream': (this_: i32) => i32;
			'drop-input-stream': (this_: i32) => void;
			'check-write': (result: ptr<(i32 | i64 | f32 | f64)[]>) => void;
			'write': (result: ptr<(i32 | i64 | f32 | f64)[]>) => void;
			'blocking-write-and-flush': (result: ptr<(i32 | i64 | f32 | f64)[]>) => void;
			'flush': (result: ptr<(i32 | i64 | f32 | f64)[]>) => void;
			'blocking-flush': (result: ptr<(i32 | i64 | f32 | f64)[]>) => void;
			'subscribe-to-output-stream': (this_: i32) => i32;
			'write-zeroes': (result: ptr<(i32 | i64 | f32 | f64)[]>) => void;
			'splice': (result: ptr<(i32 | i64 | f32 | f64)[]>) => void;
			'blocking-splice': (result: ptr<(i32 | i64 | f32 | f64)[]>) => void;
			'forward': (result: ptr<(i32 | i64 | f32 | f64)[]>) => void;
			'drop-output-stream': (this_: i32) => void;
		};
		export function createHost<T extends $wcm.Host>(service: io.Streams, context: $wcm.Context): T {
			return $wcm.Host.create<T>(allFunctions, service, context);
		}
		export function createService(wasmInterface: $wcm.WasmInterface, context: $wcm.Context): io.Streams {
			return $wcm.Service.create<io.Streams>(allFunctions, wasmInterface, context);
		}
	}
}
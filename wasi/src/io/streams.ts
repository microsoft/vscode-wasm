import * as $wcm from '@vscode/wasm-component-model';
import type { u32, u64, result } from '@vscode/wasm-component-model';
import { poll } from '../poll/poll';

export namespace streams {
	type pollable = poll.pollable;

	/**
	 * Streams provide a sequence of data and then end; once they end, they
	 * no longer provide any further data.
	 *
	 * For example, a stream reading from a file ends when the stream reaches
	 * the end of the file. For another example, a stream reading from a
	 * socket ends when the socket is closed.
	 */
	export enum stream_status {
		/**
		 * The stream is open and may produce further data.
		 */
		open = 0,

		/**
		 * When reading, this indicates that the stream will not produce
		 * further data.
		 * When writing, this indicates that the stream will no longer be read.
		 * Further writes are still permitted.
		 */
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
	export type input_stream = u32;

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
	export declare function read($this: input_stream, len: u64): result<void, [Uint8Array, stream_status]>;

	/**
	 * Read bytes from a stream, after blocking until at least one byte can
	 * be read. Except for blocking, identical to `read`.
	 */
	export declare function blocking_read($this: input_stream, len: u64): result<void, [Uint8Array, stream_status]>;

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
	export declare function skip($this: input_stream, len: u64): result<void, [u64, stream_status]>;

	/**
	 * Skip bytes from a stream, after blocking until at least one byte
	 * can be skipped. Except for blocking behavior, identical to `skip`.
	 */
	export declare function blocking_skip($this: input_stream, len: u64): result<void, [u64, stream_status]>;

	/**
	 * Create a `pollable` which will resolve once either the specified stream
	 * has bytes available to read or the other end of the stream has been
	 * closed.
	 * The created `pollable` is a child resource of the `input-stream`.
	 * Implementations may trap if the `input-stream` is dropped before
	 * all derived `pollable`s created with this function are dropped.
	 */
	export declare function subscribe_to_input_stream($this: input_stream): pollable;

	/**
	 * Dispose of the specified `input-stream`, after which it may no longer
	 * be used.
	 * Implementations may trap if this `input-stream` is dropped while child
	 * `pollable` resources are still alive.
	 * After this `input-stream` is dropped, implementations may report any
	 * corresponding `output-stream` has `stream-state.closed`.
	 */
	export declare function drop_input_stream($this: input_stream): void;

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
	export type output_stream = u32;

	/**
	 * Perform a non-blocking write of bytes to a stream.
	 *
	 * This function returns a `u64` and a `stream-status`. The `u64` indicates
	 * the number of bytes from `buf` that were written, which may be less than
	 * the length of `buf`. The `stream-status` indicates if further writes to
	 * the stream are expected to be read.
	 *
	 * When the returned `stream-status` is `open`, the `u64` return value may
	 * be less than the length of `buf`. This indicates that no more bytes may
	 * be written to the stream promptly. In that case the
	 * `subscribe-to-output-stream` pollable will indicate when additional bytes
	 * may be promptly written.
	 *
	 * Writing an empty list must return a non-error result with `0` for the
	 * `u64` return value, and the current `stream-status`.
	 */
	export declare function write($this: output_stream, buf: Uint8Array): result<void, [u64, stream_status]>;

	/**
	 * Blocking write of bytes to a stream.
	 *
	 * This is similar to `write`, except that it blocks until at least one
	 * byte can be written.
	 */
	export declare function blocking_write($this: output_stream, buf: Uint8Array): result<void, [u64, stream_status]>;

	/**
	 * Write multiple zero-bytes to a stream.
	 *
	 * This function returns a `u64` indicating the number of zero-bytes
	 * that were written; it may be less than `len`. Equivelant to a call to
	 * `write` with a list of zeroes of the given length.
	 */
	export declare function write_zeroes($this: output_stream, len: u64): result<void, [u64, stream_status]>;

	/**
	 * Write multiple zero bytes to a stream, with blocking.
	 *
	 * This is similar to `write-zeroes`, except that it blocks until at least
	 * one byte can be written. Equivelant to a call to `blocking-write` with
	 * a list of zeroes of the given length.
	 */
	export declare function blocking_write_zeroes($this: output_stream, len: u64): result<void, [u64, stream_status]>;

	/**
	 * Read from one stream and write to another.
	 *
	 * This function returns the number of bytes transferred; it may be less
	 * than `len`.
	 *
	 * Unlike other I/O functions, this function blocks until all the data
	 * read from the input stream has been written to the output stream.
	 */
	export declare function splice($this: output_stream, src: input_stream, len: u64): result<void, [u64, stream_status]>;

	/**
	 * Read from one stream and write to another, with blocking.
	 *
	 * This is similar to `splice`, except that it blocks until at least
	 * one byte can be read.
	 */
	export declare function blocking_splice($this: output_stream, src: input_stream, len: u64): result<void, [u64, stream_status]>;

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
	export declare function forward($this: output_stream, src: input_stream): result<void, [u64, stream_status]>;

	/**
	 * Create a `pollable` which will resolve once either the specified stream
	 * is ready to accept bytes or the `stream-state` has become closed.
	 *
	 * Once the stream-state is closed, this pollable is always ready
	 * immediately.
	 *
	 * The created `pollable` is a child resource of the `output-stream`.
	 * Implementations may trap if the `output-stream` is dropped before
	 * all derived `pollable`s created with this function are dropped.
	 */
	export declare function subscribe_to_output_stream($this: output_stream): pollable;

	/**
	 * Dispose of the specified `output-stream`, after which it may no longer
	 * be used.
	 * Implementations may trap if this `output-stream` is dropped while
	 * child `pollable` resources are still alive.
	 * After this `output-stream` is dropped, implementations may report any
	 * corresponding `input-stream` has `stream-state.closed`.
	 */
	export declare function drop_output_stream($this: output_stream): void;


	export namespace $cm {
		const $pollable = poll.$cm.$pollable;
		export const $input_stream = $wcm.u32;
		export const $output_stream = $wcm.u32;
		export const $stream_status = new $wcm.EnumType<stream_status>(2);
		export const $read = new $wcm.FunctionSignature('read', [
			['$this', $input_stream], ['len', $wcm.u64]
		], new $wcm.ResultType<void, [Uint8Array, stream_status]>(undefined, new $wcm.TupleType<[Uint8Array, stream_status]>([new $wcm.Uint8ArrayType(), $stream_status])));
		export const $blocking_read = new $wcm.FunctionSignature('blocking_read', [
			['$this', $input_stream], ['len', $wcm.u64]
		], new $wcm.ResultType<void, [Uint8Array, stream_status]>(undefined, new $wcm.TupleType<[Uint8Array, stream_status]>([new $wcm.Uint8ArrayType(), $stream_status])));
		export const $skip = new $wcm.FunctionSignature('skip', [
			['$this', $input_stream], ['len', $wcm.u64]
		], new $wcm.ResultType<void, [u64, stream_status]>(undefined, new $wcm.TupleType<[u64, stream_status]>([$wcm.u64, $stream_status])));
		export const $blocking_skip = new $wcm.FunctionSignature('blocking_skip', [
			['$this', $input_stream], ['len', $wcm.u64]
		], new $wcm.ResultType<void, [u64, stream_status]>(undefined, new $wcm.TupleType<[u64, stream_status]>([$wcm.u64, $stream_status])));
		export const $subscribe_to_input_stream = new $wcm.FunctionSignature('subscribe_to_input_stream', [
			['$this', $input_stream]
		], $pollable);
		export const $drop_input_stream = new $wcm.FunctionSignature('drop_input_stream', [
			['$this', $input_stream]
		]);
		export const $write = new $wcm.FunctionSignature('write', [
			['$this', $output_stream], ['buf', new $wcm.Uint8ArrayType()]
		], new $wcm.ResultType<void, [u64, stream_status]>(undefined, new $wcm.TupleType<[u64, stream_status]>([$wcm.u64, $stream_status])));
		export const $blocking_write = new $wcm.FunctionSignature('blocking_write', [
			['$this', $output_stream], ['buf', new $wcm.Uint8ArrayType()]
		], new $wcm.ResultType<void, [u64, stream_status]>(undefined, new $wcm.TupleType<[u64, stream_status]>([$wcm.u64, $stream_status])));
		export const $write_zeroes = new $wcm.FunctionSignature('write_zeroes', [
			['$this', $output_stream], ['len', $wcm.u64]
		], new $wcm.ResultType<void, [u64, stream_status]>(undefined, new $wcm.TupleType<[u64, stream_status]>([$wcm.u64, $stream_status])));
		export const $blocking_write_zeroes = new $wcm.FunctionSignature('blocking_write_zeroes', [
			['$this', $output_stream], ['len', $wcm.u64]
		], new $wcm.ResultType<void, [u64, stream_status]>(undefined, new $wcm.TupleType<[u64, stream_status]>([$wcm.u64, $stream_status])));
		export const $splice = new $wcm.FunctionSignature('splice', [
			['$this', $output_stream], ['src', $input_stream], ['len', $wcm.u64]
		], new $wcm.ResultType<void, [u64, stream_status]>(undefined, new $wcm.TupleType<[u64, stream_status]>([$wcm.u64, $stream_status])));
		export const $blocking_splice = new $wcm.FunctionSignature('blocking_splice', [
			['$this', $output_stream], ['src', $input_stream], ['len', $wcm.u64]
		], new $wcm.ResultType<void, [u64, stream_status]>(undefined, new $wcm.TupleType<[u64, stream_status]>([$wcm.u64, $stream_status])));
		export const $forward = new $wcm.FunctionSignature('forward', [
			['$this', $output_stream], ['src', $input_stream]
		], new $wcm.ResultType<void, [u64, stream_status]>(undefined, new $wcm.TupleType<[u64, stream_status]>([$wcm.u64, $stream_status])));
		export const $subscribe_to_output_stream = new $wcm.FunctionSignature('subscribe_to_output_stream', [
			['$this', $output_stream]
		], $pollable);
		export const $drop_output_stream = new $wcm.FunctionSignature('drop_output_stream', [
			['$this', $output_stream]
		]);
	}
}
export type streams = Pick<typeof streams, 'read' | 'blocking_read' | 'skip' | 'blocking_skip' | 'subscribe_to_input_stream' | 'drop_input_stream' | 'write' | 'blocking_write' | 'write_zeroes' | 'blocking_write_zeroes' | 'splice' | 'blocking_splice' | 'forward' | 'subscribe_to_output_stream' | 'drop_output_stream'>;
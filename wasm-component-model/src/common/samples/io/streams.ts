import * as $wcm from '../../componentModel';
import type { u32, u64, u8, result } from '../../componentModel';
import { poll } from '../poll/main';

export namespace streams {
	export type pollable = poll.pollable;
	export interface stream_error extends $wcm.JRecord {
		dummy: u32;
	}
	export enum stream_status {
		open = 0,
		ended = 1,
	}
	export type input_stream = u32;
	export declare function read($this: input_stream, len: u64): result<[u8[], stream_status], stream_error>;
	export declare function blocking_read($this: input_stream, len: u64): result<[u8[], stream_status], stream_error>;
	export declare function skip($this: input_stream, len: u64): result<[u64, stream_status], stream_error>;
	export declare function blocking_skip($this: input_stream, len: u64): result<[u64, stream_status], stream_error>;
	export declare function subscribe_to_input_stream($this: input_stream): pollable;
	export declare function drop_input_stream($this: input_stream): void;
	export type output_stream = u32;
	export declare function write($this: output_stream, buf: u8[]): result<[u64, stream_status], stream_error>;
	export declare function blocking_write($this: output_stream, buf: u8[]): result<[u64, stream_status], stream_error>;
	export declare function write_zeroes($this: output_stream, len: u64): result<[u64, stream_status], stream_error>;
	export declare function blocking_write_zeroes($this: output_stream, len: u64): result<[u64, stream_status], stream_error>;
	export declare function splice($this: output_stream, src: input_stream, len: u64): result<[u64, stream_status], stream_error>;
	export declare function blocking_splice($this: output_stream, src: input_stream, len: u64): result<[u64, stream_status], stream_error>;
	export declare function forward($this: output_stream, src: input_stream): result<[u64, stream_status], stream_error>;
	export declare function subscribe_to_output_stream($this: output_stream): pollable;
	export declare function drop_output_stream($this: output_stream): void;
	export namespace $cm {
		const $pollable: $wcm.ComponentModelType<pollable> = poll.$cm.$pollable;
		export const $stream_error: $wcm.ComponentModelType<stream_error> = new $wcm.RecordType<stream_error>([
			['dummy', $wcm.u32]
		]);
		export const $stream_status: $wcm.ComponentModelType<stream_status> = new $wcm.EnumType<stream_status>(2);
		export const $input_stream: $wcm.ComponentModelType<input_stream> = $wcm.u32;
		export const $output_stream: $wcm.ComponentModelType<output_stream> = $wcm.u32;
		export const $read: $wcm.FunctionSignature = new $wcm.FunctionSignature('read', [
			['$this', $input_stream], ['len', $wcm.u64]
		], new $wcm.ResultType<[u8[], stream_status], stream_error>(new $wcm.TupleType<[u8[], stream_status]>([new $wcm.ListType<u8>($wcm.u8), $stream_status]), $stream_error));
		export const $blocking_read: $wcm.FunctionSignature = new $wcm.FunctionSignature('blocking_read', [
			['$this', $input_stream], ['len', $wcm.u64]
		], new $wcm.ResultType<[u8[], stream_status], stream_error>(new $wcm.TupleType<[u8[], stream_status]>([new $wcm.ListType<u8>($wcm.u8), $stream_status]), $stream_error));
		export const $skip: $wcm.FunctionSignature = new $wcm.FunctionSignature('skip', [
			['$this', $input_stream], ['len', $wcm.u64]
		], new $wcm.ResultType<[u64, stream_status], stream_error>(new $wcm.TupleType<[u64, stream_status]>([$wcm.u64, $stream_status]), $stream_error));
		export const $blocking_skip: $wcm.FunctionSignature = new $wcm.FunctionSignature('blocking_skip', [
			['$this', $input_stream], ['len', $wcm.u64]
		], new $wcm.ResultType<[u64, stream_status], stream_error>(new $wcm.TupleType<[u64, stream_status]>([$wcm.u64, $stream_status]), $stream_error));
		export const $subscribe_to_input_stream: $wcm.FunctionSignature = new $wcm.FunctionSignature('subscribe_to_input_stream', [
			['$this', $input_stream]
		], $pollable);
		export const $drop_input_stream: $wcm.FunctionSignature = new $wcm.FunctionSignature('drop_input_stream', [
			['$this', $input_stream]
		]);
		export const $write: $wcm.FunctionSignature = new $wcm.FunctionSignature('write', [
			['$this', $output_stream], ['buf', new $wcm.ListType<u8>($wcm.u8)]
		], new $wcm.ResultType<[u64, stream_status], stream_error>(new $wcm.TupleType<[u64, stream_status]>([$wcm.u64, $stream_status]), $stream_error));
		export const $blocking_write: $wcm.FunctionSignature = new $wcm.FunctionSignature('blocking_write', [
			['$this', $output_stream], ['buf', new $wcm.ListType<u8>($wcm.u8)]
		], new $wcm.ResultType<[u64, stream_status], stream_error>(new $wcm.TupleType<[u64, stream_status]>([$wcm.u64, $stream_status]), $stream_error));
		export const $write_zeroes: $wcm.FunctionSignature = new $wcm.FunctionSignature('write_zeroes', [
			['$this', $output_stream], ['len', $wcm.u64]
		], new $wcm.ResultType<[u64, stream_status], stream_error>(new $wcm.TupleType<[u64, stream_status]>([$wcm.u64, $stream_status]), $stream_error));
		export const $blocking_write_zeroes: $wcm.FunctionSignature = new $wcm.FunctionSignature('blocking_write_zeroes', [
			['$this', $output_stream], ['len', $wcm.u64]
		], new $wcm.ResultType<[u64, stream_status], stream_error>(new $wcm.TupleType<[u64, stream_status]>([$wcm.u64, $stream_status]), $stream_error));
		export const $splice: $wcm.FunctionSignature = new $wcm.FunctionSignature('splice', [
			['$this', $output_stream], ['src', $input_stream], ['len', $wcm.u64]
		], new $wcm.ResultType<[u64, stream_status], stream_error>(new $wcm.TupleType<[u64, stream_status]>([$wcm.u64, $stream_status]), $stream_error));
		export const $blocking_splice: $wcm.FunctionSignature = new $wcm.FunctionSignature('blocking_splice', [
			['$this', $output_stream], ['src', $input_stream], ['len', $wcm.u64]
		], new $wcm.ResultType<[u64, stream_status], stream_error>(new $wcm.TupleType<[u64, stream_status]>([$wcm.u64, $stream_status]), $stream_error));
		export const $forward: $wcm.FunctionSignature = new $wcm.FunctionSignature('forward', [
			['$this', $output_stream], ['src', $input_stream]
		], new $wcm.ResultType<[u64, stream_status], stream_error>(new $wcm.TupleType<[u64, stream_status]>([$wcm.u64, $stream_status]), $stream_error));
		export const $subscribe_to_output_stream: $wcm.FunctionSignature = new $wcm.FunctionSignature('subscribe_to_output_stream', [
			['$this', $output_stream]
		], $pollable);
		export const $drop_output_stream: $wcm.FunctionSignature = new $wcm.FunctionSignature('drop_output_stream', [
			['$this', $output_stream]
		]);
	}
}
export type streams = Pick<typeof streams, 'read' | 'blocking_read' | 'skip' | 'blocking_skip' | 'subscribe_to_input_stream' | 'drop_input_stream' | 'write' | 'blocking_write' | 'write_zeroes' | 'blocking_write_zeroes' | 'splice' | 'blocking_splice' | 'forward' | 'subscribe_to_output_stream' | 'drop_output_stream'>;
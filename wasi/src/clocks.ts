/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '@vscode/wasm-component-model';
import type { u64, own, u32, i64, i32, ptr } from '@vscode/wasm-component-model';
import { io } from './io';

export namespace clocks {
	/**
	 * WASI Monotonic Clock is a clock API intended to let users measure elapsed
	 * time.
	 * 
	 * It is intended to be portable at least between Unix-family platforms and
	 * Windows.
	 * 
	 * A monotonic clock is a clock which has an unspecified initial value, and
	 * successive reads of the clock will produce non-decreasing values.
	 * 
	 * It is intended for measuring elapsed time.
	 */
	export namespace monotonicClock {
		export type Pollable = io.poll.Pollable;

		/**
		 * An instant in time, in nanoseconds. An instant is relative to an
		 * unspecified initial value, and can only be compared to instances from
		 * the same monotonic-clock.
		 */
		export type Instant = u64;

		/**
		 * A duration of time, in nanoseconds.
		 */
		export type Duration = u64;

		/**
		 * Read the current value of the clock.
		 * 
		 * The clock is monotonic, therefore calling this function repeatedly will
		 * produce a sequence of non-decreasing values.
		 */
		export type now = () => Instant;

		/**
		 * Query the resolution of the clock. Returns the duration of time
		 * corresponding to a clock tick.
		 */
		export type resolution = () => Duration;

		/**
		 * Create a `pollable` which will resolve once the specified instant
		 * occured.
		 */
		export type subscribeInstant = (when: Instant) => own<Pollable>;

		/**
		 * Create a `pollable` which will resolve once the given duration has
		 * elapsed, starting at the time at which this function was called.
		 * occured.
		 */
		export type subscribeDuration = (when: Duration) => own<Pollable>;
	}
	export type MonotonicClock = {
		now: monotonicClock.now;
		resolution: monotonicClock.resolution;
		subscribeInstant: monotonicClock.subscribeInstant;
		subscribeDuration: monotonicClock.subscribeDuration;
	};

	/**
	 * WASI Wall Clock is a clock API intended to let users query the current
	 * time. The name "wall" makes an analogy to a "clock on the wall", which
	 * is not necessarily monotonic as it may be reset.
	 * 
	 * It is intended to be portable at least between Unix-family platforms and
	 * Windows.
	 * 
	 * A wall clock is a clock which measures the date and time according to
	 * some external reference.
	 * 
	 * External references may be reset, so this clock is not necessarily
	 * monotonic, making it unsuitable for measuring elapsed time.
	 * 
	 * It is intended for reporting the current date and time for humans.
	 */
	export namespace wallClock {
		/**
		 * A time and date in seconds plus nanoseconds.
		 */
		export type Datetime = {
			seconds: u64;
			nanoseconds: u32;
		};

		/**
		 * Read the current value of the clock.
		 * 
		 * This clock is not monotonic, therefore calling this function repeatedly
		 * will not necessarily produce a sequence of non-decreasing values.
		 * 
		 * The returned timestamps represent the number of seconds since
		 * 1970-01-01T00:00:00Z, also known as [POSIX's Seconds Since the Epoch],
		 * also known as [Unix Time].
		 * 
		 * The nanoseconds field of the output is always less than 1000000000.
		 * 
		 * [POSIX's Seconds Since the Epoch]: https://pubs.opengroup.org/onlinepubs/9699919799/xrat/V4_xbd_chap04.html#tag_21_04_16
		 * [Unix Time]: https://en.wikipedia.org/wiki/Unix_time
		 */
		export type now = () => Datetime;

		/**
		 * Query the resolution of the clock.
		 * 
		 * The nanoseconds field of the output is always less than 1000000000.
		 */
		export type resolution = () => Datetime;
	}
	export type WallClock = {
		now: wallClock.now;
		resolution: wallClock.resolution;
	};
}

export namespace clocks {
	export namespace monotonicClock.$ {
		export const Pollable = io.poll.$.Pollable;
		export const Instant = $wcm.u64;
		export const Duration = $wcm.u64;
		export const now = new $wcm.FunctionType<clocks.monotonicClock.now>('now', [], Instant);
		export const resolution = new $wcm.FunctionType<clocks.monotonicClock.resolution>('resolution', [], Duration);
		export const subscribeInstant = new $wcm.FunctionType<clocks.monotonicClock.subscribeInstant>('subscribe-instant',[
			['when', Instant],
		], new $wcm.OwnType<clocks.monotonicClock.Pollable>(Pollable));
		export const subscribeDuration = new $wcm.FunctionType<clocks.monotonicClock.subscribeDuration>('subscribe-duration',[
			['when', Duration],
		], new $wcm.OwnType<clocks.monotonicClock.Pollable>(Pollable));
	}
	export namespace monotonicClock._ {
		export const id = 'wasi:clocks/monotonic-clock@0.2.0' as const;
		export const witName = 'monotonic-clock' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['Pollable', $.Pollable],
			['Instant', $.Instant],
			['Duration', $.Duration]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['now', $.now],
			['resolution', $.resolution],
			['subscribeInstant', $.subscribeInstant],
			['subscribeDuration', $.subscribeDuration]
		]);
		export type WasmInterface = {
			'now': () => i64;
			'resolution': () => i64;
			'subscribe-instant': (when: i64) => i32;
			'subscribe-duration': (when: i64) => i32;
		};
		export function createImports(service: clocks.MonotonicClock, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Imports.create<WasmInterface>(functions, undefined, service, context);
		}
		export function filterExports(exports: object, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Exports.filter<WasmInterface>(exports, functions, undefined, id, clocks._.version, context);
		}
		export function bindExports(wasmInterface: WasmInterface, context: $wcm.WasmContext): clocks.MonotonicClock {
			return $wcm.Exports.bind<clocks.MonotonicClock>(functions, [], wasmInterface, context);
		}
	}

	export namespace wallClock.$ {
		export const Datetime = new $wcm.RecordType<clocks.wallClock.Datetime>([
			['seconds', $wcm.u64],
			['nanoseconds', $wcm.u32],
		]);
		export const now = new $wcm.FunctionType<clocks.wallClock.now>('now', [], Datetime);
		export const resolution = new $wcm.FunctionType<clocks.wallClock.resolution>('resolution', [], Datetime);
	}
	export namespace wallClock._ {
		export const id = 'wasi:clocks/wall-clock@0.2.0' as const;
		export const witName = 'wall-clock' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['Datetime', $.Datetime]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['now', $.now],
			['resolution', $.resolution]
		]);
		export type WasmInterface = {
			'now': (result: ptr<Datetime>) => void;
			'resolution': (result: ptr<Datetime>) => void;
		};
		export function createImports(service: clocks.WallClock, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Imports.create<WasmInterface>(functions, undefined, service, context);
		}
		export function filterExports(exports: object, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Exports.filter<WasmInterface>(exports, functions, undefined, id, clocks._.version, context);
		}
		export function bindExports(wasmInterface: WasmInterface, context: $wcm.WasmContext): clocks.WallClock {
			return $wcm.Exports.bind<clocks.WallClock>(functions, [], wasmInterface, context);
		}
	}
}

export namespace clocks._ {
	export const version = '0.2.0' as const;
	export const id = 'wasi:clocks@0.2.0' as const;
	export const witName = 'clocks' as const;
	export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
		['monotonicClock', monotonicClock._],
		['wallClock', wallClock._]
	]);
}
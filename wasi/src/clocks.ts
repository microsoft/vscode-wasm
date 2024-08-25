/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/* eslint-disable @typescript-eslint/ban-types */
import * as $wcm from '@vscode/wasm-component-model';
import type { u64, u32, i64, i32, ptr } from '@vscode/wasm-component-model';
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
	 */
	export namespace MonotonicClock {
		export type Pollable = io.Poll.Pollable;

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
		 * has occurred.
		 */
		export type subscribeInstant = (when: Instant) => Pollable;

		/**
		 * Create a `pollable` that will resolve after the specified duration has
		 * elapsed from the time this function is invoked.
		 */
		export type subscribeDuration = (when: Duration) => Pollable;
	}
	export type MonotonicClock = {
		now: MonotonicClock.now;
		resolution: MonotonicClock.resolution;
		subscribeInstant: MonotonicClock.subscribeInstant;
		subscribeDuration: MonotonicClock.subscribeDuration;
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
	export namespace WallClock {
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
		now: WallClock.now;
		resolution: WallClock.resolution;
	};
}

export namespace clocks {
	export namespace MonotonicClock.$ {
		export const Pollable = io.Poll.$.Pollable;
		export const Instant = $wcm.u64;
		export const Duration = $wcm.u64;
		export const now = new $wcm.FunctionType<clocks.MonotonicClock.now>('now', [], Instant);
		export const resolution = new $wcm.FunctionType<clocks.MonotonicClock.resolution>('resolution', [], Duration);
		export const subscribeInstant = new $wcm.FunctionType<clocks.MonotonicClock.subscribeInstant>('subscribe-instant',[
			['when', Instant],
		], new $wcm.OwnType<clocks.MonotonicClock.Pollable>(Pollable));
		export const subscribeDuration = new $wcm.FunctionType<clocks.MonotonicClock.subscribeDuration>('subscribe-duration',[
			['when', Duration],
		], new $wcm.OwnType<clocks.MonotonicClock.Pollable>(Pollable));
	}
	export namespace MonotonicClock._ {
		export const id = 'wasi:clocks/monotonic-clock@0.2.1' as const;
		export const witName = 'monotonic-clock' as const;
		export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
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
		export namespace imports {
			export type WasmInterface = _.WasmInterface;
		}
		export namespace exports {
			export type WasmInterface = _.WasmInterface;
		}
	}

	export namespace WallClock.$ {
		export const Datetime = new $wcm.RecordType<clocks.WallClock.Datetime>([
			['seconds', $wcm.u64],
			['nanoseconds', $wcm.u32],
		]);
		export const now = new $wcm.FunctionType<clocks.WallClock.now>('now', [], Datetime);
		export const resolution = new $wcm.FunctionType<clocks.WallClock.resolution>('resolution', [], Datetime);
	}
	export namespace WallClock._ {
		export const id = 'wasi:clocks/wall-clock@0.2.1' as const;
		export const witName = 'wall-clock' as const;
		export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
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
		export namespace imports {
			export type WasmInterface = _.WasmInterface;
		}
		export namespace exports {
			export type WasmInterface = _.WasmInterface;
		}
	}
}

export namespace clocks._ {
	export const version = '0.2.1' as const;
	export const id = 'wasi:clocks@0.2.1' as const;
	export const witName = 'clocks' as const;
	export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
		['MonotonicClock', MonotonicClock._],
		['WallClock', WallClock._]
	]);
}
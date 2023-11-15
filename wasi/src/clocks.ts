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
export type clocks = {
	MonotonicClock?: clocks.MonotonicClock;
	WallClock?: clocks.WallClock;
};

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
		export const id = 'wasi:clocks/monotonic-clock' as const;
		export const witName = 'monotonic-clock' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['Pollable', $.Pollable],
			['Instant', $.Instant],
			['Duration', $.Duration]
		]);
		export const functions: Map<string, $wcm.FunctionType<$wcm.ServiceFunction>> = new Map([
			['now', $.now],
			['resolution', $.resolution],
			['subscribeInstant', $.subscribeInstant],
			['subscribeDuration', $.subscribeDuration]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map([
		]);
		export type WasmInterface = {
			'now': () => i64;
			'resolution': () => i64;
			'subscribe-instant': (when: i64) => i32;
			'subscribe-duration': (when: i64) => i32;
		};
		export function createHost(service: clocks.MonotonicClock, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, _kind?: $wcm.ResourceKind): clocks.MonotonicClock {
			return $wcm.Service.create<clocks.MonotonicClock>(functions, [], wasmInterface, context);
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
		export const id = 'wasi:clocks/wall-clock' as const;
		export const witName = 'wall-clock' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['Datetime', $.Datetime]
		]);
		export const functions: Map<string, $wcm.FunctionType<$wcm.ServiceFunction>> = new Map([
			['now', $.now],
			['resolution', $.resolution]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map([
		]);
		export type WasmInterface = {
			'now': (result: ptr<[i64, i32]>) => void;
			'resolution': (result: ptr<[i64, i32]>) => void;
		};
		export function createHost(service: clocks.WallClock, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, _kind?: $wcm.ResourceKind): clocks.WallClock {
			return $wcm.Service.create<clocks.WallClock>(functions, [], wasmInterface, context);
		}
	}
}

export namespace clocks._ {
	export const id = 'wasi:clocks' as const;
	export const witName = 'clocks' as const;
	export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
		['MonotonicClock', MonotonicClock._],
		['WallClock', WallClock._]
	]);
	export type WasmInterface = {
		'wasi:clocks/monotonic-clock'?: MonotonicClock._.WasmInterface;
		'wasi:clocks/wall-clock'?: WallClock._.WasmInterface;
	};
	export function createHost(service: clocks, context: $wcm.Context): WasmInterface {
		const result: WasmInterface = Object.create(null);
		if (service.MonotonicClock !== undefined) {
			result['wasi:clocks/monotonic-clock'] = MonotonicClock._.createHost(service.MonotonicClock, context);
		}
		if (service.WallClock !== undefined) {
			result['wasi:clocks/wall-clock'] = WallClock._.createHost(service.WallClock, context);
		}
		return result;
	}
	export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind?: $wcm.ResourceKind): clocks {
		const result: clocks = Object.create(null);
		if (wasmInterface['wasi:clocks/monotonic-clock'] !== undefined) {
			result.MonotonicClock = MonotonicClock._.createService(wasmInterface['wasi:clocks/monotonic-clock'], context, kind);
		}
		if (wasmInterface['wasi:clocks/wall-clock'] !== undefined) {
			result.WallClock = WallClock._.createService(wasmInterface['wasi:clocks/wall-clock'], context, kind);
		}
		return result;
	}
}
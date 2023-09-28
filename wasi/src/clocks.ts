import * as $wcm from '@vscode/wasm-component-model';
import { Poll } from './poll';

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
	
	export type Pollable = Poll.Pollable;
	
	/**
	 * A timestamp in nanoseconds.
	 */
	export type Instant = bigint;
	
	/**
	 * Read the current value of the clock.
	 * 
	 * The clock is monotonic, therefore calling this function repeatedly will
	 * produce a sequence of non-decreasing values.
	 */
	export declare function now(): Instant;
	
	/**
	 * Query the resolution of the clock.
	 */
	export declare function resolution(): Instant;
	
	/**
	 * Create a `pollable` which will resolve once the specified time has been
	 * reached.
	 */
	export declare function subscribe(when: Instant, absolute: boolean): Pollable;
}

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
	export interface Datetime extends $wcm.JRecord {
		seconds: bigint;
		nanoseconds: number;
	}
	
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
	export declare function now(): Datetime;
	
	/**
	 * Query the resolution of the clock.
	 * 
	 * The nanoseconds field of the output is always less than 1000000000.
	 */
	export declare function resolution(): Datetime;
}

export namespace Timezone {
	
	export type Datetime = WallClock.Datetime;
	
	/**
	 * A timezone.
	 * 
	 * In timezones that recognize daylight saving time, also known as daylight
	 * time and summer time, the information returned from the functions varies
	 * over time to reflect these adjustments.
	 * 
	 * This [represents a resource](https://github.com/WebAssembly/WASI/blob/main/docs/WitInWasi.md#Resources).
	 */
	export type Timezone = number;
	
	/**
	 * Information useful for displaying the timezone of a specific `datetime`.
	 * 
	 * This information may vary within a single `timezone` to reflect daylight
	 * saving time adjustments.
	 */
	export interface TimezoneDisplay extends $wcm.JRecord {
		
		/**
		 * The number of seconds difference between UTC time and the local
		 * time of the timezone.
		 * 
		 * The returned value will always be less than 86400 which is the
		 * number of seconds in a day (24*60*60).
		 * 
		 * In implementations that do not expose an actual time zone, this
		 * should return 0.
		 */
		utcOffset: number;
		
		/**
		 * The abbreviated name of the timezone to display to a user. The name
		 * `UTC` indicates Coordinated Universal Time. Otherwise, this should
		 * reference local standards for the name of the time zone.
		 * 
		 * In implementations that do not expose an actual time zone, this
		 * should be the string `UTC`.
		 * 
		 * In time zones that do not have an applicable name, a formatted
		 * representation of the UTC offset may be returned, such as `-04:00`.
		 */
		name: string;
		
		/**
		 * Whether daylight saving time is active.
		 * 
		 * In implementations that do not expose an actual time zone, this
		 * should return false.
		 */
		inDaylightSavingTime: boolean;
	}
	
	/**
	 * Return information needed to display the given `datetime`. This includes
	 * the UTC offset, the time zone name, and a flag indicating whether
	 * daylight saving time is active.
	 * 
	 * If the timezone cannot be determined for the given `datetime`, return a
	 * `timezone-display` for `UTC` with a `utc-offset` of 0 and no daylight
	 * saving time.
	 */
	export declare function display(this_: Timezone, when: Datetime): TimezoneDisplay;
	
	/**
	 * The same as `display`, but only return the UTC offset.
	 */
	export declare function utcOffset(this_: Timezone, when: Datetime): number;
	
	/**
	 * Dispose of the specified input-stream, after which it may no longer
	 * be used.
	 */
	export declare function dropTimezone(this_: Timezone): void;
}

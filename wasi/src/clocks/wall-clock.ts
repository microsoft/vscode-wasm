import * as $wcm from '@vscode/wasm-component-model';
import type { u64, u32 } from '@vscode/wasm-component-model';

export namespace wall_clock {
	/**
	 * A time and date in seconds plus nanoseconds.
	 */
	export interface datetime extends $wcm.JRecord {
		seconds: u64;
		
		nanoseconds: u32;
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
	export declare function now(): datetime;
	
	/**
	 * Query the resolution of the clock.
	 *
	 * The nanoseconds field of the output is always less than 1000000000.
	 */
	export declare function resolution(): datetime;
	export namespace $cm {
		export const $datetime = new $wcm.RecordType<datetime>([
			['seconds', $wcm.u64], ['nanoseconds', $wcm.u32]
		]);
		export const $now = new $wcm.FunctionSignature('now', [], $datetime);
		export const $resolution = new $wcm.FunctionSignature('resolution', [], $datetime);
	}
}
export type wall_clock = Pick<typeof wall_clock, 'now' | 'resolution'>;
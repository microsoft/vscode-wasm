import * as $wcm from '@vscode/wasm-component-model';
import type { u32, s32 } from '@vscode/wasm-component-model';
import { wall_clock } from './wall-clock';

export namespace timezone {
	type datetime = wall_clock.datetime;

	/**
	 * A timezone.
	 *
	 * In timezones that recognize daylight saving time, also known as daylight
	 * time and summer time, the information returned from the functions varies
	 * over time to reflect these adjustments.
	 *
	 * This [represents a resource](https://github.com/WebAssembly/WASI/blob/main/docs/WitInWasi.md#Resources).
	 */
	export type timezone = u32;

	/**
	 * Return information needed to display the given `datetime`. This includes
	 * the UTC offset, the time zone name, and a flag indicating whether
	 * daylight saving time is active.
	 *
	 * If the timezone cannot be determined for the given `datetime`, return a
	 * `timezone-display` for `UTC` with a `utc-offset` of 0 and no daylight
	 * saving time.
	 */
	export declare function display($this: timezone, when: datetime): timezone_display;

	/**
	 * The same as `display`, but only return the UTC offset.
	 */
	export declare function utc_offset($this: timezone, when: datetime): s32;

	/**
	 * Dispose of the specified input-stream, after which it may no longer
	 * be used.
	 */
	export declare function drop_timezone($this: timezone): void;

	/**
	 * Information useful for displaying the timezone of a specific `datetime`.
	 *
	 * This information may vary within a single `timezone` to reflect daylight
	 * saving time adjustments.
	 */
	export interface timezone_display extends $wcm.JRecord {
		utc_offset: s32;

		name: string;

		in_daylight_saving_time: boolean;
	}


	export namespace $cm {
		const $datetime = wall_clock.$cm.$datetime;
		export const $timezone = $wcm.u32;
		export const $timezone_display = new $wcm.RecordType<timezone_display>([
			['utc_offset', $wcm.s32], ['name', $wcm.wstring], ['in_daylight_saving_time', $wcm.bool]
		]);
		export const $display = new $wcm.FunctionSignature('display', [
			['$this', $timezone], ['when', $datetime]
		], $timezone_display);
		export const $utc_offset = new $wcm.FunctionSignature('utc_offset', [
			['$this', $timezone], ['when', $datetime]
		], $wcm.s32);
		export const $drop_timezone = new $wcm.FunctionSignature('drop_timezone', [
			['$this', $timezone]
		]);
	}
}
export type timezone = Pick<typeof timezone, 'display' | 'utc_offset' | 'drop_timezone'>;
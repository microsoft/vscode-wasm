import type { WallClock } from './wall-clock';

export namespace Timezone {
	export const path: string = 'timezone';

	type Datetime = WallClock.Datetime;

	export interface TimezoneDisplay {
		utcOffset: number;
		inDaylightSavingTime: boolean;
	}

	export type Timezone = number;

	export declare function display(this: Timezone, when: Datetime): TimezoneDisplay;
	export declare function utcOffset(this: Timezone, when: Datetime): number;
	export declare function dropTimezone(this: Timezone): void;
}
export type Timezone = typeof Timezone;
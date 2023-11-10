import type { WallClock } from './wall-clock';

export namespace Timezone {
	export const path: string = 'timezone';

	type Datetime = WallClock.Datetime;

	export interface TimezoneDisplay {
		utcOffset: number;
		inDaylightSavingTime: boolean;
	}

	export type Timezone = number;

	export declare function display(self: Timezone, when: Datetime): TimezoneDisplay;
	export declare function utcOffset(self: Timezone, when: Datetime): number;
	export declare function dropTimezone(self: Timezone): void;

	export namespace $cm {
		export const Timezone = 10;
		// export const TimezoneDisplay: ComponentModelType<TimezoneDisplay> = new RecordType<TimezoneDisplay>([
		// 	['utcOffset', u8], ['inDaylightSavingTime', u32]
		// ]);
	}

	export function $host(service: $Timezone) {
		service.display = display;
		return {
			display(params: (number | bigint)[]) {
				service.display(params[0], params[1]);
			}
		};
	}

	export function $forwardHost() {
		return {
			display(params: (number | bigint)[]) {
				return service.display(params[0], params[1]);
			}
		};
	}
}
type $Timezone = Pick<typeof Timezone, 'display' | 'utcOffset' | 'dropTimezone'>;
export type Timezone = Pick<typeof Timezone, 'display' | 'utcOffset' | 'dropTimezone'>;

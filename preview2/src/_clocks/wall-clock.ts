export namespace WallClock {

	export const path: string = 'wall-clock';

	export interface Datetime {
		seconds: bigint;
  		nanoseconds: number;
	}

	export declare function now(): Datetime;
	export declare function resolution(): Datetime;
}
export type WallClock = typeof WallClock;
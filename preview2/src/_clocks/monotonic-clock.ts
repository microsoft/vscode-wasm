export namespace MonotonicClock {
	export const path: string = 'monotonic-clock';
	export type Instant = bigint;

	export declare function now(): Instant;
	export declare function resolution(): Instant;
	export declare function subscribe(when: Instant, absolute: boolean): number;
}
export type MonotonicClock = typeof MonotonicClock;
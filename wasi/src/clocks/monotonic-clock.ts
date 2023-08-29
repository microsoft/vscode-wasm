import * as $wcm from '@vscode/wasm-component-model';
import type { u64 } from '@vscode/wasm-component-model';
import { poll } from '../poll/poll';

export namespace monotonic_clock {
	type pollable = poll.pollable;
	
	/**
	 * A timestamp in nanoseconds.
	 */
	export type instant = u64;
	
	/**
	 * Read the current value of the clock.
	 *
	 * The clock is monotonic, therefore calling this function repeatedly will
	 * produce a sequence of non-decreasing values.
	 */
	export declare function now(): instant;
	
	/**
	 * Query the resolution of the clock.
	 */
	export declare function resolution(): instant;
	
	/**
	 * Create a `pollable` which will resolve once the specified time has been
	 * reached.
	 */
	export declare function subscribe(when: instant, absolute: boolean): pollable;
	export namespace $cm {
		const $pollable = poll.$cm.$pollable;
		export const $instant = $wcm.u64;
		export const $now = new $wcm.FunctionSignature('now', [], $instant);
		export const $resolution = new $wcm.FunctionSignature('resolution', [], $instant);
		export const $subscribe = new $wcm.FunctionSignature('subscribe', [
			['when', $instant], ['absolute', $wcm.bool]
		], $pollable);
	}
}
export type monotonic_clock = Pick<typeof monotonic_clock, 'now' | 'resolution' | 'subscribe'>;
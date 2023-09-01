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
	export type now = typeof now;
	
	/**
	 * Query the resolution of the clock.
	 */
	export declare function resolution(): instant;
	export type resolution = typeof resolution;
	
	/**
	 * Create a `pollable` which will resolve once the specified time has been
	 * reached.
	 */
	export declare function subscribe(when: instant, absolute: boolean): pollable;
	export type subscribe = typeof subscribe;
	
	
	export namespace $cm {
		const $pollable = poll.$cm.$pollable;
		export const $instant = $wcm.u64;
		export const $now = new $wcm.FunctionType<now>('now', [], $instant);
		export const $resolution = new $wcm.FunctionType<resolution>('resolution', [], $instant);
		export const $subscribe = new $wcm.FunctionType<subscribe>('subscribe', [
			['when', $instant], ['absolute', $wcm.bool]
		], $pollable);
		export namespace $ {
			const allFunctions = [$now, $resolution, $subscribe];
			export function createHost<T extends $wcm.Host>(service: monotonic_clock, context: $wcm.Context): T {
				return $wcm.Host.create<T>(allFunctions, service, context);
			}
			export function createService<T extends monotonic_clock>(wasmInterface: $wcm.WasmInterface, context: $wcm.Context): T {
				return $wcm.Service.create<T>(allFunctions, wasmInterface, context);
			}

		}
	}
}
export type monotonic_clock = Pick<typeof monotonic_clock, 'now' | 'resolution' | 'subscribe'>;
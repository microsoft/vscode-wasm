import * as $wcm from '@vscode/wasm-component-model';
import type { u32 } from '@vscode/wasm-component-model';

export namespace poll {
	/**
	 * A "pollable" handle.
	 *
	 * This is conceptually represents a `stream<_, _>`, or in other words,
	 * a stream that one can wait on, repeatedly, but which does not itself
	 * produce any data. It's temporary scaffolding until component-model's
	 * async features are ready.
	 *
	 * And at present, it is a `u32` instead of being an actual handle, until
	 * the wit-bindgen implementation of handles and resources is ready.
	 *
	 * `pollable` lifetimes are not automatically managed. Users must ensure
	 * that they do not outlive the resource they reference.
	 *
	 * This [represents a resource](https://github.com/WebAssembly/WASI/blob/main/docs/WitInWasi.md#Resources).
	 */
	export type pollable = u32;
	
	/**
	 * Dispose of the specified `pollable`, after which it may no longer
	 * be used.
	 */
	export declare function drop_pollable($this: pollable): void;
	export type drop_pollable = typeof drop_pollable;
	
	/**
	 * Poll for completion on a set of pollables.
	 *
	 * The "oneoff" in the name refers to the fact that this function must do a
	 * linear scan through the entire list of subscriptions, which may be
	 * inefficient if the number is large and the same subscriptions are used
	 * many times. In the future, this is expected to be obsoleted by the
	 * component model async proposal, which will include a scalable waiting
	 * facility.
	 *
	 * The result list<bool> is the same length as the argument
	 * list<pollable>, and indicates the readiness of each corresponding
	 * element in that / list, with true indicating ready.
	 */
	export declare function poll_oneoff($in: pollable[]): boolean[];
	export type poll_oneoff = typeof poll_oneoff;
	
	
	export namespace $cm {
		export const $pollable = $wcm.u32;
		export const $drop_pollable = new $wcm.FunctionType<drop_pollable>('drop_pollable', [
			['$this', $pollable]
		]);
		export const $poll_oneoff = new $wcm.FunctionType<poll_oneoff>('poll_oneoff', [
			['$in', new $wcm.ListType<pollable>($pollable)]
		], new $wcm.ListType<boolean>($wcm.bool));
		export namespace $ {
			const allFunctions = [$drop_pollable, $poll_oneoff];
			export function createHost<T extends $wcm.Host>(service: poll, context: $wcm.Context): T {
				return $wcm.Host.create<T>(allFunctions, service, context);
			}
			export function createService<T extends poll>(wasmInterface: $wcm.WasmInterface, context: $wcm.Context): T {
				return $wcm.Service.create<T>(allFunctions, wasmInterface, context);
			}

		}
	}
}
export type poll = Pick<typeof poll, 'drop_pollable' | 'poll_oneoff'>;
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '@vscode/wasm-component-model';
import type { u32 } from '@vscode/wasm-component-model';

export namespace poll {
	/**
	 * A poll API intended to let users wait for I/O events on multiple handles
	 * at once.
	 */
	export namespace Poll {
		
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
		export type Pollable = u32;
		
		/**
		 * Dispose of the specified `pollable`, after which it may no longer
		 * be used.
		 */
		export declare function dropPollable(this_: Pollable): void;
		
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
		export declare function pollOneoff(in_: Pollable[]): boolean[];
	}
	export type Poll = Pick<typeof Poll, 'dropPollable' | 'pollOneoff'>;
	
}

export namespace poll {
	export namespace Poll.$ {
		export const Pollable = $wcm.u32;
		export const dropPollable = new $wcm.FunctionType<typeof poll.Poll.dropPollable>('dropPollable', 'drop-pollable',[
			['this_', Pollable],
		], undefined);
		export const pollOneoff = new $wcm.FunctionType<typeof poll.Poll.pollOneoff>('pollOneoff', 'poll-oneoff',[
			['in_', new $wcm.ListType<u32>(Pollable)],
		], new $wcm.ListType<boolean>($wcm.bool));
	}
	export namespace Poll._ {
		const allFunctions = [$.dropPollable, $.pollOneoff];
		export function createHost<T extends $wcm.Host>(service: poll.Poll, context: $wcm.Context): T {
			return $wcm.Host.create<T>(allFunctions, service, context);
		}
		export function createService<T extends poll.Poll>(wasmInterface: $wcm.WasmInterface, context: $wcm.Context): T {
			return $wcm.Service.create<T>(allFunctions, wasmInterface, context);
		}
	}
}
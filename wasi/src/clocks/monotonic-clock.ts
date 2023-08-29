/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as $wcm from '@vscode/wasm-component-model';
import type { u64 } from '@vscode/wasm-component-model';

import { poll } from '../poll/poll';

export namespace monotonic_clock {
        type pollable = poll.pollable;
        export type instant = u64;
        export declare function now(): instant;
        export declare function resolution(): instant;
        export declare function subscribe(when: instant, absolute: boolean): pollable;
        export namespace $cm {
        	const $pollable: $wcm.ComponentModelType<pollable> = poll.$cm.$pollable;
        	export const $instant: $wcm.ComponentModelType<instant> = $wcm.u64;
        	export const $now: $wcm.FunctionSignature = new $wcm.FunctionSignature('now', [], $instant);
        	export const $resolution: $wcm.FunctionSignature = new $wcm.FunctionSignature('resolution', [], $instant);
        	export const $subscribe: $wcm.FunctionSignature = new $wcm.FunctionSignature('subscribe', [
        		['when', $instant], ['absolute', $wcm.bool]
        	], $pollable);
        }
}
export type monotonic_clock = Pick<typeof monotonic_clock, 'now' | 'resolution' | 'subscribe'>;
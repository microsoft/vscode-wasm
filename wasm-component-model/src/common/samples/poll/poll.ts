/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as $wcm from '../../componentModel';
import type { u32 } from '../../componentModel';

export namespace poll {
	export type pollable = u32;
	export declare function drop_pollable($this: pollable): void;
	export declare function poll_oneoff($in: pollable[]): boolean[];
	export namespace $cm {
		export const $pollable: $wcm.ComponentModelType<pollable> = $wcm.u32;
		export const $drop_pollable: $wcm.FunctionSignature = new $wcm.FunctionSignature('drop_pollable', [
			['$this', $pollable]
		]);
		export const $poll_oneoff: $wcm.FunctionSignature = new $wcm.FunctionSignature('poll_oneoff', [
			['$in', new $wcm.ListType<pollable>($pollable)]
		], new $wcm.ListType<boolean>($wcm.bool));
	}
}
export type poll = Pick<typeof poll, 'drop_pollable' | 'poll_oneoff'>;
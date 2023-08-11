/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as $wcm from '../../componentModel';
import type { u64, u32 } from '../../componentModel';

export namespace wall_clock {
	export interface datetime extends $wcm.JRecord {
		seconds: u64;
		nanoseconds: u32;
	}
	export declare function now(): datetime;
	export declare function resolution(): datetime;
	export namespace $cm {
		export const $datetime: $wcm.ComponentModelType<datetime> = new $wcm.RecordType<datetime>([
			['seconds', $wcm.u64], ['nanoseconds', $wcm.u32]
		]);
		export const $now: $wcm.FunctionSignature = new $wcm.FunctionSignature('now', [], $datetime);
		export const $resolution: $wcm.FunctionSignature = new $wcm.FunctionSignature('resolution', [], $datetime);
	}
}
export type wall_clock = Pick<typeof wall_clock, 'now' | 'resolution'>;
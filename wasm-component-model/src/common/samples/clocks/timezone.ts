/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as $wcm from '../../componentModel';
import type { s32, u32 } from '../../componentModel';

import { wall_clock } from './wall-clock';

export namespace timezone {
	type datetime = wall_clock.datetime;
	export type timezone = u32;
	export declare function display(self: timezone, when: datetime): timezone_display;
	export declare function utc_offset(self: timezone, when: datetime): s32;
	export declare function drop_timezone(self: timezone): void;
	export interface timezone_display extends $wcm.JRecord {
		utc_offset: s32;
		name: string;
		in_daylight_saving_time: boolean;
	}
	export namespace $cm {
		const $datetime: $wcm.ComponentModelType<datetime> = wall_clock.$cm.$datetime;
		export const $timezone: $wcm.ComponentModelType<timezone> = $wcm.u32;
		export const $timezone_display: $wcm.ComponentModelType<timezone_display> = new $wcm.RecordType<timezone_display>([
			['utc_offset', $wcm.s32], ['name', $wcm.wstring], ['in_daylight_saving_time', $wcm.bool]
		]);
		export const $display: $wcm.FunctionSignature = new $wcm.FunctionSignature('display', [
			['self', $timezone], ['when', $datetime]
		], $timezone_display );
		export const $utc_offset: $wcm.FunctionSignature = new $wcm.FunctionSignature('utc_offset', [
			['self', $timezone], ['when', $datetime]
		], $wcm.s32 );
		export const $drop_timezone: $wcm.FunctionSignature = new $wcm.FunctionSignature('drop_timezone', [
			['self', $timezone]
		]);
	}
}
export type timezone = Pick<typeof timezone, 'display' | 'utc_offset' | 'drop_timezone'>;
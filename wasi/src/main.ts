/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { poll as _poll } from './poll/poll';
import { streams as _streams} from './io/streams';
import { timezone as _timezone } from './clocks/timezone';
import { wall_clock as _wall_clock } from './clocks/wall-clock';
import { monotonic_clock as _monotonic_clock } from './clocks/monotonic-clock';
import { filesystem as _filesystem } from './filesystem/filesystem';

export namespace poll {
	export type poll = _poll;
	export const poll = _poll;
}

export namespace io {
	export type streams = _streams;
	export const streams = _streams;
}

export namespace clocks {
	export type timezone = _timezone;
	export const timezone = _timezone;
	export type wall_clock = _wall_clock;
	export const wall_clock = _wall_clock;
	export type monotonic_clock = _monotonic_clock;
	export const monotonic_clock = _monotonic_clock;
}

export namespace filesystem {
	export type filesystem = _filesystem;
	export const filesystem = _filesystem;
}
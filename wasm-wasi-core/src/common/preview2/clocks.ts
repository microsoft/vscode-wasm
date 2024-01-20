/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RAL from '../ral';

import { clocks } from '@vscode/wasi';
import { i32, i64, ptr, u64 } from '@vscode/wasm-component-model';
import { Pollable } from './io';

function createMonotonicClock(): clocks.MonotonicClock {
	return {
		now: () => {
			return RAL().clock.monotonic();
		},
		resolution: () => {
			return 1n;
		},
		subscribeDuration: (when: u64) => {
			const pollable = new Pollable();
			return pollable;
		},
		subscribeInstant: (when : u64) => {
			const pollable = new Pollable();
			return pollable;
		}
	};
}


const DateTime = clocks.WallClock.$.Datetime;
function createWallClock(): clocks.WallClock._.WasmInterface {
	return {
		now: (result: ptr<clocks.WallClock.Datetime>) => {
			const value: i64 = RAL().clock.monotonic();

		},
		resolution: (result: ptr<clocks.WallClock.Datetime>) => {
			return 1n;
		}
	};
}
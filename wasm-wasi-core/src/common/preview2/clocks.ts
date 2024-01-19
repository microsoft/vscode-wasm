/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RAL from '../ral';

import { clocks } from '@vscode/wasi';
import { i32, i64, ptr, u64 } from '@vscode/wasm-component-model';
import { Pollable } from './io';

function createMonotonicClock(): clocks.MonotonicClock._.WasmInterface {
	return {
		now: () => {
			return RAL().clock.monotonic();
		},
		resolution: () => {
			return 1n;
		},
		'subscribe-duration': (when: u64) => {
			const pollable = new Pollable();
			return pollable.handle();
		},
		'subscribe-instant': (when : u64) => {
			const pollable = new Pollable();
			return pollable.handle();
		}
	};
}


const DateTime = clocks.WallClock.$.Datetime;
function createWallClock(): clocks.WallClock._.WasmInterface {
	return {
		now: (result: ptr<[i64, i32]>) => {
			const value: i64 = RAL().clock.monotonic();

		},
		resolution: (result: ptr<[i64, i32]>) => {
			return 1n;
		}
	};
}
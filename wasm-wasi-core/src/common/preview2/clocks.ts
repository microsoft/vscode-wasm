/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RAL from '../ral';

import { clocks } from '@vscode/wasi';
import { u64 } from '@vscode/wasm-component-model';
import { Pollable } from './io';

export function createMonotonicClock(): clocks.MonotonicClock {
	return {
		now: () => {
			return RAL().clock.monotonic();
		},
		resolution: () => {
			return 1n;
		},
		subscribeDuration: (_when: u64) => {
			const pollable = new Pollable();
			return pollable;
		},
		subscribeInstant: (_when : u64) => {
			const pollable = new Pollable();
			return pollable;
		}
	};
}


export function createWallClock(): clocks.WallClock {
	return {
		now: () => {
			// const value: i64 = RAL().clock.monotonic();
			return { seconds: 0n, nanoseconds: 0 };
		},
		resolution: () => {
			return { seconds: 0n, nanoseconds: 1 };
		}
	};
}
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RAL from '../ral';

import { u64 } from '@vscode/wasm-component-model';

import { clocks } from '@vscode/wasi';
import { Pollable } from './io';
import type { WasiClient } from './wasiClient';

export function createMonotonicClock(client: WasiClient) {
	return {
		now(): clocks.MonotonicClock.Instant {
			return RAL().clock.monotonic();
		},
		resolution(): clocks.MonotonicClock.Duration {
			return 1n;
		},
		subscribeDuration(when: u64): Pollable {
			const pollable = new Pollable(client.getSharedMemory());
			client.setTimeout(pollable, when);
			return pollable;
		},
		subscribeInstant(when : u64): Pollable {
			const pollable = new Pollable(client.getSharedMemory());
			const duration = when - RAL().clock.realtime();
			if (duration < 0) {
				pollable.resolve();
			} else {
				client.setTimeout(pollable, duration);
			}
			return pollable;
		}
	} satisfies clocks.MonotonicClock;
}

export function createWallClock() {
	return {
		now(): clocks.WallClock.Datetime {
			// const value: i64 = RAL().clock.monotonic();
			return { seconds: 0n, nanoseconds: 0 };
		},
		resolution(): clocks.WallClock.Datetime {
			return { seconds: 0n, nanoseconds: 1 };
		}
	} satisfies clocks.WallClock;
}
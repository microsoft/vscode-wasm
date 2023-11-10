
import { clocks } from './main';

clocks.MonotonicClock.id;

import MonotonicClock = clocks.MonotonicClock;

let x: MonotonicClock.Instant = 0n;
let i: MonotonicClock = {} as any;

i.now();
i.resolution();
i.subscribe(x, false);

import wasi, { clocks } from './main';

clocks.MonotonicClock._.id;

import MonotonicClock = clocks.MonotonicClock;

let x: MonotonicClock.Instant = 0n;
let i: MonotonicClock = {} as any;

i.now();
i.resolution();

let w: wasi = {} as any;
w.io?.Poll?.poll;
wasi._.packages.get('io');
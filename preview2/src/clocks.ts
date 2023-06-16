
import { WasiPackage } from './wasi';
import * as wallClock from './_clocks/wall-clock';
import * as timezone from './_clocks/timezone';
import * as monotonic from './_clocks/monotonic-clock';

namespace Clocks {
	export const packageName: string = 'wasi:clocks';
	export type Timezone = timezone.Timezone;
	export type WallClock = wallClock.WallClock;
	export type MonotonicClock = monotonic.MonotonicClock;
}
type Clocks = (typeof Clocks & WasiPackage);

export default Clocks;
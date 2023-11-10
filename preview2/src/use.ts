import Clocks from './clocks';
import Poll from './poll';

let wallClock!: Clocks.WallClock;
let poll!: Poll.Poll;

wallClock.now();
poll.dropPollable(0);
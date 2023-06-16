import * as poll from './_poll/poll';

namespace Poll {
	export const packageName: string = 'wasi:poll';
	export type Poll = poll.Poll;
}
type Poll = typeof Poll;

export default Poll;
export namespace Poll {
	export const path: string = 'poll';
	export type Pollable = number;
	export declare function dropPollable(pollable: Pollable): void;
	export declare function pollOneoff(input: Uint32Array): Uint8Array | ArrayBuffer;
}
export type Poll = typeof Poll;
import { parentPort } from 'node:worker_threads';

interface Memory {
	malloc(size: number): number;
	free(ptr: number): void;
}

parentPort!.on('message', async (message: { index: number; module: WebAssembly.Module; memory: WebAssembly.Memory}) => {
	const instance = new WebAssembly.Instance(message.module, {
		env: {
			memory: message.memory
		},
		wasi_snapshot_preview1: {
			sched_yield: () => 0
		}
	});
	const exports:Memory = instance.exports as any;
	const allocated: number[] = [];
	while(true) {
		if (allocated.length > 3 || Math.random() < 0.5 && allocated.length > 0) {
			const ptr = allocated.shift()!;
			exports.free(ptr);
			parentPort!.postMessage(`Worker ${message.index} freed ${ptr}.`);
		} else {
			const bytes = Math.floor(Math.random() * 1000);
			const ptr = exports.malloc(bytes);
			allocated.push(ptr);
			parentPort!.postMessage(`Worker ${message.index} allocated ${bytes} bytes at ${ptr}.`);
		}
		await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
	}
});
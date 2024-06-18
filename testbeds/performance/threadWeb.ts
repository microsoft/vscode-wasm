/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const memory = new SharedArrayBuffer(4096);
const view = new DataView(memory);
const sync = new Int32Array(memory, 0, 1);

self.onmessage = (event: MessageEvent<string>) => {
	const message = event.data;
	if (message === 'start') {
		let sum: number = 0;
		const start = Date.now();
		for (let i = 0; i < 1000000; i++) {
			Atomics.store(sync, 0, 0);
			self.postMessage(memory);
			const result = Atomics.wait(sync, 0, 0);
			switch (result) {
				case 'ok':
					sum += view.getInt32(4, true);
					break;
				case 'not-equal':
					const value = Atomics.load(sync, 0);
					if (value === 1) {
						sum += view.getInt32(4, true);
					} else {
						console.log(`Not equal: ${value}`);
					}
					break;
				case 'timed-out':
					console.log('timed-out');
					break;
			}
		}
		const end = Date.now();
		console.log(`Time taken to call 1000000 times: ${end - start}ms. Sum value: ${sum}`);
	}
};
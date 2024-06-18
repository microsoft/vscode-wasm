/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import fs from 'node:fs/promises';
import path from 'node:path';
import { Worker } from 'node:worker_threads';


async function main(): Promise<void> {
	const module = await WebAssembly.compile(await fs.readFile('malloc.wasm'));
	const memory = new WebAssembly.Memory({ initial: 2, maximum: 4, shared: true });
	for (let i = 0; i < 10; i++) {
		const worker = new Worker(path.join(__dirname, 'worker.js'));
		worker.postMessage({ index: i, module, memory });
		worker.on('message', (message: string) => {
			console.log(message);
		});
	}
}

main().catch(console.error);
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import assert from 'assert';

import { Alignment, u32 } from '@vscode/wasm-component-model';
import { Memory, MemoryLocation, SharedObject } from '@vscode/wasm-component-model-std';

import { WasiManagementClient } from '../wasiManagementClient';
import { WasiClient } from '../wasiClient';

suite(`Wasi Worker Tests`, () => {

	suiteSetup(async () => {
		if (!SharedObject.isInitialized()) {
			const memory = await Memory.create();
			SharedObject.initialize(memory);
		}
	});

	test(`setTimeout`, async () => {
		const memory = SharedObject.memory();
		const ptr = memory.alloc(Alignment.word, u32.size * 2);
		const signal = new Int32Array(memory.buffer, ptr, 1);

		const managementClient = new WasiManagementClient();
		await managementClient.launch();
		const connectionInfo = await managementClient.createConnection();

		const client = new WasiClient(connectionInfo.port);
		const start = Date.now();
		client.setTimeout(MemoryLocation.create(ptr), BigInt(500 * 1e6));
		Atomics.wait(signal, 0, 0);
		const diff = Date.now() - start;
		assert.ok(diff >= 500 && diff <= 600);
	});
});
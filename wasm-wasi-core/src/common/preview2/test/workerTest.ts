/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import RIL from '../ril';
RIL.install();

import { Alignment, u32 } from '@vscode/wasm-component-model';

import malloc from '../../common/malloc';
import { MemoryLocation, SharedObject } from '../../common/sobject';
import { WasiManagementClient } from '../../common/wasiManagementClient';
import { WasiClient } from '../../common/wasiClient';

async function main(): Promise<void> {

	const memory = await RIL().Memory.create(await WebAssembly.compile(malloc), new WebAssembly.Memory({ initial: 2, maximum: 8, shared: true }));
	await SharedObject.initialize(memory);
	const ptr = memory.alloc(Alignment.word, u32.size * 2);
	const signal = new Int32Array(memory.buffer, ptr, 1);

	const managementClient = new WasiManagementClient();
	await managementClient.launch();
	const connectionInfo = await managementClient.createConnection();

	const client = new WasiClient(connectionInfo.port);
	// eslint-disable-next-line no-console
	console.log(`Waiting: ${Date.now()}`);
	client.setTimeout(MemoryLocation.create(ptr), BigInt(1000 * 1e6));
	Atomics.wait(signal, 0, 0);
	// eslint-disable-next-line no-console
	console.log(`Done: ${Date.now()}`);
}

// eslint-disable-next-line no-console
main().catch(console.error);
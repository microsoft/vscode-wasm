/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import RAL from '../../ral';

import { Alignment, u32 } from '@vscode/wasm-component-model';

import { MemoryLocation, SharedObject, Memory } from '@vscode/wasm-component-model-std';
import { WasiManagementClient } from '../wasiManagementClient';
import { WasiClient } from '../wasiClient';

export async function main(): Promise<void> {

	const memory = await Memory.create();
	await SharedObject.initialize(memory);
	const ptr = memory.alloc(Alignment.word, u32.size * 2);
	const signal = new Int32Array(memory.buffer, ptr, 1);

	const managementClient = new WasiManagementClient();
	await managementClient.launch();
	const connectionInfo = await managementClient.createConnection();

	const client = new WasiClient(connectionInfo.port);
	RAL().console.log(`Waiting: ${Date.now()}`);
	client.setTimeout(MemoryLocation.create(ptr), BigInt(1000 * 1e6));
	Atomics.wait(signal, 0, 0);
	// eslint-disable-next-line no-console
	RAL().console.log(`Done: ${Date.now()}`);
}
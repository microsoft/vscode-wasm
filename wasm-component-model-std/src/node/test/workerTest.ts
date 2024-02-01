/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import RIL from '../ril';
RIL.install();

import malloc from '../../common/malloc';
import { SharedObject } from '../../common/sobject';
import { WasiClient } from '../../common/wasiClient';

async function main(): Promise<void> {

	const module = await WebAssembly.compile(malloc);
	const memory = new WebAssembly.Memory({ initial: 2, maximum: 8, shared: true });
	await SharedObject.initialize(await RIL().Memory.create(module, memory));

	const client = new WasiClient();
	await client.launch();
}

// eslint-disable-next-line no-console
main().catch(console.error);
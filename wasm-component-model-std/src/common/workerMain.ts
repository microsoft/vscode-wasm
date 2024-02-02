/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import RAL from './ral';

import type { ConnectionPort } from './connection';
import type { BaseWorker } from './workerService';

export async function main(port: ConnectionPort, args: string[]): Promise<void> {
	const toLoad = args[0];
	const constructor: BaseWorker.Constructor = (await import(toLoad)).Constructor;
	if (typeof constructor !== 'function') {
		throw new Error('Missing constructor function');
	}
	const connection = RAL().Connection.create(port) as unknown as BaseWorker.ConnectionType;
	new constructor(connection, args.slice(1));
	connection.listen();
	connection.notify('workerReady');
}
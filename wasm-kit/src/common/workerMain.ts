/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { AnyConnection } from './connection';
import RAL from './ral';

import type { BaseWorker } from './workerService';

export namespace Worker {
	export async function main(constructor: BaseWorker.Constructor): Promise<void> {
		try {
			const port = RAL().Worker.getPort();
			const args = RAL().Worker.getArgs();
			const connection = AnyConnection.create(port);
			new constructor(connection, args.slice(1));
			connection.listen();
			connection.notify('workerReady');
		} catch (error) {
			RAL().console.error(error);
			RAL().Worker.exitCode = -1;
		}
	}
}
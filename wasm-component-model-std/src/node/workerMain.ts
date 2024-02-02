/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import RIL from './ril';
RIL.install();

import { parentPort } from 'worker_threads';
import { main } from '../common/workerMain';

main(parentPort!, process.argv.slice(2)).catch((error) => {
	RIL().console.error(error);
	process.exitCode = -1;
}).finally(() => {
});
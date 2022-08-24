/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import RAL from '../../ral';
import type { Requests } from '../tests';

const connection = RAL().$testing.ServiceConnection.create<Requests>()!;
connection.onRequest('varUint8array', () => {
	return { errno: 0, data: RAL().TextEncoder.create().encode('1'.repeat(32)) };
});
connection.signalReady();
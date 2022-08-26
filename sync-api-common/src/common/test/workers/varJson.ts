/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import RAL from '../../ral';
import type { TestRequests } from '../tests';

const connection = RAL().$testing.ServiceConnection.create<TestRequests>()!;
connection.onRequest('varJSON', () => {
	return { errno: 0, data: { name: 'vscode', age: 70 } };
});
connection.signalReady();
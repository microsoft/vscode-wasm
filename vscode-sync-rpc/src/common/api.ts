/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

export * from './connection';
export * from './protocol';

import { BaseClientConnection, Uint8Length } from './connection';
import { Requests } from './protocol';
import RAL from './ral';
export default RAL;

let c: BaseClientConnection<Requests>;

c.sendRequest(
	'terminal/read', null, Uint8Length(20), 20
);
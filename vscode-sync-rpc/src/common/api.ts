/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

export * from './connection';
export * from './protocol';

import { BaseClientConnection } from './connection';
import { Requests } from './protocol';
import RAL from './ral';
export default RAL;

let connection: BaseClientConnection<Requests>;
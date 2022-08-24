/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import RIL from './ril';
RIL.install();

import RAL from '../common/ral';
import { ServiceConnection, ClientConnection } from './connection';

export * from '../common/api';
export { ServiceConnection, ClientConnection };
export default RAL;
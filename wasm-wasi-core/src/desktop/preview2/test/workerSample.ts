/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import RIL from '../../ril';
RIL.install();

import { main } from '../../../common/preview2/test/workerSample';

// eslint-disable-next-line no-console
main().catch(error => RIL().console.error(error));
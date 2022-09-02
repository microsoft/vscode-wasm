/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import path from 'path';
import '../main';
import * as tests from '../../common/test/connection.test';

tests.setScript(path.join(__dirname, './workers/main.js'));
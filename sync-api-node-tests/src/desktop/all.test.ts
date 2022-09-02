/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import path from 'path';
import * as apiTests from '../api.test';

apiTests.contribute((testCase) => {
	return path.join(__dirname, '..', 'workers', `${testCase}.js`);
}, 'file');
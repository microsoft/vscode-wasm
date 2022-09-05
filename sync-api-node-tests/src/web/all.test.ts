/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as apiTests from '../api.test';

apiTests.contribute((testCase) => {
	return `http://localhost:3000/static/devextensions/dist/workers/${testCase}.js?vscode-coi=3`;
}, 'vscode-test-web');
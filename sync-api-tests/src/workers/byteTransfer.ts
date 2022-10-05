/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { RAL } from '@vscode/sync-api-client';
import { URI } from 'vscode-uri';

import runSingle from './tests';

const uri = URI.from({ scheme: 'byteTransfer', authority: 'byteTransfer', path: '/write' });

runSingle((client) => {
	client.byteTransfer.write(uri, RAL().TextEncoder.create().encode('hello'));
}).catch(console.error);
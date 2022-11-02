/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WASI, Options, Environment, DeviceDescription, FileDescriptorDescription } from './wasi';

export * from '@vscode/sync-api-client';

export {
	WASI, Options, Environment, DeviceDescription, FileDescriptorDescription
};

export * from './wasiTypes';
export * from './deviceDriver';
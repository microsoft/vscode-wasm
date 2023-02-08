/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WASI, Options, Environment, DeviceDescription, FileDescriptorDescription } from './wasi';
import { BigInts } from './converter';
import { s64, ptr } from './baseTypes';
import { FileBaseRights, FileInheritingRights, DirectoryBaseRights, DirectoryInheritingRights } from './vscodeFileSystemDriver';
import { rights } from './wasiTypes';

export {
	s64, ptr, WASI, Options, Environment, DeviceDescription, FileDescriptorDescription, BigInts
};

export * from '@vscode/sync-api-client';
export * from './wasiTypes';
export * from './deviceDriver';

type ExportRights  = { base: rights; inheriting: rights };
export namespace VSCodeFS {
	export const DirectoryRights: ExportRights =  {
		base: DirectoryBaseRights,
		inheriting: DirectoryInheritingRights
	};
	export const FileRights: ExportRights =  {
		base: FileBaseRights,
		inheriting: FileInheritingRights
	};
}
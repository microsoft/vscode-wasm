/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Errno, errno, Signatures, WasiError } from './wasi';
import { FunctionSignature, Param, ParamType } from './wasiMeta';

export namespace Offsets {
	export const lock_size = 4;
	export const lock_index = 0;
	// Method to call.
	export const method_size = 4;
	export const method_index = lock_index + lock_size;
	// Errno
	export const errno_size = 2;
	export const errno_index = method_index + method_size;
	// params
	export const params_index = errno_index + errno_size + 2; // 4 bytes alignment
	export const header_size = params_index;
}
// The size of the lock indicator.



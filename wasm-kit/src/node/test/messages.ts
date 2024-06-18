/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { ptr } from '@vscode/wasm-component-model';
import type { SharedMemory, MemoryLocation } from '../../common/sharedObject';

export type ManagementCalls = {
	method: 'init';
	params: {
		workerId: number;
		memory: SharedMemory.Transferable;
	};
	result: void;
} | {
	method: 'array/new';
	params: {
		counter: MemoryLocation;
		array: MemoryLocation;
		lock: MemoryLocation;
	};
	result: void;
};

export type Notifications =  {
	method: 'start';
} | {
	method: 'exit';
};

export type Operations = {
	method: 'array/push';
	params: {
		workerId: number;
		array: ptr;
		sequence: number;
		value: any;
		length: number;
	};
} | {
	method: 'array/pop';
	params: {
		workerId: number;
		array: ptr;
		sequence: number;
		result: any | undefined;
		length: number;
	};
} | {
	method: 'array/get';
	params: {
		workerId: number;
		array: ptr;
		sequence: number;
		index: number;
		result: any;
	};
};

export type ServerNotifications = {
	method: 'done';
};
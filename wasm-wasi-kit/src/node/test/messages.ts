/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { type MemoryRangeTransferable } from '@vscode/wasm-component-model';
import type { SharedMemory } from '../../common/sobject';

export type ManagementCalls = {
	method: 'init';
	params: {
		workerId: number;
		memory: SharedMemory.Transferable;
	};
	result: void;
};

export type Notifications = {
	method: 'array/new';
	params: {
		array: MemoryRangeTransferable;
		counter: MemoryRangeTransferable;
	};
} | {
	method: 'exit';
};

export type Operations = {
	method: 'array/push';
	params: {
		workerId: number;
		sequence: number;
		value: any;
		length: number;
	};
} | {
	method: 'array/pop';
	params: {
		workerId: number;
		sequence: number;
		result: any | undefined;
		length: number;
	};
} | {
	method: 'array/get';
	params: {
		workerId: number;
		sequence: number;
		index: number;
		result: any;
	};
};

export type ServerNotifications = {
	method: 'done';
};
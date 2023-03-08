/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Uri } from 'vscode';
import { ptr, u32 } from './baseTypes';

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

export interface StartMainMessage {
	readonly method: 'startMain';
	readonly bits: SharedArrayBuffer | Uri;
}

export interface StartThreadMessage {
	readonly method: 'startThread';
	readonly bits: SharedArrayBuffer | Uri;
	readonly tid: u32;
	readonly start_arg: ptr;
}

export interface WorkerReadyMessage {
	readonly method: 'workerReady';
}
export namespace WorkerReadyMessage {
	export function is(message: WasiCallMessage | WorkerReadyMessage): message is WorkerReadyMessage {
		const candidate = message as WorkerReadyMessage;
		return candidate && candidate.method === 'workerReady';
	}
}

export type WasiCallMessage = [SharedArrayBuffer, SharedArrayBuffer];
export namespace WasiCallMessage {
	export function is(message: WasiCallMessage | WorkerReadyMessage): message is WasiCallMessage {
		return Array.isArray(message) && message.length === 2 && message[0] instanceof SharedArrayBuffer && message[1] instanceof SharedArrayBuffer;
	}
}
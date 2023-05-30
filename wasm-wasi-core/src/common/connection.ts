/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/// <reference path="../../typings/webAssemblyCommon.d.ts" />

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
	readonly module: WebAssembly.Module;
	readonly memory?: WebAssembly.Memory;
	readonly trace?: boolean;
}
export namespace StartMainMessage {
	export function is(message: ServiceMessage): message is StartMainMessage {
		const candidate = message as StartMainMessage;
		return candidate && candidate.method === 'startMain';
	}
}

export interface StartThreadMessage {
	readonly method: 'startThread';
	readonly module: WebAssembly.Module;
	readonly memory: WebAssembly.Memory;
	readonly tid: u32;
	readonly start_arg: ptr;
	readonly trace?: boolean;
}
export namespace StartThreadMessage {
	export function is(message: ServiceMessage): message is StartThreadMessage {
		const candidate = message as StartThreadMessage;
		return candidate && candidate.method === 'startThread';
	}
}

export type ServiceMessage = StartMainMessage | StartThreadMessage | { method: string };

export interface WorkerReadyMessage {
	readonly method: 'workerReady';
}
export namespace WorkerReadyMessage {
	export function is(message: WorkerMessage): message is WorkerReadyMessage {
		const candidate = message as WorkerReadyMessage;
		return candidate && candidate.method === 'workerReady';
	}
}

export interface WorkerDoneMessage {
	readonly method: 'workerDone';
}
export namespace WorkerDoneMessage {
	export function is(message: WorkerMessage): message is WorkerReadyMessage {
		const candidate = message as WorkerDoneMessage;
		return candidate && candidate.method === 'workerDone';
	}
}

export interface TraceMessage {
	readonly method: 'trace';
	readonly message: string;
	readonly timeTaken: number;
}
export namespace TraceMessage {
	export function is(message: WorkerMessage): message is TraceMessage {
		const candidate = message as TraceMessage;
		return candidate && candidate.method === 'trace';
	}
}

export interface TraceSummaryMessage {
	readonly method: 'traceSummary';
	readonly summary: string[];
}
export namespace TraceSummaryMessage {
	export function is(message: WorkerMessage): message is TraceSummaryMessage {
		const candidate = message as TraceSummaryMessage;
		return candidate && candidate.method === 'traceSummary';
	}
}

export type WasiCallMessage = [SharedArrayBuffer, SharedArrayBuffer];
export namespace WasiCallMessage {
	export function is(message: WorkerMessage): message is WasiCallMessage {
		return Array.isArray(message) && message.length === 2 && message[0] instanceof SharedArrayBuffer && message[1] instanceof SharedArrayBuffer;
	}
}

export type WorkerMessage = WasiCallMessage | WorkerReadyMessage | WorkerDoneMessage | TraceMessage | TraceSummaryMessage | { method: string };
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { HostMessage, WorkerMessage } from '../../common/connection';

export interface TestsDoneMessage {
	method: 'testsDone';
	failures: number;
}

export namespace TestsDoneMessage {
	export function is(message: WorkerMessage): message is TestsDoneMessage {
		const candidate = message as TestsDoneMessage;
		return candidate.method === 'testsDone';
	}
}

export interface ConsoleMessage {
	readonly method: 'console';
	readonly severity: 'log' | 'info' | 'warn' | 'error';
	readonly args: any[];
}

export namespace ConsoleMessage {
	export function is(message: WorkerMessage): message is ConsoleMessage {
		const candidate = message as ConsoleMessage;
		return candidate.method === 'console';
	}
}

export interface ModeMessage {
	readonly method: 'setMode';
	readonly shared: boolean;
}

export namespace ModeMessage {
	export function is(message: HostMessage): message is ModeMessage {
		const candidate = message as ModeMessage;
		return candidate.method === 'setMode';
	}
}
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { WorkerMessage } from '../../common/connection';

export interface TestsDoneMessage extends WorkerMessage {
	method: 'testsDone';
	failures: number;
}

export interface ConsoleMessage extends WorkerMessage {
	readonly method: 'console';
	readonly severity: 'log' | 'info' | 'warn' | 'error';
	readonly args: any[];
}
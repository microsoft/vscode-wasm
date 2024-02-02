/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import type * as Messages from './workerMessages';
import { BaseConnection, type AnyConnection } from './connection';
import RAL from './ral';

export interface WorkerClient {
	launch(): Promise<void>;
	terminate(): Promise<number>;
}
export namespace WorkerClient {
	export type ConnectionType = BaseConnection<Messages.Client.AsyncCalls, undefined, undefined, undefined, undefined, Messages.Service.Notifications>;
}
export const WorkerClient = RAL().WorkerClient;

export abstract class WorkerClientBase {
	protected setConnection(_connection: AnyConnection): void {
		throw new Error(`Must be implemented in subclass`);
	}
}
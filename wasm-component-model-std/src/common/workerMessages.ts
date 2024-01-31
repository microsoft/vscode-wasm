/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/// <reference path="../../typings/workerCommon.d.ts" />

import type { BaseConnection } from './connection';

export namespace Client {
	export type AsyncCalls = {
		method: 'initialize';
		params: {
			sharedMemory: {
				module: WebAssembly.Module;
				memory: WebAssembly.Memory;
			};
		};
		result: void;
	} | {
		method: 'connection/create';
		params: {
			id: number | string;
			port: MessagePort;
		};
		result: void;
	} | {
		method: 'connection/drop';
		params: {
			id: number | string;
		};
		result: void;
	};
	export type ConnectionType<TIL = TransferItems> = BaseConnection<Client.AsyncCalls, undefined, undefined, undefined, undefined, Service.Notifications, TIL>;
}

export namespace Service {
	export type Notifications = {
		method: 'workerReady';
	};
	export type ConnectionType<TIL = TransferItems> = BaseConnection<undefined, undefined, Notifications, Client.AsyncCalls, undefined, undefined, TIL>;
}
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as wm from './workerMessages';

import _Client = wm.Client;
import _Service = wm.Service;

export * from './sobject';
export * from './sarray';
export * from './connection';
export * from './workerClient';
export * from './workerService';
export * from './workerMain';

export namespace WorkerMessages {
	export namespace Client {
		export type AsyncCalls = _Client.AsyncCalls;
		export type ConnectionType = _Client.ConnectionType;
	}
	export namespace Service {
		export type Notifications = _Service.Notifications;
		export type ConnectionType = _Service.ConnectionType;
	}
}
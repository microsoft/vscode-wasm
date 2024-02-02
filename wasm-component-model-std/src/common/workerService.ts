/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import type * as Messages from './workerMessages';
import { SharedObject, Memory } from './sobject';
import type { ConnectionPort, TransferItems } from './connection';

export abstract class BaseWorker {

	protected readonly connection: BaseWorker.ConnectionType;

	constructor(connection: BaseWorker.ConnectionType) {
		this.connection = connection;
		this.connection.onAsyncCall('initialize', async (params) => {
			const memory = await Memory.createFrom(params.sharedMemory.module, params.sharedMemory.memory);
			SharedObject.initialize(memory);
			this.connection.initializeSyncCall(memory);
		});
	}
}
export namespace BaseWorker {
	export type ConnectionType<TIL = TransferItems> = Messages.Service.ConnectionType<TIL>;
	export type Constructor = new (connection: ConnectionType, args?: string[]) => BaseWorker;
}


export abstract class MultiConnectionWorker<C> extends BaseWorker {

	private readonly connections: Map<number | string, C>;

	constructor(connection: BaseWorker.ConnectionType) {
		super(connection);
		this.connections = new Map();
		connection.onAsyncCall('connection/create', async (params) => {
			const connection = await this.createConnection(params.port);
			this.connections.set(params.id, connection);
		});
		connection.onAsyncCall('connection/drop', async (params) => {
			const connection = this.connections.get(params.id);
			if (connection !== undefined) {
				this.connections.delete(params.id);
				await this.dropConnection(connection);
			}
		});
	}

	protected abstract createConnection(port: ConnectionPort): Promise<C>;
	protected abstract dropConnection(connection:C): Promise<void>;
}
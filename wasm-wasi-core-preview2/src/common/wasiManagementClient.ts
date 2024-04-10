/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import RAL from '../ral';

import { AnyConnection, BaseConnection, type ConnectionPort, WorkerClientBase, type WorkerMessages, WorkerClient } from '@vscode/wasm-kit';

type ConnectionType = BaseConnection<WorkerMessages.Client.AsyncCalls, undefined, undefined, undefined, undefined, undefined>;

export type WasiConnectionInfo = {
	id: number;
	port: ConnectionPort;
};

class _WasiManagementClient extends WorkerClientBase {

	private static id: number = 1;

	private _connection: ConnectionType | undefined;

	constructor() {
		super();
	}

	protected setConnection(connection: AnyConnection): void {
		this._connection = AnyConnection.cast<ConnectionType>(connection);
	}

	protected get connection(): ConnectionType {
		if (this._connection === undefined) {
			throw new Error('Connection is not initialized.');
		}
		return this._connection;
	}

	public async createConnection(): Promise<WasiConnectionInfo> {
		const [port1, port2] = AnyConnection.createPorts();
		const id = _WasiManagementClient.id++;
		await this.connection.callAsync('connection/create', { id, port: port2 }, [port2]);
		return { id, port: port1 };
	}

	public async dropConnection(id: number): Promise<void> {
		await this.connection.callAsync('connection/drop', { id });
	}
}

export type WasiManagementClient = WorkerClient & { createConnection(): Promise<WasiConnectionInfo>; dropConnection(id: number): Promise<void> };
export const WasiManagementClient = WorkerClient<_WasiManagementClient>(_WasiManagementClient, RAL().Worker.getWorkerUri('common/preview2/wasiWorker.js'));
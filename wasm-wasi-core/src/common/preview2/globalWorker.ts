/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

//import RAL from '../common/ral';

import { BaseConnection, SharedObject } from '@vscode/wasm-component-model-std';

type AsyncCalls = {
	method: 'init';
	params: {
		memory: WebAssembly.Memory;
	};
} | {
	method: 'removeChannel';
	params: {
		id: number;
	};
};

export abstract class GlobalWorker {



	private readonly managementConnection: BaseConnection<>;

	private readonly connections: Map<number, BaseConnection> = new Map();

	protected init(memory: WebAssembly.Memory): Promise<void> {
		return SharedObject.initialize(memory);
	}

	protected removeChannel(id: number): void {
		const connection = this.connections.get(id);
		if (connection) {
			connection.destroy();
			this.connections.delete(id);
		}
	}
}
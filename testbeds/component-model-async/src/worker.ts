/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Connection, RAL, type WorkerConnection } from '@vscode/wasm-component-model';
import { calculator } from './calculator';

async function main(): Promise<void> {
	const connection: WorkerConnection = await Connection.createWorker(calculator._);
	connection.listen()
};

main().catch(RAL().console.error);
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AssertionError } from 'assert';
import { MessagePort, parentPort  } from 'worker_threads';

import { ClientConnection } from '@vscode/sync-api-common/node';
import { ApiClient, APIRequests, WorkspaceFolder } from '@vscode/sync-api-client';

import { TestRequests } from '../tests';

if (parentPort === null) {
	process.exit();
}
const pp: MessagePort = parentPort;

export default async function runSingle(test: (client: ApiClient, folder: WorkspaceFolder) => void): Promise<void> {
	const connection = new ClientConnection<APIRequests | TestRequests>(pp);
	const client = new ApiClient(connection);
	await connection.serviceReady();
	const workspaceFolders = client.vscode.workspace.workspaceFolders;
	const folder = workspaceFolders[0];
	try {
		test(client, folder);
		client.process.procExit(0);
	} catch (error) {
		if (error instanceof AssertionError) {
			connection.sendRequest('testing/assertionError', {
				message: error.message,
				actual: error.actual,
				expected: error.expected,
				operator: error.operator,
				generatedMessage: error.generatedMessage,
				code: error.code
			});
		} else if (error instanceof Error) {
			connection.sendRequest('testing/error', {
				message: error.message
			});
		} else {
			connection.sendRequest('testing/error', {
				message: `Unknown error occurred during test execution`
			});
		}
		client.process.procExit(1);
	}
}
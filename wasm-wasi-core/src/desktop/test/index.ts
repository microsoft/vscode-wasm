/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import path from 'path';
import {  Worker } from 'worker_threads';

export async function run(): Promise<void> {
	debugger;
	const worker = new Worker(path.join(__dirname, 'testWorker'));
	return new Promise((resolve) => {
		worker.once('exit', resolve);
	});
}
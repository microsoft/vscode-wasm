/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RIL from '../ril';
RIL.install();

import path from 'path';
import {  Worker } from 'worker_threads';

import { NodeServiceConnection } from '../process';
import { Clock, EnvironmentWasiService, NoSysWasiService, WasiService, ClockWasiService } from '../../common/service';
import { FileDescriptor, FileDescriptors } from '../../common/fileDescriptor';
import { Environment, Options } from '../../common/api';
import { FileSystemDeviceDriver } from '../../common/deviceDriver';

export async function run(): Promise<void> {
	await doRun(['shared']);
	await doRun(['nonShared']);
}

async function doRun(argv: string[]): Promise<void> {
	const worker = new Worker(path.join(__dirname, 'testWorker'), { argv: argv });
	const result = new Promise<void>((resolve) => {
		worker.once('exit', resolve);
	});
	const fileDescriptors: FileDescriptors = new FileDescriptors();
	const preOpenDirectories: Map<string, { driver: FileSystemDeviceDriver; fd: FileDescriptor | undefined }> =  new Map();
	const env: Environment = { 'var1': 'value1', 'var2': 'value2' };
	const options: Options = {
		args: ['arg1', 'arg22', 'arg333'],
		env,
	};
	const clock = Clock.create();
	const wasiService: WasiService = Object.assign({}, NoSysWasiService, EnvironmentWasiService.create(
		fileDescriptors, 'testApp', preOpenDirectories.entries(), options
	), ClockWasiService.create(clock));
	const connection = new NodeServiceConnection(wasiService, worker);
	await connection.workerReady();
	return result;
}
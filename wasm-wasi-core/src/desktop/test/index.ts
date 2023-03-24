/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RIL from '../ril';
RIL.install();

import path from 'node:path';
import {  Worker } from 'node:worker_threads';

import vscode from 'vscode';

import { NodeServiceConnection } from '../process';
import { Clock, EnvironmentWasiService, NoSysWasiService, WasiService, ClockWasiService } from '../../common/service';
import { FileDescriptor, FileDescriptors } from '../../common/fileDescriptor';
import { Environment, Options } from '../../common/api';
import { FileSystemDeviceDriver } from '../../common/deviceDriver';
import WasiKernel from '../../common/kernel';
import * as vscfs from '../../common/vscodeFileSystemDriver';
import { DeviceWasiService } from '../../common/service';

export async function run(): Promise<void> {
	// We have no workspace folder so we will create one and
	// add it to the workspace
	if (vscode.workspace.workspaceFolders === undefined || vscode.workspace.workspaceFolders.length === 0) {
		throw new Error(`No test workspace found`);
	}

	const folder = vscode.workspace.workspaceFolders![0].uri;
	const encoder = new TextEncoder();

	// This is fixture data
	const fixture = folder.with({ path: path.join(folder.path, 'fixture') });
	await vscode.workspace.fs.createDirectory(fixture);

	// Setup a fixture to test path_open
	const read = fixture.with({ path: path.join(fixture.path, 'path_open') });
	await vscode.workspace.fs.writeFile(folder.with({ path: path.join(read.path, 'helloWorld.txt') }), encoder.encode('Hello World'));

	// This is to store tmp data
	const tmp = folder.with({ path: path.join(folder.path, 'tmp') });
	await vscode.workspace.fs.createDirectory(tmp);

	await doRun(['shared'], folder);
	try {
		await vscode.workspace.fs.delete(tmp, { recursive: true });
	} catch (err) {
		console.error(err);
	}
	await vscode.workspace.fs.createDirectory(tmp);
	await doRun(['nonShared'], folder);
	try {
		await vscode.workspace.fs.delete(fixture, { recursive: true });
		await vscode.workspace.fs.delete(tmp, { recursive: true });
	} catch (err) {
		console.error(err);
	}
}

async function doRun(argv: string[], folder: vscode.Uri): Promise<void> {
	const fileDescriptors: FileDescriptors = new FileDescriptors();
	const deviceDrivers = WasiKernel.deviceDrivers;
	const fileSystem = vscfs.create(deviceDrivers.next(), folder);
	deviceDrivers.add(fileSystem);
	const preOpenDirectories: Map<string, { driver: FileSystemDeviceDriver; fd: FileDescriptor | undefined }> =  new Map([
		['/workspace', { driver: fileSystem, fd: undefined }]
	]);
	const env: Environment = { 'var1': 'value1', 'var2': 'value2' };
	const options: Options = {
		args: ['arg1', 'arg22', 'arg333'],
		env: env
	};

	const clock = Clock.create();
	const fileSystemService = DeviceWasiService.create(deviceDrivers, fileDescriptors, clock, options);
	const environmentService = EnvironmentWasiService.create(fileDescriptors, 'testApp', preOpenDirectories.entries(), options);
	const clockService = ClockWasiService.create(clock);
	const wasiService: WasiService = Object.assign({}, NoSysWasiService, environmentService, clockService, fileSystemService);

	const worker = new Worker(path.join(__dirname, 'testWorker'), { argv: argv });
	const result = new Promise<void>((resolve) => {
		worker.once('exit', resolve);
	});
	const connection = new NodeServiceConnection(wasiService, worker);
	await connection.workerReady();
	await result;
}
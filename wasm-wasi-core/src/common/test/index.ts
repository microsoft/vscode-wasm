/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RAL from '../ral';

import vscode from 'vscode';

import { Clock, EnvironmentWasiService, NoSysWasiService, WasiService, ClockWasiService, EnvironmentOptions } from '../service';
import { FileDescriptors } from '../fileDescriptor';
import { Environment } from '../api';
import { FileSystemDeviceDriver } from '../deviceDriver';
import WasiKernel from '../kernel';
import * as vscfs from '../vscodeFileSystemDriver';
import { DeviceWasiService } from '../service';


export type WorkspaceContent = {
	readonly root: vscode.Uri;
	readonly fixture: vscode.Uri;
	readonly tmp: vscode.Uri;
	readonly stats: {
		mtime: bigint;
		ctime: bigint;
	};
};

export async function createWorkspaceContent(): Promise<WorkspaceContent>{
	const path = RAL().path;
	// We have no workspace folder so we will create one and
	// add it to the workspace
	if (vscode.workspace.workspaceFolders === undefined || vscode.workspace.workspaceFolders.length === 0) {
		throw new Error(`No test workspace found`);
	}

	const folder = vscode.workspace.workspaceFolders![0].uri;
	const encoder = RAL().TextEncoder.create();

	// This is fixture data
	const fixture = folder.with({ path: path.join(folder.path, 'fixture') });
	await vscode.workspace.fs.createDirectory(fixture);

	// Setup a fixture to test path_open
	const read = fixture.with({ path: path.join(fixture.path, 'read') });
	const helloWorld = folder.with({ path: path.join(read.path, 'helloWorld.txt') });
	await vscode.workspace.fs.writeFile(helloWorld, encoder.encode('Hello World'));
	const stats = await vscode.workspace.fs.stat(helloWorld);
	await vscode.workspace.fs.writeFile(folder.with({ path: path.join(read.path, 'large.txt') }), encoder.encode('1'.repeat(3000)));

	// This is to store tmp data
	const tmp = folder.with({ path: path.join(folder.path, 'tmp') });
	await vscode.workspace.fs.createDirectory(tmp);

	return {
		root: folder,
		fixture: fixture,
		tmp: tmp,
		stats: {
			mtime: BigInt(stats.mtime) * 1000000n,
			ctime: BigInt(stats.ctime) * 1000000n
		}
	};
}

export async function createTmp(workspaceContent: WorkspaceContent): Promise<void> {
	await vscode.workspace.fs.createDirectory(workspaceContent.tmp);
}

export async function cleanupTmp(workspaceContent: WorkspaceContent): Promise<void> {
	await vscode.workspace.fs.delete(workspaceContent.tmp, { recursive: true });
}

export async function cleanupWorkspaceContent(workspaceContent: WorkspaceContent): Promise<void> {
	await vscode.workspace.fs.delete(workspaceContent.tmp, { recursive: true });
	await vscode.workspace.fs.delete(workspaceContent.fixture, { recursive: true });
}

export function createWasiService(workspaceContent: WorkspaceContent): WasiService {
	const fileDescriptors: FileDescriptors = new FileDescriptors();
	const deviceDrivers = WasiKernel.deviceDrivers;
	const fileSystem = vscfs.create(WasiKernel.nextDeviceId(), workspaceContent.root);
	deviceDrivers.add(fileSystem);
	const preOpenDirectories: Map<string, FileSystemDeviceDriver> =  new Map([
		['/workspace', fileSystem]
	]);
	const env: Environment = { 'var1': 'value1', 'var2': 'value2' };
	const options: EnvironmentOptions = {
		args: ['arg1', 'arg22', 'arg333'],
		env: env
	};

	const clock = Clock.create();
	const fileSystemService = DeviceWasiService.create(deviceDrivers, fileDescriptors, clock, undefined, options);
	const environmentService = EnvironmentWasiService.create(fileDescriptors, 'testApp', preOpenDirectories.entries(), options);
	const clockService = ClockWasiService.create(clock);
	const result: WasiService = Object.assign({}, NoSysWasiService, environmentService, clockService, fileSystemService);
	return result;
}
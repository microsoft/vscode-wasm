/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import assert from 'assert';

import WasiKernel from '../kernel';
import { FileDescriptors } from '../fileDescriptor';
import * as vrfs from '../rootFileSystemDriver';
import * as tfs from './testFileSystemDeviceDriver';
import { FileSystemDeviceDriver } from '../deviceDriver';
import { Uri } from 'vscode';

suite('RootFileSystem', () => {
	test('getMountPoint - root', () => {
		const fileDescriptors = new FileDescriptors();
		const mountPoints: Map<string, FileSystemDeviceDriver> = new Map();
		const rootUri = Uri.from({ scheme: 'fs-scheme', path: '/' });
		mountPoints.set('/usr/files', tfs.create(WasiKernel.nextDeviceId(), rootUri));
		const fs = vrfs.create(WasiKernel.nextDeviceId(), fileDescriptors, mountPoints);
		const mountPoint = fs.getMountPoint(Uri.from({ scheme: 'fs-scheme', path: '/abc.txt' }));
		assert.strictEqual(mountPoint[0], '/usr/files');
		assert.strictEqual(mountPoint[1].toString(), rootUri.toString());
	});

	test('getMountPoint - no root', () => {
		const fileDescriptors = new FileDescriptors();
		const mountPoints: Map<string, FileSystemDeviceDriver> = new Map();
		const rootUri = Uri.from({ scheme: 'fs-scheme', path: '/folder' });
		mountPoints.set('/usr/files', tfs.create(WasiKernel.nextDeviceId(), rootUri));
		const fs = vrfs.create(WasiKernel.nextDeviceId(), fileDescriptors, mountPoints);
		const mountPoint = fs.getMountPoint(Uri.from({ scheme: 'fs-scheme', path: '/folder/abc.txt' }));
		assert.strictEqual(mountPoint[0], '/usr/files');
		assert.strictEqual(mountPoint[1].toString(), rootUri.toString());
	});
});
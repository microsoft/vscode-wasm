/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { } from './wasiTypes';

import { Device, DeviceIds, FileDescriptor, NoSysDevice } from './device';
import { ApiClient } from '@vscode/sync-api-client';

export class TTYDevice extends NoSysDevice implements Device {

	public readonly id: bigint;

	private readonly apiClient: ApiClient;

	constructor(apiClient: ApiClient) {
		super();
		this.id = DeviceIds.next();
		this.apiClient = apiClient;
	}

	fd_write(fd: FileDescriptor, buffers: Uint8Array[]): size {
		const inode = getINode(fileDescriptor.inode);
		let buffer: Uint8Array;
		if (buffers.length === 1) {
			buffer = buffers[0];
		} else {
			const byteLength: number = buffers.reduce<number>((prev, current) => prev + current.length, 0);
			buffer = new Uint8Array(byteLength);
			let offset = 0;
			for (const item of buffers) {
				buffer.set(item, offset);
				offset = item.byteLength;
			}
		}
		apiClient.tty.write(inode.uri, buffer);
		return buffer.byteLength;
	}
}
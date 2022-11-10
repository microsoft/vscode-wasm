/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Uri } from 'vscode';

export interface Source {

	/**
	 * A unique URI representing the byte source.
	 */
	uri: Uri;

	/**
	 * Reads bytes from this source.
	 *
	 * @param maxBytesToRead The maximal number of bytes to read.
	 * @result the bytes read. Can be less than `maxBytesToRead`
	 */
	read(maxBytesToRead: number): Promise<Uint8Array>;
}

export interface Sink {

	/**
	 * A unique URI representing the byte sink.
	 */
	uri: Uri;

	/**
	 * Write the bytes to the sink
	 *
	 * @param The bytes to write.
	 * @result The actual number of bytes written.
	 */
	write(bytes: Uint8Array): Promise<number>;
}

export type FileDescriptorDescription = {
	kind: 'fileSystem';
	uri: Uri;
	path: string;
} | {
	kind: 'terminal';
	uri: Uri;
} | {
	kind: 'console';
	uri: Uri;
};

export interface CharacterDeviceDriver {

	/**
	 * A unique URI representing the character device.
	 */
	readonly uri: Uri;

	/**
	 * Returns a file descriptor description that can
	 * be used to identify the device on the WASI side.
	 */
	readonly fileDescriptor: FileDescriptorDescription;

	/**
	 * Write the bytes to the character device
	 *
	 * @param The bytes to write.
	 * @result The actual number of bytes written.
	 */
	write(bytes: Uint8Array): Promise<number>;

	/**
	 * Reads bytes from the character device.
	 *
	 * @param maxBytesToRead The maximal number of bytes to read.
	 * @result the bytes read. Can be less than `maxBytesToRead`
	 */
	read(maxBytesToRead: number): Promise<Uint8Array>;
}
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

export namespace Stdio {

	export const scheme = 'stdio' as const;

	export function createUri(components: { readonly authority?: string; readonly path?: string; readonly query?: string; readonly fragment?: string }): Uri {
		return Uri.from(Object.assign({ scheme: scheme}, components));
	}
}

export interface Stdio {
	stdin: Source;
	stdout: Sink;
	stderr: Sink;
}
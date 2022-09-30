/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Uri } from 'vscode';

export interface CharacterDeviceProvider {
	read(uri: Uri, maxBytesToRead: number): Promise<Uint8Array>;
	write(uri: Uri, bytes: Uint8Array): Promise<void>;
}
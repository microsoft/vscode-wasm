/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as code from 'vscode-sync-api-client';
import * as wasi from './wasiTypes';

export namespace code2Wasi {
	export function asFileType(fileType: code.FileType): wasi.FileType {
		switch (fileType) {
			case code.FileType.File:
				return wasi.FileType.regular_file;
			case code.FileType.Directory:
				return wasi.FileType.directory;
			case code.FileType.SymbolicLink:
				return wasi.FileType.symbolic_link;
			default:
				return wasi.FileType.unknown;
		}
	}
}
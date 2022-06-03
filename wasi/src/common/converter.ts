/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as code from 'vscode-sync-api-client';
import * as wasi from './wasiTypes';

export namespace code2Wasi {
	export function asFileType(fileType: code.FileType): wasi.filetype {
		switch (fileType) {
			case code.FileType.File:
				return wasi.filetype.regular_file;
			case code.FileType.Directory:
				return wasi.filetype.directory;
			case code.FileType.SymbolicLink:
				return wasi.filetype.symbolic_link;
			default:
				return wasi.filetype.unknown;
		}
	}
}
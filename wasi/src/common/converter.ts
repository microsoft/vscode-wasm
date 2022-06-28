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
				return wasi.Filetype.regular_file;
			case code.FileType.Directory:
				return wasi.Filetype.directory;
			case code.FileType.SymbolicLink:
				return wasi.Filetype.symbolic_link;
			default:
				return wasi.Filetype.unknown;
		}
	}
	export function asErrno(errno: code.RPCErrno): wasi.errno {
		switch (errno) {
			case code.RPCErrno.Success:
				return wasi.Errno.success;
			case code.RPCErrno.UnknownError:
				return wasi.Errno.inval;
			case code.Types.FileSystemError.FileNotFound:
				return wasi.Errno.noent;
			case code.Types.FileSystemError.FileExists:
				return wasi.Errno.exist;
			case code.Types.FileSystemError.FileNotADirectory:
				return wasi.Errno.notdir;
			case code.Types.FileSystemError.FileIsADirectory:
				return wasi.Errno.isdir;
			case code.Types.FileSystemError.NoPermissions:
				return wasi.Errno.perm;
			case code.Types.FileSystemError.Unavailable:
				return wasi.Errno.busy;
			default:
				return wasi.Errno.inval;
		}
	}
}
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as code from 'vscode';
import * as wasi from './wasi';

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
	export function asErrno(code: string): wasi.errno {
		switch (code) {
			case 'FileNotFound':
				return wasi.Errno.noent;
			case 'FileExists':
				return wasi.Errno.exist;
			case 'FileNotADirectory':
				return wasi.Errno.notdir;
			case 'FileIsADirectory':
				return wasi.Errno.isdir;
			case 'NoPermissions':
				return wasi.Errno.perm;
			case 'Unavailable':
				return wasi.Errno.busy;
			default:
				return wasi.Errno.inval;
		}
	}
}

export namespace BigInts {
	const MAX_VALUE_AS_BIGINT = BigInt(Number.MAX_VALUE);
	export function asNumber(value: bigint): number {
		if (value > MAX_VALUE_AS_BIGINT) {
			throw new wasi.WasiError(wasi.Errno.fbig);
		}
		return Number(value);
	}
	export function max(...args: bigint[]): bigint {
		return args.reduce((m, e) => e > m ? e : m);
	}

	export function min(...args: bigint[]): bigint {
		return args.reduce((m, e) => e < m ? e : m);
	}
}
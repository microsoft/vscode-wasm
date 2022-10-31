/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { RPCErrno, Uint32Result, VariableResult, u32 } from './connection';

export namespace DTOs {

	export type UriComponents = {
		scheme: string;
		authority: string;
		path: string;
		query: string;
		fragment: string;
	};

	export type FileDescriptorDescription = {
		kind: 'fileSystem';
		uri: UriComponents;
		path: string;
	} | {
		kind: 'terminal';
		uri: UriComponents;
	} | {
		kind: 'console';
		uri: UriComponents;
	};

	export type FileSystemError = u32;
	export namespace FileSystemError {

		/**
         * Create an error to signal that a file or folder wasn't found.
		 */
		export const FileNotFound = RPCErrno.$Custom;

		/**
         * Create an error to signal that a file or folder already exists, e.g. when
         * creating but not overwriting a file.
         */
		export const FileExists = FileNotFound + 1;

		/**
         * Create an error to signal that a file is not a folder.
         */
    	export const FileNotADirectory = FileExists + 1;

		/**
         * Create an error to signal that a file is a folder.
         */
		export const FileIsADirectory = FileNotADirectory + 1;

		/**
         * Create an error to signal that an operation lacks required permissions.
         */
		export const NoPermissions = FileIsADirectory + 1;

		/**
         * Create an error to signal that the file system is unavailable or too busy to
         * complete a request.
         */
		export const Unavailable = NoPermissions + 1;
	}

	export type fileType = u32;
	export enum FileType {
		/**
		 * The file type is unknown.
		 */
		Unknown = 0,

		/**
		 * A regular file.
		 */
		File = 1,

		/**
		 * A directory.
		 */
		Directory = 2,

		/**
		 * A symbolic link to a file.
		 */
		SymbolicLink = 64
	}

	export type filePermission = u32;
	export enum FilePermission {

		/**
    	 * The file is readonly.
    	 */
		Readonly = 1
	}

	export type Stat = {
		type: fileType;
		ctime: u32;
		mtime: u32;
		size: u32;
		permission: filePermission;
	};

	export namespace Stat {
		export const typedResult = Uint32Result.fromLength(5);
		export function create(memory: Uint32Array): Stat {
			return {
				get type() {
					return memory[0];
				},
				set type(value: u32) {
					memory[0] = value;
				},
				get ctime() {
					return memory[1];
				},
				set ctime(value: u32) {
					memory[1] = value;
				},
				get mtime() {
					return memory[2];
				},
				set mtime(value: u32) {
					memory[2]= value;
				},
				get size() {
					return memory[3];
				},
				set size(value: u32) {
					memory[3]= value;
				},
				get permission() {
					return memory[4];
				},
				set permission(value: u32) {
					memory[4]= value;
				}
			};
		}
	}

	export type DirectoryEntries = [string, DTOs.FileType][];

	export interface WorkspaceFolder {
		readonly uri: UriComponents;
		readonly name: string;
		readonly index: number;
	}

	export interface TextDocument {
		uri: UriComponents;
	}
}

export type Requests = {
	/**
	 * The WebAssembly execution has existed.
	 */
	method: 'process/proc_exit';
	params: {
		rval: number;
	};
	result: null;

} | {
	/**
	 * Sleep for the amount of ms.
	 */
	method: 'timer/sleep';
	params: {
		ms: number;
	};
	result: null;
} | {
	/**
	 * Retrieve the set of workspace folders
	 */
	method: 'workspace/workspaceFolders';
	params: null;
	result: VariableResult<DTOs.WorkspaceFolder[]>;
} | {
	/**
	 * Writes bytes to a sink
	 */
	method: 'byteSink/write';
	params: {
		uri: DTOs.UriComponents;
		binary: Uint8Array;
	};
	result: Uint32Array;
} | {
	/**
	 * Reads bytes from a source
	 */
	method: 'byteSource/read';
	params: {
		uri: DTOs.UriComponents;
		maxBytesToRead: number;
	};
	result: VariableResult<Uint8Array>;
} | {
	/**
	 * Stat a file / directory
	 */
	method: 'fileSystem/stat';
	params: {
		uri: DTOs.UriComponents;
	};
	result: Uint32Array;
} | {
	/**
	 * Read a file
	 */
	method: 'fileSystem/readFile';
	params: {
		uri: DTOs.UriComponents;
	};
	result: VariableResult<Uint8Array>;
} | {
	/**
	 * Write a file
	 */
	method: 'fileSystem/writeFile';
	params: {
		uri: DTOs.UriComponents;
		binary: Uint8Array;
	};
	result: null;
} | {
	/**
	 * Read a directory
	 */
	method: 'fileSystem/readDirectory';
	params: {
		uri: DTOs.UriComponents;
	};
	result: VariableResult<DTOs.DirectoryEntries>;
} | {
	method: 'fileSystem/createDirectory';
	params: {
		uri: DTOs.UriComponents;
	};
	result: null;
} | {
	method: 'fileSystem/delete';
	params: {
		uri: DTOs.UriComponents;
		options?: {
			recursive?: boolean;
			useTrash?: boolean;
		};
	};
	result: null;
} | {
	method: 'fileSystem/rename';
	params: {
		source: DTOs.UriComponents;
		target: DTOs.UriComponents;
		options?: {
			overwrite?: boolean;
		};
	};
	result: null;
};
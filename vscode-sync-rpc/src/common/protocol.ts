/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Uint32Result, VariableResult } from './connection';

export type u8 = number;
export type u16 = number;
export type u32 = number;
export type u64 = number;
export type size = u32;

export namespace Types {

	export type FileSystemError = u16;
	export namespace FileSystemError {

		/**
		 * Operation was successful.
		 */
		export const Success = 0;

		/**
		 * Unknown error happened during file operation.
		 */
		export const Unknown = 1;

		/**
         * Create an error to signal that a file or folder wasn't found.
		 */
		export const FileNotFound = 2;

		/**
         * Create an error to signal that a file or folder already exists, e.g. when
         * creating but not overwriting a file.
         */
		export const FileExists = 3;

		/**
         * Create an error to signal that a file is not a folder.
         */
    	export const FileNotADirectory = 4;

		/**
         * Create an error to signal that a file is a folder.
         */
		export const FileIsADirectory = 5;

		/**
         * Create an error to signal that an operation lacks required permissions.
         */
		export const NoPermissions = 6;

		/**
         * Create an error to signal that the file system is unavailable or too busy to
         * complete a request.
         */
		export const Unavailable = 7;
	}

	export type UriComponents = {
		scheme: string;
		authority: string;
		path: string;
		query: string;
		fragment: string;
	};

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

	export type DirectoryEntries = [string, Types.FileType][];
}

export type Requests =
{
	/**
	 * Write a string encoded using UTF8 to the terminal
	 */
	method: 'terminal/write';
	params: {
		binary: Uint8Array;
	};
	result: null;
} | {
	/**
	 * Read from the terminal and provide the data as
	 * a string encoded using UTF8
	 */
	method: 'terminal/read';
	params: null;
	result: Uint8Array;
} | {
	/**
	 * Stat a file / directory
	 */
	method: 'fileSystem/stat';
	params: {
		uri: Types.UriComponents;
	};
	result: Uint32Array;
} | {
	/**
	 * Read a file
	 */
	method: 'fileSystem/readFile';
	params: {
		uri: Types.UriComponents;
	};
	result: VariableResult<Uint8Array>;
} | {
	/**
	 * Write a file
	 */
	method: 'fileSystem/writeFile';
	params: {
		uri: Types.UriComponents;
		binary: Uint8Array;
	};
	result: null;
} | {
	/**
	 * Read a directory
	 */
	method: 'fileSystem/readDirectory';
	params: {
		uri: Types.UriComponents;
	};
	result: VariableResult<Types.DirectoryEntries>;
} | {
	method: 'fileSystem/createDirectory';
	params: {
		uri: Types.UriComponents;
	};
	result: null;
} | {
	method: 'fileSystem/delete';
	params: {
		uri: Types.UriComponents;
		options?: {
			recursive?: boolean;
			useTrash?: boolean;
		};
	};
	result: null;
};
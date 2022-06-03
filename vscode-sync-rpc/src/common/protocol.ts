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
	 * Open a file
	 */
	method: 'fileSystem/readFile';
	params: {
		uri: Types.UriComponents;
	};
	result: VariableResult<Uint8Array>;
};
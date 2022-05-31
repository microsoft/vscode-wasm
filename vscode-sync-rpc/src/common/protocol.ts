/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

export type u8 = number;
export type u16 = number;
export type u32 = number;
export type u64 = number;
export type size = u32;

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

export type Stat = {
	type: fileType;
	ctime: u32;
	mtime: u32;
	size: u32;
};

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
		uri: UriComponents;
	};
	result: Stat;
};
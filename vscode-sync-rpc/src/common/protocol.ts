/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

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
};
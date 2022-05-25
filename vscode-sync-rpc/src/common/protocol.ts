/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

export type Requests = {
	method: 'terminal/write';
	params: {
		binary: Uint8Array;
	};
	result: null;
} | {
	method: 'terminal/read';
	params: null;
	result: Uint8Array;
};
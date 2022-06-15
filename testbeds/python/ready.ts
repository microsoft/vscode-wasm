/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export interface UriComponents {
	scheme: string;
	authority: string;
	path: string;
	query: string;
	fragment: string;
}

export type WorkspaceFolder = {
	name: string;
	uri: UriComponents;
};

export type Ready = {
	workspaceFolders: WorkspaceFolder[];
	pythonFile: UriComponents;
};
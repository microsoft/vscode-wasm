/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as ts from 'typescript';
import { ApiClient, APIRequests } from 'vscode-sync-api-client';
import { ClientConnection, DTOs } from 'vscode-sync-rpc/browser';
import { URI, Utils } from 'vscode-uri';

const connection = new ClientConnection<APIRequests>(<Worker><any>globalThis);

connection.serviceReady().then(() => {
	ts.parseJsonConfigFileContent

	const apiClient = new ApiClient(connection);

	const [workspaceFolder] = apiClient.workspace.workspaceFolders;

	type FileSystemEntries = {
		readonly files: readonly string[];
		readonly directories: readonly string[];
	}
	type TSExt = typeof ts & {
		matchFiles(path: string, extensions: readonly string[] | undefined, excludes: readonly string[] | undefined, includes: readonly string[] | undefined, useCaseSensitiveFileNames: boolean, currentDirectory: string, depth: number | undefined, getFileSystemEntries: (path: string) => FileSystemEntries, realpath: (path: string) => string): string[];
	}

	const host = new class implements ts.ParseConfigFileHost {

		// -- ParseConfigFileHost

		readonly useCaseSensitiveFileNames: boolean = true;

		getCurrentDirectory() {
			return '/'
		}

		readDirectory(rootDir: string, extensions: readonly string[], excludes: readonly string[] | undefined, includes: readonly string[], depth?: number | undefined): readonly string[] {
			return (<TSExt>ts).matchFiles(
				rootDir, extensions, excludes, includes, false, this.getCurrentDirectory(), depth,
				path => this._getFileSystemEntries(path),
				path => path
			)
		}

		private _getFileSystemEntries(path: string): FileSystemEntries {
			const uri = Utils.joinPath(workspaceFolder.uri, path)
			const entries = apiClient.workspace.fileSystem.readDirectory(uri);
			const files: string[] = [];
			const directories: string[] = [];
			for (const [name, type] of entries) {
				switch (type) {
					case DTOs.FileType.Directory:
						directories.push(name);
						break;
					case DTOs.FileType.File:
						files.push(name);
						break;
				}
			}
			return { files, directories }
		}

		fileExists(path: string): boolean {
			try {
				const uri = Utils.joinPath(workspaceFolder.uri, path)
				apiClient.workspace.fileSystem.stat(uri)
				return true;
			} catch (error) {
				return false;
			}
		}

		readFile(path: string): string | undefined {
			const uri = Utils.joinPath(workspaceFolder.uri, path)
			const bytes = apiClient.workspace.fileSystem.read(uri);
			return new TextDecoder().decode(new Uint8Array(bytes).slice())
		}

		// --- ConfigFileDiagnosticsReporter

		onUnRecoverableConfigFileDiagnostic(d: ts.Diagnostic) {
			debugger;
			console.error('FATAL', d)
		}
	}

	try {
		const parsed = ts.getParsedCommandLineOfConfigFile('ts/tsconfig.json', undefined, host)
		console.log(JSON.stringify(parsed, undefined, 4))
	} catch (error) {
		console.error(error)
	}

	apiClient.procExit(0)
})
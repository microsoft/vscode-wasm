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

	const host = new class implements ts.ParseConfigFileHost {

		// -- ParseConfigFileHost

		readonly useCaseSensitiveFileNames: boolean = true;

		getCurrentDirectory() {
			return '/'
		}

		readDirectory(rootDir: string, extensions: readonly string[], excludes: readonly string[] | undefined, includes: readonly string[], depth?: number | undefined): readonly string[] {
			const result: string[] = [];
			this._readDirectory(rootDir, extensions, excludes, includes, depth ?? 0, result);
			return result;
		}

		_readDirectory(rootDir: string, extensions: readonly string[], excludes: readonly string[] | undefined, includes: readonly string[], depth: number, bucket: string[]) {
			const uri = Utils.joinPath(workspaceFolder.uri, rootDir)
			const entries = apiClient.workspace.fileSystem.readDirectory(uri);
			for (const [name, type] of entries) {
				const path = `${rootDir}/${name}`;
				if (extensions.some(ext => name.endsWith(ext))) {
					bucket.push(path)
				}
				if (depth > 0 && type === DTOs.FileType.Directory) {
					this._readDirectory(path, extensions, excludes, includes, depth - 1, bucket)
				}
			}
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
		console.log(parsed)
	} catch (error) {
		console.error(error)
	}

	apiClient.procExit(0)
})

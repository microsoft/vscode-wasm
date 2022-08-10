/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { URI } from 'vscode-uri';
import { Errno, fdflags, WasiError } from './wasiTypes';


export namespace FileSystem {

	let inodeCounter: bigint = 1n;

	export const stdinINode = inodeCounter++;
	export const stdoutINode = inodeCounter++;
	export const stderrINode = inodeCounter++;

	type INode = {
		/**
		 * The inode Id.
		 */
		id: bigint;

		refs: number;

		/**
		 * The corresponding VS Code URI
		 */
		uri: URI;

		fdFlags: fdflags;


		/**
		 * The loaded file content if available.
		 */
		content: Uint8Array | undefined;
	};

	const $path2INode: Map<string, INode> = new Map();
	const $inodes: Map<bigint, INode> = new Map();

	export function getINodeByPath(filepath: string, uri: URI): INode {
		let result = $path2INode.get(filepath);
		if (result !== undefined) {
			return result;
		}
		result = { id: inodeCounter++, uri, refs: 0, content: undefined };
		$path2INode.set(filepath, result);
		$inodes.set(result.id, result);
		return result;
	}

	export function getINodeById(id: bigint): INode {
		const result = $inodes.get(id);
		if (result === undefined) {
			throw new WasiError(Errno.badf);
		}
		return result;
	}

	export function releaseINode(filePath: string): void {

	}

	export function remapINode(oldPath: string, newPath: string): void {

	}
}
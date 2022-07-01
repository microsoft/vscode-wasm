/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { URI } from 'vscode-uri';

/**
 * Enumeration of file types. The types `File` and `Directory` can also be
 * a symbolic links, in that case use `FileType.File | FileType.SymbolicLink` and
 * `FileType.Directory | FileType.SymbolicLink`.
 */
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

export enum FilePermission {

	/**
     * The file is readonly.
     */
	Readonly = 1
}

/**
 * The `FileStat`-type represents metadata about a file
 */
export interface FileStat {

	/**
     * The type of the file, e.g. is a regular file, a directory, or symbolic link
     * to a file.
     *
     * *Note:* This value might be a bitmask, e.g. `FileType.File | FileType.SymbolicLink`.
     */
	type: FileType;

	/**
     * The creation timestamp in milliseconds elapsed since January 1, 1970 00:00:00 UTC.
     */
	ctime: number;

	/**
     * The modification timestamp in milliseconds elapsed since January 1, 1970 00:00:00 UTC.
     *
     * *Note:* If the file changed, it is important to provide an updated `mtime` that advanced
     * from the previous value. Otherwise there may be optimizations in place that will not show
     * the updated file contents in an editor for example.
     */
	mtime: number;

	/**
     * The size in bytes.
     *
     * *Note:* If the file changed, it is important to provide an updated `size`. Otherwise there
     * may be optimizations in place that will not show the updated file contents in an editor for
     * example.
     */
	size: number;

	/**
     * The permissions of the file, e.g. whether the file is readonly.
     *
     * *Note:* This value might be a bitmask, e.g. `FilePermission.Readonly | FilePermission.Other`.
     */
	permissions?: FilePermission;
}

export class FileSystemError extends Error {

	/**
      * Create an error to signal that a file or folder wasn't found.
      * @param messageOrUri Message or uri.
      */
	public static FileNotFound(messageOrUri?: string | URI): FileSystemError {
		return new FileSystemError('FileNotFound', messageOrUri);
	}

	/**
     * Create an error to signal that a file or folder already exists, e.g. when
     * creating but not overwriting a file.
     * @param messageOrUri Message or uri.
     */
	public static FileExists(messageOrUri?: string | URI): FileSystemError {
		return new FileSystemError('FileExists', messageOrUri);
	}

	/**
     * Create an error to signal that a file is not a folder.
     * @param messageOrUri Message or uri.
     */
	public static FileNotADirectory(messageOrUri?: string | URI): FileSystemError {
		return new FileSystemError('FileNotADirectory', messageOrUri);
	}

	/**
     * Create an error to signal that a file is a folder.
     * @param messageOrUri Message or uri.
     */
	public static FileIsADirectory(messageOrUri?: string | URI): FileSystemError {
		return new FileSystemError('FileIsADirectory', messageOrUri);
	}

	/**
     * Create an error to signal that an operation lacks required permissions.
     * @param messageOrUri Message or uri.
     */
	public static NoPermissions(messageOrUri?: string | URI): FileSystemError {
		return new FileSystemError('NoPermissions', messageOrUri);
	}

	/**
     * Create an error to signal that the file system is unavailable or too busy to
     * complete a request.
     * @param messageOrUri Message or uri.
     */
	public static Unavailable(messageOrUri?: string | URI): FileSystemError {
		return new FileSystemError('Unavailable', messageOrUri);
	}

	/**
      * Creates a new filesystem error.
      *
      * @param messageOrUri Message or uri.
      */
	private constructor(code: string, messageOrUri?: string | URI) {
		super(typeof messageOrUri === 'string' ? messageOrUri : messageOrUri !== undefined ? messageOrUri.toString() : 'Unknown error');
		this.code = code;
	}

	/**
     * A code that identifies this error.
     *
     * Possible values are names of errors, like {@linkcode FileSystemError.FileNotFound FileNotFound},
     * or `Unknown` for unspecified errors.
     */
	readonly code: string;
}

export interface WorkspaceFolder {

	/**
      * The associated uri for this workspace folder.
      *
      * *Note:* The {@link Uri}-type was intentionally chosen such that future releases of the editor can support
      * workspace folders that are not stored on the local disk, e.g. `ftp://server/workspaces/foo`.
      */
	readonly uri: URI;

	/**
      * The name of this workspace folder. Defaults to
      * the basename of its {@link Uri.path uri-path}
      */
	readonly name: string;

	/**
      * The ordinal number of this workspace folder.
      */
	readonly index: number;
}

export interface TextDocument {
	uri: URI;
}
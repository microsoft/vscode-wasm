/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

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

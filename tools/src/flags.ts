/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

const flags: Map<string, bigint> = new Map([
 	['fd_datasync', 1n << 0n],
	['fd_read', 1n << 1n],
	['fd_seek', 1n << 2n],
	['fd_fdstat_set_flags', 1n << 3n],
	['fd_sync', 1n << 4n],
	['fd_tell', 1n << 5n],
	['fd_write', 1n << 6n],
	['fd_advise', 1n << 7n],
	['fd_allocate', 1n << 8n],
	['path_create_directory', 1n << 9n],
	['path_create_file', 1n << 10n],
	['path_link_source', 1n << 11n],
	['path_link_target', 1n << 12n],
	['path_open', 1n << 13n],
	['fd_readdir', 1n << 14n],
	['path_readlink', 1n << 15n],
	['path_rename_source', 1n << 16n],
	['path_rename_target', 1n << 17n],
	['path_filestat_get', 1n << 18n],
	['path_filestat_set_size', 1n << 19n],
	['path_filestat_set_times', 1n << 20n],
	['fd_filestat_get', 1n << 21n],
	['fd_filestat_set_size', 1n << 22n],
	['fd_filestat_set_times', 1n << 23n],
	['path_symlink', 1n << 24n],
	['path_remove_directory', 1n << 25n],
	['path_unlink_file', 1n << 26n],
	['poll_fd_readwrite', 1n << 27n],
	['sock_shutdown', 1n << 28n],
	['sock_accept', 1n << 29n]
]);

const value = BigInt(process.argv[2]);
for (const entry of flags) {
	if ((value & entry[1]) !== 0n) {
		console.log(entry[0]);
	}
}
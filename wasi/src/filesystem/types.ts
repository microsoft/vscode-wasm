import * as $wcm from '@vscode/wasm-component-model';
import type { u64, u32, result, option } from '@vscode/wasm-component-model';
import { wall_clock } from '../clocks/wall-clock';
import { streams } from '../io/streams';

export namespace types {
	type input_stream = streams.input_stream;
	type output_stream = streams.output_stream;
	
	type datetime = wall_clock.datetime;
	
	/**
	 * File size or length of a region within a file.
	 */
	export type filesize = u64;
	
	/**
	 * The type of a filesystem object referenced by a descriptor.
	 *
	 * Note: This was called `filetype` in earlier versions of WASI.
	 */
	export enum descriptor_type {
		/**
		 * The type of the descriptor or file is unknown or is different from
		 * any of the other types specified.
		 */
		unknown = 0,
		
		/**
		 * The descriptor refers to a block device inode.
		 */
		block_device = 1,
		
		/**
		 * The descriptor refers to a character device inode.
		 */
		character_device = 2,
		
		/**
		 * The descriptor refers to a directory inode.
		 */
		directory = 3,
		
		/**
		 * The descriptor refers to a named pipe.
		 */
		fifo = 4,
		
		/**
		 * The file refers to a symbolic link inode.
		 */
		symbolic_link = 5,
		
		/**
		 * The descriptor refers to a regular file inode.
		 */
		regular_file = 6,
		
		/**
		 * The descriptor refers to a socket.
		 */
		socket = 7,
	}
	
	/**
	 * Descriptor flags.
	 *
	 * Note: This was called `fdflags` in earlier versions of WASI.
	 */
	export interface descriptor_flags extends $wcm.JFlags {
		/**
		 * Read mode: Data can be read.
		 */
		read: boolean;
		
		/**
		 * Write mode: Data can be written to.
		 */
		write: boolean;
		
		/**
		 * Request that writes be performed according to synchronized I/O file
		 * integrity completion. The data stored in the file and the file's
		 * metadata are synchronized. This is similar to `O_SYNC` in POSIX.
		 *
		 * The precise semantics of this operation have not yet been defined for
		 * WASI. At this time, it should be interpreted as a request, and not a
		 * requirement.
		 */
		file_integrity_sync: boolean;
		
		/**
		 * Request that writes be performed according to synchronized I/O data
		 * integrity completion. Only the data stored in the file is
		 * synchronized. This is similar to `O_DSYNC` in POSIX.
		 *
		 * The precise semantics of this operation have not yet been defined for
		 * WASI. At this time, it should be interpreted as a request, and not a
		 * requirement.
		 */
		data_integrity_sync: boolean;
		
		/**
		 * Requests that reads be performed at the same level of integrety
		 * requested for writes. This is similar to `O_RSYNC` in POSIX.
		 *
		 * The precise semantics of this operation have not yet been defined for
		 * WASI. At this time, it should be interpreted as a request, and not a
		 * requirement.
		 */
		requested_write_sync: boolean;
		
		/**
		 * Mutating directories mode: Directory contents may be mutated.
		 *
		 * When this flag is unset on a descriptor, operations using the
		 * descriptor which would create, rename, delete, modify the data or
		 * metadata of filesystem objects, or obtain another handle which
		 * would permit any of those, shall fail with `error-code::read-only` if
		 * they would otherwise succeed.
		 *
		 * This may only be set on directories.
		 */
		mutate_directory: boolean;
	}
	
	/**
	 * File attributes.
	 *
	 * Note: This was called `filestat` in earlier versions of WASI.
	 */
	export interface descriptor_stat extends $wcm.JRecord {
		type: descriptor_type;
		
		link_count: link_count;
		
		size: filesize;
		
		data_access_timestamp: datetime;
		
		data_modification_timestamp: datetime;
		
		status_change_timestamp: datetime;
	}
	
	/**
	 * Flags determining the method of how paths are resolved.
	 */
	export interface path_flags extends $wcm.JFlags {
		/**
		 * As long as the resolved path corresponds to a symbolic link, it is
		 * expanded.
		 */
		symlink_follow: boolean;
	}
	
	/**
	 * Open flags used by `open-at`.
	 */
	export interface open_flags extends $wcm.JFlags {
		/**
		 * Create file if it does not exist, similar to `O_CREAT` in POSIX.
		 */
		create: boolean;
		
		/**
		 * Fail if not a directory, similar to `O_DIRECTORY` in POSIX.
		 */
		directory: boolean;
		
		/**
		 * Fail if file already exists, similar to `O_EXCL` in POSIX.
		 */
		exclusive: boolean;
		
		/**
		 * Truncate file to size 0, similar to `O_TRUNC` in POSIX.
		 */
		truncate: boolean;
	}
	
	/**
	 * Permissions mode used by `open-at`, `change-file-permissions-at`, and
	 * similar.
	 */
	export interface modes extends $wcm.JFlags {
		/**
		 * True if the resource is considered readable by the containing
		 * filesystem.
		 */
		readable: boolean;
		
		/**
		 * True if the resource is considered writable by the containing
		 * filesystem.
		 */
		writable: boolean;
		
		/**
		 * True if the resource is considered executable by the containing
		 * filesystem. This does not apply to directories.
		 */
		executable: boolean;
	}
	
	/**
	 * Access type used by `access-at`.
	 */
	export namespace access_type {
		/**
		 * Test for readability, writeability, or executability.
		 */
		export const access = 0;
		export type access = { readonly case: typeof access; readonly value: modes } & _common;
		
		/**
		 * Test whether the path exists.
		 */
		export const exists = 1;
		export type exists = { readonly case: typeof exists } & _common;
		
		export type _ct = typeof access | typeof exists;
		export type _vt = modes | undefined;
		type _common = Omit<VariantImpl, 'case' | 'value'>;
		export function _ctor(c: _ct, v: _vt): access_type {
			return new VariantImpl(c, v) as access_type;
		}
		export function _access(value: modes): access {
			return new VariantImpl(access, value) as access;
		}
		export function _exists(): exists {
			return new VariantImpl(exists, undefined) as exists;
		}
		class VariantImpl {
			private readonly _case: _ct;
			private readonly _value?: _vt;
			constructor(c: _ct, value: _vt) {
				this._case = c;
				this._value = value;
			}
			get case(): _ct {
				return this._case;
			}
			get value(): _vt {
				return this._value;
			}
			access(): this is access {
				return this._case === access_type.access;
			}
			exists(): this is exists {
				return this._case === access_type.exists;
			}
		}
	}
	export type access_type = access_type.access | access_type.exists;
	
	/**
	 * Number of hard links to an inode.
	 */
	export type link_count = u64;
	
	/**
	 * When setting a timestamp, this gives the value to set it to.
	 */
	export namespace new_timestamp {
		/**
		 * Leave the timestamp set to its previous value.
		 */
		export const no_change = 0;
		export type no_change = { readonly case: typeof no_change } & _common;
		
		/**
		 * Set the timestamp to the current time of the system clock associated
		 * with the filesystem.
		 */
		export const now = 1;
		export type now = { readonly case: typeof now } & _common;
		
		/**
		 * Set the timestamp to the given value.
		 */
		export const timestamp = 2;
		export type timestamp = { readonly case: typeof timestamp; readonly value: datetime } & _common;
		
		export type _ct = typeof no_change | typeof now | typeof timestamp;
		export type _vt = datetime | undefined;
		type _common = Omit<VariantImpl, 'case' | 'value'>;
		export function _ctor(c: _ct, v: _vt): new_timestamp {
			return new VariantImpl(c, v) as new_timestamp;
		}
		export function _no_change(): no_change {
			return new VariantImpl(no_change, undefined) as no_change;
		}
		export function _now(): now {
			return new VariantImpl(now, undefined) as now;
		}
		export function _timestamp(value: datetime): timestamp {
			return new VariantImpl(timestamp, value) as timestamp;
		}
		class VariantImpl {
			private readonly _case: _ct;
			private readonly _value?: _vt;
			constructor(c: _ct, value: _vt) {
				this._case = c;
				this._value = value;
			}
			get case(): _ct {
				return this._case;
			}
			get value(): _vt {
				return this._value;
			}
			no_change(): this is no_change {
				return this._case === new_timestamp.no_change;
			}
			now(): this is now {
				return this._case === new_timestamp.now;
			}
			timestamp(): this is timestamp {
				return this._case === new_timestamp.timestamp;
			}
		}
	}
	export type new_timestamp = new_timestamp.no_change | new_timestamp.now | new_timestamp.timestamp;
	
	/**
	 * A directory entry.
	 */
	export interface directory_entry extends $wcm.JRecord {
		type: descriptor_type;
		
		name: string;
	}
	
	/**
	 * Error codes returned by functions, similar to `errno` in POSIX.
	 * Not all of these error codes are returned by the functions provided by this
	 * API; some are used in higher-level library layers, and others are provided
	 * merely for alignment with POSIX.
	 */
	export enum error_code {
		/**
		 * Permission denied, similar to `EACCES` in POSIX.
		 */
		access = 0,
		
		/**
		 * Resource unavailable, or operation would block, similar to `EAGAIN` and `EWOULDBLOCK` in POSIX.
		 */
		would_block = 1,
		
		/**
		 * Connection already in progress, similar to `EALREADY` in POSIX.
		 */
		already = 2,
		
		/**
		 * Bad descriptor, similar to `EBADF` in POSIX.
		 */
		bad_descriptor = 3,
		
		/**
		 * Device or resource busy, similar to `EBUSY` in POSIX.
		 */
		busy = 4,
		
		/**
		 * Resource deadlock would occur, similar to `EDEADLK` in POSIX.
		 */
		deadlock = 5,
		
		/**
		 * Storage quota exceeded, similar to `EDQUOT` in POSIX.
		 */
		quota = 6,
		
		/**
		 * File exists, similar to `EEXIST` in POSIX.
		 */
		exist = 7,
		
		/**
		 * File too large, similar to `EFBIG` in POSIX.
		 */
		file_too_large = 8,
		
		/**
		 * Illegal byte sequence, similar to `EILSEQ` in POSIX.
		 */
		illegal_byte_sequence = 9,
		
		/**
		 * Operation in progress, similar to `EINPROGRESS` in POSIX.
		 */
		in_progress = 10,
		
		/**
		 * Interrupted function, similar to `EINTR` in POSIX.
		 */
		interrupted = 11,
		
		/**
		 * Invalid argument, similar to `EINVAL` in POSIX.
		 */
		invalid = 12,
		
		/**
		 * I/O error, similar to `EIO` in POSIX.
		 */
		io = 13,
		
		/**
		 * Is a directory, similar to `EISDIR` in POSIX.
		 */
		is_directory = 14,
		
		/**
		 * Too many levels of symbolic links, similar to `ELOOP` in POSIX.
		 */
		loop = 15,
		
		/**
		 * Too many links, similar to `EMLINK` in POSIX.
		 */
		too_many_links = 16,
		
		/**
		 * Message too large, similar to `EMSGSIZE` in POSIX.
		 */
		message_size = 17,
		
		/**
		 * Filename too long, similar to `ENAMETOOLONG` in POSIX.
		 */
		name_too_long = 18,
		
		/**
		 * No such device, similar to `ENODEV` in POSIX.
		 */
		no_device = 19,
		
		/**
		 * No such file or directory, similar to `ENOENT` in POSIX.
		 */
		no_entry = 20,
		
		/**
		 * No locks available, similar to `ENOLCK` in POSIX.
		 */
		no_lock = 21,
		
		/**
		 * Not enough space, similar to `ENOMEM` in POSIX.
		 */
		insufficient_memory = 22,
		
		/**
		 * No space left on device, similar to `ENOSPC` in POSIX.
		 */
		insufficient_space = 23,
		
		/**
		 * Not a directory or a symbolic link to a directory, similar to `ENOTDIR` in POSIX.
		 */
		not_directory = 24,
		
		/**
		 * Directory not empty, similar to `ENOTEMPTY` in POSIX.
		 */
		not_empty = 25,
		
		/**
		 * State not recoverable, similar to `ENOTRECOVERABLE` in POSIX.
		 */
		not_recoverable = 26,
		
		/**
		 * Not supported, similar to `ENOTSUP` and `ENOSYS` in POSIX.
		 */
		unsupported = 27,
		
		/**
		 * Inappropriate I/O control operation, similar to `ENOTTY` in POSIX.
		 */
		no_tty = 28,
		
		/**
		 * No such device or address, similar to `ENXIO` in POSIX.
		 */
		no_such_device = 29,
		
		/**
		 * Value too large to be stored in data type, similar to `EOVERFLOW` in POSIX.
		 */
		overflow = 30,
		
		/**
		 * Operation not permitted, similar to `EPERM` in POSIX.
		 */
		not_permitted = 31,
		
		/**
		 * Broken pipe, similar to `EPIPE` in POSIX.
		 */
		pipe = 32,
		
		/**
		 * Read-only file system, similar to `EROFS` in POSIX.
		 */
		read_only = 33,
		
		/**
		 * Invalid seek, similar to `ESPIPE` in POSIX.
		 */
		invalid_seek = 34,
		
		/**
		 * Text file busy, similar to `ETXTBSY` in POSIX.
		 */
		text_file_busy = 35,
		
		/**
		 * Cross-device link, similar to `EXDEV` in POSIX.
		 */
		cross_device = 36,
	}
	
	/**
	 * File or memory access pattern advisory information.
	 */
	export enum advice {
		/**
		 * The application has no advice to give on its behavior with respect
		 * to the specified data.
		 */
		normal = 0,
		
		/**
		 * The application expects to access the specified data sequentially
		 * from lower offsets to higher offsets.
		 */
		sequential = 1,
		
		/**
		 * The application expects to access the specified data in a random
		 * order.
		 */
		random = 2,
		
		/**
		 * The application expects to access the specified data in the near
		 * future.
		 */
		will_need = 3,
		
		/**
		 * The application expects that it will not access the specified data
		 * in the near future.
		 */
		dont_need = 4,
		
		/**
		 * The application expects to access the specified data once and then
		 * not reuse it thereafter.
		 */
		no_reuse = 5,
	}
	
	/**
	 * A descriptor is a reference to a filesystem object, which may be a file,
	 * directory, named pipe, special file, or other object on which filesystem
	 * calls may be made.
	 *
	 * This [represents a resource](https://github.com/WebAssembly/WASI/blob/main/docs/WitInWasi.md#Resources).
	 */
	export type descriptor = u32;
	
	/**
	 * A 128-bit hash value, split into parts because wasm doesn't have a
	 * 128-bit integer type.
	 */
	export interface metadata_hash_value extends $wcm.JRecord {
		lower: u64;
		
		upper: u64;
	}
	
	/**
	 * Return a stream for reading from a file, if available.
	 *
	 * May fail with an error-code describing why the file cannot be read.
	 *
	 * Multiple read, write, and append streams may be active on the same open
	 * file and they do not interfere with each other.
	 *
	 * Note: This allows using `read-stream`, which is similar to `read` in POSIX.
	 */
	export declare function read_via_stream($this: descriptor, offset: filesize): result<input_stream, error_code>;
	
	/**
	 * Return a stream for writing to a file, if available.
	 *
	 * May fail with an error-code describing why the file cannot be written.
	 *
	 * Note: This allows using `write-stream`, which is similar to `write` in
	 * POSIX.
	 */
	export declare function write_via_stream($this: descriptor, offset: filesize): result<output_stream, error_code>;
	
	/**
	 * Return a stream for appending to a file, if available.
	 *
	 * May fail with an error-code describing why the file cannot be appended.
	 *
	 * Note: This allows using `write-stream`, which is similar to `write` with
	 * `O_APPEND` in in POSIX.
	 */
	export declare function append_via_stream($this: descriptor): result<output_stream, error_code>;
	
	/**
	 * Provide file advisory information on a descriptor.
	 *
	 * This is similar to `posix_fadvise` in POSIX.
	 */
	export declare function advise($this: descriptor, offset: filesize, length: filesize, advice: advice): result<void, error_code>;
	
	/**
	 * Synchronize the data of a file to disk.
	 *
	 * This function succeeds with no effect if the file descriptor is not
	 * opened for writing.
	 *
	 * Note: This is similar to `fdatasync` in POSIX.
	 */
	export declare function sync_data($this: descriptor): result<void, error_code>;
	
	/**
	 * Get flags associated with a descriptor.
	 *
	 * Note: This returns similar flags to `fcntl(fd, F_GETFL)` in POSIX.
	 *
	 * Note: This returns the value that was the `fs_flags` value returned
	 * from `fdstat_get` in earlier versions of WASI.
	 */
	export declare function get_flags($this: descriptor): result<descriptor_flags, error_code>;
	
	/**
	 * Get the dynamic type of a descriptor.
	 *
	 * Note: This returns the same value as the `type` field of the `fd-stat`
	 * returned by `stat`, `stat-at` and similar.
	 *
	 * Note: This returns similar flags to the `st_mode & S_IFMT` value provided
	 * by `fstat` in POSIX.
	 *
	 * Note: This returns the value that was the `fs_filetype` value returned
	 * from `fdstat_get` in earlier versions of WASI.
	 */
	export declare function get_type($this: descriptor): result<descriptor_type, error_code>;
	
	/**
	 * Adjust the size of an open file. If this increases the file's size, the
	 * extra bytes are filled with zeros.
	 *
	 * Note: This was called `fd_filestat_set_size` in earlier versions of WASI.
	 */
	export declare function set_size($this: descriptor, size: filesize): result<void, error_code>;
	
	/**
	 * Adjust the timestamps of an open file or directory.
	 *
	 * Note: This is similar to `futimens` in POSIX.
	 *
	 * Note: This was called `fd_filestat_set_times` in earlier versions of WASI.
	 */
	export declare function set_times($this: descriptor, data_access_timestamp: new_timestamp, data_modification_timestamp: new_timestamp): result<void, error_code>;
	
	/**
	 * Read from a descriptor, without using and updating the descriptor's offset.
	 *
	 * This function returns a list of bytes containing the data that was
	 * read, along with a bool which, when true, indicates that the end of the
	 * file was reached. The returned list will contain up to `length` bytes; it
	 * may return fewer than requested, if the end of the file is reached or
	 * if the I/O operation is interrupted.
	 *
	 * In the future, this may change to return a `stream<u8, error-code>`.
	 *
	 * Note: This is similar to `pread` in POSIX.
	 */
	export declare function read($this: descriptor, length: filesize, offset: filesize): result<[Uint8Array, boolean], error_code>;
	
	/**
	 * Write to a descriptor, without using and updating the descriptor's offset.
	 *
	 * It is valid to write past the end of a file; the file is extended to the
	 * extent of the write, with bytes between the previous end and the start of
	 * the write set to zero.
	 *
	 * In the future, this may change to take a `stream<u8, error-code>`.
	 *
	 * Note: This is similar to `pwrite` in POSIX.
	 */
	export declare function write($this: descriptor, buffer: Uint8Array, offset: filesize): result<filesize, error_code>;
	
	/**
	 * Read directory entries from a directory.
	 *
	 * On filesystems where directories contain entries referring to themselves
	 * and their parents, often named `.` and `..` respectively, these entries
	 * are omitted.
	 *
	 * This always returns a new stream which starts at the beginning of the
	 * directory. Multiple streams may be active on the same directory, and they
	 * do not interfere with each other.
	 */
	export declare function read_directory($this: descriptor): result<directory_entry_stream, error_code>;
	
	/**
	 * Synchronize the data and metadata of a file to disk.
	 *
	 * This function succeeds with no effect if the file descriptor is not
	 * opened for writing.
	 *
	 * Note: This is similar to `fsync` in POSIX.
	 */
	export declare function sync($this: descriptor): result<void, error_code>;
	
	/**
	 * Create a directory.
	 *
	 * Note: This is similar to `mkdirat` in POSIX.
	 */
	export declare function create_directory_at($this: descriptor, path: string): result<void, error_code>;
	
	/**
	 * Return the attributes of an open file or directory.
	 *
	 * Note: This is similar to `fstat` in POSIX, except that it does not return
	 * device and inode information. For testing whether two descriptors refer to
	 * the same underlying filesystem object, use `is-same-object`. To obtain
	 * additional data that can be used do determine whether a file has been
	 * modified, use `metadata-hash`.
	 *
	 * Note: This was called `fd_filestat_get` in earlier versions of WASI.
	 */
	export declare function stat($this: descriptor): result<descriptor_stat, error_code>;
	
	/**
	 * Return the attributes of a file or directory.
	 *
	 * Note: This is similar to `fstatat` in POSIX, except that it does not
	 * return device and inode information. See the `stat` description for a
	 * discussion of alternatives.
	 *
	 * Note: This was called `path_filestat_get` in earlier versions of WASI.
	 */
	export declare function stat_at($this: descriptor, path_flags: path_flags, path: string): result<descriptor_stat, error_code>;
	
	/**
	 * Adjust the timestamps of a file or directory.
	 *
	 * Note: This is similar to `utimensat` in POSIX.
	 *
	 * Note: This was called `path_filestat_set_times` in earlier versions of
	 * WASI.
	 */
	export declare function set_times_at($this: descriptor, path_flags: path_flags, path: string, data_access_timestamp: new_timestamp, data_modification_timestamp: new_timestamp): result<void, error_code>;
	
	/**
	 * Create a hard link.
	 *
	 * Note: This is similar to `linkat` in POSIX.
	 */
	export declare function link_at($this: descriptor, old_path_flags: path_flags, old_path: string, new_descriptor: descriptor, new_path: string): result<void, error_code>;
	
	/**
	 * Open a file or directory.
	 *
	 * The returned descriptor is not guaranteed to be the lowest-numbered
	 * descriptor not currently open/ it is randomized to prevent applications
	 * from depending on making assumptions about indexes, since this is
	 * error-prone in multi-threaded contexts. The returned descriptor is
	 * guaranteed to be less than 2**31.
	 *
	 * If `flags` contains `descriptor-flags::mutate-directory`, and the base
	 * descriptor doesn't have `descriptor-flags::mutate-directory` set,
	 * `open-at` fails with `error-code::read-only`.
	 *
	 * If `flags` contains `write` or `mutate-directory`, or `open-flags`
	 * contains `truncate` or `create`, and the base descriptor doesn't have
	 * `descriptor-flags::mutate-directory` set, `open-at` fails with
	 * `error-code::read-only`.
	 *
	 * Note: This is similar to `openat` in POSIX.
	 */
	export declare function open_at($this: descriptor, path_flags: path_flags, path: string, open_flags: open_flags, flags: descriptor_flags, modes: modes): result<descriptor, error_code>;
	
	/**
	 * Read the contents of a symbolic link.
	 *
	 * If the contents contain an absolute or rooted path in the underlying
	 * filesystem, this function fails with `error-code::not-permitted`.
	 *
	 * Note: This is similar to `readlinkat` in POSIX.
	 */
	export declare function readlink_at($this: descriptor, path: string): result<string, error_code>;
	
	/**
	 * Remove a directory.
	 *
	 * Return `error-code::not-empty` if the directory is not empty.
	 *
	 * Note: This is similar to `unlinkat(fd, path, AT_REMOVEDIR)` in POSIX.
	 */
	export declare function remove_directory_at($this: descriptor, path: string): result<void, error_code>;
	
	/**
	 * Rename a filesystem object.
	 *
	 * Note: This is similar to `renameat` in POSIX.
	 */
	export declare function rename_at($this: descriptor, old_path: string, new_descriptor: descriptor, new_path: string): result<void, error_code>;
	
	/**
	 * Create a symbolic link (also known as a "symlink").
	 *
	 * If `old-path` starts with `/`, the function fails with
	 * `error-code::not-permitted`.
	 *
	 * Note: This is similar to `symlinkat` in POSIX.
	 */
	export declare function symlink_at($this: descriptor, old_path: string, new_path: string): result<void, error_code>;
	
	/**
	 * Check accessibility of a filesystem path.
	 *
	 * Check whether the given filesystem path names an object which is
	 * readable, writable, or executable, or whether it exists.
	 *
	 * This does not a guarantee that subsequent accesses will succeed, as
	 * filesystem permissions may be modified asynchronously by external
	 * entities.
	 *
	 * Note: This is similar to `faccessat` with the `AT_EACCESS` flag in POSIX.
	 */
	export declare function access_at($this: descriptor, path_flags: path_flags, path: string, type: access_type): result<void, error_code>;
	
	/**
	 * Unlink a filesystem object that is not a directory.
	 *
	 * Return `error-code::is-directory` if the path refers to a directory.
	 * Note: This is similar to `unlinkat(fd, path, 0)` in POSIX.
	 */
	export declare function unlink_file_at($this: descriptor, path: string): result<void, error_code>;
	
	/**
	 * Change the permissions of a filesystem object that is not a directory.
	 *
	 * Note that the ultimate meanings of these permissions is
	 * filesystem-specific.
	 *
	 * Note: This is similar to `fchmodat` in POSIX.
	 */
	export declare function change_file_permissions_at($this: descriptor, path_flags: path_flags, path: string, modes: modes): result<void, error_code>;
	
	/**
	 * Change the permissions of a directory.
	 *
	 * Note that the ultimate meanings of these permissions is
	 * filesystem-specific.
	 *
	 * Unlike in POSIX, the `executable` flag is not reinterpreted as a "search"
	 * flag. `read` on a directory implies readability and searchability, and
	 * `execute` is not valid for directories.
	 *
	 * Note: This is similar to `fchmodat` in POSIX.
	 */
	export declare function change_directory_permissions_at($this: descriptor, path_flags: path_flags, path: string, modes: modes): result<void, error_code>;
	
	/**
	 * Request a shared advisory lock for an open file.
	 *
	 * This requests a *shared* lock; more than one shared lock can be held for
	 * a file at the same time.
	 *
	 * If the open file has an exclusive lock, this function downgrades the lock
	 * to a shared lock. If it has a shared lock, this function has no effect.
	 *
	 * This requests an *advisory* lock, meaning that the file could be accessed
	 * by other programs that don't hold the lock.
	 *
	 * It is unspecified how shared locks interact with locks acquired by
	 * non-WASI programs.
	 *
	 * This function blocks until the lock can be acquired.
	 *
	 * Not all filesystems support locking; on filesystems which don't support
	 * locking, this function returns `error-code::unsupported`.
	 *
	 * Note: This is similar to `flock(fd, LOCK_SH)` in Unix.
	 */
	export declare function lock_shared($this: descriptor): result<void, error_code>;
	
	/**
	 * Request an exclusive advisory lock for an open file.
	 *
	 * This requests an *exclusive* lock; no other locks may be held for the
	 * file while an exclusive lock is held.
	 *
	 * If the open file has a shared lock and there are no exclusive locks held
	 * for the file, this function upgrades the lock to an exclusive lock. If the
	 * open file already has an exclusive lock, this function has no effect.
	 *
	 * This requests an *advisory* lock, meaning that the file could be accessed
	 * by other programs that don't hold the lock.
	 *
	 * It is unspecified whether this function succeeds if the file descriptor
	 * is not opened for writing. It is unspecified how exclusive locks interact
	 * with locks acquired by non-WASI programs.
	 *
	 * This function blocks until the lock can be acquired.
	 *
	 * Not all filesystems support locking; on filesystems which don't support
	 * locking, this function returns `error-code::unsupported`.
	 *
	 * Note: This is similar to `flock(fd, LOCK_EX)` in Unix.
	 */
	export declare function lock_exclusive($this: descriptor): result<void, error_code>;
	
	/**
	 * Request a shared advisory lock for an open file.
	 *
	 * This requests a *shared* lock; more than one shared lock can be held for
	 * a file at the same time.
	 *
	 * If the open file has an exclusive lock, this function downgrades the lock
	 * to a shared lock. If it has a shared lock, this function has no effect.
	 *
	 * This requests an *advisory* lock, meaning that the file could be accessed
	 * by other programs that don't hold the lock.
	 *
	 * It is unspecified how shared locks interact with locks acquired by
	 * non-WASI programs.
	 *
	 * This function returns `error-code::would-block` if the lock cannot be
	 * acquired.
	 *
	 * Not all filesystems support locking; on filesystems which don't support
	 * locking, this function returns `error-code::unsupported`.
	 *
	 * Note: This is similar to `flock(fd, LOCK_SH | LOCK_NB)` in Unix.
	 */
	export declare function try_lock_shared($this: descriptor): result<void, error_code>;
	
	/**
	 * Request an exclusive advisory lock for an open file.
	 *
	 * This requests an *exclusive* lock; no other locks may be held for the
	 * file while an exclusive lock is held.
	 *
	 * If the open file has a shared lock and there are no exclusive locks held
	 * for the file, this function upgrades the lock to an exclusive lock. If the
	 * open file already has an exclusive lock, this function has no effect.
	 *
	 * This requests an *advisory* lock, meaning that the file could be accessed
	 * by other programs that don't hold the lock.
	 *
	 * It is unspecified whether this function succeeds if the file descriptor
	 * is not opened for writing. It is unspecified how exclusive locks interact
	 * with locks acquired by non-WASI programs.
	 *
	 * This function returns `error-code::would-block` if the lock cannot be
	 * acquired.
	 *
	 * Not all filesystems support locking; on filesystems which don't support
	 * locking, this function returns `error-code::unsupported`.
	 *
	 * Note: This is similar to `flock(fd, LOCK_EX | LOCK_NB)` in Unix.
	 */
	export declare function try_lock_exclusive($this: descriptor): result<void, error_code>;
	
	/**
	 * Release a shared or exclusive lock on an open file.
	 *
	 * Note: This is similar to `flock(fd, LOCK_UN)` in Unix.
	 */
	export declare function unlock($this: descriptor): result<void, error_code>;
	
	/**
	 * Dispose of the specified `descriptor`, after which it may no longer
	 * be used.
	 */
	export declare function drop_descriptor($this: descriptor): void;
	
	/**
	 * A stream of directory entries.
	 *
	 * This [represents a stream of `dir-entry`](https://github.com/WebAssembly/WASI/blob/main/docs/WitInWasi.md#Streams).
	 */
	export type directory_entry_stream = u32;
	
	/**
	 * Read a single directory entry from a `directory-entry-stream`.
	 */
	export declare function read_directory_entry($this: directory_entry_stream): result<option<directory_entry>, error_code>;
	
	/**
	 * Dispose of the specified `directory-entry-stream`, after which it may no longer
	 * be used.
	 */
	export declare function drop_directory_entry_stream($this: directory_entry_stream): void;
	
	/**
	 * Test whether two descriptors refer to the same filesystem object.
	 *
	 * In POSIX, this corresponds to testing whether the two descriptors have the
	 * same device (`st_dev`) and inode (`st_ino` or `d_ino`) numbers.
	 * wasi-filesystem does not expose device and inode numbers, so this function
	 * may be used instead.
	 */
	export declare function is_same_object($this: descriptor, other: descriptor): boolean;
	
	/**
	 * Return a hash of the metadata associated with a filesystem object referred
	 * to by a descriptor.
	 *
	 * This returns a hash of the last-modification timestamp and file size, and
	 * may also include the inode number, device number, birth timestamp, and
	 * other metadata fields that may change when the file is modified or
	 * replaced. It may also include a secret value chosen by the
	 * implementation and not otherwise exposed.
	 *
	 * Implementations are encourated to provide the following properties:
	 *
	 *  - If the file is not modified or replaced, the computed hash value should
	 *    usually not change.
	 *  - If the object is modified or replaced, the computed hash value should
	 *    usually change.
	 *  - The inputs to the hash should not be easily computable from the
	 *    computed hash.
	 *
	 * However, none of these is required.
	 */
	export declare function metadata_hash($this: descriptor): result<metadata_hash_value, error_code>;
	
	/**
	 * Return a hash of the metadata associated with a filesystem object referred
	 * to by a directory descriptor and a relative path.
	 *
	 * This performs the same hash computation as `metadata-hash`.
	 */
	export declare function metadata_hash_at($this: descriptor, path_flags: path_flags, path: string): result<metadata_hash_value, error_code>;
	export namespace $cm {
		const $input_stream = streams.$cm.$input_stream;
		const $output_stream = streams.$cm.$output_stream;
		const $datetime = wall_clock.$cm.$datetime;
		export const $filesize = $wcm.u64;
		export const $link_count = $wcm.u64;
		export const $descriptor = $wcm.u32;
		export const $directory_entry_stream = $wcm.u32;
		export const $descriptor_type = new $wcm.EnumType<descriptor_type>(8);
		export const $descriptor_flags = new $wcm.FlagsType<descriptor_flags>(['read', 'write', 'file_integrity_sync', 'data_integrity_sync', 'requested_write_sync', 'mutate_directory']);
		export const $descriptor_stat = new $wcm.RecordType<descriptor_stat>([
			['type', $descriptor_type], ['link_count', $link_count], ['size', $filesize], ['data_access_timestamp', $datetime], ['data_modification_timestamp', $datetime], ['status_change_timestamp', $datetime]
		]);
		export const $path_flags = new $wcm.FlagsType<path_flags>(['symlink_follow']);
		export const $open_flags = new $wcm.FlagsType<open_flags>(['create', 'directory', 'exclusive', 'truncate']);
		export const $modes = new $wcm.FlagsType<modes>(['readable', 'writable', 'executable']);
		export const $access_type = new $wcm.VariantType<access_type, access_type._ct, access_type._vt>([$modes, undefined], access_type._ctor);
		export const $new_timestamp = new $wcm.VariantType<new_timestamp, new_timestamp._ct, new_timestamp._vt>([undefined, undefined, $datetime], new_timestamp._ctor);
		export const $directory_entry = new $wcm.RecordType<directory_entry>([
			['type', $descriptor_type], ['name', $wcm.wstring]
		]);
		export const $error_code = new $wcm.EnumType<error_code>(37);
		export const $advice = new $wcm.EnumType<advice>(6);
		export const $metadata_hash_value = new $wcm.RecordType<metadata_hash_value>([
			['lower', $wcm.u64], ['upper', $wcm.u64]
		]);
		export const $read_via_stream = new $wcm.FunctionSignature('read_via_stream', [
			['$this', $descriptor], ['offset', $filesize]
		], new $wcm.ResultType<input_stream, error_code>($input_stream, $error_code));
		export const $write_via_stream = new $wcm.FunctionSignature('write_via_stream', [
			['$this', $descriptor], ['offset', $filesize]
		], new $wcm.ResultType<output_stream, error_code>($output_stream, $error_code));
		export const $append_via_stream = new $wcm.FunctionSignature('append_via_stream', [
			['$this', $descriptor]
		], new $wcm.ResultType<output_stream, error_code>($output_stream, $error_code));
		export const $advise = new $wcm.FunctionSignature('advise', [
			['$this', $descriptor], ['offset', $filesize], ['length', $filesize], ['advice', $advice]
		], new $wcm.ResultType<void, error_code>(undefined, $error_code));
		export const $sync_data = new $wcm.FunctionSignature('sync_data', [
			['$this', $descriptor]
		], new $wcm.ResultType<void, error_code>(undefined, $error_code));
		export const $get_flags = new $wcm.FunctionSignature('get_flags', [
			['$this', $descriptor]
		], new $wcm.ResultType<descriptor_flags, error_code>($descriptor_flags, $error_code));
		export const $get_type = new $wcm.FunctionSignature('get_type', [
			['$this', $descriptor]
		], new $wcm.ResultType<descriptor_type, error_code>($descriptor_type, $error_code));
		export const $set_size = new $wcm.FunctionSignature('set_size', [
			['$this', $descriptor], ['size', $filesize]
		], new $wcm.ResultType<void, error_code>(undefined, $error_code));
		export const $set_times = new $wcm.FunctionSignature('set_times', [
			['$this', $descriptor], ['data_access_timestamp', $new_timestamp], ['data_modification_timestamp', $new_timestamp]
		], new $wcm.ResultType<void, error_code>(undefined, $error_code));
		export const $read = new $wcm.FunctionSignature('read', [
			['$this', $descriptor], ['length', $filesize], ['offset', $filesize]
		], new $wcm.ResultType<[Uint8Array, boolean], error_code>(new $wcm.TupleType<[Uint8Array, boolean]>([new $wcm.Uint8ArrayType(), $wcm.bool]), $error_code));
		export const $write = new $wcm.FunctionSignature('write', [
			['$this', $descriptor], ['buffer', new $wcm.Uint8ArrayType()], ['offset', $filesize]
		], new $wcm.ResultType<filesize, error_code>($filesize, $error_code));
		export const $read_directory = new $wcm.FunctionSignature('read_directory', [
			['$this', $descriptor]
		], new $wcm.ResultType<directory_entry_stream, error_code>($directory_entry_stream, $error_code));
		export const $sync = new $wcm.FunctionSignature('sync', [
			['$this', $descriptor]
		], new $wcm.ResultType<void, error_code>(undefined, $error_code));
		export const $create_directory_at = new $wcm.FunctionSignature('create_directory_at', [
			['$this', $descriptor], ['path', $wcm.wstring]
		], new $wcm.ResultType<void, error_code>(undefined, $error_code));
		export const $stat = new $wcm.FunctionSignature('stat', [
			['$this', $descriptor]
		], new $wcm.ResultType<descriptor_stat, error_code>($descriptor_stat, $error_code));
		export const $stat_at = new $wcm.FunctionSignature('stat_at', [
			['$this', $descriptor], ['path_flags', $path_flags], ['path', $wcm.wstring]
		], new $wcm.ResultType<descriptor_stat, error_code>($descriptor_stat, $error_code));
		export const $set_times_at = new $wcm.FunctionSignature('set_times_at', [
			['$this', $descriptor], ['path_flags', $path_flags], ['path', $wcm.wstring], ['data_access_timestamp', $new_timestamp], ['data_modification_timestamp', $new_timestamp]
		], new $wcm.ResultType<void, error_code>(undefined, $error_code));
		export const $link_at = new $wcm.FunctionSignature('link_at', [
			['$this', $descriptor], ['old_path_flags', $path_flags], ['old_path', $wcm.wstring], ['new_descriptor', $descriptor], ['new_path', $wcm.wstring]
		], new $wcm.ResultType<void, error_code>(undefined, $error_code));
		export const $open_at = new $wcm.FunctionSignature('open_at', [
			['$this', $descriptor], ['path_flags', $path_flags], ['path', $wcm.wstring], ['open_flags', $open_flags], ['flags', $descriptor_flags], ['modes', $modes]
		], new $wcm.ResultType<descriptor, error_code>($descriptor, $error_code));
		export const $readlink_at = new $wcm.FunctionSignature('readlink_at', [
			['$this', $descriptor], ['path', $wcm.wstring]
		], new $wcm.ResultType<string, error_code>($wcm.wstring, $error_code));
		export const $remove_directory_at = new $wcm.FunctionSignature('remove_directory_at', [
			['$this', $descriptor], ['path', $wcm.wstring]
		], new $wcm.ResultType<void, error_code>(undefined, $error_code));
		export const $rename_at = new $wcm.FunctionSignature('rename_at', [
			['$this', $descriptor], ['old_path', $wcm.wstring], ['new_descriptor', $descriptor], ['new_path', $wcm.wstring]
		], new $wcm.ResultType<void, error_code>(undefined, $error_code));
		export const $symlink_at = new $wcm.FunctionSignature('symlink_at', [
			['$this', $descriptor], ['old_path', $wcm.wstring], ['new_path', $wcm.wstring]
		], new $wcm.ResultType<void, error_code>(undefined, $error_code));
		export const $access_at = new $wcm.FunctionSignature('access_at', [
			['$this', $descriptor], ['path_flags', $path_flags], ['path', $wcm.wstring], ['type', $access_type]
		], new $wcm.ResultType<void, error_code>(undefined, $error_code));
		export const $unlink_file_at = new $wcm.FunctionSignature('unlink_file_at', [
			['$this', $descriptor], ['path', $wcm.wstring]
		], new $wcm.ResultType<void, error_code>(undefined, $error_code));
		export const $change_file_permissions_at = new $wcm.FunctionSignature('change_file_permissions_at', [
			['$this', $descriptor], ['path_flags', $path_flags], ['path', $wcm.wstring], ['modes', $modes]
		], new $wcm.ResultType<void, error_code>(undefined, $error_code));
		export const $change_directory_permissions_at = new $wcm.FunctionSignature('change_directory_permissions_at', [
			['$this', $descriptor], ['path_flags', $path_flags], ['path', $wcm.wstring], ['modes', $modes]
		], new $wcm.ResultType<void, error_code>(undefined, $error_code));
		export const $lock_shared = new $wcm.FunctionSignature('lock_shared', [
			['$this', $descriptor]
		], new $wcm.ResultType<void, error_code>(undefined, $error_code));
		export const $lock_exclusive = new $wcm.FunctionSignature('lock_exclusive', [
			['$this', $descriptor]
		], new $wcm.ResultType<void, error_code>(undefined, $error_code));
		export const $try_lock_shared = new $wcm.FunctionSignature('try_lock_shared', [
			['$this', $descriptor]
		], new $wcm.ResultType<void, error_code>(undefined, $error_code));
		export const $try_lock_exclusive = new $wcm.FunctionSignature('try_lock_exclusive', [
			['$this', $descriptor]
		], new $wcm.ResultType<void, error_code>(undefined, $error_code));
		export const $unlock = new $wcm.FunctionSignature('unlock', [
			['$this', $descriptor]
		], new $wcm.ResultType<void, error_code>(undefined, $error_code));
		export const $drop_descriptor = new $wcm.FunctionSignature('drop_descriptor', [
			['$this', $descriptor]
		]);
		export const $read_directory_entry = new $wcm.FunctionSignature('read_directory_entry', [
			['$this', $directory_entry_stream]
		], new $wcm.ResultType<option<directory_entry>, error_code>(new $wcm.OptionType<directory_entry>($directory_entry), $error_code));
		export const $drop_directory_entry_stream = new $wcm.FunctionSignature('drop_directory_entry_stream', [
			['$this', $directory_entry_stream]
		]);
		export const $is_same_object = new $wcm.FunctionSignature('is_same_object', [
			['$this', $descriptor], ['other', $descriptor]
		], $wcm.bool);
		export const $metadata_hash = new $wcm.FunctionSignature('metadata_hash', [
			['$this', $descriptor]
		], new $wcm.ResultType<metadata_hash_value, error_code>($metadata_hash_value, $error_code));
		export const $metadata_hash_at = new $wcm.FunctionSignature('metadata_hash_at', [
			['$this', $descriptor], ['path_flags', $path_flags], ['path', $wcm.wstring]
		], new $wcm.ResultType<metadata_hash_value, error_code>($metadata_hash_value, $error_code));
	}
}
export type types = Pick<typeof types, 'read_via_stream' | 'write_via_stream' | 'append_via_stream' | 'advise' | 'sync_data' | 'get_flags' | 'get_type' | 'set_size' | 'set_times' | 'read' | 'write' | 'read_directory' | 'sync' | 'create_directory_at' | 'stat' | 'stat_at' | 'set_times_at' | 'link_at' | 'open_at' | 'readlink_at' | 'remove_directory_at' | 'rename_at' | 'symlink_at' | 'access_at' | 'unlink_file_at' | 'change_file_permissions_at' | 'change_directory_permissions_at' | 'lock_shared' | 'lock_exclusive' | 'try_lock_shared' | 'try_lock_exclusive' | 'unlock' | 'drop_descriptor' | 'read_directory_entry' | 'drop_directory_entry_stream' | 'is_same_object' | 'metadata_hash' | 'metadata_hash_at'>;
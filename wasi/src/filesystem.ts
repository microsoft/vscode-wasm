/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/* eslint-disable @typescript-eslint/ban-types */
import * as $wcm from '@vscode/wasm-component-model';
import type { u64, u32, i32, i64, ptr, result } from '@vscode/wasm-component-model';
import { clocks } from './clocks';
import { io } from './io';

export namespace filesystem {
	/**
	 * WASI filesystem is a filesystem API primarily intended to let users run WASI
	 * programs that access their files on their existing filesystems, without
	 * significant overhead.
	 * 
	 * It is intended to be roughly portable between Unix-family platforms and
	 * Windows, though it does not hide many of the major differences.
	 * 
	 * Paths are passed as interface-type `string`s, meaning they must consist of
	 * a sequence of Unicode Scalar Values (USVs). Some filesystems may contain
	 * paths which are not accessible by this API.
	 * 
	 * The directory separator in WASI is always the forward-slash (`/`).
	 * 
	 * All paths in WASI are relative paths, and are interpreted relative to a
	 * `descriptor` referring to a base directory. If a `path` argument to any WASI
	 * function starts with `/`, or if any step of resolving a `path`, including
	 * `..` and symbolic link steps, reaches a directory outside of the base
	 * directory, or reaches a symlink to an absolute or rooted path in the
	 * underlying filesystem, the function fails with `error-code::not-permitted`.
	 * 
	 * For more information about WASI path resolution and sandboxing, see
	 * [WASI filesystem path resolution].
	 * 
	 * [WASI filesystem path resolution]: https://github.com/WebAssembly/wasi-filesystem/blob/main/path-resolution.md
	 */
	export namespace Types {
		export type InputStream = io.Streams.InputStream;

		export type OutputStream = io.Streams.OutputStream;

		export type Error = io.Streams.Error;

		export type Datetime = clocks.WallClock.Datetime;

		/**
		 * File size or length of a region within a file.
		 */
		export type Filesize = u64;

		/**
		 * The type of a filesystem object referenced by a descriptor.
		 * 
		 * Note: This was called `filetype` in earlier versions of WASI.
		 */
		export enum DescriptorType {

			/**
			 * The type of the descriptor or file is unknown or is different from
			 * any of the other types specified.
			 */
			unknown = 'unknown',

			/**
			 * The descriptor refers to a block device inode.
			 */
			blockDevice = 'blockDevice',

			/**
			 * The descriptor refers to a character device inode.
			 */
			characterDevice = 'characterDevice',

			/**
			 * The descriptor refers to a directory inode.
			 */
			directory = 'directory',

			/**
			 * The descriptor refers to a named pipe.
			 */
			fifo = 'fifo',

			/**
			 * The file refers to a symbolic link inode.
			 */
			symbolicLink = 'symbolicLink',

			/**
			 * The descriptor refers to a regular file inode.
			 */
			regularFile = 'regularFile',

			/**
			 * The descriptor refers to a socket.
			 */
			socket = 'socket'
		}

		/**
		 * Descriptor flags.
		 * 
		 * Note: This was called `fdflags` in earlier versions of WASI.
		 */
		export const DescriptorFlags = Object.freeze({

			/**
			 * Read mode: Data can be read.
			 */
			read: 1 << 0,

			/**
			 * Write mode: Data can be written to.
			 */
			write: 1 << 1,

			/**
			 * Request that writes be performed according to synchronized I/O file
			 * integrity completion. The data stored in the file and the file's
			 * metadata are synchronized. This is similar to `O_SYNC` in POSIX.
			 * 
			 * The precise semantics of this operation have not yet been defined for
			 * WASI. At this time, it should be interpreted as a request, and not a
			 * requirement.
			 */
			fileIntegritySync: 1 << 2,

			/**
			 * Request that writes be performed according to synchronized I/O data
			 * integrity completion. Only the data stored in the file is
			 * synchronized. This is similar to `O_DSYNC` in POSIX.
			 * 
			 * The precise semantics of this operation have not yet been defined for
			 * WASI. At this time, it should be interpreted as a request, and not a
			 * requirement.
			 */
			dataIntegritySync: 1 << 3,

			/**
			 * Requests that reads be performed at the same level of integrety
			 * requested for writes. This is similar to `O_RSYNC` in POSIX.
			 * 
			 * The precise semantics of this operation have not yet been defined for
			 * WASI. At this time, it should be interpreted as a request, and not a
			 * requirement.
			 */
			requestedWriteSync: 1 << 4,

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
			mutateDirectory: 1 << 5,
		});
		export type DescriptorFlags = u32;

		/**
		 * Flags determining the method of how paths are resolved.
		 */
		export const PathFlags = Object.freeze({

			/**
			 * As long as the resolved path corresponds to a symbolic link, it is
			 * expanded.
			 */
			symlinkFollow: 1 << 0,
		});
		export type PathFlags = u32;

		/**
		 * Open flags used by `open-at`.
		 */
		export const OpenFlags = Object.freeze({

			/**
			 * Create file if it does not exist, similar to `O_CREAT` in POSIX.
			 */
			create: 1 << 0,

			/**
			 * Fail if not a directory, similar to `O_DIRECTORY` in POSIX.
			 */
			directory: 1 << 1,

			/**
			 * Fail if file already exists, similar to `O_EXCL` in POSIX.
			 */
			exclusive: 1 << 2,

			/**
			 * Truncate file to size 0, similar to `O_TRUNC` in POSIX.
			 */
			truncate: 1 << 3,
		});
		export type OpenFlags = u32;

		/**
		 * Number of hard links to an inode.
		 */
		export type LinkCount = u64;

		/**
		 * File attributes.
		 * 
		 * Note: This was called `filestat` in earlier versions of WASI.
		 */
		export type DescriptorStat = {

			/**
			 * File type.
			 */
			type: DescriptorType;

			/**
			 * Number of hard links to the file.
			 */
			linkCount: LinkCount;

			/**
			 * For regular files, the file size in bytes. For symbolic links, the
			 * length in bytes of the pathname contained in the symbolic link.
			 */
			size: Filesize;

			/**
			 * Last data access timestamp.
			 * 
			 * If the `option` is none, the platform doesn't maintain an access
			 * timestamp for this file.
			 */
			dataAccessTimestamp?: Datetime | undefined;

			/**
			 * Last data modification timestamp.
			 * 
			 * If the `option` is none, the platform doesn't maintain a
			 * modification timestamp for this file.
			 */
			dataModificationTimestamp?: Datetime | undefined;

			/**
			 * Last file status-change timestamp.
			 * 
			 * If the `option` is none, the platform doesn't maintain a
			 * status-change timestamp for this file.
			 */
			statusChangeTimestamp?: Datetime | undefined;
		};

		/**
		 * When setting a timestamp, this gives the value to set it to.
		 */
		export namespace NewTimestamp {

			/**
			 * Leave the timestamp set to its previous value.
			 */
			export const noChange = 'noChange' as const;
			export type NoChange = { readonly tag: typeof noChange } & _common;
			export function NoChange(): NoChange {
				return new VariantImpl(noChange, undefined) as NoChange;
			}


			/**
			 * Set the timestamp to the current time of the system clock associated
			 * with the filesystem.
			 */
			export const now = 'now' as const;
			export type Now = { readonly tag: typeof now } & _common;
			export function Now(): Now {
				return new VariantImpl(now, undefined) as Now;
			}


			/**
			 * Set the timestamp to the given value.
			 */
			export const timestamp = 'timestamp' as const;
			export type Timestamp = { readonly tag: typeof timestamp; readonly value: Datetime } & _common;
			export function Timestamp(value: Datetime): Timestamp {
				return new VariantImpl(timestamp, value) as Timestamp;
			}

			export type _tt = typeof noChange | typeof now | typeof timestamp;
			export type _vt = Datetime | undefined;
			type _common = Omit<VariantImpl, 'tag' | 'value'>;
			export function _ctor(t: _tt, v: _vt): NewTimestamp {
				return new VariantImpl(t, v) as NewTimestamp;
			}
			class VariantImpl {
				private readonly _tag: _tt;
				private readonly _value?: _vt;
				constructor(t: _tt, value: _vt) {
					this._tag = t;
					this._value = value;
				}
				get tag(): _tt {
					return this._tag;
				}
				get value(): _vt {
					return this._value;
				}
				isNoChange(): this is NoChange {
					return this._tag === NewTimestamp.noChange;
				}
				isNow(): this is Now {
					return this._tag === NewTimestamp.now;
				}
				isTimestamp(): this is Timestamp {
					return this._tag === NewTimestamp.timestamp;
				}
			}
		}
		export type NewTimestamp = NewTimestamp.NoChange | NewTimestamp.Now | NewTimestamp.Timestamp;

		/**
		 * A directory entry.
		 */
		export type DirectoryEntry = {

			/**
			 * The type of the file referred to by this directory entry.
			 */
			type: DescriptorType;

			/**
			 * The name of the object.
			 */
			name: string;
		};

		/**
		 * Error codes returned by functions, similar to `errno` in POSIX.
		 * Not all of these error codes are returned by the functions provided by this
		 * API; some are used in higher-level library layers, and others are provided
		 * merely for alignment with POSIX.
		 */
		export enum ErrorCode {

			/**
			 * Permission denied, similar to `EACCES` in POSIX.
			 */
			access = 'access',

			/**
			 * Resource unavailable, or operation would block, similar to `EAGAIN` and `EWOULDBLOCK` in POSIX.
			 */
			wouldBlock = 'wouldBlock',

			/**
			 * Connection already in progress, similar to `EALREADY` in POSIX.
			 */
			already = 'already',

			/**
			 * Bad descriptor, similar to `EBADF` in POSIX.
			 */
			badDescriptor = 'badDescriptor',

			/**
			 * Device or resource busy, similar to `EBUSY` in POSIX.
			 */
			busy = 'busy',

			/**
			 * Resource deadlock would occur, similar to `EDEADLK` in POSIX.
			 */
			deadlock = 'deadlock',

			/**
			 * Storage quota exceeded, similar to `EDQUOT` in POSIX.
			 */
			quota = 'quota',

			/**
			 * File exists, similar to `EEXIST` in POSIX.
			 */
			exist = 'exist',

			/**
			 * File too large, similar to `EFBIG` in POSIX.
			 */
			fileTooLarge = 'fileTooLarge',

			/**
			 * Illegal byte sequence, similar to `EILSEQ` in POSIX.
			 */
			illegalByteSequence = 'illegalByteSequence',

			/**
			 * Operation in progress, similar to `EINPROGRESS` in POSIX.
			 */
			inProgress = 'inProgress',

			/**
			 * Interrupted function, similar to `EINTR` in POSIX.
			 */
			interrupted = 'interrupted',

			/**
			 * Invalid argument, similar to `EINVAL` in POSIX.
			 */
			invalid = 'invalid',

			/**
			 * I/O error, similar to `EIO` in POSIX.
			 */
			io = 'io',

			/**
			 * Is a directory, similar to `EISDIR` in POSIX.
			 */
			isDirectory = 'isDirectory',

			/**
			 * Too many levels of symbolic links, similar to `ELOOP` in POSIX.
			 */
			loop = 'loop',

			/**
			 * Too many links, similar to `EMLINK` in POSIX.
			 */
			tooManyLinks = 'tooManyLinks',

			/**
			 * Message too large, similar to `EMSGSIZE` in POSIX.
			 */
			messageSize = 'messageSize',

			/**
			 * Filename too long, similar to `ENAMETOOLONG` in POSIX.
			 */
			nameTooLong = 'nameTooLong',

			/**
			 * No such device, similar to `ENODEV` in POSIX.
			 */
			noDevice = 'noDevice',

			/**
			 * No such file or directory, similar to `ENOENT` in POSIX.
			 */
			noEntry = 'noEntry',

			/**
			 * No locks available, similar to `ENOLCK` in POSIX.
			 */
			noLock = 'noLock',

			/**
			 * Not enough space, similar to `ENOMEM` in POSIX.
			 */
			insufficientMemory = 'insufficientMemory',

			/**
			 * No space left on device, similar to `ENOSPC` in POSIX.
			 */
			insufficientSpace = 'insufficientSpace',

			/**
			 * Not a directory or a symbolic link to a directory, similar to `ENOTDIR` in POSIX.
			 */
			notDirectory = 'notDirectory',

			/**
			 * Directory not empty, similar to `ENOTEMPTY` in POSIX.
			 */
			notEmpty = 'notEmpty',

			/**
			 * State not recoverable, similar to `ENOTRECOVERABLE` in POSIX.
			 */
			notRecoverable = 'notRecoverable',

			/**
			 * Not supported, similar to `ENOTSUP` and `ENOSYS` in POSIX.
			 */
			unsupported = 'unsupported',

			/**
			 * Inappropriate I/O control operation, similar to `ENOTTY` in POSIX.
			 */
			noTty = 'noTty',

			/**
			 * No such device or address, similar to `ENXIO` in POSIX.
			 */
			noSuchDevice = 'noSuchDevice',

			/**
			 * Value too large to be stored in data type, similar to `EOVERFLOW` in POSIX.
			 */
			overflow = 'overflow',

			/**
			 * Operation not permitted, similar to `EPERM` in POSIX.
			 */
			notPermitted = 'notPermitted',

			/**
			 * Broken pipe, similar to `EPIPE` in POSIX.
			 */
			pipe = 'pipe',

			/**
			 * Read-only file system, similar to `EROFS` in POSIX.
			 */
			readOnly = 'readOnly',

			/**
			 * Invalid seek, similar to `ESPIPE` in POSIX.
			 */
			invalidSeek = 'invalidSeek',

			/**
			 * Text file busy, similar to `ETXTBSY` in POSIX.
			 */
			textFileBusy = 'textFileBusy',

			/**
			 * Cross-device link, similar to `EXDEV` in POSIX.
			 */
			crossDevice = 'crossDevice'
		}
		export namespace ErrorCode {
			export class Error_ extends $wcm.ResultError<ErrorCode> {
				constructor(value: ErrorCode) {
					super(value, `ErrorCode: ${value}`);
				}
			}
		}

		/**
		 * File or memory access pattern advisory information.
		 */
		export enum Advice {

			/**
			 * The application has no advice to give on its behavior with respect
			 * to the specified data.
			 */
			normal = 'normal',

			/**
			 * The application expects to access the specified data sequentially
			 * from lower offsets to higher offsets.
			 */
			sequential = 'sequential',

			/**
			 * The application expects to access the specified data in a random
			 * order.
			 */
			random = 'random',

			/**
			 * The application expects to access the specified data in the near
			 * future.
			 */
			willNeed = 'willNeed',

			/**
			 * The application expects that it will not access the specified data
			 * in the near future.
			 */
			dontNeed = 'dontNeed',

			/**
			 * The application expects to access the specified data once and then
			 * not reuse it thereafter.
			 */
			noReuse = 'noReuse'
		}

		/**
		 * A 128-bit hash value, split into parts because wasm doesn't have a
		 * 128-bit integer type.
		 */
		export type MetadataHashValue = {

			/**
			 * 64 bits of a 128-bit hash value.
			 */
			lower: u64;

			/**
			 * Another 64 bits of a 128-bit hash value.
			 */
			upper: u64;
		};

		export namespace Descriptor {
			export interface Interface extends $wcm.Resource {
				/**
				 * Return a stream for reading from a file, if available.
				 * 
				 * May fail with an error-code describing why the file cannot be read.
				 * 
				 * Multiple read, write, and append streams may be active on the same open
				 * file and they do not interfere with each other.
				 * 
				 * Note: This allows using `read-stream`, which is similar to `read` in POSIX.
				 *
				 * @throws ErrorCode.Error_
				 */
				readViaStream(offset: Filesize): InputStream;

				/**
				 * Return a stream for writing to a file, if available.
				 * 
				 * May fail with an error-code describing why the file cannot be written.
				 * 
				 * Note: This allows using `write-stream`, which is similar to `write` in
				 * POSIX.
				 *
				 * @throws ErrorCode.Error_
				 */
				writeViaStream(offset: Filesize): OutputStream;

				/**
				 * Return a stream for appending to a file, if available.
				 * 
				 * May fail with an error-code describing why the file cannot be appended.
				 * 
				 * Note: This allows using `write-stream`, which is similar to `write` with
				 * `O_APPEND` in in POSIX.
				 *
				 * @throws ErrorCode.Error_
				 */
				appendViaStream(): OutputStream;

				/**
				 * Provide file advisory information on a descriptor.
				 * 
				 * This is similar to `posix_fadvise` in POSIX.
				 *
				 * @throws ErrorCode.Error_
				 */
				advise(offset: Filesize, length: Filesize, advice: Advice): void;

				/**
				 * Synchronize the data of a file to disk.
				 * 
				 * This function succeeds with no effect if the file descriptor is not
				 * opened for writing.
				 * 
				 * Note: This is similar to `fdatasync` in POSIX.
				 *
				 * @throws ErrorCode.Error_
				 */
				syncData(): void;

				/**
				 * Get flags associated with a descriptor.
				 * 
				 * Note: This returns similar flags to `fcntl(fd, F_GETFL)` in POSIX.
				 * 
				 * Note: This returns the value that was the `fs_flags` value returned
				 * from `fdstat_get` in earlier versions of WASI.
				 *
				 * @throws ErrorCode.Error_
				 */
				getFlags(): DescriptorFlags;

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
				 *
				 * @throws ErrorCode.Error_
				 */
				getType(): DescriptorType;

				/**
				 * Adjust the size of an open file. If this increases the file's size, the
				 * extra bytes are filled with zeros.
				 * 
				 * Note: This was called `fd_filestat_set_size` in earlier versions of WASI.
				 *
				 * @throws ErrorCode.Error_
				 */
				setSize(size: Filesize): void;

				/**
				 * Adjust the timestamps of an open file or directory.
				 * 
				 * Note: This is similar to `futimens` in POSIX.
				 * 
				 * Note: This was called `fd_filestat_set_times` in earlier versions of WASI.
				 *
				 * @throws ErrorCode.Error_
				 */
				setTimes(dataAccessTimestamp: NewTimestamp, dataModificationTimestamp: NewTimestamp): void;

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
				 *
				 * @throws ErrorCode.Error_
				 */
				read(length: Filesize, offset: Filesize): [Uint8Array, boolean];

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
				 *
				 * @throws ErrorCode.Error_
				 */
				write(buffer: Uint8Array, offset: Filesize): Filesize;

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
				 *
				 * @throws ErrorCode.Error_
				 */
				readDirectory(): DirectoryEntryStream;

				/**
				 * Synchronize the data and metadata of a file to disk.
				 * 
				 * This function succeeds with no effect if the file descriptor is not
				 * opened for writing.
				 * 
				 * Note: This is similar to `fsync` in POSIX.
				 *
				 * @throws ErrorCode.Error_
				 */
				sync(): void;

				/**
				 * Create a directory.
				 * 
				 * Note: This is similar to `mkdirat` in POSIX.
				 *
				 * @throws ErrorCode.Error_
				 */
				createDirectoryAt(path: string): void;

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
				 *
				 * @throws ErrorCode.Error_
				 */
				stat(): DescriptorStat;

				/**
				 * Return the attributes of a file or directory.
				 * 
				 * Note: This is similar to `fstatat` in POSIX, except that it does not
				 * return device and inode information. See the `stat` description for a
				 * discussion of alternatives.
				 * 
				 * Note: This was called `path_filestat_get` in earlier versions of WASI.
				 *
				 * @throws ErrorCode.Error_
				 */
				statAt(pathFlags: PathFlags, path: string): DescriptorStat;

				/**
				 * Adjust the timestamps of a file or directory.
				 * 
				 * Note: This is similar to `utimensat` in POSIX.
				 * 
				 * Note: This was called `path_filestat_set_times` in earlier versions of
				 * WASI.
				 *
				 * @throws ErrorCode.Error_
				 */
				setTimesAt(pathFlags: PathFlags, path: string, dataAccessTimestamp: NewTimestamp, dataModificationTimestamp: NewTimestamp): void;

				/**
				 * Create a hard link.
				 * 
				 * Note: This is similar to `linkat` in POSIX.
				 *
				 * @throws ErrorCode.Error_
				 */
				linkAt(oldPathFlags: PathFlags, oldPath: string, newDescriptor: Descriptor, newPath: string): void;

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
				 *
				 * @throws ErrorCode.Error_
				 */
				openAt(pathFlags: PathFlags, path: string, openFlags: OpenFlags, flags: DescriptorFlags): Descriptor;

				/**
				 * Read the contents of a symbolic link.
				 * 
				 * If the contents contain an absolute or rooted path in the underlying
				 * filesystem, this function fails with `error-code::not-permitted`.
				 * 
				 * Note: This is similar to `readlinkat` in POSIX.
				 *
				 * @throws ErrorCode.Error_
				 */
				readlinkAt(path: string): string;

				/**
				 * Remove a directory.
				 * 
				 * Return `error-code::not-empty` if the directory is not empty.
				 * 
				 * Note: This is similar to `unlinkat(fd, path, AT_REMOVEDIR)` in POSIX.
				 *
				 * @throws ErrorCode.Error_
				 */
				removeDirectoryAt(path: string): void;

				/**
				 * Rename a filesystem object.
				 * 
				 * Note: This is similar to `renameat` in POSIX.
				 *
				 * @throws ErrorCode.Error_
				 */
				renameAt(oldPath: string, newDescriptor: Descriptor, newPath: string): void;

				/**
				 * Create a symbolic link (also known as a "symlink").
				 * 
				 * If `old-path` starts with `/`, the function fails with
				 * `error-code::not-permitted`.
				 * 
				 * Note: This is similar to `symlinkat` in POSIX.
				 *
				 * @throws ErrorCode.Error_
				 */
				symlinkAt(oldPath: string, newPath: string): void;

				/**
				 * Unlink a filesystem object that is not a directory.
				 * 
				 * Return `error-code::is-directory` if the path refers to a directory.
				 * Note: This is similar to `unlinkat(fd, path, 0)` in POSIX.
				 *
				 * @throws ErrorCode.Error_
				 */
				unlinkFileAt(path: string): void;

				/**
				 * Test whether two descriptors refer to the same filesystem object.
				 * 
				 * In POSIX, this corresponds to testing whether the two descriptors have the
				 * same device (`st_dev`) and inode (`st_ino` or `d_ino`) numbers.
				 * wasi-filesystem does not expose device and inode numbers, so this function
				 * may be used instead.
				 */
				isSameObject(other: Descriptor): boolean;

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
				 * - If the file is not modified or replaced, the computed hash value should
				 * usually not change.
				 * - If the object is modified or replaced, the computed hash value should
				 * usually change.
				 * - The inputs to the hash should not be easily computable from the
				 * computed hash.
				 * 
				 * However, none of these is required.
				 *
				 * @throws ErrorCode.Error_
				 */
				metadataHash(): MetadataHashValue;

				/**
				 * Return a hash of the metadata associated with a filesystem object referred
				 * to by a directory descriptor and a relative path.
				 * 
				 * This performs the same hash computation as `metadata-hash`.
				 *
				 * @throws ErrorCode.Error_
				 */
				metadataHashAt(pathFlags: PathFlags, path: string): MetadataHashValue;
			}
			export type Statics = {
			};
			export type Class = Statics & {
			};
		}
		export type Descriptor = Descriptor.Interface;

		export namespace DirectoryEntryStream {
			export interface Interface extends $wcm.Resource {
				/**
				 * Read a single directory entry from a `directory-entry-stream`.
				 *
				 * @throws ErrorCode.Error_
				 */
				readDirectoryEntry(): DirectoryEntry | undefined;
			}
			export type Statics = {
			};
			export type Class = Statics & {
			};
		}
		export type DirectoryEntryStream = DirectoryEntryStream.Interface;

		/**
		 * Attempts to extract a filesystem-related `error-code` from the stream
		 * `error` provided.
		 * 
		 * Stream operations which return `stream-error::last-operation-failed`
		 * have a payload with more information about the operation that failed.
		 * This payload can be passed through to this function to see if there's
		 * filesystem-related information about the error to return.
		 * 
		 * Note that this function is fallible because not all stream-related
		 * errors are filesystem-related errors.
		 */
		export type filesystemErrorCode = (err: Error) => ErrorCode | undefined;
	}
	export type Types = {
		Descriptor: Types.Descriptor.Class;
		DirectoryEntryStream: Types.DirectoryEntryStream.Class;
		filesystemErrorCode: Types.filesystemErrorCode;
	};

	export namespace Preopens {
		export type Descriptor = filesystem.Types.Descriptor;

		/**
		 * Return the set of preopened directories, and their path.
		 */
		export type getDirectories = () => [Descriptor, string][];
	}
	export type Preopens = {
		getDirectories: Preopens.getDirectories;
	};
}

export namespace filesystem {
	export namespace Types.$ {
		export const InputStream = io.Streams.$.InputStream;
		export const OutputStream = io.Streams.$.OutputStream;
		export const Error = io.Streams.$.Error;
		export const Datetime = clocks.WallClock.$.Datetime;
		export const Filesize = $wcm.u64;
		export const DescriptorType = new $wcm.EnumType<filesystem.Types.DescriptorType>(['unknown', 'blockDevice', 'characterDevice', 'directory', 'fifo', 'symbolicLink', 'regularFile', 'socket']);
		export const DescriptorFlags = new $wcm.FlagsType<filesystem.Types.DescriptorFlags>(6);
		export const PathFlags = new $wcm.FlagsType<filesystem.Types.PathFlags>(1);
		export const OpenFlags = new $wcm.FlagsType<filesystem.Types.OpenFlags>(4);
		export const LinkCount = $wcm.u64;
		export const DescriptorStat = new $wcm.RecordType<filesystem.Types.DescriptorStat>([
			['type', DescriptorType],
			['linkCount', LinkCount],
			['size', Filesize],
			['dataAccessTimestamp', new $wcm.OptionType<filesystem.Types.Datetime>(Datetime)],
			['dataModificationTimestamp', new $wcm.OptionType<filesystem.Types.Datetime>(Datetime)],
			['statusChangeTimestamp', new $wcm.OptionType<filesystem.Types.Datetime>(Datetime)],
		]);
		export const NewTimestamp = new $wcm.VariantType<filesystem.Types.NewTimestamp, filesystem.Types.NewTimestamp._tt, filesystem.Types.NewTimestamp._vt>([['noChange', undefined], ['now', undefined], ['timestamp', Datetime]], filesystem.Types.NewTimestamp._ctor);
		export const DirectoryEntry = new $wcm.RecordType<filesystem.Types.DirectoryEntry>([
			['type', DescriptorType],
			['name', $wcm.wstring],
		]);
		export const ErrorCode = new $wcm.EnumType<filesystem.Types.ErrorCode>(['access', 'wouldBlock', 'already', 'badDescriptor', 'busy', 'deadlock', 'quota', 'exist', 'fileTooLarge', 'illegalByteSequence', 'inProgress', 'interrupted', 'invalid', 'io', 'isDirectory', 'loop', 'tooManyLinks', 'messageSize', 'nameTooLong', 'noDevice', 'noEntry', 'noLock', 'insufficientMemory', 'insufficientSpace', 'notDirectory', 'notEmpty', 'notRecoverable', 'unsupported', 'noTty', 'noSuchDevice', 'overflow', 'notPermitted', 'pipe', 'readOnly', 'invalidSeek', 'textFileBusy', 'crossDevice']);
		export const Advice = new $wcm.EnumType<filesystem.Types.Advice>(['normal', 'sequential', 'random', 'willNeed', 'dontNeed', 'noReuse']);
		export const MetadataHashValue = new $wcm.RecordType<filesystem.Types.MetadataHashValue>([
			['lower', $wcm.u64],
			['upper', $wcm.u64],
		]);
		export const Descriptor = new $wcm.ResourceType<filesystem.Types.Descriptor>('descriptor', 'wasi:filesystem@0.2.0/types/descriptor');
		export const Descriptor_Handle = new $wcm.ResourceHandleType('descriptor');
		export const DirectoryEntryStream = new $wcm.ResourceType<filesystem.Types.DirectoryEntryStream>('directory-entry-stream', 'wasi:filesystem@0.2.0/types/directory-entry-stream');
		export const DirectoryEntryStream_Handle = new $wcm.ResourceHandleType('directory-entry-stream');
		Descriptor.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]descriptor', [['inst', Descriptor]]));
		Descriptor.addMethod('readViaStream', new $wcm.MethodType<filesystem.Types.Descriptor.Interface['readViaStream']>('[method]descriptor.read-via-stream', [
			['offset', Filesize],
		], new $wcm.ResultType<filesystem.Types.InputStream, filesystem.Types.ErrorCode>(new $wcm.OwnType<filesystem.Types.InputStream>(InputStream), ErrorCode, filesystem.Types.ErrorCode.Error_)));
		Descriptor.addMethod('writeViaStream', new $wcm.MethodType<filesystem.Types.Descriptor.Interface['writeViaStream']>('[method]descriptor.write-via-stream', [
			['offset', Filesize],
		], new $wcm.ResultType<filesystem.Types.OutputStream, filesystem.Types.ErrorCode>(new $wcm.OwnType<filesystem.Types.OutputStream>(OutputStream), ErrorCode, filesystem.Types.ErrorCode.Error_)));
		Descriptor.addMethod('appendViaStream', new $wcm.MethodType<filesystem.Types.Descriptor.Interface['appendViaStream']>('[method]descriptor.append-via-stream', [], new $wcm.ResultType<filesystem.Types.OutputStream, filesystem.Types.ErrorCode>(new $wcm.OwnType<filesystem.Types.OutputStream>(OutputStream), ErrorCode, filesystem.Types.ErrorCode.Error_)));
		Descriptor.addMethod('advise', new $wcm.MethodType<filesystem.Types.Descriptor.Interface['advise']>('[method]descriptor.advise', [
			['offset', Filesize],
			['length', Filesize],
			['advice', Advice],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode, filesystem.Types.ErrorCode.Error_)));
		Descriptor.addMethod('syncData', new $wcm.MethodType<filesystem.Types.Descriptor.Interface['syncData']>('[method]descriptor.sync-data', [], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode, filesystem.Types.ErrorCode.Error_)));
		Descriptor.addMethod('getFlags', new $wcm.MethodType<filesystem.Types.Descriptor.Interface['getFlags']>('[method]descriptor.get-flags', [], new $wcm.ResultType<filesystem.Types.DescriptorFlags, filesystem.Types.ErrorCode>(DescriptorFlags, ErrorCode, filesystem.Types.ErrorCode.Error_)));
		Descriptor.addMethod('getType', new $wcm.MethodType<filesystem.Types.Descriptor.Interface['getType']>('[method]descriptor.get-type', [], new $wcm.ResultType<filesystem.Types.DescriptorType, filesystem.Types.ErrorCode>(DescriptorType, ErrorCode, filesystem.Types.ErrorCode.Error_)));
		Descriptor.addMethod('setSize', new $wcm.MethodType<filesystem.Types.Descriptor.Interface['setSize']>('[method]descriptor.set-size', [
			['size', Filesize],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode, filesystem.Types.ErrorCode.Error_)));
		Descriptor.addMethod('setTimes', new $wcm.MethodType<filesystem.Types.Descriptor.Interface['setTimes']>('[method]descriptor.set-times', [
			['dataAccessTimestamp', NewTimestamp],
			['dataModificationTimestamp', NewTimestamp],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode, filesystem.Types.ErrorCode.Error_)));
		Descriptor.addMethod('read', new $wcm.MethodType<filesystem.Types.Descriptor.Interface['read']>('[method]descriptor.read', [
			['length', Filesize],
			['offset', Filesize],
		], new $wcm.ResultType<[Uint8Array, boolean], filesystem.Types.ErrorCode>(new $wcm.TupleType<[Uint8Array, boolean]>([new $wcm.Uint8ArrayType(), $wcm.bool]), ErrorCode, filesystem.Types.ErrorCode.Error_)));
		Descriptor.addMethod('write', new $wcm.MethodType<filesystem.Types.Descriptor.Interface['write']>('[method]descriptor.write', [
			['buffer', new $wcm.Uint8ArrayType()],
			['offset', Filesize],
		], new $wcm.ResultType<filesystem.Types.Filesize, filesystem.Types.ErrorCode>(Filesize, ErrorCode, filesystem.Types.ErrorCode.Error_)));
		Descriptor.addMethod('readDirectory', new $wcm.MethodType<filesystem.Types.Descriptor.Interface['readDirectory']>('[method]descriptor.read-directory', [], new $wcm.ResultType<filesystem.Types.DirectoryEntryStream, filesystem.Types.ErrorCode>(new $wcm.OwnType<filesystem.Types.DirectoryEntryStream>(DirectoryEntryStream), ErrorCode, filesystem.Types.ErrorCode.Error_)));
		Descriptor.addMethod('sync', new $wcm.MethodType<filesystem.Types.Descriptor.Interface['sync']>('[method]descriptor.sync', [], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode, filesystem.Types.ErrorCode.Error_)));
		Descriptor.addMethod('createDirectoryAt', new $wcm.MethodType<filesystem.Types.Descriptor.Interface['createDirectoryAt']>('[method]descriptor.create-directory-at', [
			['path', $wcm.wstring],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode, filesystem.Types.ErrorCode.Error_)));
		Descriptor.addMethod('stat', new $wcm.MethodType<filesystem.Types.Descriptor.Interface['stat']>('[method]descriptor.stat', [], new $wcm.ResultType<filesystem.Types.DescriptorStat, filesystem.Types.ErrorCode>(DescriptorStat, ErrorCode, filesystem.Types.ErrorCode.Error_)));
		Descriptor.addMethod('statAt', new $wcm.MethodType<filesystem.Types.Descriptor.Interface['statAt']>('[method]descriptor.stat-at', [
			['pathFlags', PathFlags],
			['path', $wcm.wstring],
		], new $wcm.ResultType<filesystem.Types.DescriptorStat, filesystem.Types.ErrorCode>(DescriptorStat, ErrorCode, filesystem.Types.ErrorCode.Error_)));
		Descriptor.addMethod('setTimesAt', new $wcm.MethodType<filesystem.Types.Descriptor.Interface['setTimesAt']>('[method]descriptor.set-times-at', [
			['pathFlags', PathFlags],
			['path', $wcm.wstring],
			['dataAccessTimestamp', NewTimestamp],
			['dataModificationTimestamp', NewTimestamp],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode, filesystem.Types.ErrorCode.Error_)));
		Descriptor.addMethod('linkAt', new $wcm.MethodType<filesystem.Types.Descriptor.Interface['linkAt']>('[method]descriptor.link-at', [
			['oldPathFlags', PathFlags],
			['oldPath', $wcm.wstring],
			['newDescriptor', new $wcm.BorrowType<filesystem.Types.Descriptor>(Descriptor)],
			['newPath', $wcm.wstring],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode, filesystem.Types.ErrorCode.Error_)));
		Descriptor.addMethod('openAt', new $wcm.MethodType<filesystem.Types.Descriptor.Interface['openAt']>('[method]descriptor.open-at', [
			['pathFlags', PathFlags],
			['path', $wcm.wstring],
			['openFlags', OpenFlags],
			['flags', DescriptorFlags],
		], new $wcm.ResultType<filesystem.Types.Descriptor, filesystem.Types.ErrorCode>(new $wcm.OwnType<filesystem.Types.Descriptor>(Descriptor), ErrorCode, filesystem.Types.ErrorCode.Error_)));
		Descriptor.addMethod('readlinkAt', new $wcm.MethodType<filesystem.Types.Descriptor.Interface['readlinkAt']>('[method]descriptor.readlink-at', [
			['path', $wcm.wstring],
		], new $wcm.ResultType<string, filesystem.Types.ErrorCode>($wcm.wstring, ErrorCode, filesystem.Types.ErrorCode.Error_)));
		Descriptor.addMethod('removeDirectoryAt', new $wcm.MethodType<filesystem.Types.Descriptor.Interface['removeDirectoryAt']>('[method]descriptor.remove-directory-at', [
			['path', $wcm.wstring],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode, filesystem.Types.ErrorCode.Error_)));
		Descriptor.addMethod('renameAt', new $wcm.MethodType<filesystem.Types.Descriptor.Interface['renameAt']>('[method]descriptor.rename-at', [
			['oldPath', $wcm.wstring],
			['newDescriptor', new $wcm.BorrowType<filesystem.Types.Descriptor>(Descriptor)],
			['newPath', $wcm.wstring],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode, filesystem.Types.ErrorCode.Error_)));
		Descriptor.addMethod('symlinkAt', new $wcm.MethodType<filesystem.Types.Descriptor.Interface['symlinkAt']>('[method]descriptor.symlink-at', [
			['oldPath', $wcm.wstring],
			['newPath', $wcm.wstring],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode, filesystem.Types.ErrorCode.Error_)));
		Descriptor.addMethod('unlinkFileAt', new $wcm.MethodType<filesystem.Types.Descriptor.Interface['unlinkFileAt']>('[method]descriptor.unlink-file-at', [
			['path', $wcm.wstring],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode, filesystem.Types.ErrorCode.Error_)));
		Descriptor.addMethod('isSameObject', new $wcm.MethodType<filesystem.Types.Descriptor.Interface['isSameObject']>('[method]descriptor.is-same-object', [
			['other', new $wcm.BorrowType<filesystem.Types.Descriptor>(Descriptor)],
		], $wcm.bool));
		Descriptor.addMethod('metadataHash', new $wcm.MethodType<filesystem.Types.Descriptor.Interface['metadataHash']>('[method]descriptor.metadata-hash', [], new $wcm.ResultType<filesystem.Types.MetadataHashValue, filesystem.Types.ErrorCode>(MetadataHashValue, ErrorCode, filesystem.Types.ErrorCode.Error_)));
		Descriptor.addMethod('metadataHashAt', new $wcm.MethodType<filesystem.Types.Descriptor.Interface['metadataHashAt']>('[method]descriptor.metadata-hash-at', [
			['pathFlags', PathFlags],
			['path', $wcm.wstring],
		], new $wcm.ResultType<filesystem.Types.MetadataHashValue, filesystem.Types.ErrorCode>(MetadataHashValue, ErrorCode, filesystem.Types.ErrorCode.Error_)));
		DirectoryEntryStream.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]directory-entry-stream', [['inst', DirectoryEntryStream]]));
		DirectoryEntryStream.addMethod('readDirectoryEntry', new $wcm.MethodType<filesystem.Types.DirectoryEntryStream.Interface['readDirectoryEntry']>('[method]directory-entry-stream.read-directory-entry', [], new $wcm.ResultType<filesystem.Types.DirectoryEntry | undefined, filesystem.Types.ErrorCode>(new $wcm.OptionType<filesystem.Types.DirectoryEntry>(DirectoryEntry), ErrorCode, filesystem.Types.ErrorCode.Error_)));
		export const filesystemErrorCode = new $wcm.FunctionType<filesystem.Types.filesystemErrorCode>('filesystem-error-code',[
			['err', new $wcm.BorrowType<filesystem.Types.Error>(Error)],
		], new $wcm.OptionType<filesystem.Types.ErrorCode>(ErrorCode));
	}
	export namespace Types._ {
		export const id = 'wasi:filesystem/types@0.2.0' as const;
		export const witName = 'types' as const;
		export namespace Descriptor {
			export type WasmInterface = {
				'[method]descriptor.read-via-stream': (self: i32, offset: i64, result: ptr<result<InputStream, ErrorCode>>) => void;
				'[method]descriptor.write-via-stream': (self: i32, offset: i64, result: ptr<result<OutputStream, ErrorCode>>) => void;
				'[method]descriptor.append-via-stream': (self: i32, result: ptr<result<OutputStream, ErrorCode>>) => void;
				'[method]descriptor.advise': (self: i32, offset: i64, length: i64, advice_Advice: i32, result: ptr<result<void, ErrorCode>>) => void;
				'[method]descriptor.sync-data': (self: i32, result: ptr<result<void, ErrorCode>>) => void;
				'[method]descriptor.get-flags': (self: i32, result: ptr<result<DescriptorFlags, ErrorCode>>) => void;
				'[method]descriptor.get-type': (self: i32, result: ptr<result<DescriptorType, ErrorCode>>) => void;
				'[method]descriptor.set-size': (self: i32, size: i64, result: ptr<result<void, ErrorCode>>) => void;
				'[method]descriptor.set-times': (self: i32, dataAccessTimestamp_case: i32, dataAccessTimestamp_0: i64, dataAccessTimestamp_1: i32, dataModificationTimestamp_case: i32, dataModificationTimestamp_0: i64, dataModificationTimestamp_1: i32, result: ptr<result<void, ErrorCode>>) => void;
				'[method]descriptor.read': (self: i32, length: i64, offset: i64, result: ptr<result<[Uint8Array, boolean], ErrorCode>>) => void;
				'[method]descriptor.write': (self: i32, buffer_ptr: i32, buffer_len: i32, offset: i64, result: ptr<result<Filesize, ErrorCode>>) => void;
				'[method]descriptor.read-directory': (self: i32, result: ptr<result<DirectoryEntryStream, ErrorCode>>) => void;
				'[method]descriptor.sync': (self: i32, result: ptr<result<void, ErrorCode>>) => void;
				'[method]descriptor.create-directory-at': (self: i32, path_ptr: i32, path_len: i32, result: ptr<result<void, ErrorCode>>) => void;
				'[method]descriptor.stat': (self: i32, result: ptr<result<DescriptorStat, ErrorCode>>) => void;
				'[method]descriptor.stat-at': (self: i32, pathFlags: i32, path_ptr: i32, path_len: i32, result: ptr<result<DescriptorStat, ErrorCode>>) => void;
				'[method]descriptor.set-times-at': (self: i32, pathFlags: i32, path_ptr: i32, path_len: i32, dataAccessTimestamp_case: i32, dataAccessTimestamp_0: i64, dataAccessTimestamp_1: i32, dataModificationTimestamp_case: i32, dataModificationTimestamp_0: i64, dataModificationTimestamp_1: i32, result: ptr<result<void, ErrorCode>>) => void;
				'[method]descriptor.link-at': (self: i32, oldPathFlags: i32, oldPath_ptr: i32, oldPath_len: i32, newDescriptor: i32, newPath_ptr: i32, newPath_len: i32, result: ptr<result<void, ErrorCode>>) => void;
				'[method]descriptor.open-at': (self: i32, pathFlags: i32, path_ptr: i32, path_len: i32, openFlags: i32, flags: i32, result: ptr<result<Descriptor, ErrorCode>>) => void;
				'[method]descriptor.readlink-at': (self: i32, path_ptr: i32, path_len: i32, result: ptr<result<string, ErrorCode>>) => void;
				'[method]descriptor.remove-directory-at': (self: i32, path_ptr: i32, path_len: i32, result: ptr<result<void, ErrorCode>>) => void;
				'[method]descriptor.rename-at': (self: i32, oldPath_ptr: i32, oldPath_len: i32, newDescriptor: i32, newPath_ptr: i32, newPath_len: i32, result: ptr<result<void, ErrorCode>>) => void;
				'[method]descriptor.symlink-at': (self: i32, oldPath_ptr: i32, oldPath_len: i32, newPath_ptr: i32, newPath_len: i32, result: ptr<result<void, ErrorCode>>) => void;
				'[method]descriptor.unlink-file-at': (self: i32, path_ptr: i32, path_len: i32, result: ptr<result<void, ErrorCode>>) => void;
				'[method]descriptor.is-same-object': (self: i32, other: i32) => i32;
				'[method]descriptor.metadata-hash': (self: i32, result: ptr<result<MetadataHashValue, ErrorCode>>) => void;
				'[method]descriptor.metadata-hash-at': (self: i32, pathFlags: i32, path_ptr: i32, path_len: i32, result: ptr<result<MetadataHashValue, ErrorCode>>) => void;
			};
			export namespace imports {
				export type WasmInterface = Descriptor.WasmInterface & { '[resource-drop]descriptor': (self: i32) => void };
			}
			export namespace exports {
				export type WasmInterface = Descriptor.WasmInterface & { '[dtor]descriptor': (self: i32) => void };
			}
		}
		export namespace DirectoryEntryStream {
			export type WasmInterface = {
				'[method]directory-entry-stream.read-directory-entry': (self: i32, result: ptr<result<DirectoryEntry | undefined, ErrorCode>>) => void;
			};
			export namespace imports {
				export type WasmInterface = DirectoryEntryStream.WasmInterface & { '[resource-drop]directory-entry-stream': (self: i32) => void };
			}
			export namespace exports {
				export type WasmInterface = DirectoryEntryStream.WasmInterface & { '[dtor]directory-entry-stream': (self: i32) => void };
			}
		}
		export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
			['InputStream', $.InputStream],
			['OutputStream', $.OutputStream],
			['Error', $.Error],
			['Datetime', $.Datetime],
			['Filesize', $.Filesize],
			['DescriptorType', $.DescriptorType],
			['DescriptorFlags', $.DescriptorFlags],
			['PathFlags', $.PathFlags],
			['OpenFlags', $.OpenFlags],
			['LinkCount', $.LinkCount],
			['DescriptorStat', $.DescriptorStat],
			['NewTimestamp', $.NewTimestamp],
			['DirectoryEntry', $.DirectoryEntry],
			['ErrorCode', $.ErrorCode],
			['Advice', $.Advice],
			['MetadataHashValue', $.MetadataHashValue],
			['Descriptor', $.Descriptor],
			['DirectoryEntryStream', $.DirectoryEntryStream]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['filesystemErrorCode', $.filesystemErrorCode]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map<string, $wcm.ResourceType>([
			['Descriptor', $.Descriptor],
			['DirectoryEntryStream', $.DirectoryEntryStream]
		]);
		export type WasmInterface = {
			'filesystem-error-code': (err: i32, result: ptr<ErrorCode | undefined>) => void;
		};
		export namespace imports {
			export type WasmInterface = _.WasmInterface & Descriptor.imports.WasmInterface & DirectoryEntryStream.imports.WasmInterface;
		}
		export namespace exports {
			export type WasmInterface = _.WasmInterface & Descriptor.exports.WasmInterface & DirectoryEntryStream.exports.WasmInterface;
			export namespace imports {
				export type WasmInterface = {
					'[resource-new]descriptor': (rep: i32) => i32;
					'[resource-rep]descriptor': (handle: i32) => i32;
					'[resource-drop]descriptor': (handle: i32) => void;
					'[resource-new]directory-entry-stream': (rep: i32) => i32;
					'[resource-rep]directory-entry-stream': (handle: i32) => i32;
					'[resource-drop]directory-entry-stream': (handle: i32) => void;
				};
			}
		}
	}

	export namespace Preopens.$ {
		export const Descriptor = filesystem.Types.$.Descriptor;
		export const getDirectories = new $wcm.FunctionType<filesystem.Preopens.getDirectories>('get-directories', [], new $wcm.ListType<[filesystem.Preopens.Descriptor, string]>(new $wcm.TupleType<[filesystem.Preopens.Descriptor, string]>([new $wcm.OwnType<filesystem.Preopens.Descriptor>(Descriptor), $wcm.wstring])));
	}
	export namespace Preopens._ {
		export const id = 'wasi:filesystem/preopens@0.2.0' as const;
		export const witName = 'preopens' as const;
		export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
			['Descriptor', $.Descriptor]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['getDirectories', $.getDirectories]
		]);
		export type WasmInterface = {
			'get-directories': (result: ptr<[Descriptor, string][]>) => void;
		};
		export namespace imports {
			export type WasmInterface = _.WasmInterface;
		}
		export namespace exports {
			export type WasmInterface = _.WasmInterface;
		}
	}
}

export namespace filesystem._ {
	export const version = '0.2.0' as const;
	export const id = 'wasi:filesystem@0.2.0' as const;
	export const witName = 'filesystem' as const;
	export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
		['Types', Types._],
		['Preopens', Preopens._]
	]);
}
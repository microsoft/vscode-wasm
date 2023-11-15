/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '@vscode/wasm-component-model';
import type { u64, u32, borrow, own, result, resource, option, i32, i64, ptr } from '@vscode/wasm-component-model';
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
			socket = 'socket',
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
			crossDevice = 'crossDevice',
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
			noReuse = 'noReuse',
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
			export type Module = {
				
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
				readViaStream(self: borrow<Descriptor>, offset: Filesize): result<own<InputStream>, ErrorCode>;
				
				/**
				 * Return a stream for writing to a file, if available.
				 * 
				 * May fail with an error-code describing why the file cannot be written.
				 * 
				 * Note: This allows using `write-stream`, which is similar to `write` in
				 * POSIX.
				 */
				writeViaStream(self: borrow<Descriptor>, offset: Filesize): result<own<OutputStream>, ErrorCode>;
				
				/**
				 * Return a stream for appending to a file, if available.
				 * 
				 * May fail with an error-code describing why the file cannot be appended.
				 * 
				 * Note: This allows using `write-stream`, which is similar to `write` with
				 * `O_APPEND` in in POSIX.
				 */
				appendViaStream(self: borrow<Descriptor>): result<own<OutputStream>, ErrorCode>;
				
				/**
				 * Provide file advisory information on a descriptor.
				 * 
				 * This is similar to `posix_fadvise` in POSIX.
				 */
				advise(self: borrow<Descriptor>, offset: Filesize, length: Filesize, advice: Advice): result<void, ErrorCode>;
				
				/**
				 * Synchronize the data of a file to disk.
				 * 
				 * This function succeeds with no effect if the file descriptor is not
				 * opened for writing.
				 * 
				 * Note: This is similar to `fdatasync` in POSIX.
				 */
				syncData(self: borrow<Descriptor>): result<void, ErrorCode>;
				
				/**
				 * Get flags associated with a descriptor.
				 * 
				 * Note: This returns similar flags to `fcntl(fd, F_GETFL)` in POSIX.
				 * 
				 * Note: This returns the value that was the `fs_flags` value returned
				 * from `fdstat_get` in earlier versions of WASI.
				 */
				getFlags(self: borrow<Descriptor>): result<DescriptorFlags, ErrorCode>;
				
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
				getType(self: borrow<Descriptor>): result<DescriptorType, ErrorCode>;
				
				/**
				 * Adjust the size of an open file. If this increases the file's size, the
				 * extra bytes are filled with zeros.
				 * 
				 * Note: This was called `fd_filestat_set_size` in earlier versions of WASI.
				 */
				setSize(self: borrow<Descriptor>, size: Filesize): result<void, ErrorCode>;
				
				/**
				 * Adjust the timestamps of an open file or directory.
				 * 
				 * Note: This is similar to `futimens` in POSIX.
				 * 
				 * Note: This was called `fd_filestat_set_times` in earlier versions of WASI.
				 */
				setTimes(self: borrow<Descriptor>, dataAccessTimestamp: NewTimestamp, dataModificationTimestamp: NewTimestamp): result<void, ErrorCode>;
				
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
				read(self: borrow<Descriptor>, length: Filesize, offset: Filesize): result<[Uint8Array, boolean], ErrorCode>;
				
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
				write(self: borrow<Descriptor>, buffer: Uint8Array, offset: Filesize): result<Filesize, ErrorCode>;
				
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
				readDirectory(self: borrow<Descriptor>): result<own<DirectoryEntryStream>, ErrorCode>;
				
				/**
				 * Synchronize the data and metadata of a file to disk.
				 * 
				 * This function succeeds with no effect if the file descriptor is not
				 * opened for writing.
				 * 
				 * Note: This is similar to `fsync` in POSIX.
				 */
				sync(self: borrow<Descriptor>): result<void, ErrorCode>;
				
				/**
				 * Create a directory.
				 * 
				 * Note: This is similar to `mkdirat` in POSIX.
				 */
				createDirectoryAt(self: borrow<Descriptor>, path: string): result<void, ErrorCode>;
				
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
				stat(self: borrow<Descriptor>): result<DescriptorStat, ErrorCode>;
				
				/**
				 * Return the attributes of a file or directory.
				 * 
				 * Note: This is similar to `fstatat` in POSIX, except that it does not
				 * return device and inode information. See the `stat` description for a
				 * discussion of alternatives.
				 * 
				 * Note: This was called `path_filestat_get` in earlier versions of WASI.
				 */
				statAt(self: borrow<Descriptor>, pathFlags: PathFlags, path: string): result<DescriptorStat, ErrorCode>;
				
				/**
				 * Adjust the timestamps of a file or directory.
				 * 
				 * Note: This is similar to `utimensat` in POSIX.
				 * 
				 * Note: This was called `path_filestat_set_times` in earlier versions of
				 * WASI.
				 */
				setTimesAt(self: borrow<Descriptor>, pathFlags: PathFlags, path: string, dataAccessTimestamp: NewTimestamp, dataModificationTimestamp: NewTimestamp): result<void, ErrorCode>;
				
				/**
				 * Create a hard link.
				 * 
				 * Note: This is similar to `linkat` in POSIX.
				 */
				linkAt(self: borrow<Descriptor>, oldPathFlags: PathFlags, oldPath: string, newDescriptor: borrow<Descriptor>, newPath: string): result<void, ErrorCode>;
				
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
				openAt(self: borrow<Descriptor>, pathFlags: PathFlags, path: string, openFlags: OpenFlags, flags: DescriptorFlags): result<own<Descriptor>, ErrorCode>;
				
				/**
				 * Read the contents of a symbolic link.
				 * 
				 * If the contents contain an absolute or rooted path in the underlying
				 * filesystem, this function fails with `error-code::not-permitted`.
				 * 
				 * Note: This is similar to `readlinkat` in POSIX.
				 */
				readlinkAt(self: borrow<Descriptor>, path: string): result<string, ErrorCode>;
				
				/**
				 * Remove a directory.
				 * 
				 * Return `error-code::not-empty` if the directory is not empty.
				 * 
				 * Note: This is similar to `unlinkat(fd, path, AT_REMOVEDIR)` in POSIX.
				 */
				removeDirectoryAt(self: borrow<Descriptor>, path: string): result<void, ErrorCode>;
				
				/**
				 * Rename a filesystem object.
				 * 
				 * Note: This is similar to `renameat` in POSIX.
				 */
				renameAt(self: borrow<Descriptor>, oldPath: string, newDescriptor: borrow<Descriptor>, newPath: string): result<void, ErrorCode>;
				
				/**
				 * Create a symbolic link (also known as a "symlink").
				 * 
				 * If `old-path` starts with `/`, the function fails with
				 * `error-code::not-permitted`.
				 * 
				 * Note: This is similar to `symlinkat` in POSIX.
				 */
				symlinkAt(self: borrow<Descriptor>, oldPath: string, newPath: string): result<void, ErrorCode>;
				
				/**
				 * Unlink a filesystem object that is not a directory.
				 * 
				 * Return `error-code::is-directory` if the path refers to a directory.
				 * Note: This is similar to `unlinkat(fd, path, 0)` in POSIX.
				 */
				unlinkFileAt(self: borrow<Descriptor>, path: string): result<void, ErrorCode>;
				
				/**
				 * Test whether two descriptors refer to the same filesystem object.
				 * 
				 * In POSIX, this corresponds to testing whether the two descriptors have the
				 * same device (`st_dev`) and inode (`st_ino` or `d_ino`) numbers.
				 * wasi-filesystem does not expose device and inode numbers, so this function
				 * may be used instead.
				 */
				isSameObject(self: borrow<Descriptor>, other: borrow<Descriptor>): boolean;
				
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
				 */
				metadataHash(self: borrow<Descriptor>): result<MetadataHashValue, ErrorCode>;
				
				/**
				 * Return a hash of the metadata associated with a filesystem object referred
				 * to by a directory descriptor and a relative path.
				 * 
				 * This performs the same hash computation as `metadata-hash`.
				 */
				metadataHashAt(self: borrow<Descriptor>, pathFlags: PathFlags, path: string): result<MetadataHashValue, ErrorCode>;
			};
			export interface Interface {
				readViaStream(offset: Filesize): result<own<InputStream>, ErrorCode>;
				writeViaStream(offset: Filesize): result<own<OutputStream>, ErrorCode>;
				appendViaStream(): result<own<OutputStream>, ErrorCode>;
				advise(offset: Filesize, length: Filesize, advice: Advice): result<void, ErrorCode>;
				syncData(): result<void, ErrorCode>;
				getFlags(): result<DescriptorFlags, ErrorCode>;
				getType(): result<DescriptorType, ErrorCode>;
				setSize(size: Filesize): result<void, ErrorCode>;
				setTimes(dataAccessTimestamp: NewTimestamp, dataModificationTimestamp: NewTimestamp): result<void, ErrorCode>;
				read(length: Filesize, offset: Filesize): result<[Uint8Array, boolean], ErrorCode>;
				write(buffer: Uint8Array, offset: Filesize): result<Filesize, ErrorCode>;
				readDirectory(): result<own<DirectoryEntryStream>, ErrorCode>;
				sync(): result<void, ErrorCode>;
				createDirectoryAt(path: string): result<void, ErrorCode>;
				stat(): result<DescriptorStat, ErrorCode>;
				statAt(pathFlags: PathFlags, path: string): result<DescriptorStat, ErrorCode>;
				setTimesAt(pathFlags: PathFlags, path: string, dataAccessTimestamp: NewTimestamp, dataModificationTimestamp: NewTimestamp): result<void, ErrorCode>;
				linkAt(oldPathFlags: PathFlags, oldPath: string, newDescriptor: borrow<Descriptor>, newPath: string): result<void, ErrorCode>;
				openAt(pathFlags: PathFlags, path: string, openFlags: OpenFlags, flags: DescriptorFlags): result<own<Descriptor>, ErrorCode>;
				readlinkAt(path: string): result<string, ErrorCode>;
				removeDirectoryAt(path: string): result<void, ErrorCode>;
				renameAt(oldPath: string, newDescriptor: borrow<Descriptor>, newPath: string): result<void, ErrorCode>;
				symlinkAt(oldPath: string, newPath: string): result<void, ErrorCode>;
				unlinkFileAt(path: string): result<void, ErrorCode>;
				isSameObject(other: borrow<Descriptor>): boolean;
				metadataHash(): result<MetadataHashValue, ErrorCode>;
				metadataHashAt(pathFlags: PathFlags, path: string): result<MetadataHashValue, ErrorCode>;
			}
			export type Manager = $wcm.ResourceManager<Interface>;
		}
		export type Descriptor = resource;
		
		export namespace DirectoryEntryStream {
			export type Module = {
				
				/**
				 * Read a single directory entry from a `directory-entry-stream`.
				 */
				readDirectoryEntry(self: borrow<DirectoryEntryStream>): result<DirectoryEntry | undefined, ErrorCode>;
			};
			export interface Interface {
				readDirectoryEntry(): result<DirectoryEntry | undefined, ErrorCode>;
			}
			export type Manager = $wcm.ResourceManager<Interface>;
		}
		export type DirectoryEntryStream = resource;
		
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
		export type filesystemErrorCode = (err: borrow<Error>) => ErrorCode | undefined;
	}
	export type Types<D extends filesystem.Types.Descriptor.Module | filesystem.Types.Descriptor.Manager = filesystem.Types.Descriptor.Module | filesystem.Types.Descriptor.Manager, DES extends filesystem.Types.DirectoryEntryStream.Module | filesystem.Types.DirectoryEntryStream.Manager = filesystem.Types.DirectoryEntryStream.Module | filesystem.Types.DirectoryEntryStream.Manager> = {
		Descriptor: D;
		DirectoryEntryStream: DES;
		filesystemErrorCode: Types.filesystemErrorCode;
	};
	
	export namespace Preopens {
		
		export type Descriptor = filesystem.Types.Descriptor;
		
		/**
		 * Return the set of preopened directories, and their path.
		 */
		export type getDirectories = () => [own<Descriptor>, string][];
	}
	export type Preopens = {
		getDirectories: Preopens.getDirectories;
	};
	
}
export type filesystem<T extends filesystem.Types = filesystem.Types> = {
	Types?: T;
	Preopens?: filesystem.Preopens;
};

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
		export const Descriptor = new $wcm.ResourceType('descriptor');
		export const DirectoryEntryStream = new $wcm.ResourceType('directory-entry-stream');
		Descriptor.addFunction('readViaStream', new $wcm.FunctionType<filesystem.Types.Descriptor.Module['readViaStream']>('[method]descriptor.read-via-stream', [
			['self', new $wcm.BorrowType<filesystem.Types.Descriptor>(Descriptor)],
			['offset', Filesize],
		], new $wcm.ResultType<own<filesystem.Types.InputStream>, filesystem.Types.ErrorCode>(new $wcm.OwnType<filesystem.Types.InputStream>(InputStream), ErrorCode)));
		Descriptor.addFunction('writeViaStream', new $wcm.FunctionType<filesystem.Types.Descriptor.Module['writeViaStream']>('[method]descriptor.write-via-stream', [
			['self', new $wcm.BorrowType<filesystem.Types.Descriptor>(Descriptor)],
			['offset', Filesize],
		], new $wcm.ResultType<own<filesystem.Types.OutputStream>, filesystem.Types.ErrorCode>(new $wcm.OwnType<filesystem.Types.OutputStream>(OutputStream), ErrorCode)));
		Descriptor.addFunction('appendViaStream', new $wcm.FunctionType<filesystem.Types.Descriptor.Module['appendViaStream']>('[method]descriptor.append-via-stream', [
			['self', new $wcm.BorrowType<filesystem.Types.Descriptor>(Descriptor)],
		], new $wcm.ResultType<own<filesystem.Types.OutputStream>, filesystem.Types.ErrorCode>(new $wcm.OwnType<filesystem.Types.OutputStream>(OutputStream), ErrorCode)));
		Descriptor.addFunction('advise', new $wcm.FunctionType<filesystem.Types.Descriptor.Module['advise']>('[method]descriptor.advise', [
			['self', new $wcm.BorrowType<filesystem.Types.Descriptor>(Descriptor)],
			['offset', Filesize],
			['length', Filesize],
			['advice', Advice],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode)));
		Descriptor.addFunction('syncData', new $wcm.FunctionType<filesystem.Types.Descriptor.Module['syncData']>('[method]descriptor.sync-data', [
			['self', new $wcm.BorrowType<filesystem.Types.Descriptor>(Descriptor)],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode)));
		Descriptor.addFunction('getFlags', new $wcm.FunctionType<filesystem.Types.Descriptor.Module['getFlags']>('[method]descriptor.get-flags', [
			['self', new $wcm.BorrowType<filesystem.Types.Descriptor>(Descriptor)],
		], new $wcm.ResultType<filesystem.Types.DescriptorFlags, filesystem.Types.ErrorCode>(DescriptorFlags, ErrorCode)));
		Descriptor.addFunction('getType', new $wcm.FunctionType<filesystem.Types.Descriptor.Module['getType']>('[method]descriptor.get-type', [
			['self', new $wcm.BorrowType<filesystem.Types.Descriptor>(Descriptor)],
		], new $wcm.ResultType<filesystem.Types.DescriptorType, filesystem.Types.ErrorCode>(DescriptorType, ErrorCode)));
		Descriptor.addFunction('setSize', new $wcm.FunctionType<filesystem.Types.Descriptor.Module['setSize']>('[method]descriptor.set-size', [
			['self', new $wcm.BorrowType<filesystem.Types.Descriptor>(Descriptor)],
			['size', Filesize],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode)));
		Descriptor.addFunction('setTimes', new $wcm.FunctionType<filesystem.Types.Descriptor.Module['setTimes']>('[method]descriptor.set-times', [
			['self', new $wcm.BorrowType<filesystem.Types.Descriptor>(Descriptor)],
			['dataAccessTimestamp', NewTimestamp],
			['dataModificationTimestamp', NewTimestamp],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode)));
		Descriptor.addFunction('read', new $wcm.FunctionType<filesystem.Types.Descriptor.Module['read']>('[method]descriptor.read', [
			['self', new $wcm.BorrowType<filesystem.Types.Descriptor>(Descriptor)],
			['length', Filesize],
			['offset', Filesize],
		], new $wcm.ResultType<[Uint8Array, boolean], filesystem.Types.ErrorCode>(new $wcm.TupleType<[Uint8Array, boolean]>([new $wcm.Uint8ArrayType(), $wcm.bool]), ErrorCode)));
		Descriptor.addFunction('write', new $wcm.FunctionType<filesystem.Types.Descriptor.Module['write']>('[method]descriptor.write', [
			['self', new $wcm.BorrowType<filesystem.Types.Descriptor>(Descriptor)],
			['buffer', new $wcm.Uint8ArrayType()],
			['offset', Filesize],
		], new $wcm.ResultType<filesystem.Types.Filesize, filesystem.Types.ErrorCode>(Filesize, ErrorCode)));
		Descriptor.addFunction('readDirectory', new $wcm.FunctionType<filesystem.Types.Descriptor.Module['readDirectory']>('[method]descriptor.read-directory', [
			['self', new $wcm.BorrowType<filesystem.Types.Descriptor>(Descriptor)],
		], new $wcm.ResultType<own<filesystem.Types.DirectoryEntryStream>, filesystem.Types.ErrorCode>(new $wcm.OwnType<filesystem.Types.DirectoryEntryStream>(DirectoryEntryStream), ErrorCode)));
		Descriptor.addFunction('sync', new $wcm.FunctionType<filesystem.Types.Descriptor.Module['sync']>('[method]descriptor.sync', [
			['self', new $wcm.BorrowType<filesystem.Types.Descriptor>(Descriptor)],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode)));
		Descriptor.addFunction('createDirectoryAt', new $wcm.FunctionType<filesystem.Types.Descriptor.Module['createDirectoryAt']>('[method]descriptor.create-directory-at', [
			['self', new $wcm.BorrowType<filesystem.Types.Descriptor>(Descriptor)],
			['path', $wcm.wstring],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode)));
		Descriptor.addFunction('stat', new $wcm.FunctionType<filesystem.Types.Descriptor.Module['stat']>('[method]descriptor.stat', [
			['self', new $wcm.BorrowType<filesystem.Types.Descriptor>(Descriptor)],
		], new $wcm.ResultType<filesystem.Types.DescriptorStat, filesystem.Types.ErrorCode>(DescriptorStat, ErrorCode)));
		Descriptor.addFunction('statAt', new $wcm.FunctionType<filesystem.Types.Descriptor.Module['statAt']>('[method]descriptor.stat-at', [
			['self', new $wcm.BorrowType<filesystem.Types.Descriptor>(Descriptor)],
			['pathFlags', PathFlags],
			['path', $wcm.wstring],
		], new $wcm.ResultType<filesystem.Types.DescriptorStat, filesystem.Types.ErrorCode>(DescriptorStat, ErrorCode)));
		Descriptor.addFunction('setTimesAt', new $wcm.FunctionType<filesystem.Types.Descriptor.Module['setTimesAt']>('[method]descriptor.set-times-at', [
			['self', new $wcm.BorrowType<filesystem.Types.Descriptor>(Descriptor)],
			['pathFlags', PathFlags],
			['path', $wcm.wstring],
			['dataAccessTimestamp', NewTimestamp],
			['dataModificationTimestamp', NewTimestamp],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode)));
		Descriptor.addFunction('linkAt', new $wcm.FunctionType<filesystem.Types.Descriptor.Module['linkAt']>('[method]descriptor.link-at', [
			['self', new $wcm.BorrowType<filesystem.Types.Descriptor>(Descriptor)],
			['oldPathFlags', PathFlags],
			['oldPath', $wcm.wstring],
			['newDescriptor', new $wcm.BorrowType<filesystem.Types.Descriptor>(Descriptor)],
			['newPath', $wcm.wstring],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode)));
		Descriptor.addFunction('openAt', new $wcm.FunctionType<filesystem.Types.Descriptor.Module['openAt']>('[method]descriptor.open-at', [
			['self', new $wcm.BorrowType<filesystem.Types.Descriptor>(Descriptor)],
			['pathFlags', PathFlags],
			['path', $wcm.wstring],
			['openFlags', OpenFlags],
			['flags', DescriptorFlags],
		], new $wcm.ResultType<own<filesystem.Types.Descriptor>, filesystem.Types.ErrorCode>(new $wcm.OwnType<filesystem.Types.Descriptor>(Descriptor), ErrorCode)));
		Descriptor.addFunction('readlinkAt', new $wcm.FunctionType<filesystem.Types.Descriptor.Module['readlinkAt']>('[method]descriptor.readlink-at', [
			['self', new $wcm.BorrowType<filesystem.Types.Descriptor>(Descriptor)],
			['path', $wcm.wstring],
		], new $wcm.ResultType<string, filesystem.Types.ErrorCode>($wcm.wstring, ErrorCode)));
		Descriptor.addFunction('removeDirectoryAt', new $wcm.FunctionType<filesystem.Types.Descriptor.Module['removeDirectoryAt']>('[method]descriptor.remove-directory-at', [
			['self', new $wcm.BorrowType<filesystem.Types.Descriptor>(Descriptor)],
			['path', $wcm.wstring],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode)));
		Descriptor.addFunction('renameAt', new $wcm.FunctionType<filesystem.Types.Descriptor.Module['renameAt']>('[method]descriptor.rename-at', [
			['self', new $wcm.BorrowType<filesystem.Types.Descriptor>(Descriptor)],
			['oldPath', $wcm.wstring],
			['newDescriptor', new $wcm.BorrowType<filesystem.Types.Descriptor>(Descriptor)],
			['newPath', $wcm.wstring],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode)));
		Descriptor.addFunction('symlinkAt', new $wcm.FunctionType<filesystem.Types.Descriptor.Module['symlinkAt']>('[method]descriptor.symlink-at', [
			['self', new $wcm.BorrowType<filesystem.Types.Descriptor>(Descriptor)],
			['oldPath', $wcm.wstring],
			['newPath', $wcm.wstring],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode)));
		Descriptor.addFunction('unlinkFileAt', new $wcm.FunctionType<filesystem.Types.Descriptor.Module['unlinkFileAt']>('[method]descriptor.unlink-file-at', [
			['self', new $wcm.BorrowType<filesystem.Types.Descriptor>(Descriptor)],
			['path', $wcm.wstring],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode)));
		Descriptor.addFunction('isSameObject', new $wcm.FunctionType<filesystem.Types.Descriptor.Module['isSameObject']>('[method]descriptor.is-same-object', [
			['self', new $wcm.BorrowType<filesystem.Types.Descriptor>(Descriptor)],
			['other', new $wcm.BorrowType<filesystem.Types.Descriptor>(Descriptor)],
		], $wcm.bool));
		Descriptor.addFunction('metadataHash', new $wcm.FunctionType<filesystem.Types.Descriptor.Module['metadataHash']>('[method]descriptor.metadata-hash', [
			['self', new $wcm.BorrowType<filesystem.Types.Descriptor>(Descriptor)],
		], new $wcm.ResultType<filesystem.Types.MetadataHashValue, filesystem.Types.ErrorCode>(MetadataHashValue, ErrorCode)));
		Descriptor.addFunction('metadataHashAt', new $wcm.FunctionType<filesystem.Types.Descriptor.Module['metadataHashAt']>('[method]descriptor.metadata-hash-at', [
			['self', new $wcm.BorrowType<filesystem.Types.Descriptor>(Descriptor)],
			['pathFlags', PathFlags],
			['path', $wcm.wstring],
		], new $wcm.ResultType<filesystem.Types.MetadataHashValue, filesystem.Types.ErrorCode>(MetadataHashValue, ErrorCode)));
		DirectoryEntryStream.addFunction('readDirectoryEntry', new $wcm.FunctionType<filesystem.Types.DirectoryEntryStream.Module['readDirectoryEntry']>('[method]directory-entry-stream.read-directory-entry', [
			['self', new $wcm.BorrowType<filesystem.Types.DirectoryEntryStream>(DirectoryEntryStream)],
		], new $wcm.ResultType<option<filesystem.Types.DirectoryEntry>, filesystem.Types.ErrorCode>(new $wcm.OptionType<filesystem.Types.DirectoryEntry>(DirectoryEntry), ErrorCode)));
		export const filesystemErrorCode = new $wcm.FunctionType<filesystem.Types.filesystemErrorCode>('filesystem-error-code',[
			['err', new $wcm.BorrowType<filesystem.Types.Error>(Error)],
		], new $wcm.OptionType<filesystem.Types.ErrorCode>(ErrorCode));
	}
	export namespace Types._ {
		export const id = 'wasi:filesystem/types' as const;
		export const witName = 'types' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
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
		export const functions: Map<string, $wcm.FunctionType<$wcm.ServiceFunction>> = new Map([
			['filesystemErrorCode', $.filesystemErrorCode]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map([
			['Descriptor', $.Descriptor],
			['DirectoryEntryStream', $.DirectoryEntryStream]
		]);
		export namespace Descriptor {
			export type WasmInterface = {
				'[method]descriptor.read-via-stream': (self: i32, offset: i64, result: ptr<[i32, i32]>) => void;
				'[method]descriptor.write-via-stream': (self: i32, offset: i64, result: ptr<[i32, i32]>) => void;
				'[method]descriptor.append-via-stream': (self: i32, result: ptr<[i32, i32]>) => void;
				'[method]descriptor.advise': (self: i32, offset: i64, length: i64, advice_Advice: i32, result: ptr<[i32, i32]>) => void;
				'[method]descriptor.sync-data': (self: i32, result: ptr<[i32, i32]>) => void;
				'[method]descriptor.get-flags': (self: i32, result: ptr<[i32, i32]>) => void;
				'[method]descriptor.get-type': (self: i32, result: ptr<[i32, i32]>) => void;
				'[method]descriptor.set-size': (self: i32, size: i64, result: ptr<[i32, i32]>) => void;
				'[method]descriptor.set-times': (self: i32, dataAccessTimestamp_case: i32, dataAccessTimestamp_0: i64, dataAccessTimestamp_1: i32, dataModificationTimestamp_case: i32, dataModificationTimestamp_0: i64, dataModificationTimestamp_1: i32, result: ptr<[i32, i32]>) => void;
				'[method]descriptor.read': (self: i32, length: i64, offset: i64, result: ptr<[i32, i32, i32, i32]>) => void;
				'[method]descriptor.write': (self: i32, buffer_ptr: i32, buffer_len: i32, offset: i64, result: ptr<[i32, i64]>) => void;
				'[method]descriptor.read-directory': (self: i32, result: ptr<[i32, i32]>) => void;
				'[method]descriptor.sync': (self: i32, result: ptr<[i32, i32]>) => void;
				'[method]descriptor.create-directory-at': (self: i32, path_ptr: i32, path_len: i32, result: ptr<[i32, i32]>) => void;
				'[method]descriptor.stat': (self: i32, result: ptr<[i32, i32, i64, i64, i32, i64, i32, i32, i64, i32, i32, i64, i32]>) => void;
				'[method]descriptor.stat-at': (self: i32, pathFlags: i32, path_ptr: i32, path_len: i32, result: ptr<[i32, i32, i64, i64, i32, i64, i32, i32, i64, i32, i32, i64, i32]>) => void;
				'[method]descriptor.set-times-at': (self: i32, pathFlags: i32, path_ptr: i32, path_len: i32, dataAccessTimestamp_case: i32, dataAccessTimestamp_0: i64, dataAccessTimestamp_1: i32, dataModificationTimestamp_case: i32, dataModificationTimestamp_0: i64, dataModificationTimestamp_1: i32, result: ptr<[i32, i32]>) => void;
				'[method]descriptor.link-at': (self: i32, oldPathFlags: i32, oldPath_ptr: i32, oldPath_len: i32, newDescriptor: i32, newPath_ptr: i32, newPath_len: i32, result: ptr<[i32, i32]>) => void;
				'[method]descriptor.open-at': (self: i32, pathFlags: i32, path_ptr: i32, path_len: i32, openFlags: i32, flags: i32, result: ptr<[i32, i32]>) => void;
				'[method]descriptor.readlink-at': (self: i32, path_ptr: i32, path_len: i32, result: ptr<[i32, i32, i32]>) => void;
				'[method]descriptor.remove-directory-at': (self: i32, path_ptr: i32, path_len: i32, result: ptr<[i32, i32]>) => void;
				'[method]descriptor.rename-at': (self: i32, oldPath_ptr: i32, oldPath_len: i32, newDescriptor: i32, newPath_ptr: i32, newPath_len: i32, result: ptr<[i32, i32]>) => void;
				'[method]descriptor.symlink-at': (self: i32, oldPath_ptr: i32, oldPath_len: i32, newPath_ptr: i32, newPath_len: i32, result: ptr<[i32, i32]>) => void;
				'[method]descriptor.unlink-file-at': (self: i32, path_ptr: i32, path_len: i32, result: ptr<[i32, i32]>) => void;
				'[method]descriptor.is-same-object': (self: i32, other: i32) => i32;
				'[method]descriptor.metadata-hash': (self: i32, result: ptr<[i32, i64, i64]>) => void;
				'[method]descriptor.metadata-hash-at': (self: i32, pathFlags: i32, path_ptr: i32, path_len: i32, result: ptr<[i32, i64, i64]>) => void;
			};
		}
		export namespace DirectoryEntryStream {
			export type WasmInterface = {
				'[method]directory-entry-stream.read-directory-entry': (self: i32, result: ptr<[i32, i32, i32, i32, i32]>) => void;
			};
		}
		export type WasmInterface = {
			'filesystem-error-code': (err: i32, result: ptr<[i32, i32]>) => void;
		} & Descriptor.WasmInterface & DirectoryEntryStream.WasmInterface;
		export namespace Descriptor  {
			export function Module(wasmInterface: WasmInterface, context: $wcm.Context): filesystem.Types.Descriptor.Module {
				return $wcm.Module.create<filesystem.Types.Descriptor.Module>($.Descriptor, wasmInterface, context);
			}
			export function Manager(): filesystem.Types.Descriptor.Manager {
				return new $wcm.ResourceManager<filesystem.Types.Descriptor.Interface>();
			}
		}
		export namespace DirectoryEntryStream  {
			export function Module(wasmInterface: WasmInterface, context: $wcm.Context): filesystem.Types.DirectoryEntryStream.Module {
				return $wcm.Module.create<filesystem.Types.DirectoryEntryStream.Module>($.DirectoryEntryStream, wasmInterface, context);
			}
			export function Manager(): filesystem.Types.DirectoryEntryStream.Manager {
				return new $wcm.ResourceManager<filesystem.Types.DirectoryEntryStream.Interface>();
			}
		}
		export function createHost(service: filesystem.Types, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export type ClassService = filesystem.Types<filesystem.Types.Descriptor.Manager, filesystem.Types.DirectoryEntryStream.Manager>;
		export type ModuleService = filesystem.Types<filesystem.Types.Descriptor.Module, filesystem.Types.DirectoryEntryStream.Module>;
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind?: $wcm.ResourceKind.class): ClassService;
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind: $wcm.ResourceKind.module): ModuleService;
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind: $wcm.ResourceKind): filesystem.Types;
		export function createService<D extends filesystem.Types.Descriptor.Module | filesystem.Types.Descriptor.Manager, DES extends filesystem.Types.DirectoryEntryStream.Module | filesystem.Types.DirectoryEntryStream.Manager>(wasmInterface: WasmInterface, context: $wcm.Context, d: $wcm.ResourceTag<D>, des: $wcm.ResourceTag<DES>): filesystem.Types<D, DES>;
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, d?: $wcm.ResourceTag<any> | $wcm.ResourceKind, des?: $wcm.ResourceTag<any>): filesystem.Types {
			d = d ?? $wcm.ResourceKind.class;
			if (d === $wcm.ResourceKind.class) {
				return $wcm.Service.create<ClassService>(functions, [['Descriptor', $.Descriptor, Descriptor.Manager], ['DirectoryEntryStream', $.DirectoryEntryStream, DirectoryEntryStream.Manager]], wasmInterface, context);
			} else if (d === $wcm.ResourceKind.module) {
				return $wcm.Service.create<ModuleService>(functions, [['Descriptor', $.Descriptor, Descriptor.Module], ['DirectoryEntryStream', $.DirectoryEntryStream, DirectoryEntryStream.Module]], wasmInterface, context);
			} else {
				return $wcm.Service.create<filesystem.Types>(functions, [['Descriptor', $.Descriptor, d!], ['DirectoryEntryStream', $.DirectoryEntryStream, des!]], wasmInterface, context);
			}
		}
	}
	
	export namespace Preopens.$ {
		export const Descriptor = filesystem.Types.$.Descriptor;
		export const getDirectories = new $wcm.FunctionType<filesystem.Preopens.getDirectories>('get-directories', [], new $wcm.ListType<[own<filesystem.Preopens.Descriptor>, string]>(new $wcm.TupleType<[own<filesystem.Preopens.Descriptor>, string]>([new $wcm.OwnType<filesystem.Preopens.Descriptor>(Descriptor), $wcm.wstring])));
	}
	export namespace Preopens._ {
		export const id = 'wasi:filesystem/preopens' as const;
		export const witName = 'preopens' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['Descriptor', $.Descriptor]
		]);
		export const functions: Map<string, $wcm.FunctionType<$wcm.ServiceFunction>> = new Map([
			['getDirectories', $.getDirectories]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map([
		]);
		export type WasmInterface = {
			'get-directories': (result: ptr<[i32, i32]>) => void;
		};
		export function createHost(service: filesystem.Preopens, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context, _kind?: $wcm.ResourceKind): filesystem.Preopens {
			return $wcm.Service.create<filesystem.Preopens>(functions, [], wasmInterface, context);
		}
	}
}

export namespace filesystem._ {
	export const id = 'wasi:filesystem' as const;
	export const witName = 'filesystem' as const;
	export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
		['Types', Types._],
		['Preopens', Preopens._]
	]);
	export type WasmInterface = {
		'wasi:filesystem/types'?: Types._.WasmInterface;
		'wasi:filesystem/preopens'?: Preopens._.WasmInterface;
	};
	export function createHost(service: filesystem, context: $wcm.Context): WasmInterface {
		const result: WasmInterface = Object.create(null);
		if (service.Types !== undefined) {
			result['wasi:filesystem/types'] = Types._.createHost(service.Types, context);
		}
		if (service.Preopens !== undefined) {
			result['wasi:filesystem/preopens'] = Preopens._.createHost(service.Preopens, context);
		}
		return result;
	}
	export type ClassService = filesystem<filesystem.Types._.ClassService>;
	export type ModuleService = filesystem<filesystem.Types._.ModuleService>;
	export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind?: $wcm.ResourceKind.class): ClassService;
	export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind: $wcm.ResourceKind.module): ModuleService;
	export function createService(wasmInterface: WasmInterface, context: $wcm.Context, kind: $wcm.ResourceKind): filesystem;
	export function createService<T extends filesystem.Types>(wasmInterface: WasmInterface, context: $wcm.Context, t: filesystem.Types): filesystem<T>;
	export function createService(wasmInterface: WasmInterface, context: $wcm.Context, t?: filesystem.Types | $wcm.ResourceKind): filesystem {
		const result: filesystem = Object.create(null);
		t = t ?? $wcm.ResourceKind.class;
		if (t === $wcm.ResourceKind.class || t === $wcm.ResourceKind.module) {
			if (wasmInterface['wasi:filesystem/types'] !== undefined) {
				result.Types = Types._.createService(wasmInterface['wasi:filesystem/types'], context, t);
			}
			if (wasmInterface['wasi:filesystem/preopens'] !== undefined) {
				result.Preopens = Preopens._.createService(wasmInterface['wasi:filesystem/preopens'], context, t);
			}
		} else {
			if (wasmInterface['wasi:filesystem/types'] !== undefined) {
				result.Types = t;
			}
			if (wasmInterface['wasi:filesystem/preopens'] !== undefined) {
				result.Preopens = Preopens._.createService(wasmInterface['wasi:filesystem/preopens'], context);
			}
		}
		return result;
	}
}
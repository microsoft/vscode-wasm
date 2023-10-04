/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '@vscode/wasm-component-model';
import type { u64, u32, result, option } from '@vscode/wasm-component-model';
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
	 */
	export namespace Types {
		
		export type InputStream = io.Streams.InputStream;
		
		export type OutputStream = io.Streams.OutputStream;
		
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
			unknown = 0,
			blockDevice = 1,
			characterDevice = 2,
			directory = 3,
			fifo = 4,
			symbolicLink = 5,
			regularFile = 6,
			socket = 7,
		}
		
		/**
		 * Descriptor flags.
		 * 
		 * Note: This was called `fdflags` in earlier versions of WASI.
		 */
		export interface DescriptorFlags extends $wcm.JFlags {
			read: boolean;
			write: boolean;
			fileIntegritySync: boolean;
			dataIntegritySync: boolean;
			requestedWriteSync: boolean;
			mutateDirectory: boolean;
		};
		
		/**
		 * Flags determining the method of how paths are resolved.
		 */
		export interface PathFlags extends $wcm.JFlags {
			symlinkFollow: boolean;
		};
		
		/**
		 * Open flags used by `open-at`.
		 */
		export interface OpenFlags extends $wcm.JFlags {
			create: boolean;
			directory: boolean;
			exclusive: boolean;
			truncate: boolean;
		};
		
		/**
		 * Permissions mode used by `open-at`, `change-file-permissions-at`, and
		 * similar.
		 */
		export interface Modes extends $wcm.JFlags {
			readable: boolean;
			writable: boolean;
			executable: boolean;
		};
		
		/**
		 * Access type used by `access-at`.
		 */
		export namespace AccessType {
			
			/**
			 * Test for readability, writeability, or executability.
			 */
			export const access = 0 as const;
			export type access = { readonly case: typeof access; readonly value: Modes } & _common;
			
			
			/**
			 * Test whether the path exists.
			 */
			export const exists = 1 as const;
			export type exists = { readonly case: typeof exists } & _common;
			
			export type _ct = typeof access | typeof exists;
			export type _vt = Modes | undefined;
			type _common = Omit<VariantImpl, 'case' | 'value'>;
			export function _ctor(c: _ct, v: _vt): AccessType {
				return new VariantImpl(c, v) as AccessType;
			}
			export function _access(value: Modes): access {
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
					return this._case === AccessType.access;
				}
				exists(): this is exists {
					return this._case === AccessType.exists;
				}
			}
		}
		export type AccessType = AccessType.access | AccessType.exists;
		
		/**
		 * Number of hard links to an inode.
		 */
		export type LinkCount = u64;
		
		/**
		 * File attributes.
		 * 
		 * Note: This was called `filestat` in earlier versions of WASI.
		 */
		export interface DescriptorStat extends $wcm.JRecord {
			
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
			 */
			dataAccessTimestamp: Datetime;
			
			/**
			 * Last data modification timestamp.
			 */
			dataModificationTimestamp: Datetime;
			
			/**
			 * Last file status change timestamp.
			 */
			statusChangeTimestamp: Datetime;
		}
		
		/**
		 * When setting a timestamp, this gives the value to set it to.
		 */
		export namespace NewTimestamp {
			
			/**
			 * Leave the timestamp set to its previous value.
			 */
			export const noChange = 0 as const;
			export type noChange = { readonly case: typeof noChange } & _common;
			
			
			/**
			 * Set the timestamp to the current time of the system clock associated
			 * with the filesystem.
			 */
			export const now = 1 as const;
			export type now = { readonly case: typeof now } & _common;
			
			
			/**
			 * Set the timestamp to the given value.
			 */
			export const timestamp = 2 as const;
			export type timestamp = { readonly case: typeof timestamp; readonly value: Datetime } & _common;
			
			export type _ct = typeof noChange | typeof now | typeof timestamp;
			export type _vt = Datetime | undefined;
			type _common = Omit<VariantImpl, 'case' | 'value'>;
			export function _ctor(c: _ct, v: _vt): NewTimestamp {
				return new VariantImpl(c, v) as NewTimestamp;
			}
			export function _noChange(): noChange {
				return new VariantImpl(noChange, undefined) as noChange;
			}
			export function _now(): now {
				return new VariantImpl(now, undefined) as now;
			}
			export function _timestamp(value: Datetime): timestamp {
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
				noChange(): this is noChange {
					return this._case === NewTimestamp.noChange;
				}
				now(): this is now {
					return this._case === NewTimestamp.now;
				}
				timestamp(): this is timestamp {
					return this._case === NewTimestamp.timestamp;
				}
			}
		}
		export type NewTimestamp = NewTimestamp.noChange | NewTimestamp.now | NewTimestamp.timestamp;
		
		/**
		 * A directory entry.
		 */
		export interface DirectoryEntry extends $wcm.JRecord {
			
			/**
			 * The type of the file referred to by this directory entry.
			 */
			type: DescriptorType;
			
			/**
			 * The name of the object.
			 */
			name: string;
		}
		
		/**
		 * Error codes returned by functions, similar to `errno` in POSIX.
		 * Not all of these error codes are returned by the functions provided by this
		 * API; some are used in higher-level library layers, and others are provided
		 * merely for alignment with POSIX.
		 */
		export enum ErrorCode {
			access = 0,
			wouldBlock = 1,
			already = 2,
			badDescriptor = 3,
			busy = 4,
			deadlock = 5,
			quota = 6,
			exist = 7,
			fileTooLarge = 8,
			illegalByteSequence = 9,
			inProgress = 10,
			interrupted = 11,
			invalid = 12,
			io = 13,
			isDirectory = 14,
			loop = 15,
			tooManyLinks = 16,
			messageSize = 17,
			nameTooLong = 18,
			noDevice = 19,
			noEntry = 20,
			noLock = 21,
			insufficientMemory = 22,
			insufficientSpace = 23,
			notDirectory = 24,
			notEmpty = 25,
			notRecoverable = 26,
			unsupported = 27,
			noTty = 28,
			noSuchDevice = 29,
			overflow = 30,
			notPermitted = 31,
			pipe = 32,
			readOnly = 33,
			invalidSeek = 34,
			textFileBusy = 35,
			crossDevice = 36,
		}
		
		/**
		 * File or memory access pattern advisory information.
		 */
		export enum Advice {
			normal = 0,
			sequential = 1,
			random = 2,
			willNeed = 3,
			dontNeed = 4,
			noReuse = 5,
		}
		
		/**
		 * A descriptor is a reference to a filesystem object, which may be a file,
		 * directory, named pipe, special file, or other object on which filesystem
		 * calls may be made.
		 * 
		 * This [represents a resource](https://github.com/WebAssembly/WASI/blob/main/docs/WitInWasi.md#Resources).
		 */
		export type Descriptor = u32;
		
		/**
		 * A 128-bit hash value, split into parts because wasm doesn't have a
		 * 128-bit integer type.
		 */
		export interface MetadataHashValue extends $wcm.JRecord {
			
			/**
			 * 64 bits of a 128-bit hash value.
			 */
			lower: u64;
			
			/**
			 * Another 64 bits of a 128-bit hash value.
			 */
			upper: u64;
		}
		
		/**
		 * A stream of directory entries.
		 * 
		 * This [represents a stream of `dir-entry`](https://github.com/WebAssembly/WASI/blob/main/docs/WitInWasi.md#Streams).
		 */
		export type DirectoryEntryStream = u32;
		
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
		export declare function readViaStream(this_: Descriptor, offset: Filesize): result<InputStream, ErrorCode>;
		
		/**
		 * Return a stream for writing to a file, if available.
		 * 
		 * May fail with an error-code describing why the file cannot be written.
		 * 
		 * Note: This allows using `write-stream`, which is similar to `write` in
		 * POSIX.
		 */
		export declare function writeViaStream(this_: Descriptor, offset: Filesize): result<OutputStream, ErrorCode>;
		
		/**
		 * Return a stream for appending to a file, if available.
		 * 
		 * May fail with an error-code describing why the file cannot be appended.
		 * 
		 * Note: This allows using `write-stream`, which is similar to `write` with
		 * `O_APPEND` in in POSIX.
		 */
		export declare function appendViaStream(this_: Descriptor): result<OutputStream, ErrorCode>;
		
		/**
		 * Provide file advisory information on a descriptor.
		 * 
		 * This is similar to `posix_fadvise` in POSIX.
		 */
		export declare function advise(this_: Descriptor, offset: Filesize, length: Filesize, advice: Advice): result<void, ErrorCode>;
		
		/**
		 * Synchronize the data of a file to disk.
		 * 
		 * This function succeeds with no effect if the file descriptor is not
		 * opened for writing.
		 * 
		 * Note: This is similar to `fdatasync` in POSIX.
		 */
		export declare function syncData(this_: Descriptor): result<void, ErrorCode>;
		
		/**
		 * Get flags associated with a descriptor.
		 * 
		 * Note: This returns similar flags to `fcntl(fd, F_GETFL)` in POSIX.
		 * 
		 * Note: This returns the value that was the `fs_flags` value returned
		 * from `fdstat_get` in earlier versions of WASI.
		 */
		export declare function getFlags(this_: Descriptor): result<DescriptorFlags, ErrorCode>;
		
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
		export declare function getType(this_: Descriptor): result<DescriptorType, ErrorCode>;
		
		/**
		 * Adjust the size of an open file. If this increases the file's size, the
		 * extra bytes are filled with zeros.
		 * 
		 * Note: This was called `fd_filestat_set_size` in earlier versions of WASI.
		 */
		export declare function setSize(this_: Descriptor, size: Filesize): result<void, ErrorCode>;
		
		/**
		 * Adjust the timestamps of an open file or directory.
		 * 
		 * Note: This is similar to `futimens` in POSIX.
		 * 
		 * Note: This was called `fd_filestat_set_times` in earlier versions of WASI.
		 */
		export declare function setTimes(this_: Descriptor, dataAccessTimestamp: NewTimestamp, dataModificationTimestamp: NewTimestamp): result<void, ErrorCode>;
		
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
		export declare function read(this_: Descriptor, length: Filesize, offset: Filesize): result<[Uint8Array, boolean], ErrorCode>;
		
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
		export declare function write(this_: Descriptor, buffer: Uint8Array, offset: Filesize): result<Filesize, ErrorCode>;
		
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
		export declare function readDirectory(this_: Descriptor): result<DirectoryEntryStream, ErrorCode>;
		
		/**
		 * Synchronize the data and metadata of a file to disk.
		 * 
		 * This function succeeds with no effect if the file descriptor is not
		 * opened for writing.
		 * 
		 * Note: This is similar to `fsync` in POSIX.
		 */
		export declare function sync(this_: Descriptor): result<void, ErrorCode>;
		
		/**
		 * Create a directory.
		 * 
		 * Note: This is similar to `mkdirat` in POSIX.
		 */
		export declare function createDirectoryAt(this_: Descriptor, path: string): result<void, ErrorCode>;
		
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
		export declare function stat(this_: Descriptor): result<DescriptorStat, ErrorCode>;
		
		/**
		 * Return the attributes of a file or directory.
		 * 
		 * Note: This is similar to `fstatat` in POSIX, except that it does not
		 * return device and inode information. See the `stat` description for a
		 * discussion of alternatives.
		 * 
		 * Note: This was called `path_filestat_get` in earlier versions of WASI.
		 */
		export declare function statAt(this_: Descriptor, pathFlags: PathFlags, path: string): result<DescriptorStat, ErrorCode>;
		
		/**
		 * Adjust the timestamps of a file or directory.
		 * 
		 * Note: This is similar to `utimensat` in POSIX.
		 * 
		 * Note: This was called `path_filestat_set_times` in earlier versions of
		 * WASI.
		 */
		export declare function setTimesAt(this_: Descriptor, pathFlags: PathFlags, path: string, dataAccessTimestamp: NewTimestamp, dataModificationTimestamp: NewTimestamp): result<void, ErrorCode>;
		
		/**
		 * Create a hard link.
		 * 
		 * Note: This is similar to `linkat` in POSIX.
		 */
		export declare function linkAt(this_: Descriptor, oldPathFlags: PathFlags, oldPath: string, newDescriptor: Descriptor, newPath: string): result<void, ErrorCode>;
		
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
		export declare function openAt(this_: Descriptor, pathFlags: PathFlags, path: string, openFlags: OpenFlags, flags: DescriptorFlags, modes: Modes): result<Descriptor, ErrorCode>;
		
		/**
		 * Read the contents of a symbolic link.
		 * 
		 * If the contents contain an absolute or rooted path in the underlying
		 * filesystem, this function fails with `error-code::not-permitted`.
		 * 
		 * Note: This is similar to `readlinkat` in POSIX.
		 */
		export declare function readlinkAt(this_: Descriptor, path: string): result<string, ErrorCode>;
		
		/**
		 * Remove a directory.
		 * 
		 * Return `error-code::not-empty` if the directory is not empty.
		 * 
		 * Note: This is similar to `unlinkat(fd, path, AT_REMOVEDIR)` in POSIX.
		 */
		export declare function removeDirectoryAt(this_: Descriptor, path: string): result<void, ErrorCode>;
		
		/**
		 * Rename a filesystem object.
		 * 
		 * Note: This is similar to `renameat` in POSIX.
		 */
		export declare function renameAt(this_: Descriptor, oldPath: string, newDescriptor: Descriptor, newPath: string): result<void, ErrorCode>;
		
		/**
		 * Create a symbolic link (also known as a "symlink").
		 * 
		 * If `old-path` starts with `/`, the function fails with
		 * `error-code::not-permitted`.
		 * 
		 * Note: This is similar to `symlinkat` in POSIX.
		 */
		export declare function symlinkAt(this_: Descriptor, oldPath: string, newPath: string): result<void, ErrorCode>;
		
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
		export declare function accessAt(this_: Descriptor, pathFlags: PathFlags, path: string, type: AccessType): result<void, ErrorCode>;
		
		/**
		 * Unlink a filesystem object that is not a directory.
		 * 
		 * Return `error-code::is-directory` if the path refers to a directory.
		 * Note: This is similar to `unlinkat(fd, path, 0)` in POSIX.
		 */
		export declare function unlinkFileAt(this_: Descriptor, path: string): result<void, ErrorCode>;
		
		/**
		 * Change the permissions of a filesystem object that is not a directory.
		 * 
		 * Note that the ultimate meanings of these permissions is
		 * filesystem-specific.
		 * 
		 * Note: This is similar to `fchmodat` in POSIX.
		 */
		export declare function changeFilePermissionsAt(this_: Descriptor, pathFlags: PathFlags, path: string, modes: Modes): result<void, ErrorCode>;
		
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
		export declare function changeDirectoryPermissionsAt(this_: Descriptor, pathFlags: PathFlags, path: string, modes: Modes): result<void, ErrorCode>;
		
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
		export declare function lockShared(this_: Descriptor): result<void, ErrorCode>;
		
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
		export declare function lockExclusive(this_: Descriptor): result<void, ErrorCode>;
		
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
		export declare function tryLockShared(this_: Descriptor): result<void, ErrorCode>;
		
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
		export declare function tryLockExclusive(this_: Descriptor): result<void, ErrorCode>;
		
		/**
		 * Release a shared or exclusive lock on an open file.
		 * 
		 * Note: This is similar to `flock(fd, LOCK_UN)` in Unix.
		 */
		export declare function unlock(this_: Descriptor): result<void, ErrorCode>;
		
		/**
		 * Dispose of the specified `descriptor`, after which it may no longer
		 * be used.
		 */
		export declare function dropDescriptor(this_: Descriptor): void;
		
		/**
		 * Read a single directory entry from a `directory-entry-stream`.
		 */
		export declare function readDirectoryEntry(this_: DirectoryEntryStream): result<DirectoryEntry | undefined, ErrorCode>;
		
		/**
		 * Dispose of the specified `directory-entry-stream`, after which it may no longer
		 * be used.
		 */
		export declare function dropDirectoryEntryStream(this_: DirectoryEntryStream): void;
		
		/**
		 * Test whether two descriptors refer to the same filesystem object.
		 * 
		 * In POSIX, this corresponds to testing whether the two descriptors have the
		 * same device (`st_dev`) and inode (`st_ino` or `d_ino`) numbers.
		 * wasi-filesystem does not expose device and inode numbers, so this function
		 * may be used instead.
		 */
		export declare function isSameObject(this_: Descriptor, other: Descriptor): boolean;
		
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
		export declare function metadataHash(this_: Descriptor): result<MetadataHashValue, ErrorCode>;
		
		/**
		 * Return a hash of the metadata associated with a filesystem object referred
		 * to by a directory descriptor and a relative path.
		 * 
		 * This performs the same hash computation as `metadata-hash`.
		 */
		export declare function metadataHashAt(this_: Descriptor, pathFlags: PathFlags, path: string): result<MetadataHashValue, ErrorCode>;
	}
	export type Types = Pick<typeof Types, 'readViaStream' | 'writeViaStream' | 'appendViaStream' | 'advise' | 'syncData' | 'getFlags' | 'getType' | 'setSize' | 'setTimes' | 'read' | 'write' | 'readDirectory' | 'sync' | 'createDirectoryAt' | 'stat' | 'statAt' | 'setTimesAt' | 'linkAt' | 'openAt' | 'readlinkAt' | 'removeDirectoryAt' | 'renameAt' | 'symlinkAt' | 'accessAt' | 'unlinkFileAt' | 'changeFilePermissionsAt' | 'changeDirectoryPermissionsAt' | 'lockShared' | 'lockExclusive' | 'tryLockShared' | 'tryLockExclusive' | 'unlock' | 'dropDescriptor' | 'readDirectoryEntry' | 'dropDirectoryEntryStream' | 'isSameObject' | 'metadataHash' | 'metadataHashAt'>;
	
	export namespace Preopens {
		
		export type Descriptor = filesystem.Types.Descriptor;
		
		/**
		 * Return the set of preopened directories, and their path.
		 */
		export declare function getDirectories(): [Descriptor, string][];
	}
	export type Preopens = Pick<typeof Preopens, 'getDirectories'>;
	
}

export namespace filesystem {
	export namespace Types.$ {
		export const InputStream = io.Streams.$.InputStream;
		export const OutputStream = io.Streams.$.OutputStream;
		export const Datetime = clocks.WallClock.$.Datetime;
		export const Filesize = $wcm.u64;
		export const DescriptorType = new $wcm.EnumType<filesystem.Types.DescriptorType>(8);
		export const DescriptorFlags = new $wcm.FlagsType<filesystem.Types.DescriptorFlags>(['read', 'write', 'fileIntegritySync', 'dataIntegritySync', 'requestedWriteSync', 'mutateDirectory']);
		export const PathFlags = new $wcm.FlagsType<filesystem.Types.PathFlags>(['symlinkFollow']);
		export const OpenFlags = new $wcm.FlagsType<filesystem.Types.OpenFlags>(['create', 'directory', 'exclusive', 'truncate']);
		export const Modes = new $wcm.FlagsType<filesystem.Types.Modes>(['readable', 'writable', 'executable']);
		export const AccessType = new $wcm.VariantType<filesystem.Types.AccessType, filesystem.Types.AccessType._ct, filesystem.Types.AccessType._vt>([Modes, undefined], filesystem.Types.AccessType._ctor);
		export const LinkCount = $wcm.u64;
		export const DescriptorStat = new $wcm.RecordType<filesystem.Types.DescriptorStat>([
			['type', DescriptorType],
			['linkCount', LinkCount],
			['size', Filesize],
			['dataAccessTimestamp', Datetime],
			['dataModificationTimestamp', Datetime],
			['statusChangeTimestamp', Datetime],
		]);
		export const NewTimestamp = new $wcm.VariantType<filesystem.Types.NewTimestamp, filesystem.Types.NewTimestamp._ct, filesystem.Types.NewTimestamp._vt>([undefined, undefined, Datetime], filesystem.Types.NewTimestamp._ctor);
		export const DirectoryEntry = new $wcm.RecordType<filesystem.Types.DirectoryEntry>([
			['type', DescriptorType],
			['name', $wcm.wstring],
		]);
		export const ErrorCode = new $wcm.EnumType<filesystem.Types.ErrorCode>(37);
		export const Advice = new $wcm.EnumType<filesystem.Types.Advice>(6);
		export const Descriptor = $wcm.u32;
		export const MetadataHashValue = new $wcm.RecordType<filesystem.Types.MetadataHashValue>([
			['lower', $wcm.u64],
			['upper', $wcm.u64],
		]);
		export const DirectoryEntryStream = $wcm.u32;
		export const readViaStream = new $wcm.FunctionType<typeof filesystem.Types.readViaStream>('readViaStream', 'read-via-stream',[
			['this_', Descriptor],
			['offset', Filesize],
		], new $wcm.ResultType<filesystem.Types.InputStream, filesystem.Types.ErrorCode>(InputStream, ErrorCode));
		export const writeViaStream = new $wcm.FunctionType<typeof filesystem.Types.writeViaStream>('writeViaStream', 'write-via-stream',[
			['this_', Descriptor],
			['offset', Filesize],
		], new $wcm.ResultType<filesystem.Types.OutputStream, filesystem.Types.ErrorCode>(OutputStream, ErrorCode));
		export const appendViaStream = new $wcm.FunctionType<typeof filesystem.Types.appendViaStream>('appendViaStream', 'append-via-stream',[
			['this_', Descriptor],
		], new $wcm.ResultType<filesystem.Types.OutputStream, filesystem.Types.ErrorCode>(OutputStream, ErrorCode));
		export const advise = new $wcm.FunctionType<typeof filesystem.Types.advise>('advise', 'advise',[
			['this_', Descriptor],
			['offset', Filesize],
			['length', Filesize],
			['advice', Advice],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode));
		export const syncData = new $wcm.FunctionType<typeof filesystem.Types.syncData>('syncData', 'sync-data',[
			['this_', Descriptor],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode));
		export const getFlags = new $wcm.FunctionType<typeof filesystem.Types.getFlags>('getFlags', 'get-flags',[
			['this_', Descriptor],
		], new $wcm.ResultType<filesystem.Types.DescriptorFlags, filesystem.Types.ErrorCode>(DescriptorFlags, ErrorCode));
		export const getType = new $wcm.FunctionType<typeof filesystem.Types.getType>('getType', 'get-type',[
			['this_', Descriptor],
		], new $wcm.ResultType<filesystem.Types.DescriptorType, filesystem.Types.ErrorCode>(DescriptorType, ErrorCode));
		export const setSize = new $wcm.FunctionType<typeof filesystem.Types.setSize>('setSize', 'set-size',[
			['this_', Descriptor],
			['size', Filesize],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode));
		export const setTimes = new $wcm.FunctionType<typeof filesystem.Types.setTimes>('setTimes', 'set-times',[
			['this_', Descriptor],
			['dataAccessTimestamp', NewTimestamp],
			['dataModificationTimestamp', NewTimestamp],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode));
		export const read = new $wcm.FunctionType<typeof filesystem.Types.read>('read', 'read',[
			['this_', Descriptor],
			['length', Filesize],
			['offset', Filesize],
		], new $wcm.ResultType<[Uint8Array, boolean], filesystem.Types.ErrorCode>(new $wcm.TupleType<[Uint8Array, boolean]>([new $wcm.Uint8ArrayType(), $wcm.bool]), ErrorCode));
		export const write = new $wcm.FunctionType<typeof filesystem.Types.write>('write', 'write',[
			['this_', Descriptor],
			['buffer', new $wcm.Uint8ArrayType()],
			['offset', Filesize],
		], new $wcm.ResultType<u64, filesystem.Types.ErrorCode>(Filesize, ErrorCode));
		export const readDirectory = new $wcm.FunctionType<typeof filesystem.Types.readDirectory>('readDirectory', 'read-directory',[
			['this_', Descriptor],
		], new $wcm.ResultType<u32, filesystem.Types.ErrorCode>(DirectoryEntryStream, ErrorCode));
		export const sync = new $wcm.FunctionType<typeof filesystem.Types.sync>('sync', 'sync',[
			['this_', Descriptor],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode));
		export const createDirectoryAt = new $wcm.FunctionType<typeof filesystem.Types.createDirectoryAt>('createDirectoryAt', 'create-directory-at',[
			['this_', Descriptor],
			['path', $wcm.wstring],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode));
		export const stat = new $wcm.FunctionType<typeof filesystem.Types.stat>('stat', 'stat',[
			['this_', Descriptor],
		], new $wcm.ResultType<filesystem.Types.DescriptorStat, filesystem.Types.ErrorCode>(DescriptorStat, ErrorCode));
		export const statAt = new $wcm.FunctionType<typeof filesystem.Types.statAt>('statAt', 'stat-at',[
			['this_', Descriptor],
			['pathFlags', PathFlags],
			['path', $wcm.wstring],
		], new $wcm.ResultType<filesystem.Types.DescriptorStat, filesystem.Types.ErrorCode>(DescriptorStat, ErrorCode));
		export const setTimesAt = new $wcm.FunctionType<typeof filesystem.Types.setTimesAt>('setTimesAt', 'set-times-at',[
			['this_', Descriptor],
			['pathFlags', PathFlags],
			['path', $wcm.wstring],
			['dataAccessTimestamp', NewTimestamp],
			['dataModificationTimestamp', NewTimestamp],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode));
		export const linkAt = new $wcm.FunctionType<typeof filesystem.Types.linkAt>('linkAt', 'link-at',[
			['this_', Descriptor],
			['oldPathFlags', PathFlags],
			['oldPath', $wcm.wstring],
			['newDescriptor', Descriptor],
			['newPath', $wcm.wstring],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode));
		export const openAt = new $wcm.FunctionType<typeof filesystem.Types.openAt>('openAt', 'open-at',[
			['this_', Descriptor],
			['pathFlags', PathFlags],
			['path', $wcm.wstring],
			['openFlags', OpenFlags],
			['flags', DescriptorFlags],
			['modes', Modes],
		], new $wcm.ResultType<u32, filesystem.Types.ErrorCode>(Descriptor, ErrorCode));
		export const readlinkAt = new $wcm.FunctionType<typeof filesystem.Types.readlinkAt>('readlinkAt', 'readlink-at',[
			['this_', Descriptor],
			['path', $wcm.wstring],
		], new $wcm.ResultType<string, filesystem.Types.ErrorCode>($wcm.wstring, ErrorCode));
		export const removeDirectoryAt = new $wcm.FunctionType<typeof filesystem.Types.removeDirectoryAt>('removeDirectoryAt', 'remove-directory-at',[
			['this_', Descriptor],
			['path', $wcm.wstring],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode));
		export const renameAt = new $wcm.FunctionType<typeof filesystem.Types.renameAt>('renameAt', 'rename-at',[
			['this_', Descriptor],
			['oldPath', $wcm.wstring],
			['newDescriptor', Descriptor],
			['newPath', $wcm.wstring],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode));
		export const symlinkAt = new $wcm.FunctionType<typeof filesystem.Types.symlinkAt>('symlinkAt', 'symlink-at',[
			['this_', Descriptor],
			['oldPath', $wcm.wstring],
			['newPath', $wcm.wstring],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode));
		export const accessAt = new $wcm.FunctionType<typeof filesystem.Types.accessAt>('accessAt', 'access-at',[
			['this_', Descriptor],
			['pathFlags', PathFlags],
			['path', $wcm.wstring],
			['type', AccessType],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode));
		export const unlinkFileAt = new $wcm.FunctionType<typeof filesystem.Types.unlinkFileAt>('unlinkFileAt', 'unlink-file-at',[
			['this_', Descriptor],
			['path', $wcm.wstring],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode));
		export const changeFilePermissionsAt = new $wcm.FunctionType<typeof filesystem.Types.changeFilePermissionsAt>('changeFilePermissionsAt', 'change-file-permissions-at',[
			['this_', Descriptor],
			['pathFlags', PathFlags],
			['path', $wcm.wstring],
			['modes', Modes],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode));
		export const changeDirectoryPermissionsAt = new $wcm.FunctionType<typeof filesystem.Types.changeDirectoryPermissionsAt>('changeDirectoryPermissionsAt', 'change-directory-permissions-at',[
			['this_', Descriptor],
			['pathFlags', PathFlags],
			['path', $wcm.wstring],
			['modes', Modes],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode));
		export const lockShared = new $wcm.FunctionType<typeof filesystem.Types.lockShared>('lockShared', 'lock-shared',[
			['this_', Descriptor],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode));
		export const lockExclusive = new $wcm.FunctionType<typeof filesystem.Types.lockExclusive>('lockExclusive', 'lock-exclusive',[
			['this_', Descriptor],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode));
		export const tryLockShared = new $wcm.FunctionType<typeof filesystem.Types.tryLockShared>('tryLockShared', 'try-lock-shared',[
			['this_', Descriptor],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode));
		export const tryLockExclusive = new $wcm.FunctionType<typeof filesystem.Types.tryLockExclusive>('tryLockExclusive', 'try-lock-exclusive',[
			['this_', Descriptor],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode));
		export const unlock = new $wcm.FunctionType<typeof filesystem.Types.unlock>('unlock', 'unlock',[
			['this_', Descriptor],
		], new $wcm.ResultType<void, filesystem.Types.ErrorCode>(undefined, ErrorCode));
		export const dropDescriptor = new $wcm.FunctionType<typeof filesystem.Types.dropDescriptor>('dropDescriptor', 'drop-descriptor',[
			['this_', Descriptor],
		], undefined);
		export const readDirectoryEntry = new $wcm.FunctionType<typeof filesystem.Types.readDirectoryEntry>('readDirectoryEntry', 'read-directory-entry',[
			['this_', DirectoryEntryStream],
		], new $wcm.ResultType<option<filesystem.Types.DirectoryEntry>, filesystem.Types.ErrorCode>(new $wcm.OptionType<filesystem.Types.DirectoryEntry>(DirectoryEntry), ErrorCode));
		export const dropDirectoryEntryStream = new $wcm.FunctionType<typeof filesystem.Types.dropDirectoryEntryStream>('dropDirectoryEntryStream', 'drop-directory-entry-stream',[
			['this_', DirectoryEntryStream],
		], undefined);
		export const isSameObject = new $wcm.FunctionType<typeof filesystem.Types.isSameObject>('isSameObject', 'is-same-object',[
			['this_', Descriptor],
			['other', Descriptor],
		], $wcm.bool);
		export const metadataHash = new $wcm.FunctionType<typeof filesystem.Types.metadataHash>('metadataHash', 'metadata-hash',[
			['this_', Descriptor],
		], new $wcm.ResultType<filesystem.Types.MetadataHashValue, filesystem.Types.ErrorCode>(MetadataHashValue, ErrorCode));
		export const metadataHashAt = new $wcm.FunctionType<typeof filesystem.Types.metadataHashAt>('metadataHashAt', 'metadata-hash-at',[
			['this_', Descriptor],
			['pathFlags', PathFlags],
			['path', $wcm.wstring],
		], new $wcm.ResultType<filesystem.Types.MetadataHashValue, filesystem.Types.ErrorCode>(MetadataHashValue, ErrorCode));
	}
	export namespace Types._ {
		const allFunctions = [$.readViaStream, $.writeViaStream, $.appendViaStream, $.advise, $.syncData, $.getFlags, $.getType, $.setSize, $.setTimes, $.read, $.write, $.readDirectory, $.sync, $.createDirectoryAt, $.stat, $.statAt, $.setTimesAt, $.linkAt, $.openAt, $.readlinkAt, $.removeDirectoryAt, $.renameAt, $.symlinkAt, $.accessAt, $.unlinkFileAt, $.changeFilePermissionsAt, $.changeDirectoryPermissionsAt, $.lockShared, $.lockExclusive, $.tryLockShared, $.tryLockExclusive, $.unlock, $.dropDescriptor, $.readDirectoryEntry, $.dropDirectoryEntryStream, $.isSameObject, $.metadataHash, $.metadataHashAt];
		export function createHost<T extends $wcm.Host>(service: filesystem.Types, context: $wcm.Context): T {
			return $wcm.Host.create<T>(allFunctions, service, context);
		}
		export function createService<T extends filesystem.Types>(wasmInterface: $wcm.WasmInterface, context: $wcm.Context): T {
			return $wcm.Service.create<T>(allFunctions, wasmInterface, context);
		}
	}
	export namespace Preopens.$ {
		export const Descriptor = filesystem.Types.$.Descriptor;
		export const getDirectories = new $wcm.FunctionType<typeof filesystem.Preopens.getDirectories>('getDirectories', 'get-directories', [], new $wcm.ListType<[filesystem.Preopens.Descriptor, string]>(new $wcm.TupleType<[filesystem.Preopens.Descriptor, string]>([Descriptor, $wcm.wstring])));
	}
	export namespace Preopens._ {
		const allFunctions = [$.getDirectories];
		export function createHost<T extends $wcm.Host>(service: filesystem.Preopens, context: $wcm.Context): T {
			return $wcm.Host.create<T>(allFunctions, service, context);
		}
		export function createService<T extends filesystem.Preopens>(wasmInterface: $wcm.WasmInterface, context: $wcm.Context): T {
			return $wcm.Service.create<T>(allFunctions, wasmInterface, context);
		}
	}
}
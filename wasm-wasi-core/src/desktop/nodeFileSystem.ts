/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { BigIntStats, Dir } from 'node:fs';
import fs from 'node:fs/promises';
import paths from 'node:path';

import RAL from '../common/ral';
import { u64, size } from '../common/baseTypes';
import {
	fdstat, filestat, Rights, fd, rights, fdflags, Filetype, WasiError, Errno, filetype, Whence,
	lookupflags, timestamp, fstflags, oflags, Oflags, filesize, Fdflags, inode, Lookupflags, Fstflags, errno
} from '../common/wasi';
import { BigInts } from '../common/converter';
import { BaseFileDescriptor, FdProvider, FileDescriptor } from '../common/fileDescriptor';
import { NoSysDeviceDriver, ReaddirEntry, FileSystemDeviceDriver, DeviceId, DeviceDriverKind } from '../common/deviceDriver';
import { Dirent } from 'node:fs';
import { Uri } from 'vscode';
import { WritePermDeniedDeviceDriver } from '../common/deviceDriver';

const _DirectoryBaseRights: rights = Rights.fd_fdstat_set_flags | Rights.path_create_directory |
	Rights.path_create_file | Rights.path_link_source | Rights.path_link_target | Rights.path_open |
	Rights.fd_readdir | Rights.path_readlink | Rights.path_rename_source | Rights.path_rename_target |
	Rights.path_filestat_get | Rights.path_filestat_set_size | Rights.path_filestat_set_times |
	Rights.fd_filestat_get | Rights.fd_filestat_set_times | Rights.path_remove_directory | Rights.path_unlink_file |
	Rights.path_symlink;
const _DirectoryBaseRightsReadonly = _DirectoryBaseRights & Rights.ReadOnly;
function getDirectoryBaseRights(readOnly: boolean = false): rights {
	return readOnly ? _DirectoryBaseRightsReadonly : _DirectoryBaseRights;
}

const _FileBaseRights: rights = Rights.fd_datasync | Rights.fd_read | Rights.fd_seek | Rights.fd_fdstat_set_flags |
	Rights.fd_sync | Rights.fd_tell | Rights.fd_write | Rights.fd_advise | Rights.fd_allocate | Rights.fd_filestat_get |
	Rights.fd_filestat_set_size | Rights.fd_filestat_set_times | Rights.poll_fd_readwrite;
const _FileBaseRightsReadOnly = _FileBaseRights & Rights.ReadOnly;
function getFileBaseRights(readOnly: boolean = false): rights {
	return readOnly ? _FileBaseRightsReadOnly : _FileBaseRights;
}

const _DirectoryInheritingRights: rights = _DirectoryBaseRights | _FileBaseRights;
const _DirectoryInheritingRightsReadonly = _DirectoryInheritingRights & Rights.ReadOnly;
function getDirectoryInheritingRights(readOnly: boolean = false): rights {
	return readOnly ? _DirectoryInheritingRightsReadonly : _DirectoryInheritingRights;
}

// const _FileInheritingRights: rights = 0n;
// const _FileInheritingRightsReadonly = _FileInheritingRights & Rights.ReadOnly;
// Needed when we allow creation of stdio file descriptors
// function getFileInheritingRights(readOnly: boolean = false): rights {
// 	return readOnly ? _FileInheritingRightsReadonly : _FileInheritingRights;
// }

const DirectoryOnlyBaseRights: rights = getDirectoryBaseRights() & ~getFileBaseRights();
const FileOnlyBaseRights: rights = getFileBaseRights() & ~getDirectoryBaseRights();

class GenericFileDescriptor extends BaseFileDescriptor {

	private _cursor: number;
	public readonly handle: fs.FileHandle;

	constructor(deviceId: bigint, fd: fd, filetype: filetype, rights_base: rights, fdflags: fdflags, inode: bigint, handle: fs.FileHandle) {
		super(deviceId, fd, filetype, rights_base, 0n, fdflags, inode);
		this.handle = handle;
		this._cursor = 0;
	}

	public with(change: { fd: fd }): FileDescriptor {
		return new GenericFileDescriptor(this.deviceId, change.fd, this.fileType, this.rights_base, this.fdflags, this.inode, this.handle);
	}

	public dispose(): Promise<void> {
		return this.handle.close();
	}

	public get cursor(): number {
		return this._cursor;
	}

	public set cursor(value: number) {
		if (value < 0) {
			throw new WasiError(Errno.inval);
		}
		this._cursor = value;
	}
}

class DirectoryFileDescriptor extends BaseFileDescriptor {

	public readonly handle: fs.FileHandle;
	private _dir: Dir;

	constructor(deviceId: bigint, fd: fd, rights_base: rights, rights_inheriting: rights, fdflags: fdflags, inode: bigint, handle: fs.FileHandle, dir: Dir) {
		super(deviceId, fd, Filetype.directory, rights_base, rights_inheriting, fdflags, inode);
		this.handle = handle;
		this._dir = dir;
	}

	public get dir(): Dir {
		return this._dir;
	}

	public async dispose(): Promise<void> {
		await this.handle.close();
		await this._dir.close();
	}

	public async reOpenDir(): Promise<void> {
		const path = this._dir.path;
		this._dir = await fs.opendir(path);
	}

	public with(change: { fd: fd }): FileDescriptor {
		return new DirectoryFileDescriptor(this.deviceId, change.fd, this.rights_base, this.rights_inheriting, this.fdflags, this.inode, this.handle, this.dir);
	}

	childDirectoryRights(requested_rights: rights): rights {
		return (this.rights_inheriting & requested_rights) & ~FileOnlyBaseRights;
	}

	childFileRights(requested_rights: rights): rights {
		return (this.rights_inheriting & requested_rights) & ~DirectoryOnlyBaseRights;
	}
}

export function create(deviceId: DeviceId, basePath: string, readOnly: boolean = false): FileSystemDeviceDriver {

	function createGenericDescriptor(fd: fd, filetype: filetype, rights_base: rights, fdflags: fdflags, inode: inode, handle: fs.FileHandle): GenericFileDescriptor {
		return new GenericFileDescriptor(deviceId, fd, filetype, rights_base, fdflags, inode, handle);
	}

	function assertGenericDescriptor(fileDescriptor: FileDescriptor): asserts fileDescriptor is GenericFileDescriptor {
		if (!(fileDescriptor instanceof GenericFileDescriptor)) {
			throw new WasiError(Errno.badf);
		}
	}

	function createDirectoryDescriptor(fd: fd, rights_base: rights, rights_inheriting: rights, fdflags: fdflags, inode: inode, handle: fs.FileHandle, dir: Dir): DirectoryFileDescriptor {
		return new DirectoryFileDescriptor(deviceId, fd, rights_base, rights_inheriting, fdflags, inode, handle, dir);
	}

	function assertDirectoryDescriptor(fileDescriptor: FileDescriptor): asserts fileDescriptor is DirectoryFileDescriptor {
		if (!(fileDescriptor instanceof DirectoryFileDescriptor)) {
			throw new WasiError(Errno.badf);
		}
	}

	function assertHandleDescriptor(fileDescriptor: FileDescriptor): asserts fileDescriptor is BaseFileDescriptor & { handle: fs.FileHandle } {
		if (!(fileDescriptor instanceof GenericFileDescriptor) && !(fileDescriptor instanceof DirectoryFileDescriptor)) {
			throw new WasiError(Errno.badf);
		}
	}

	async function getRootFileDescriptor(fd: fd): Promise<DirectoryFileDescriptor> {
		try {
			const stat = await fs.stat(basePath, { bigint: true });
			if (!stat.isDirectory()) {
				throw new WasiError(Errno.notdir);
			}
			const handle = await fs.open(basePath);
			const dir = await fs.opendir(basePath);
			return new DirectoryFileDescriptor(deviceId, fd, getDirectoryBaseRights(readOnly), getDirectoryInheritingRights(readOnly), 0, stat.ino, handle, dir);
		} catch (error) {
			throw handleError(error);
		}
	}

	async function assertDirectoryExists(fileDescriptor: DirectoryFileDescriptor): Promise<void> {
		try {
			const stat = await fileDescriptor.handle.stat();
			if (!stat.isDirectory()) {
				throw new WasiError(Errno.notdir);
			}
		} catch (error) {
			throw new WasiError(Errno.notdir);
		}
	}

	function getFiletype(item: BigIntStats | Dirent): filetype {
		if (item.isFile()) {
			return Filetype.regular_file;
		} else if (item.isDirectory()) {
			return Filetype.directory;
		} else if (item.isCharacterDevice()) {
			return Filetype.character_device;
		} else if (item.isBlockDevice()) {
			return Filetype.block_device;
		} else if (item.isSymbolicLink()) {
			return Filetype.symbolic_link;
		} else if (item.isSocket()) {
			return Filetype.socket_stream;
		} else {
			return Filetype.unknown;
		}
	}

	function assignStat(result: filestat, inode: inode, stat: BigIntStats): void {
		result.dev = deviceId;
		result.ino = inode;
		result.filetype = getFiletype(stat);
		result.nlink = stat.nlink;
		result.size = stat.size;
		result.atim = stat.atimeNs;
		result.ctim = stat.ctimeNs;
		result.mtim = stat.mtimeNs;
	}

	async function followSymlink(fullpath: string): Promise<string> {
		while (true) {
			const stat = await fs.stat(fullpath);
			if (stat.isSymbolicLink()) {
				fullpath = await fs.readlink(fullpath);
			} else {
				return fullpath;
			}
		}
	}

	const node2Wasi: Map<string, errno> = new Map([
		['ERR_ACCESS_DENIED', Errno.acces],
		['ERR_CHILD_CLOSED_BEFORE_REPLY', Errno.child],
		['ERR_DIR_CLOSED', Errno.io],
		['ERR_DIR_CONCURRENT_OPERATION', Errno.io],
		['ERR_FS_CP_DIR_TO_NON_DIR', Errno.notdir],
		['ERR_FS_CP_EEXIST', Errno.exist],
		['ERR_FS_CP_EINVAL', Errno.inval],
		['ERR_FS_CP_NON_DIR_TO_DIR', Errno.isdir],
		['ERR_FS_CP_SYMLINK_TO_SUBDIRECTORY', Errno.inval],
		['ERR_FS_CP_UNKNOWN', Errno.inval],
		['ERR_FS_EISDIR', Errno.isdir],
		['ERR_FS_FILE_TOO_LARGE', Errno.fbig],
		['ERR_FS_INVALID_SYMLINK_TYPE', Errno.inval]
	]);

	function getNodeErrorCode(error: any): string | undefined {
		if (!(error instanceof Error)) {
			return undefined;
		}
		return typeof (error as unknown as {code: string}).code === 'string' ? (error as unknown as {code: string}).code : undefined;
	}

	function handleError(error: any, def: errno = Errno.badf): Error {
		if (error instanceof WasiError) {
			return error;
		} else if (error instanceof Error) {
			const code =  typeof (error as unknown as {code: string}).code === 'string' ? (error as unknown as {code: string}).code : undefined;
			if (code !== undefined) {
				return new WasiError(node2Wasi.get(code) ?? def);
			}
		}
		return new WasiError(def);
	}

	const $this: FileSystemDeviceDriver = {

		kind: DeviceDriverKind.fileSystem,
		id: deviceId,
		uri: Uri.from( { scheme: 'node-fs', path: '/'} ),
		joinPath(): Uri | undefined {
			return undefined;
		},
		createStdioFileDescriptor(_dirflags: lookupflags | undefined = Lookupflags.none, _path: string, _oflags: oflags | undefined = Oflags.none, _fs_rights_base: rights | undefined, _fdflags: fdflags | undefined = Fdflags.none, _fd: 0 | 1 | 2): Promise<FileDescriptor> {
			// The file system shouldn't be used to give WASM processes access to the workspace files, even not on the desktop.
			// It main purpose is to read file from the extensions installation directory. So we don't support stdio operations.
			throw new WasiError(Errno.inval);
		},
		fd_create_prestat_fd(fd: fd): Promise<FileDescriptor> {
			return Promise.resolve(getRootFileDescriptor(fd));
		},
		fd_advise(fileDescriptor: FileDescriptor, _offset: bigint, _length: bigint, _advise: number): Promise<void> {
			assertGenericDescriptor(fileDescriptor);
			// We don't have advisory in NodeFS. So treat it as successful.
			return Promise.resolve();
		},
		async fd_allocate(fileDescriptor: FileDescriptor, offset: bigint, len: bigint): Promise<void> {
			assertGenericDescriptor(fileDescriptor);
			try {
				const buffer = await fileDescriptor.handle.readFile();
				const newBuffer = Buffer.alloc(buffer.byteLength + BigInts.asNumber(len));
				buffer.copy(newBuffer, 0, 0, BigInts.asNumber(offset));
				buffer.copy(newBuffer, BigInts.asNumber(offset + len), BigInts.asNumber(offset));
				await fileDescriptor.handle.write(newBuffer);
			} catch (error) {
				throw handleError(error);
			}
		},
		async fd_close(fileDescriptor: FileDescriptor): Promise<void> {
			try {
				assertHandleDescriptor(fileDescriptor);
				if (fileDescriptor.dispose !== undefined) {
					try {
						await fileDescriptor.dispose();
					} catch (error) {
						const code = getNodeErrorCode(error);
						if (code === undefined || code !== 'ERR_DIR_CLOSED') {
							throw error;
						}
					}
				}
			} catch (error) {
				throw handleError(error);
			}
		},
		async fd_datasync(fileDescriptor: FileDescriptor): Promise<void> {
			try {
				assertGenericDescriptor(fileDescriptor);
				await fileDescriptor.handle.datasync();
			} catch (error) {
				throw handleError(error);
			}
		},
		fd_fdstat_get(fileDescriptor: FileDescriptor, result: fdstat): Promise<void> {
			result.fs_filetype = fileDescriptor.fileType;
			result.fs_flags = fileDescriptor.fdflags;
			result.fs_rights_base = fileDescriptor.rights_base;
			result.fs_rights_inheriting = fileDescriptor.rights_inheriting;
			return Promise.resolve();
		},
		fd_fdstat_set_flags(fileDescriptor: FileDescriptor, fdflags: number): Promise<void> {
			fileDescriptor.fdflags = fdflags;
			return Promise.resolve();
		},
		async fd_filestat_get(fileDescriptor: FileDescriptor, result: filestat): Promise<void> {
			try {
				assertHandleDescriptor(fileDescriptor);
				assignStat(result, fileDescriptor.inode, await fileDescriptor.handle.stat({ bigint: true }));
			} catch (error) {
				throw handleError(error);
			}
		},
		async fd_filestat_set_size(fileDescriptor: FileDescriptor, size: bigint): Promise<void> {
			try {
				assertGenericDescriptor(fileDescriptor);
				await fileDescriptor.handle.truncate(BigInts.asNumber(size));
			} catch (error) {
				throw handleError(error);
			}
		},
		fd_filestat_set_times(_fileDescriptor: FileDescriptor, _atim: bigint, _mtim: bigint, _fst_flags: fstflags): Promise<void> {
			// For new we do nothing. We could cache the timestamp in memory
			// But we would loose them during reload. We could also store them
			// in local storage
			throw new WasiError(Errno.nosys);
		},
		async fd_pread(fileDescriptor: FileDescriptor, offset: filesize, buffers: Uint8Array[]): Promise<size> {
			if (buffers.length === 0) {
				return 0;
			}
			try {
				assertGenericDescriptor(fileDescriptor);
				const handle = fileDescriptor.handle;
				let pos = BigInts.asNumber(offset);
				return (await handle.readv(buffers, pos)).bytesRead;
			} catch (error) {
				throw handleError(error);
			}
		},
		async fd_pwrite(fileDescriptor: FileDescriptor, offset: filesize, buffers: Uint8Array[]): Promise<number> {
			if (buffers.length === 0) {
				return 0;
			}
			try {
				assertGenericDescriptor(fileDescriptor);
				const handle = fileDescriptor.handle;
				let pos = BigInts.asNumber(offset);
				return (await handle.writev(buffers, pos)).bytesWritten;
			} catch (error) {
				throw handleError(error);
			}
		},
		async fd_read(fileDescriptor: FileDescriptor, buffers: Uint8Array[]): Promise<number> {
			if (buffers.length === 0) {
				return 0;
			}
			try {
				assertGenericDescriptor(fileDescriptor);
				const handle = fileDescriptor.handle;
				const bytesRead =  (await handle.readv(buffers, fileDescriptor.cursor)).bytesRead;
				fileDescriptor.cursor = fileDescriptor.cursor + bytesRead;
				return bytesRead;
			} catch (error) {
				throw handleError(error);
			}
		},
		async fd_readdir(fileDescriptor: FileDescriptor): Promise<ReaddirEntry[]> {
			try {
				assertDirectoryDescriptor(fileDescriptor);

				const path = fileDescriptor.dir.path;
				const result: ReaddirEntry[] = [];
				for await (const entry of fileDescriptor.dir) {
					const stat = await fs.stat(paths.join(path, entry.name), { bigint: true });
					result.push({ d_ino: stat.ino, d_type: getFiletype(entry), d_name: entry.name});
				}
				await fileDescriptor.reOpenDir();
				return result;
			} catch (error) {
				throw handleError(error);
			}
		},
		async fd_seek(fileDescriptor: FileDescriptor, _offset: bigint, whence: number): Promise<bigint> {
			assertGenericDescriptor(fileDescriptor);

			const offset = BigInts.asNumber(_offset);
			switch(whence) {
				case Whence.set:
					fileDescriptor.cursor = offset;
					break;
				case Whence.cur:
					fileDescriptor.cursor = fileDescriptor.cursor + offset;
					break;
				case Whence.end:
					const size = (await fileDescriptor.handle.stat()).size;
					fileDescriptor.cursor = Math.max(0, size - offset);
					break;
			}
			return BigInt(fileDescriptor.cursor);
		},
		fd_renumber(fileDescriptor: FileDescriptor, _to: fd): Promise<void> {
			assertGenericDescriptor(fileDescriptor);
			return Promise.resolve();
		},
		async fd_sync(fileDescriptor: FileDescriptor): Promise<void> {
			try {
				assertGenericDescriptor(fileDescriptor);
				await fileDescriptor.handle.sync();
			} catch (error) {
				throw handleError(error);
			}
		},
		fd_tell(fileDescriptor: FileDescriptor): Promise<u64> {
			assertGenericDescriptor(fileDescriptor);
			return Promise.resolve(BigInt(fileDescriptor.cursor));
		},
		async fd_write(fileDescriptor: FileDescriptor, buffers: Uint8Array[]): Promise<number> {
			if (buffers.length === 0) {
				return 0;
			}
			try {
				assertGenericDescriptor(fileDescriptor);
				const handle = fileDescriptor.handle;
				const bytesWritten = (await handle.writev(buffers, fileDescriptor.cursor)).bytesWritten;
				fileDescriptor.cursor = fileDescriptor.cursor + bytesWritten;
				return bytesWritten;
			} catch (error) {
				throw handleError(error);
			}
		},
		async path_create_directory(fileDescriptor: FileDescriptor, path: string): Promise<void> {
			try {
				assertDirectoryDescriptor(fileDescriptor);
				await assertDirectoryExists(fileDescriptor);
				const fullpath = paths.join(fileDescriptor.dir.path, path);
				await fs.mkdir(fullpath, { recursive: true });
			} catch (error) {
				throw handleError(error);
			}
		},
		async path_filestat_get(fileDescriptor: FileDescriptor, flags: lookupflags, path: string, result: filestat): Promise<void> {
			try {
				assertDirectoryDescriptor(fileDescriptor);
				await assertDirectoryExists(fileDescriptor);
				const fullpath = Lookupflags.symlink_followOn(flags) ? await followSymlink(paths.join(fileDescriptor.dir.path, path)) : paths.join(fileDescriptor.dir.path, path);
				const stat = await fs.stat(fullpath, { bigint: true });
				assignStat(result, stat.ino, stat);
			} catch (error) {
				throw handleError(error);
			}
		},
		async path_filestat_set_times(fileDescriptor: FileDescriptor, flags: lookupflags, path: string, atim: timestamp, mtim: timestamp, fst_flags: fstflags): Promise<void> {
			try {
				assertDirectoryDescriptor(fileDescriptor);
				await assertDirectoryExists(fileDescriptor);
				let fullpath = Lookupflags.symlink_followOn(flags) ? await followSymlink(paths.join(fileDescriptor.dir.path, path)) : paths.join(fileDescriptor.dir.path, path);
				const now = RAL().clock.realtime();
				if (Fstflags.atim_nowOn(fst_flags)) {
					atim = now;
				}
				if (Fstflags.mtim_nowOn(fst_flags)) {
					mtim = now;
				}
				await fs.utimes(fullpath, BigInts.asNumber(atim), BigInts.asNumber(mtim));
			} catch (error) {
				throw handleError(error);
			}
		},
		async path_link(oldFileDescriptor: FileDescriptor, old_flags: lookupflags, old_path: string, newFileDescriptor: FileDescriptor, new_path: string): Promise<void> {
			try {
				assertDirectoryDescriptor(oldFileDescriptor);
				await assertDirectoryExists(oldFileDescriptor);
				const oldFullpath = Lookupflags.symlink_followOn(old_flags) ? await followSymlink(paths.join(oldFileDescriptor.dir.path, old_path)) : paths.join(oldFileDescriptor.dir.path, old_path);

				assertDirectoryDescriptor(newFileDescriptor);
				await assertDirectoryExists(newFileDescriptor);
				const newFullpath = paths.join(newFileDescriptor.dir.path, new_path);

				await fs.link(oldFullpath, newFullpath);
			} catch (error) {
				throw handleError(error);
			}
		},
		async path_open(fileDescriptor: FileDescriptor, dirflags: lookupflags, path: string, oflags: oflags, fs_rights_base: rights, fs_rights_inheriting: rights, fdflags: fdflags, fdProvider: FdProvider): Promise<FileDescriptor> {
			assertDirectoryDescriptor(fileDescriptor);
			await assertDirectoryExists(fileDescriptor);
			const fullpath = Lookupflags.symlink_followOn(dirflags) ? await followSymlink(paths.join(fileDescriptor.dir.path, path)) : paths.join(fileDescriptor.dir.path, path);

			let nodeFlags: number = 0;
			let needs_rights_base: bigint = 0n;
			let needs_rights_inheriting: bigint = 0n;

			const read = (fs_rights_base & (Rights.fd_read | Rights.fd_readdir)) !== 0n;
			const write= (fs_rights_base & (Rights.fd_write | Rights.fd_datasync | Rights.fd_allocate | Rights.fd_filestat_set_size)) !== 0n;

			if (write && read) {
				nodeFlags |= fs.constants.O_RDWR;
			} else if (read) {
				nodeFlags |= fs.constants.O_RDONLY;
			} else if (write) {
				nodeFlags |= fs.constants.O_WRONLY;
			}

			if (Oflags.creatOn(oflags)) {
				nodeFlags |= fs.constants.O_CREAT;
				needs_rights_base |= Rights.path_create_file;
			}
			if (Oflags.directoryOn(oflags)) {
				nodeFlags |= fs.constants.O_DIRECTORY;
			}
			if (Oflags.exclOn(oflags)) {
				nodeFlags |= fs.constants.O_EXCL;
			}
			if (Oflags.truncOn(oflags)) {
				nodeFlags |= fs.constants.O_TRUNC;
				needs_rights_base |= Rights.path_filestat_set_size;
			}

			if (Fdflags.appendOn(fdflags)) {
				nodeFlags |= fs.constants.O_APPEND;
			}
			if (Fdflags.dsyncOn(fdflags)) {
				nodeFlags |= fs.constants.O_DSYNC;
				needs_rights_inheriting |= Rights.fd_datasync;
			}
			if (Fdflags.nonblockOn(fdflags)) {
				nodeFlags = fs.constants.O_NONBLOCK;
			}
			if (Fdflags.rsyncOn(fdflags)) {
				nodeFlags |= fs.constants.O_SYNC;
				needs_rights_inheriting |= Rights.fd_sync;
			}
			if (Fdflags.syncOn(fdflags)) {
				nodeFlags |= fs.constants.O_SYNC;
				needs_rights_inheriting = Rights.fd_sync;
			}

			if (write && (nodeFlags & (fs.constants.O_APPEND | fs.constants.O_TRUNC)) === 0) {
				needs_rights_inheriting |= Rights.fd_seek;
			}

			fileDescriptor.assertBaseRights(needs_rights_base);
			fileDescriptor.assertInheritingRights(needs_rights_inheriting);

			try {
				const handle = await fs.open(fullpath, nodeFlags);
				const stat = await handle.stat({ bigint: true });
				const filetype: filetype = getFiletype(stat);
				const result = filetype === Filetype.directory
					? createDirectoryDescriptor(fdProvider.next(), fileDescriptor.childDirectoryRights(fs_rights_base), fs_rights_inheriting | getDirectoryInheritingRights(readOnly), fdflags, stat.ino, handle, await fs.opendir(fullpath))
					: createGenericDescriptor(fdProvider.next(), filetype, fileDescriptor.childFileRights(fs_rights_base), fdflags, stat.ino, handle);
				return result;
			} catch (error) {
				throw handleError(error);
			}
		},
		async path_readlink(fileDescriptor: FileDescriptor, path: string): Promise<string> {
			try {
				assertDirectoryDescriptor(fileDescriptor);
				await assertDirectoryExists(fileDescriptor);
				const fullpath = paths.join(fileDescriptor.dir.path, path);
				const stat = await fs.stat(fullpath);
				const result = stat.isSymbolicLink() ? await fs.readlink(fullpath) : fullpath;
				return result;
			} catch (error) {
				throw handleError(error);
			}
		},
		async path_remove_directory(fileDescriptor: FileDescriptor, path: string): Promise<void> {
			try {
				assertDirectoryDescriptor(fileDescriptor);
				await assertDirectoryExists(fileDescriptor);
				const fullpath = paths.join(fileDescriptor.dir.path, path);
				await fs.rmdir(fullpath);
			} catch (error) {
				throw handleError(error, Errno.notempty);
			}
		},
		async path_rename(oldFileDescriptor: FileDescriptor, oldPath: string, newFileDescriptor: FileDescriptor, newPath: string): Promise<void> {
			try {
				assertDirectoryDescriptor(oldFileDescriptor);
				await assertDirectoryExists(oldFileDescriptor);
				const oldFullpath = paths.join(oldFileDescriptor.dir.path, oldPath);

				assertDirectoryDescriptor(newFileDescriptor);
				await assertDirectoryExists(newFileDescriptor);
				const newFullpath = paths.join(newFileDescriptor.dir.path, newPath);

				await fs.rename(oldFullpath, newFullpath);
			} catch (error) {
				throw handleError(error);
			}
		},
		async path_symlink(oldPath: string, fileDescriptor: FileDescriptor, newPath: string): Promise<void> {
			try {
				assertDirectoryDescriptor(fileDescriptor);
				await assertDirectoryExists(fileDescriptor);
				const oldFullpath = paths.join(fileDescriptor.dir.path, oldPath);
				const newFullpath = paths.join(fileDescriptor.dir.path, newPath);

				await fs.symlink(oldFullpath, newFullpath);
			} catch (error) {
				throw handleError(error);
			}
		},
		async path_unlink_file(fileDescriptor: FileDescriptor, path: string): Promise<void> {
			try {
				assertDirectoryDescriptor(fileDescriptor);
				await assertDirectoryExists(fileDescriptor);
				const fullpath = paths.join(fileDescriptor.dir.path, path);
				await fs.unlink(fullpath);
			} catch (error) {
				throw handleError(error);
			}
		},
		async fd_bytesAvailable(fileDescriptor: FileDescriptor): Promise<filesize> {
			try {
				assertGenericDescriptor(fileDescriptor);
				const stat = await fileDescriptor.handle.stat();
				return BigInt(Math.max(0, stat.size - fileDescriptor.cursor));
			} catch (error) {
				throw handleError(error);
			}
		}
	};

	return Object.assign({}, NoSysDeviceDriver, $this, readOnly ? WritePermDeniedDeviceDriver : {});
}
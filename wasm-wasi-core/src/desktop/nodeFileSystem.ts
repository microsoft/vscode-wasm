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
	lookupflags, timestamp, fstflags, oflags, Oflags, filesize, Fdflags, inode, Lookupflags, Fstflags
} from '../common/wasi';
import { BigInts, code2Wasi } from '../common/converter';
import { BaseFileDescriptor, FdProvider, FileDescriptor } from '../common/fileDescriptor';
import { NoSysDeviceDriver, ReaddirEntry, FileSystemDeviceDriver, DeviceId } from '../common/deviceDriver';
import { Dirent } from 'node:fs';

export const DirectoryBaseRights: rights = Rights.fd_fdstat_set_flags | Rights.path_create_directory |
		Rights.path_create_file | Rights.path_link_source | Rights.path_link_target | Rights.path_open |
		Rights.fd_readdir | Rights.path_readlink | Rights.path_rename_source | Rights.path_rename_target |
		Rights.path_filestat_get | Rights.path_filestat_set_size | Rights.path_filestat_set_times |
		Rights.fd_filestat_get | Rights.fd_filestat_set_times | Rights.path_remove_directory | Rights.path_unlink_file |
		Rights.path_symlink;

export const FileBaseRights: rights = Rights.fd_datasync | Rights.fd_read | Rights.fd_seek | Rights.fd_fdstat_set_flags |
		Rights.fd_sync | Rights.fd_tell | Rights.fd_write | Rights.fd_advise | Rights.fd_allocate | Rights.fd_filestat_get |
		Rights.fd_filestat_set_size | Rights.fd_filestat_set_times | Rights.poll_fd_readwrite;

export const DirectoryInheritingRights: rights = DirectoryBaseRights | FileBaseRights;

export const FileInheritingRights: rights = 0n;

const DirectoryOnlyBaseRights: rights = DirectoryBaseRights & ~FileBaseRights;
const FileOnlyBaseRights: rights = FileBaseRights & ~DirectoryBaseRights;
const StdInFileRights: rights = Rights.fd_read | Rights.fd_seek | Rights.fd_tell | Rights.fd_advise | Rights.fd_filestat_get | Rights.poll_fd_readwrite;
const StdoutFileRights: rights = FileBaseRights & ~Rights.fd_read;


class FileFileDescriptor extends BaseFileDescriptor {

	private _cursor: number;
	public readonly handle: fs.FileHandle;

	constructor(deviceId: bigint, fd: fd, rights_base: rights, fdflags: fdflags, inode: bigint, handle: fs.FileHandle) {
		super(deviceId, fd, Filetype.regular_file, rights_base, 0n, fdflags, inode);
		this.handle = handle;
		this._cursor = 0;
	}

	public with(change: { fd: fd }): FileDescriptor {
		return new FileFileDescriptor(this.deviceId, change.fd, this.rights_base, this.fdflags, this.inode, this.handle);
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
	public readonly dir: Dir;

	constructor(deviceId: bigint, fd: fd, rights_base: rights, rights_inheriting: rights, fdflags: fdflags, inode: bigint, handle: fs.FileHandle, dir: Dir) {
		super(deviceId, fd, Filetype.directory, rights_base, rights_inheriting, fdflags, inode);
		this.handle = handle;
		this.dir = dir;
	}

	public with(change: { fd: fd }): FileDescriptor {
		return new FileFileDescriptor(this.deviceId, change.fd, this.rights_base, this.fdflags, this.inode, this.handle);
	}
}

export function create(deviceId: DeviceId, basePath: string): FileSystemDeviceDriver {

	function assertFileDescriptor(fileDescriptor: FileDescriptor): asserts fileDescriptor is FileFileDescriptor {
		if (!(fileDescriptor instanceof FileFileDescriptor)) {
			throw new WasiError(Errno.badf);
		}
	}

	function assertDirectoryDescriptor(fileDescriptor: FileDescriptor): asserts fileDescriptor is DirectoryFileDescriptor {
		if (!(fileDescriptor instanceof FileFileDescriptor)) {
			throw new WasiError(Errno.badf);
		}
	}

	function assertHandleDescriptor(fileDescriptor: FileDescriptor): asserts fileDescriptor is BaseFileDescriptor & { handle: fs.FileHandle } {
		if (!(fileDescriptor instanceof FileFileDescriptor) && !(fileDescriptor instanceof DirectoryFileDescriptor)) {
			throw new WasiError(Errno.badf);
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

	const $this: FileSystemDeviceDriver = {

		uri: baseUri,
		id: deviceId,

		getRootFileDescriptor(): FileDescriptor {
			if ($rootFileDescriptor === undefined) {
				throw new WasiError(Errno.inval);
			}
			return $rootFileDescriptor;
		},
		isRootFileDescriptor(fileDescriptor: FileDescriptor): boolean {
			if ($rootFileDescriptor === undefined) {
				throw new WasiError(Errno.inval);
			}
			return $rootFileDescriptor.deviceId === fileDescriptor.deviceId && $rootFileDescriptor.inode === fileDescriptor.inode;
		},
		createStdioFileDescriptor(dirflags: lookupflags | undefined = Lookupflags.none, path: string, _oflags: oflags | undefined = Oflags.none, _fs_rights_base: rights | undefined, fdflags: fdflags | undefined = Fdflags.none, fd: 0 | 1 | 2): Promise<FileDescriptor> {
			if (path.length === 0) {
				throw new WasiError(Errno.inval);
			}
			const fs_rights_base: rights = _fs_rights_base ?? fd === 0
				? StdInFileRights
				: StdoutFileRights;
			const oflags: oflags = _oflags ?? fd === 0
				? Oflags.none
				: Oflags.creat | Oflags.trunc;

			// Fake a parent descriptor
			const parentDescriptor = createRootFileDescriptor(999999);
			return $this.path_open(parentDescriptor, dirflags, path, oflags, fs_rights_base, FileInheritingRights, fdflags, { next: () => fd });
		},
		fd_create_prestat_fd(fd: fd): Promise<FileDescriptor> {
			return Promise.resolve(getRootFileDescriptor(fd));
		},
		fd_advise(fileDescriptor: FileDescriptor, _offset: bigint, _length: bigint, _advise: number): Promise<void> {
			assertFileDescriptor(fileDescriptor);
			// We don't have advisory in NodeFS. So treat it as successful.
			return Promise.resolve();
		},
		async fd_allocate(fileDescriptor: FileDescriptor, _offset: bigint, _len: bigint): Promise<void> {
			assertFileDescriptor(fileDescriptor);
			fileDescriptor.handle.allocate();

		},
		async fd_close(fileDescriptor: FileDescriptor): Promise<void> {
			assertHandleDescriptor(fileDescriptor);
			await fileDescriptor.handle.close();
			if (fileDescriptor instanceof DirectoryFileDescriptor) {
				await fileDescriptor.dir.close();
			}
		},
		fd_datasync(fileDescriptor: FileDescriptor): Promise<void> {
			assertFileDescriptor(fileDescriptor);
			return fileDescriptor.handle.datasync();
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
			assertHandleDescriptor(fileDescriptor);
			assignStat(result, fileDescriptor.inode, await fileDescriptor.handle.stat({ bigint: true }));
		},
		async fd_filestat_set_size(fileDescriptor: FileDescriptor, size: bigint): Promise<void> {
			assertFileDescriptor(fileDescriptor);
			await fileDescriptor.handle.truncate(BigInts.asNumber(size));
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
			assertFileDescriptor(fileDescriptor);
			const handle = fileDescriptor.handle;
			let pos = BigInts.asNumber(offset);
			return (await handle.readv(buffers, pos)).bytesRead;
		},
		async fd_pwrite(fileDescriptor: FileDescriptor, offset: filesize, buffers: Uint8Array[]): Promise<number> {
			if (buffers.length === 0) {
				return 0;
			}
			assertFileDescriptor(fileDescriptor);
			const handle = fileDescriptor.handle;
			let pos = BigInts.asNumber(offset);
			return (await handle.writev(buffers, pos)).bytesWritten;
		},
		async fd_read(fileDescriptor: FileDescriptor, buffers: Uint8Array[]): Promise<number> {
			if (buffers.length === 0) {
				return 0;
			}
			assertFileDescriptor(fileDescriptor);
			const handle = fileDescriptor.handle;
			const bytesRead =  (await handle.readv(buffers, fileDescriptor.cursor)).bytesRead;
			fileDescriptor.cursor = fileDescriptor.cursor + bytesRead;
			return bytesRead;
		},
		async fd_readdir(fileDescriptor: FileDescriptor): Promise<ReaddirEntry[]> {
			assertDirectoryDescriptor(fileDescriptor);

			const result: ReaddirEntry[] = [];
			for await (const entry of fileDescriptor.dir) {
				const stat = await fs.stat(paths.join(fileDescriptor.dir.path, entry.name), { bigint: true });
				result.push({ d_ino: stat.ino, d_type: getFiletype(entry), d_name: entry.name});
			}
			return result;
		},
		async fd_seek(fileDescriptor: FileDescriptor, _offset: bigint, whence: number): Promise<bigint> {
			assertFileDescriptor(fileDescriptor);

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
			assertFileDescriptor(fileDescriptor);
			return Promise.resolve();
		},
		async fd_sync(fileDescriptor: FileDescriptor): Promise<void> {
			assertFileDescriptor(fileDescriptor);
			return fileDescriptor.handle.sync();
		},
		fd_tell(fileDescriptor: FileDescriptor): Promise<u64> {
			assertFileDescriptor(fileDescriptor);
			return Promise.resolve(BigInt(fileDescriptor.cursor));
		},
		async fd_write(fileDescriptor: FileDescriptor, buffers: Uint8Array[]): Promise<number> {
			if (buffers.length === 0) {
				return 0;
			}
			assertFileDescriptor(fileDescriptor);
			const handle = fileDescriptor.handle;
			const bytesWritten = (await handle.writev(buffers, fileDescriptor.cursor)).bytesWritten;
			fileDescriptor.cursor = fileDescriptor.cursor + bytesWritten;
			return bytesWritten;

		},
		async path_create_directory(fileDescriptor: FileDescriptor, path: string): Promise<void> {
			assertDirectoryDescriptor(fileDescriptor);
			await assertDirectoryExists(fileDescriptor);
			const fullpath = paths.join(fileDescriptor.dir.path, path);
			await fs.mkdir(fullpath, { recursive: true });
		},
		async path_filestat_get(fileDescriptor: FileDescriptor, flags: lookupflags, path: string, result: filestat): Promise<void> {
			assertDirectoryDescriptor(fileDescriptor);
			await assertDirectoryExists(fileDescriptor);
			const fullpath = Lookupflags.symlink_followOn(flags) ? await followSymlink(paths.join(fileDescriptor.dir.path, path)) : paths.join(fileDescriptor.dir.path, path);
			const stat = await fs.stat(fullpath, { bigint: true });
			assignStat(result, stat.ino, stat);
		},
		async path_filestat_set_times(fileDescriptor: FileDescriptor, flags: lookupflags, path: string, atim: timestamp, mtim: timestamp, fst_flags: fstflags): Promise<void> {
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
		},
		async path_link(oldFileDescriptor: FileDescriptor, old_flags: lookupflags, old_path: string, newFileDescriptor: FileDescriptor, new_path: string): Promise<void> {
			assertDirectoryDescriptor(oldFileDescriptor);
			await assertDirectoryExists(oldFileDescriptor);
			const oldFullpath = Lookupflags.symlink_followOn(old_flags) ? await followSymlink(paths.join(oldFileDescriptor.dir.path, old_path)) : paths.join(oldFileDescriptor.dir.path, old_path);

			assertDirectoryDescriptor(newFileDescriptor);
			await assertDirectoryExists(newFileDescriptor);
			const newFullpath = paths.join(newFileDescriptor.dir.path, new_path);

			return fs.link(oldFullpath, newFullpath);
		},
		async path_open(parentDescriptor: FileDescriptor, _dirflags: lookupflags, path: string, oflags: oflags, fs_rights_base: rights, fs_rights_inheriting: rights, fdflags: fdflags, fdProvider: FdProvider): Promise<FileDescriptor> {
			assertDirectoryDescriptor(parentDescriptor);
			// We ignore lookup flags that request to follow symlinks. The POSIX FS
			// implementation we have right now doesn't support symlinks and VS Code
			// has no API to follow / resolve a symlink.

			let filetype: filetype | undefined = await doGetFiletype(parentDescriptor, path);
			const entryExists: boolean = filetype !== undefined;
			if (entryExists) {
				if (Oflags.exclOn(oflags)) {
					throw new WasiError(Errno.exist);
				} else if (Oflags.directoryOn(oflags) && filetype !== Filetype.directory) {
					throw new WasiError(Errno.notdir);
				}
			} else {
				// Entry does not exist;
				if (Oflags.creatOff(oflags)) {
					throw new WasiError(Errno.noent);
				}
			}
			let createFile: boolean = false;
			if (Oflags.creatOn(oflags) && !entryExists) {
				// Ensure parent handle is directory
				parentDescriptor.assertIsDirectory();
				const dirname = RAL().path.dirname(path);
				// The name has a directory part. Ensure that the directory exists
				if (dirname !== '.') {
					const dirFiletype = await doGetFiletype(parentDescriptor, dirname);
					if (dirFiletype === undefined || dirFiletype !== Filetype.directory) {
						throw new WasiError(Errno.noent);
					}
				}
				filetype = Filetype.regular_file;
				createFile = true;
			} else {
				if (filetype === undefined) {
					throw new WasiError(Errno.noent);
				}
			}

			// VS Code file system has only files and directories
			if (filetype !== Filetype.regular_file && filetype !== Filetype.directory) {
				throw new WasiError(Errno.badf);
			}

			// Currently VS Code doesn't offer a generic API to open a file
			// or a directory. Since we were able to stat the file we create
			// a file descriptor for it and lazy get the file content on read.
			const result = filetype === Filetype.regular_file
				? createFileDescriptor(parentDescriptor, fdProvider.next(), parentDescriptor.childFileRights(fs_rights_base), fdflags, path)
				: createDirectoryDescriptor(parentDescriptor, fdProvider.next(), parentDescriptor.childDirectoryRights(fs_rights_base), fs_rights_inheriting | DirectoryInheritingRights, fdflags, path);

			if (result instanceof FileFileDescriptor && (createFile || Oflags.truncOn(oflags))) {
				await createOrTruncate(result);
			}
			return result;
		},
		async path_readlink(fileDescriptor: FileDescriptor, path: string): Promise<string> {
			assertDirectoryDescriptor(fileDescriptor);
			await assertDirectoryExists(fileDescriptor);
			const fullpath = paths.join(fileDescriptor.dir.path, path);
			const stat = await fs.stat(fullpath);
			return stat.isSymbolicLink() ? fs.readlink(fullpath) : fullpath;
		},
		async path_remove_directory(fileDescriptor: FileDescriptor, path: string): Promise<void> {
			assertDirectoryDescriptor(fileDescriptor);
			await assertDirectoryExists(fileDescriptor);
			const fullpath = paths.join(fileDescriptor.dir.path, path);

			try {
				await fs.rmdir(fullpath);
			} catch (error) {
				throw new WasiError(Errno.notempty);
			}
		},
		async path_rename(oldFileDescriptor: FileDescriptor, oldPath: string, newFileDescriptor: FileDescriptor, newPath: string): Promise<void> {
			assertDirectoryDescriptor(oldFileDescriptor);
			assertDirectoryDescriptor(newFileDescriptor);

			const newParentNode = fs.getNode(newFileDescriptor.inode, NodeKind.Directory);
			if (fs.existsNode(newParentNode, newPath)) {
				throw new WasiError(Errno.exist);
			}
			const oldParentNode = fs.getNode(oldFileDescriptor.inode, NodeKind.Directory);
			const oldNode = fs.getNodeByPath(oldParentNode, oldPath);
			let filestat: FileStat | undefined;
			let content: Uint8Array | undefined;
			if (oldNode !== undefined && oldNode.refs > 0) {
				try {
					const uri = fs.getUri(oldNode);
					filestat = await vscode_fs.stat(uri);
					if (oldNode.kind === NodeKind.File) {
						content = await vscode_fs.readFile(uri);
					}
				} catch {
					filestat = { type: FileType.File, ctime: Date.now(), mtime: Date.now(), size: 0 };
					content = new Uint8Array(0);
				}
			}

			const oldUri = fs.getUri(oldParentNode, oldPath);
			const newUri = fs.getUri(newParentNode, newPath);

			await vscode_fs.rename(oldUri, newUri, { overwrite: false });

			if (oldNode !== undefined) {
				fs.renameNode(oldNode, filestat, content, newParentNode, newPath);
			}
		},
		path_symlink(oldPath: string, fileDescriptor: FileDescriptor, newPath: string): Promise<void> {
		},
		async path_unlink_file(fileDescriptor: FileDescriptor, path: string): Promise<void> {
			assertDirectoryDescriptor(fileDescriptor);
			const inode = fs.getNode(fileDescriptor.inode, NodeKind.Directory);
			const targetNode = fs.getNodeByPath(inode, path, NodeKind.File);
			let filestat: FileStat | undefined;
			let content: Uint8Array | undefined;
			if (targetNode !== undefined && targetNode.refs > 0) {
				try {
					const uri = fs.getUri(targetNode);
					filestat = await vscode_fs.stat(uri);
					content = await vscode_fs.readFile(uri);
				} catch {
					filestat = { type: FileType.File, ctime: Date.now(), mtime: Date.now(), size: 0 };
					content = new Uint8Array(0);
				}
			}
			await vscode_fs.delete(fs.getUri(inode, path), { recursive: false, useTrash: true });
			if (targetNode !== undefined) {
				if (filestat !== undefined && content !== undefined) {
					fs.deleteNode(targetNode, filestat, content);
				} else {
					fs.deleteNode(targetNode);
				}
			}
		},
		async fd_bytesAvailable(fileDescriptor: FileDescriptor): Promise<filesize> {
			assertFileDescriptor(fileDescriptor);
			const stat = await fileDescriptor.handle.stat();
			return BigInt(Math.max(0, stat.size - fileDescriptor.cursor));
		}
	};

	return Object.assign({}, NoSysDeviceDriver, $this);
}
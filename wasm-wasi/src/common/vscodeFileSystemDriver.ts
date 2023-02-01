/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { URI } from 'vscode-uri';

import { ApiShape, size } from '@vscode/sync-api-client';

import { BigInts, code2Wasi } from './converter';
import { BaseFileDescriptor, FileDescriptor, NoSysDeviceDriver, DeviceIds, ReaddirEntry, FileSystemDeviceDriver } from './deviceDriver';
import { fdstat, filestat, Rights, fd, rights, fdflags, Filetype, WasiError, Errno, filetype, Whence, lookupflags, timestamp, fstflags, oflags, Oflags, filesize, Fdflags } from './wasiTypes';

import RAL from './ral';
import { u64 } from './baseTypes';
const paths = RAL().path;

export const DirectoryBaseRights: rights = Rights.fd_fdstat_set_flags | Rights.path_create_directory |
		Rights.path_create_file | Rights.path_open | Rights.fd_readdir | Rights.path_rename_source |
		Rights.path_rename_target | Rights.path_filestat_get | Rights.path_filestat_set_size | /** path_filestat_set_times | */
		Rights.fd_filestat_get | Rights.fd_filestat_set_times | Rights.path_remove_directory |
		Rights.path_unlink_file;

export const FileBaseRights: rights = Rights.fd_datasync | Rights.fd_read | Rights.fd_seek | Rights.fd_fdstat_set_flags |
		Rights.fd_sync | Rights.fd_tell | Rights.fd_write | Rights.fd_advise | Rights.fd_allocate | Rights.fd_filestat_get |
		Rights.fd_filestat_set_size | Rights.fd_filestat_set_times | Rights.poll_fd_readwrite;

export const DirectoryInheritingRights: rights = DirectoryBaseRights | FileBaseRights;

export const FileInheritingRights: rights = 0n;

const DirectoryOnlyBaseRights: rights = DirectoryBaseRights & ~FileBaseRights;
const FileOnlyBaseRights: rights = FileBaseRights & ~DirectoryBaseRights;


class FileFileDescriptor extends BaseFileDescriptor {

	/**
	 * The cursor into the file's content;
	 */
	private _cursor: number;

	/**
	 * The path used when opening the file descriptor.
	 */
	public readonly path: string;

	constructor(deviceId: bigint, fd: fd, rights_base: rights, fdflags: fdflags, inode: bigint, path: string) {
		super(deviceId, fd, Filetype.regular_file, rights_base, 0n, fdflags, inode);
		this._cursor = 0;
		this.path = path;
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

	/**
	 * The path used when opening the file descriptor.
	 */
	public readonly path: string;

	constructor(deviceId: bigint, fd: fd, rights_base: rights, rights_inheriting: rights, fdflags: fdflags, inode: bigint, path: string) {
		super(deviceId, fd, Filetype.directory, rights_base, rights_inheriting, fdflags, inode);
		this.path = path;
	}

	childDirectoryRights(requested_rights: rights): rights {
		return (this.rights_inheriting & requested_rights) & ~FileOnlyBaseRights;
	}

	childFileRights(requested_rights: rights): rights {
		return (this.rights_inheriting & requested_rights) & ~DirectoryOnlyBaseRights;
	}
}

interface INode {

	/**
	 * The inode Id.
	 */
	id: bigint;

	/**
	 * How often the INode is referenced via a file descriptor
	 */
	refs: number;

	/**
	 * The corresponding VS Code URI
	 */
	uri: URI;

	/**
	 * The loaded file content if available.
	 */
	content?: Uint8Array;
}

namespace INode {
	export function hasContent(inode: INode): inode is INode & { content: Uint8Array } {
		return inode.content !== undefined;
	}
}

export function create(apiClient: ApiShape, _textEncoder: RAL.TextEncoder, fileDescriptorId: { next(): number }, baseUri: URI, mountPoint: string): FileSystemDeviceDriver {

	const deviceId = DeviceIds.next();
	const vscode_fs = apiClient.vscode.workspace.fileSystem;

	let inodeCounter: bigint = 1n;
	const path2INode: Map<string, INode> = new Map();
	const inodes: Map<bigint, INode> = new Map();
	const deletedINode: Map<bigint, INode> = new Map();

	const preOpenDirectories = [mountPoint];

	function createFileDescriptor(parentDescriptor: DirectoryFileDescriptor, rights_base: rights, fdflags: fdflags, path: string): FileFileDescriptor {
		const parentINode = getINode(parentDescriptor.inode);
		const filePath = paths.join(parentDescriptor.path, path);
		const fileUri = uriJoin(parentINode.uri, path);
		return new FileFileDescriptor(deviceId, fileDescriptorId.next(), rights_base, fdflags, getOrCreateINode(filePath, fileUri, true).id, filePath);
	}

	function assertFileDescriptor(fileDescriptor: FileDescriptor): asserts fileDescriptor is FileFileDescriptor {
		if (!(fileDescriptor instanceof FileFileDescriptor)) {
			throw new WasiError(Errno.badf);
		}
	}

	function createDirectoryDescriptor(parentDescriptor: DirectoryFileDescriptor, rights_base: rights, rights_inheriting: rights, fdflags: fdflags, path: string): DirectoryFileDescriptor {
		const parentINode = getINode(parentDescriptor.inode);
		const filePath = paths.join(parentDescriptor.path, path);
		const fileUri = uriJoin(parentINode.uri, path);
		return new DirectoryFileDescriptor(deviceId, fileDescriptorId.next(), rights_base, rights_inheriting, fdflags, getOrCreateINode(filePath, fileUri, true).id, filePath);
	}

	function assertDirectoryDescriptor(fileDescriptor: FileDescriptor): asserts fileDescriptor is DirectoryFileDescriptor {
		if (!(fileDescriptor instanceof DirectoryFileDescriptor)) {
			throw new WasiError(Errno.badf);
		}
	}

	function assertFileOrDirectoryDescriptor(fileDescriptor: FileDescriptor): asserts fileDescriptor is (FileFileDescriptor | DirectoryFileDescriptor) {
		if (!(fileDescriptor instanceof FileFileDescriptor) && !(fileDescriptor instanceof DirectoryFileDescriptor)) {
			throw new WasiError(Errno.badf);
		}
	}

	function getOrCreateINode(filepath: string, uri: URI, ref: boolean): INode {
		let result = path2INode.get(filepath);
		if (result !== undefined) {
			if (ref) {
				result.refs++;
			}
			return result;
		}
		result = { id: inodeCounter++, uri, refs: 0, content: undefined };
		if (ref) {
			result.refs++;
		}
		path2INode.set(filepath, result);
		inodes.set(result.id, result);
		return result;
	}

	function getINode(id: bigint): INode {
		const inode: INode | undefined = inodes.get(id);
		if (inode === undefined) {
			throw new WasiError(Errno.badf);
		}
		return inode;
	}

	function getResolvedINode(id: bigint): Required<INode> {
		const inode: INode | undefined = inodes.get(id);
		if (inode === undefined) {
			throw new WasiError(Errno.badf);
		}
		if (inode.content === undefined) {
			inode.content = vscode_fs.readFile(inode.uri);
		}
		return inode as Required<INode>;
	}

	function unrefINode(id: bigint): void {
		let inode = inodes.get(id);
		if (inode === undefined) {
			inode = deletedINode.get(id);
		}
		if (inode === undefined) {
			throw new WasiError(Errno.badf);
		}
		inode.refs--;
		if (inode.refs === 0) {
			inode.content = undefined;
			deletedINode.delete(id);
		}
	}

	function markINodeAsDeleted(filepath: string): void {
		const inode = path2INode.get(filepath);
		if (inode === undefined) {
			return;
		}
		path2INode.delete(filepath);
		if (!deletedINode.has(inode.id)) {
			deletedINode.set(inode.id, inode);
		}
	}

	function uriJoin(uri: URI, name: string): URI {
		if (name === '.') {
			return uri;
		}
		return uri.with( { path: paths.join(uri.path, name)} );
	}

	function doGetFiletype(fileDescriptor: FileFileDescriptor | DirectoryFileDescriptor, path: string): filetype | undefined {
		const inode = getINode(fileDescriptor.inode);
		const fileUri = uriJoin(inode.uri, path);
		try {
			const stat = vscode_fs.stat(fileUri);
			return code2Wasi.asFileType(stat.type);
		} catch {
			return undefined;
		}
	}

	function doStat(inode: INode, result: filestat): void {
		const vStat = vscode_fs.stat(inode.uri);
		result.dev = deviceId;
		result.ino = inode.id;
		result.filetype = code2Wasi.asFileType(vStat.type);
		// nlink denotes the number of hard links (not soft links)
		// Since VS Code doesn't support hard links on files we
		// always return 1.
		result.nlink = 1n;
		result.size = BigInt(vStat.size);
		result.atim = timeInNanoseconds(vStat.mtime);
		result.ctim = timeInNanoseconds(vStat.ctime);
		result.mtim = timeInNanoseconds(vStat.mtime);
	}

	function timeInNanoseconds(timeInMilliseconds: number): bigint {
		return BigInt(timeInMilliseconds) * 1000000n;
	}

	function read(content: Uint8Array, offset: number, buffers: Uint8Array[]): size {
		let totalBytesRead = 0;
		for (const buffer of buffers) {
			const toRead = Math.min(buffer.length, content.byteLength - offset);
			buffer.set(content.subarray(offset, offset + toRead));
			totalBytesRead += toRead;
			if (toRead < buffer.length) {
				break;
			}
			offset += toRead;
		}
		return totalBytesRead;
	}

	function write(content: Uint8Array, offset: number, buffers: Uint8Array[]): [Uint8Array, size] {
		let bytesToWrite: size = 0;
		for (const bytes of buffers) {
			bytesToWrite += bytes.byteLength;
		}

		// Do we need to increase the buffer
		if (offset + bytesToWrite > content.byteLength) {
			const newContent = new Uint8Array(offset + bytesToWrite);
			newContent.set(content);
			content = newContent;
		}

		for (const bytes of buffers) {
			content.set(bytes, offset);
			offset += bytes.length;
		}

		return [content, bytesToWrite];
	}


	function createOrTruncate(fileDescriptor: FileFileDescriptor): void {
		const inode = getINode(fileDescriptor.inode);
		inode.content = new Uint8Array(0);
		fileDescriptor.cursor = 0;
		writeContent(inode as Required<INode>);
	}

	function writeContent(inode: Required<INode>) {
		vscode_fs.writeFile(inode.uri, inode.content);
	}

	return Object.assign({}, NoSysDeviceDriver, {
		id: deviceId,

		createStdioFileDescriptor(fd: 0 | 1 | 2, fdflags: fdflags, path: string): FileDescriptor {
			if (path.length === 0) {
				throw new WasiError(Errno.inval);
			}
			if (path[0] !== '/') {
				path = `/${path}`;
			}

			const fileUri = uriJoin(baseUri, path);
			const inode = getOrCreateINode(path, fileUri, true);
			return new FileFileDescriptor(deviceId, fd, FileBaseRights, fdflags, inode.id, path);
		},
		fd_advise(fileDescriptor: FileDescriptor, _offset: bigint, _length: bigint, _advise: number): void {
			fileDescriptor.assertBaseRights(Rights.fd_advise);
			// We don't have advisory in VS Code. So treat it as successful.
			return;
		},
		fd_allocate(fileDescriptor: FileDescriptor, _offset: bigint, _len: bigint): void {
			assertFileDescriptor(fileDescriptor);

			const offset = BigInts.asNumber(_offset);
			const len = BigInts.asNumber(_len);

			const inode = getResolvedINode(fileDescriptor.inode);
			const content = inode.content;
			if (offset > content.byteLength) {
				throw new WasiError(Errno.inval);
			}

			const newContent: Uint8Array = new Uint8Array(content.byteLength + len);
			newContent.set(content.subarray(0, offset), 0);
			newContent.set(content.subarray(offset), offset + len);
			inode.content = newContent;
			writeContent(inode);

		},
		fd_close(fileDescriptor: FileDescriptor): void {
			unrefINode(fileDescriptor.inode);
		},
		fd_datasync(fileDescriptor: FileDescriptor): void {
			assertFileDescriptor(fileDescriptor);

			const inode = getINode(fileDescriptor.inode);
			if (!INode.hasContent(inode)) {
				return;
			}
			writeContent(inode);
		},
		fd_fdstat_get(fileDescriptor: FileDescriptor, result: fdstat): void {
			result.fs_filetype = fileDescriptor.fileType;
			result.fs_flags = fileDescriptor.fdflags;
			result.fs_rights_base = fileDescriptor.rights_base;
			result.fs_rights_inheriting = fileDescriptor.rights_inheriting;
		},
		fd_fdstat_set_flags(fileDescriptor: FileDescriptor, fdflags: number): void {
			fileDescriptor.fdflags = fdflags;
		},
		fd_filestat_get(fileDescriptor: FileDescriptor, result: filestat): void {
			assertFileDescriptor(fileDescriptor);

			const inode = getINode(fileDescriptor.inode);
			doStat(inode, result);
		},
		fd_filestat_set_size(fileDescriptor: FileDescriptor, _size: bigint): void {
			assertFileDescriptor(fileDescriptor);

			const size = BigInts.asNumber(_size);
			const inode = getResolvedINode(fileDescriptor.inode);
			const content = inode.content;
			if (content.byteLength === size) {
				return;
			} else if (content.byteLength < size) {
				const newContent = new Uint8Array(size);
				newContent.set(content);
				inode.content = newContent;
			} else if (content.byteLength > size) {
				const newContent = new Uint8Array(size);
				newContent.set(content.subarray(0, size));
				inode.content = newContent;
			}
			writeContent(inode);
		},
		fd_filestat_set_times(_fileDescriptor: FileDescriptor, _atim: bigint, _mtim: bigint, _fst_flags: number): void {
			// For new we do nothing. We could cache the timestamp in memory
			// But we would loose them during reload. We could also store them
			// in local storage
			throw new WasiError(Errno.nosys);
		},
		fd_pread(fileDescriptor: FileDescriptor, _offset: filesize, buffers: Uint8Array[]): size {
			const offset = BigInts.asNumber(_offset);
			const content = getResolvedINode(fileDescriptor.inode).content;
			return read(content, offset, buffers);
		},
		fd_prestat_get(fd: fd): [string, FileDescriptor] | undefined {
			const next = preOpenDirectories.shift();
			if (next === undefined) {
				return undefined;
			}
			return [
				next,
				new DirectoryFileDescriptor(deviceId, fd, DirectoryBaseRights, DirectoryInheritingRights, 0, getOrCreateINode('/', baseUri, true).id, '/')
			];
		},
		fd_pwrite(fileDescriptor: FileDescriptor, _offset: filesize, buffers: Uint8Array[]): number {
			const offset = BigInts.asNumber(_offset);
			const inode = getResolvedINode(fileDescriptor.inode);

			const [newContent, bytesWritten] = write(inode.content, offset, buffers);
			inode.content = newContent;
			writeContent(inode);
			return bytesWritten;
		},
		fd_read(fileDescriptor: FileDescriptor, buffers: Uint8Array[]): number {
			if (buffers.length === 0) {
				return 0;
			}
			assertFileDescriptor(fileDescriptor);

			const content = getResolvedINode(fileDescriptor.inode).content;
			const offset = fileDescriptor.cursor;
			const totalBytesRead = read(content, offset, buffers);
			fileDescriptor.cursor = fileDescriptor.cursor + totalBytesRead;
			return totalBytesRead;
		},
		fd_readdir(fileDescriptor: FileDescriptor): ReaddirEntry[] {
			assertDirectoryDescriptor(fileDescriptor);

			// Also unclear whether we have to include '.' and '..'
			// See also https://github.com/WebAssembly/wasi-filesystem/issues/3
			const inode = getINode(fileDescriptor.inode);
			const entries = vscode_fs.readDirectory(inode.uri);
			const result: ReaddirEntry[] = [];
			for (const entry of entries) {
				const name = entry[0];
				const filePath = paths.join(fileDescriptor.path, name);
				const fileUri = uriJoin(inode.uri, name);
				result.push({ d_ino: getOrCreateINode(filePath, fileUri, false).id, d_type: code2Wasi.asFileType(entry[1]), d_name: name });
			}
			return result;
		},
		fd_seek(fileDescriptor: FileDescriptor, _offset: bigint, whence: number): bigint {
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
					const inode = getResolvedINode(fileDescriptor.inode);
					fileDescriptor.cursor = Math.max(0, inode.content.byteLength - offset);
					break;
			}
			return BigInt(fileDescriptor.cursor);
		},
		fd_sync(fileDescriptor: FileDescriptor): void {
			const inode = getINode(fileDescriptor.inode);
			if (!INode.hasContent(inode)) {
				return;
			}
			writeContent(inode);
		},
		fd_tell(fileDescriptor: FileDescriptor): u64 {
			assertFileDescriptor(fileDescriptor);

			return BigInt(fileDescriptor.cursor);
		},
		fd_write(fileDescriptor: FileDescriptor, buffers: Uint8Array[]): number {
			if (buffers.length === 0) {
				return 0;
			}
			assertFileDescriptor(fileDescriptor);

			const inode = getResolvedINode(fileDescriptor.inode);
			// We have append mode on. According to POSIX we need to
			// move the cursor to the end of the file on every write
			if (Fdflags.appendOn(fileDescriptor.fdflags)) {
				fileDescriptor.cursor = inode.content.byteLength;
			}
			const [newContent, bytesWritten] = write(inode.content, fileDescriptor.cursor, buffers);
			inode.content = newContent;
			writeContent(inode);
			fileDescriptor.cursor = fileDescriptor.cursor + bytesWritten;
			return bytesWritten;
		},
		path_create_directory(fileDescriptor: FileDescriptor, path: string): void {
			const inode = getINode(fileDescriptor.inode);
			vscode_fs.createDirectory(uriJoin(inode.uri, path));
		},
		path_filestat_get(fileDescriptor: FileDescriptor, _flags: lookupflags, path: string, result: filestat): void {
			assertFileOrDirectoryDescriptor(fileDescriptor);

			const inode = getINode(fileDescriptor.inode);
			const filePath = paths.join(fileDescriptor.path, path);
			const fileUri = uriJoin(inode.uri, path);
			doStat(getOrCreateINode(filePath, fileUri, false), result);
		},
		path_filestat_set_times(_fileDescriptor: FileDescriptor, _flags: lookupflags, _path: string, _atim: timestamp, _mtim: timestamp, _fst_flags: fstflags): void {
			// For now we do nothing. We could cache the timestamp in memory
			// But we would loose them during reload. We could also store them
			// in local storage
		},
		path_link(_oldFileDescriptor: FileDescriptor, _old_flags: lookupflags, _old_path: string, _newFileDescriptor: FileDescriptor, _new_path: string): void {
			// For now we do nothing. If we need to implement this we need
			// support from the VS Code API.
		},
		path_open(parentDescriptor: FileDescriptor, _dirflags: lookupflags, path: string, oflags: oflags, fs_rights_base: rights, fs_rights_inheriting: rights, fdflags: fdflags): FileDescriptor {
			assertDirectoryDescriptor(parentDescriptor);

			if (path === '.') {
				path = parentDescriptor.path;
			}
			let filetype: filetype | undefined = doGetFiletype(parentDescriptor, path);
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
				const dirname = paths.dirname(path);
				// The name has a directory part. Ensure that the directory exists
				if (dirname !== '.') {
					const dirFiletype = doGetFiletype(parentDescriptor, dirname);
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
				? createFileDescriptor(parentDescriptor, parentDescriptor.childFileRights(fs_rights_base), fdflags, path)
				: createDirectoryDescriptor(parentDescriptor, parentDescriptor.childDirectoryRights(fs_rights_base), fs_rights_inheriting | DirectoryInheritingRights, fdflags, path);

			if (result instanceof FileFileDescriptor && (createFile || Oflags.truncOn(oflags))) {
				createOrTruncate(result);
			}
			return result;
		},
		path_readlink(_fileDescriptor: FileDescriptor, _path: string): string {
			// For now we do nothing. If we need to implement this we need
			// support from the VS Code API.
			throw new WasiError(Errno.noent);
		},
		path_remove_directory(fileDescriptor: FileDescriptor, path: string): void {
			assertFileOrDirectoryDescriptor(fileDescriptor);

			const parentINode = getINode(fileDescriptor.inode);
			const fileUri = uriJoin(parentINode.uri, path);
			vscode_fs.delete(fileUri, { recursive: false, useTrash: true });
			// todo@dirkb Need to think about whether we need to mark sub inodes as deleted as well.
			markINodeAsDeleted(paths.join(fileDescriptor.path, path));
		},
		path_rename(oldFileDescriptor: FileDescriptor, oldPath: string, newFileDescriptor: FileDescriptor, newPath: string): void {
			assertDirectoryDescriptor(oldFileDescriptor);
			assertDirectoryDescriptor(newFileDescriptor);

			const oldParentINode = getINode(oldFileDescriptor.inode);
			const newParentINode = getINode(newFileDescriptor.inode);

			const oldUri = uriJoin(oldParentINode.uri, oldPath);
			const newUri = uriJoin(newParentINode.uri, newPath);
			vscode_fs.rename(oldUri, newUri, { overwrite: false });

			// todo@dirkb unclear what really happens in posix. We need to understand if
			// an old file descriptor could still read the directory under its new location.
			const oldINode = path2INode.get(paths.join(oldFileDescriptor.path, oldPath));
			if (oldINode === undefined) {
				return;
			}
			const newFilePath = paths.join(newFileDescriptor.path, newPath);
			const newINode = path2INode.get(newFilePath);
			if (newINode !== undefined) {
				throw new WasiError(Errno.badf);
			}
			path2INode.set(newFilePath, oldINode);
		},
		path_symlink(_oldPath: string, _fileDescriptor: FileDescriptor, _newPath: string): void {
			throw new WasiError(Errno.nosys);
		},
		path_unlink_file(fileDescriptor: FileDescriptor, path: string): void {
			assertDirectoryDescriptor(fileDescriptor);
			const inode = getINode(fileDescriptor.inode);
			const filePath = paths.join(fileDescriptor.path, path);
			const fileUri = uriJoin(inode.uri, path);
			vscode_fs.delete(fileUri, { recursive: false, useTrash: true });
			markINodeAsDeleted(filePath);
		},
		bytesAvailable(fileDescriptor: FileDescriptor): filesize {
			assertFileDescriptor(fileDescriptor);

			const inode = getResolvedINode(fileDescriptor.inode);
			const cursor = fileDescriptor.cursor;
			return BigInt(Math.max(0,inode.content.byteLength - cursor));
		}
	});
}
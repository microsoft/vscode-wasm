/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { URI } from 'vscode-uri';

import { ApiShape, size } from '@vscode/sync-api-client';

import { BigInts, code2Wasi } from './converter';
import {
	BaseFileDescriptor, FileDescriptor, NoSysDeviceDriver, DeviceIds, ReaddirEntry, FileSystemDeviceDriver
} from './deviceDriver';
import {
	fdstat, filestat, Rights, fd, rights, fdflags, Filetype, WasiError, Errno, filetype, Whence, lookupflags, timestamp, fstflags,
	oflags, Oflags, filesize, Fdflags, Lookupflags, inode
} from './wasiTypes';

import RAL from './ral';
import { u64 } from './baseTypes';
import { LRUCache } from './linkedMap';
import path from 'path';
const paths = RAL().path;

export const DirectoryBaseRights: rights = Rights.fd_fdstat_set_flags | Rights.path_create_directory |
		Rights.path_create_file | Rights.path_link_source | Rights.path_link_target | Rights.path_open |
		Rights.fd_readdir | Rights.path_readlink | Rights.path_rename_source | Rights.path_rename_target |
		Rights.path_filestat_get | Rights.path_filestat_set_size | Rights.path_filestat_set_times |
		Rights.fd_filestat_get | Rights.fd_filestat_set_times | Rights.path_remove_directory | Rights.path_unlink_file;

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

	constructor(deviceId: bigint, fd: fd, rights_base: rights, fdflags: fdflags, inode: bigint) {
		super(deviceId, fd, Filetype.regular_file, rights_base, 0n, fdflags, inode);
		this._cursor = 0;
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

	constructor(deviceId: bigint, fd: fd, rights_base: rights, rights_inheriting: rights, fdflags: fdflags, inode: bigint) {
		super(deviceId, fd, Filetype.directory, rights_base, rights_inheriting, fdflags, inode);
	}

	childDirectoryRights(requested_rights: rights): rights {
		return (this.rights_inheriting & requested_rights) & ~FileOnlyBaseRights;
	}

	childFileRights(requested_rights: rights): rights {
		return (this.rights_inheriting & requested_rights) & ~DirectoryOnlyBaseRights;
	}
}

enum NodeKind {
	File,
	Directory
}

type FileNode = {

	readonly kind: NodeKind.File;

	/**
	 * This inode id.
	 */
	readonly inode: inode;

	/**
	 * How often the INode is referenced via a file descriptor
	 */
	refs: number;

	/**
	 * The parent node
	 */
	readonly parent: DirectoryNode;

	/**
	 * The cached name of the inode to speed up path
	 * generation
	 */
	name: string | undefined;
};

namespace FileNode {
	export function create(id: inode, parent: DirectoryNode): FileNode {
		return {
			kind: NodeKind.File,
			inode: id,
			refs: 0,
			parent,
			name: undefined
		};
	}
}

type DirectoryNode = {

	readonly kind: NodeKind.Directory;

	/**
	 * This inode id.
	 */
	readonly inode: inode;

	/**
	 * How often the INode is referenced via a file descriptor
	 */
	refs: number;

	/**
	 * The parent node
	 */
	readonly parent: DirectoryNode | undefined;

	/**
	 * The directory entries.
	 */
	readonly entries: Map<string, Node>;

	/**
	 * The cached name of the inode to speed up path
	 * generation
	 */
	name: string | undefined;
};

type Node = FileNode | DirectoryNode;

namespace DirectoryNode {
	export function create(id: inode, parent: DirectoryNode | undefined): DirectoryNode {
		return {
			kind: NodeKind.Directory,
			inode: id,
			refs: 0,
			parent,
			name: undefined,
			entries: new Map()
		};
	}
}

class FileSystem {

	static inodeCounter: bigint = 1n;

	private readonly vscfs: URI;
	private readonly root: DirectoryNode;

	private readonly inodes: Map<inode, Node>;
	private readonly contents: Map<inode, Uint8Array>;
	private readonly pathCache: LRUCache<Node, string>;

	constructor(vscfs: URI) {
		this.vscfs = vscfs;
		this.root = {
			kind: NodeKind.Directory,
			inode: FileSystem.inodeCounter++,
			parent: undefined,
			refs: 1,
			name: '/',
			entries: new Map()
		};

		this.inodes = new Map();
		this.inodes.set(this.root.inode, this.root);
		this.contents = new Map();
		this.pathCache = new LRUCache(256);
	}

	public getRoot(): DirectoryNode {
		return this.root;
	}

	getUri(node: Node): URI;
	getUri(node: DirectoryNode, fsPath: string): URI;
	getUri(node: DirectoryNode, fsPath?: string): URI {
		const finalPath = fsPath === undefined || fsPath === '.' ? this.getPath(node) : path.join(this.getPath(node), fsPath);
		return this.vscfs.with({ path: paths.join(this.vscfs.path, finalPath) });
	}

	public getNode(id: inode): Node;
	public getNode(id: inode, kind: NodeKind.File): FileNode;
	public getNode(id: inode, kind: NodeKind.Directory): DirectoryNode;
	public getNode(id: inode, kind?: NodeKind): Node {
		const node = this.inodes.get(id);
		if (node === undefined) {
			throw new WasiError(Errno.noent);
		}
		if (kind === NodeKind.File && node.kind !== NodeKind.File) {
			throw new WasiError(Errno.isdir);
		} else if (kind === NodeKind.Directory && node.kind !== NodeKind.Directory) {
			throw new WasiError(Errno.notdir);
		}
		return node;
	}

	public deleteNodeById(id: inode): void {
		this.deleteNode(this.getNode(id));
	}

	public deleteNodeByPath(parent: DirectoryNode, path: string): void {
		const node = this.findNode(parent, path);
		if (node === undefined) {
			throw new WasiError(Errno.noent);
		}
		this.deleteNode(node);
	}

	private deleteNode(node: Node): void {
		if (node.parent === undefined) {
			throw new WasiError(Errno.badf);
		}
		const name = this.getName(node);
		node.parent.entries.delete(name);
		this.clearCache(node);
	}

	private clearCache(inode: Node): void {
		this.pathCache.delete(inode);
		inode.name = undefined;
		if (inode.kind === NodeKind.Directory) {
			for (const child of inode.entries.values()) {
				this.clearCache(child);
			}
		}
	}

	private findNode(parent: DirectoryNode, path: string): Node | undefined	{
		const parts = this.getPathSegments(path);
		let current: FileNode | DirectoryNode | undefined = parent;
		for (let i = 0; i < parts.length; i++) {
			switch (current.kind) {
				case NodeKind.File:
					return undefined;
				case NodeKind.Directory:
					current = current.entries.get(parts[i]);
					if (current === undefined) {
						return undefined;
					}
					break;
			}
		}
		return current;
	}

	public getOrCreateNode(parent: DirectoryNode, path: string, kind: NodeKind, ref: boolean): FileNode | DirectoryNode {
		const parts = this.getPathSegments(path);
		let current: FileNode | DirectoryNode | undefined = parent;
		for (let i = 0; i < parts.length; i++) {
			switch (current.kind) {
				case NodeKind.File:
					throw new WasiError(Errno.notdir);
				case NodeKind.Directory:
					let entry = current.entries.get(parts[i]);
					if (entry === undefined) {
						if (i === parts.length - 1) {
							entry = kind === NodeKind.File
								? FileNode.create(FileSystem.inodeCounter++, current)
								: DirectoryNode.create(FileSystem.inodeCounter++, current);
							if (ref) {
								entry.refs++;
							}
						} else {
							entry = DirectoryNode.create(FileSystem.inodeCounter++, current);
						}
						current.entries.set(parts[i], entry);
					}
					current = entry;
					break;
			}
		}
		return current;
	}

	private getPathSegments(path: string): string[] {
		if (path.charAt(0) === '/') { path = path.substring(1); }
		if (path.charAt(path.length - 1) === '/') { path = path.substring(0, path.length - 1); }
		return path.split('/');
	}

	public setContent(inode: FileNode, content: Uint8Array): void {
		this.contents.set(inode.inode, content);
	}

	public getContent(inode: FileNode): Uint8Array {
		const content = this.contents.get(inode.inode);
		if (content !== undefined)	{
			return content;
		}

	}

	private getPath(inode: FileNode | DirectoryNode): string {
		let result = this.pathCache.get(inode);
		if (result === undefined) {
			const parts: string[] = [];
			let current: FileNode | DirectoryNode | undefined = inode;
			do {
				parts.push(this.getName(current));
				current = current.parent;
			} while (current !== undefined);
			result = parts.reverse().join('/');
			this.pathCache.set(inode, result);
		}
		return result;
	}

	private getName(inode: FileNode | DirectoryNode): string {
		if (inode.name !== undefined) {
			return inode.name;
		}
		const parent = inode.parent;
		if (parent === undefined) {
			throw new Error('The root node must always have a name');
		}
		for (const [name, child] of parent.entries) {
			if (child === inode) {
				inode.name = name;
				return name;
			}
		}
		throw new WasiError(Errno.noent);
	}
}

export function create(apiClient: ApiShape, _textEncoder: RAL.TextEncoder, fileDescriptorId: { next(): number }, baseUri: URI, mountPoint: string): FileSystemDeviceDriver {

	const deviceId = DeviceIds.next();
	const vscode_fs = apiClient.vscode.workspace.fileSystem;
	const fs = new FileSystem(baseUri);

	const deletedINode: Map<bigint, INode> = new Map();

	const preOpenDirectories = [mountPoint];

	function createFileDescriptor(parentDescriptor: DirectoryFileDescriptor, rights_base: rights, fdflags: fdflags, path: string): FileFileDescriptor {
		const parentNode = fs.getNode(parentDescriptor.inode, NodeKind.Directory);
		return new FileFileDescriptor(deviceId, fileDescriptorId.next(), rights_base, fdflags, fs.getOrCreateNode(parentNode, path, NodeKind.File, true).inode);
	}

	function assertFileDescriptor(fileDescriptor: FileDescriptor): asserts fileDescriptor is FileFileDescriptor {
		if (!(fileDescriptor instanceof FileFileDescriptor)) {
			throw new WasiError(Errno.badf);
		}
	}

	function createDirectoryDescriptor(parentDescriptor: DirectoryFileDescriptor, rights_base: rights, rights_inheriting: rights, fdflags: fdflags, path: string): DirectoryFileDescriptor {
		const parentNode = fs.getNode(parentDescriptor.inode, NodeKind.Directory);
		return new DirectoryFileDescriptor(deviceId, fileDescriptorId.next(), rights_base, rights_inheriting, fdflags, fs.getOrCreateNode(parentNode, path, NodeKind.Directory, true).inode);
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
		const inode = fs.getNode(fileDescriptor.inode);
		try {
			const stat = vscode_fs.stat(fs.getUri(inode, path));
			return code2Wasi.asFileType(stat.type);
		} catch {
			return undefined;
		}
	}

	function doStat(inode: Node, result: filestat): void {
		const vStat = vscode_fs.stat(fs.getUri(inode));
		result.dev = deviceId;
		result.ino = inode.inode;
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
		const content = new Uint8Array(0);
		const inode = fs.getNode(fileDescriptor.inode, NodeKind.File);
		fileDescriptor.cursor = 0;
		writeContent(inode, content);
	}

	function writeContent(node: FileNode, content?: Uint8Array) {
		const toWrite = content ?? fs.getContent(node);
		vscode_fs.writeFile(fs.getUri(node), toWrite);
		if (content !== undefined) {
			fs.setContent(node, content);
		}
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

			const inode = fs.getOrCreateNode(fs.getRoot(), path, NodeKind.File, true);
			return new FileFileDescriptor(deviceId, fd, FileBaseRights, fdflags, inode.inode);
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

			const inode = fs.getNode(fileDescriptor.inode, NodeKind.File);
			const content = fs.getContent(inode);
			if (offset > content.byteLength) {
				throw new WasiError(Errno.inval);
			}

			const newContent: Uint8Array = new Uint8Array(content.byteLength + len);
			newContent.set(content.subarray(0, offset), 0);
			newContent.set(content.subarray(offset), offset + len);
			writeContent(inode, newContent);
		},
		fd_close(fileDescriptor: FileDescriptor): void {
			unrefINode(fileDescriptor.inode);
		},
		fd_datasync(fileDescriptor: FileDescriptor): void {
			assertFileDescriptor(fileDescriptor);
			const node = fs.getNode(fileDescriptor.inode, NodeKind.File);
			writeContent(node);
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
			const inode = fs.getNode(fileDescriptor.inode);
			doStat(inode, result);
		},
		fd_filestat_set_size(fileDescriptor: FileDescriptor, _size: bigint): void {
			assertFileDescriptor(fileDescriptor);

			const size = BigInts.asNumber(_size);
			const node = fs.getNode(fileDescriptor.inode, NodeKind.File);
			const content = fs.getContent(node);
			if (content.byteLength === size) {
				return;
			} else if (content.byteLength < size) {
				const newContent = new Uint8Array(size);
				newContent.set(content);
				writeContent(node, newContent);
			} else if (content.byteLength > size) {
				const newContent = new Uint8Array(size);
				newContent.set(content.subarray(0, size));
				writeContent(node, newContent);
			}
		},
		fd_filestat_set_times(_fileDescriptor: FileDescriptor, _atim: bigint, _mtim: bigint, _fst_flags: number): void {
			// For new we do nothing. We could cache the timestamp in memory
			// But we would loose them during reload. We could also store them
			// in local storage
			throw new WasiError(Errno.nosys);
		},
		fd_pread(fileDescriptor: FileDescriptor, _offset: filesize, buffers: Uint8Array[]): size {
			const offset = BigInts.asNumber(_offset);
			const content = fs.getContent(fs.getNode(fileDescriptor.inode, NodeKind.File));
			return read(content, offset, buffers);
		},
		fd_prestat_get(fd: fd): [string, FileDescriptor] | undefined {
			const next = preOpenDirectories.shift();
			if (next === undefined) {
				return undefined;
			}
			return [
				next,
				new DirectoryFileDescriptor(deviceId, fd, DirectoryBaseRights, DirectoryInheritingRights, 0, fs.getRoot().inode)
			];
		},
		fd_pwrite(fileDescriptor: FileDescriptor, _offset: filesize, buffers: Uint8Array[]): number {
			const offset = BigInts.asNumber(_offset);
			const inode = fs.getNode(fileDescriptor.inode, NodeKind.File);
			const [newContent, bytesWritten] = write(fs.getContent(inode), offset, buffers);
			writeContent(inode, newContent);
			return bytesWritten;
		},
		fd_read(fileDescriptor: FileDescriptor, buffers: Uint8Array[]): number {
			if (buffers.length === 0) {
				return 0;
			}
			assertFileDescriptor(fileDescriptor);

			const content = fs.getContent(fs.getNode(fileDescriptor.inode, NodeKind.File));
			const offset = fileDescriptor.cursor;
			const totalBytesRead = read(content, offset, buffers);
			fileDescriptor.cursor = fileDescriptor.cursor + totalBytesRead;
			return totalBytesRead;
		},
		fd_readdir(fileDescriptor: FileDescriptor): ReaddirEntry[] {
			assertDirectoryDescriptor(fileDescriptor);

			// Also unclear whether we have to include '.' and '..'
			// See also https://github.com/WebAssembly/wasi-filesystem/issues/3
			const directoryNode = fs.getNode(fileDescriptor.inode, NodeKind.Directory);
			const entries = vscode_fs.readDirectory(fs.getUri(directoryNode));
			const result: ReaddirEntry[] = [];
			for (const entry of entries) {
				const name = entry[0];
				const filetype: filetype = code2Wasi.asFileType(entry[1]);
				const nodeKind = filetype === Filetype.directory ? NodeKind.Directory : NodeKind.File;
				result.push({ d_ino: fs.getOrCreateNode(directoryNode, name, nodeKind, false).inode, d_type: filetype, d_name: name });
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
					const content = fs.getContent(fs.getNode(fileDescriptor.inode, NodeKind.File));
					fileDescriptor.cursor = Math.max(0, content.byteLength - offset);
					break;
			}
			return BigInt(fileDescriptor.cursor);
		},
		fd_sync(fileDescriptor: FileDescriptor): void {
			writeContent(fs.getNode(fileDescriptor.inode, NodeKind.File));
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

			const inode = fs.getNode(fileDescriptor.inode, NodeKind.File);
			const content = fs.getContent(inode);
			// We have append mode on. According to POSIX we need to
			// move the cursor to the end of the file on every write
			if (Fdflags.appendOn(fileDescriptor.fdflags)) {
				fileDescriptor.cursor = content.byteLength;
			}
			const [newContent, bytesWritten] = write(content, fileDescriptor.cursor, buffers);
			writeContent(inode,newContent);
			fileDescriptor.cursor = fileDescriptor.cursor + bytesWritten;
			return bytesWritten;
		},
		path_create_directory(fileDescriptor: FileDescriptor, path: string): void {
			const inode = fs.getNode(fileDescriptor.inode, NodeKind.Directory);
			vscode_fs.createDirectory(fs.getUri(inode, path));
		},
		path_filestat_get(fileDescriptor: FileDescriptor, _flags: lookupflags, path: string, result: filestat): void {
			assertFileOrDirectoryDescriptor(fileDescriptor);

			const inode = fs.getNode(fileDescriptor.inode);
			doStat(fs.getOrCreateNode(filePath, fileUri, false), result);
		},
		path_filestat_set_times(_fileDescriptor: FileDescriptor, _flags: lookupflags, _path: string, _atim: timestamp, _mtim: timestamp, _fst_flags: fstflags): void {
			// For now we do nothing. We could cache the timestamp in memory
			// But we would loose them during reload. We could also store them
			// in local storage
			throw new WasiError(Errno.nosys);
		},
		path_link(_oldFileDescriptor: FileDescriptor, _old_flags: lookupflags, _old_path: string, _newFileDescriptor: FileDescriptor, _new_path: string): void {
			// For now we do nothing. If we need to implement this we need
			// support from the VS Code API.
			throw new WasiError(Errno.nosys);
		},
		path_open(parentDescriptor: FileDescriptor, dirflags: lookupflags, path: string, oflags: oflags, fs_rights_base: rights, fs_rights_inheriting: rights, fdflags: fdflags): FileDescriptor {
			assertDirectoryDescriptor(parentDescriptor);
			if ((dirflags & Lookupflags.symlink_follow) !== 0) {
				throw new WasiError(Errno.inval);
			}

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
			throw new WasiError(Errno.nolink);
		},
		path_remove_directory(fileDescriptor: FileDescriptor, path: string): void {
			assertDirectoryDescriptor(fileDescriptor);

			const parentINode = getINode(fileDescriptor.inode);
			const fileUri = uriJoin(parentINode.uri, path);
			vscode_fs.delete(fileUri, { recursive: false, useTrash: true });
			// todo@dirkb Need to think about whether we need to mark sub inodes as deleted as well.
			markINodeAsDeleted(paths.join(fileDescriptor.path, path));
		},
		path_rename(oldFileDescriptor: FileDescriptor, oldPath: string, newFileDescriptor: FileDescriptor, newPath: string): void {
			assertDirectoryDescriptor(oldFileDescriptor);
			assertDirectoryDescriptor(newFileDescriptor);

			// Make sure that we don't have an iNode for the new path.
			const newFilePath = paths.join(newFileDescriptor.path, newPath);
			if (path2INode.has(newFilePath)) {
				throw new WasiError(Errno.exist);
			}

			const oldParentINode = getINode(oldFileDescriptor.inode);
			const newParentINode = getINode(newFileDescriptor.inode);

			const oldUri = uriJoin(oldParentINode.uri, oldPath);
			const newUri = uriJoin(newParentINode.uri, newPath);

			vscode_fs.rename(oldUri, newUri, { overwrite: false });

			// Check if we have an iNode for the old path. If not there is nothing to do.
			const oldFilePath = paths.join(oldFileDescriptor.path, oldPath);
			const oldINode = path2INode.get(oldFilePath);
			if (oldINode === undefined) {
				return;
			}
			path2INode.delete(oldFilePath);
			oldINode.uri = newUri;
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
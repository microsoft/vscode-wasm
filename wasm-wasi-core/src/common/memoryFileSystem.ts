/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as uuid from 'uuid';

import { FileNode as ApiFileNode, DirectoryNode as ApiDirectoryNode, Filetype as ApiFiletype, MemoryFileSystem as ApiMemoryFileSystem } from './api';
import { Uri } from 'vscode';
import { DeviceDriverKind, DeviceId, FileSystemDeviceDriver, NoSysDeviceDriver, ReaddirEntry, ReadonlyFileSystemDeviceDriver, WritePermDeniedDeviceDriver } from './deviceDriver';
import { BaseFileDescriptor, FdProvider, FileDescriptor } from './fileDescriptor';
import { Errno, Fdflags, Filetype, Lookupflags, Oflags, Rights, WasiError, Whence, fd, fdflags, fdstat, filesize, filestat, inode, lookupflags, oflags, rights } from './wasi';
import { size, u64 } from './baseTypes';
import { BigInts } from './converter';

import RAL from './ral';
const paths = RAL().path;

interface BaseFileNode extends ApiFileNode {

	/**
	 * The parent node
	 */
	readonly parent: BaseDirectoryNode;

	/**
	 * This inode id.
	 */
	readonly inode: inode;

	/**
	 * The name of the file.
	 */
	readonly name: string;
}

interface BaseDirectoryNode extends ApiDirectoryNode {

	/**
	 * The parent node
	 */
	readonly parent: BaseDirectoryNode | undefined;

	/**
	 * This inode id.
	 */
	readonly inode: inode;

	/**
	 * The name of the directory
	 */
	readonly  name: string;

	/**
	 * The directory entries.
	 */
	readonly entries: Map<string, BaseNode>;
}

type BaseNode = BaseFileNode | BaseDirectoryNode;


function timeInNanoseconds(timeInMilliseconds: number): bigint {
	return BigInt(timeInMilliseconds) * 1000000n;
}

abstract class BaseFileSystem<D extends BaseDirectoryNode, F extends BaseFileNode > {

	private inodeCounter: bigint;
	private readonly root: D;

	constructor(root: D) {
		// 1n is reserved for root
		this.inodeCounter = 2n;
		this.root = root;
	}

	protected nextInode(): inode {
		return this.inodeCounter++;
	}

	public getRoot(): D {
		return this.root;
	}

	public refNode(node: Node): void {
		node.refs++;
	}

	public unrefNode(node: Node): void {
		node.refs--;
	}

	public findNode(path: string): D | F | undefined;
	public findNode(parent: D, path: string): D | F | undefined;
	public findNode(parentOrPath: D | string, p?: string): D | F | undefined {
		let parent: D;
		let path: string;
		if (typeof parentOrPath === 'string') {
			parent = this.root;
			path = parentOrPath;
		} else {
			parent = parentOrPath;
			path = p!;
		}
		const parts = this.getSegmentsFromPath(path);
		if (parts.length === 1) {
			if (parts[0] === '.') {
				return parent;
			} else if (parts[0] === '..') {
				return parent.parent as D;
			}
		}
		let current: F | D | undefined = parent;
		for (let i = 0; i < parts.length; i++) {
			switch (current.filetype) {
				case ApiFiletype.regular_file:
					return undefined;
				case ApiFiletype.directory:
					current = current.entries.get(parts[i]) as F | D | undefined;
					if (current === undefined) {
						return undefined;
					}
					break;
			}
		}
		return current;
	}

	private getSegmentsFromPath(path: string): string[] {
		if (path.charAt(0) === '/') { path = path.substring(1); }
		if (path.charAt(path.length - 1) === '/') { path = path.substring(0, path.length - 1); }
		return path.normalize().split('/');
	}
}

interface FileNode extends BaseFileNode {

	readonly parent: DirectoryNode;

	/**
	 * The files time stamp.
	 */
	readonly ctime: bigint;
	readonly mtime: bigint;
	readonly atime: bigint;

	/**
	 * How often the INode is referenced via a file descriptor
	 */
	refs: number;

	/**
	 * The content of the file.
	 */
	readonly content: Uint8Array | { size: bigint; reader: (node: FileNode) => Promise<Uint8Array> };
}

namespace FileNode {
	export function create(parent: DirectoryNode, inode: inode, name: string, time: bigint, content: Uint8Array | { size: bigint; reader: (node: FileNode) => Promise<Uint8Array> }): FileNode {
		return {
			filetype: ApiFiletype.regular_file,
			parent,
			inode,
			name,
			ctime: time,
			mtime: time,
			atime: time,
			refs: 0,
			content: content
		};
	}
	export function size(node: FileNode): bigint {
		if (node.content instanceof Uint8Array) {
			return BigInt(node.content.length);
		} else {
			return node.content.size;
		}
	}
}

interface DirectoryNode extends BaseDirectoryNode {

	readonly parent: DirectoryNode | undefined;

	/**
	 * The files time stamp.
	 */
	readonly ctime: bigint;
	readonly mtime: bigint;
	readonly atime: bigint;

	/**
	 * How often the INode is referenced via a file descriptor
	 */
	refs: number;

	readonly entries: Map<string, Node>;
}

namespace DirectoryNode {
	export function create(parent: DirectoryNode | undefined, id: inode, name: string, time: bigint): DirectoryNode {
		return {
			filetype: ApiFiletype.directory,
			inode: id,
			name,
			ctime: time,
			mtime: time,
			atime: time,
			refs: 0,
			parent,
			entries: new Map()
		};
	}
	export function size(node: DirectoryNode): bigint {
		return BigInt((Math.trunc(node.entries.size * 24 / 4096) + 1) * 4096);
	}
}

type Node = FileNode | DirectoryNode;

export class MemoryFileSystem extends BaseFileSystem<DirectoryNode, FileNode> implements ApiMemoryFileSystem {

	public readonly uri: Uri = Uri.from({ scheme: 'wasi-memfs', authority: uuid.v4() });

	constructor() {
		super(DirectoryNode.create(undefined, 1n, '/', timeInNanoseconds(Date.now())));
	}

	public createDirectory(path: string): void {
		const dirname = paths.dirname(path);
		const basename = paths.basename(path);
		const parent = this.getDirectoryNode(dirname);
		const node = DirectoryNode.create(parent, this.nextInode(), basename, timeInNanoseconds(Date.now()));
		parent.entries.set(basename, node);
	}

	public createFile(path: string, content: Uint8Array | { size: bigint; reader: (node: FileNode) => Promise<Uint8Array> }): void {
		const dirname = paths.dirname(path);
		const basename = paths.basename(path);
		const parent = this.getDirectoryNode(dirname);
		const node = FileNode.create(parent, this.nextInode(), basename, timeInNanoseconds(Date.now()), content);
		parent.entries.set(basename, node);
	}

	private getDirectoryNode(path: string): DirectoryNode {
		const result = this.findNode(path);
		if (result === undefined) {
			throw new Error(`ENOENT: no such directory ${path}`);
		}
		if (result.filetype !== ApiFiletype.directory) {
			throw new Error(`ENOTDIR: not a directory ${path}`);
		}
		return result;
	}

	public async getContent(node: FileNode): Promise<Uint8Array> {
		if (node.content instanceof Uint8Array) {
			return Promise.resolve(node.content);
		} else {
			const result = await node.content.reader(node);
			(node as { content: Uint8Array}).content = result;
			return result;
		}
	}
}

// When mounted the file system is readonly for now. We need to invest to make this writable and we need a use case first.
const DirectoryBaseRights: rights = Rights.path_open | Rights.fd_readdir | Rights.path_filestat_get | Rights.fd_filestat_get;
const FileBaseRights: rights = Rights.fd_read | Rights.fd_seek | Rights.fd_tell | Rights.fd_advise | Rights.fd_filestat_get | Rights.poll_fd_readwrite;
const DirectoryInheritingRights: rights = DirectoryBaseRights | FileBaseRights;
const DirectoryOnlyBaseRights: rights = DirectoryBaseRights & ~FileBaseRights;
const FileOnlyBaseRights: rights = FileBaseRights & DirectoryBaseRights;


class FileFileDescriptor extends BaseFileDescriptor {

	private _cursor: bigint;
	public readonly node: FileNode;

	constructor(deviceId: bigint, fd: fd, rights_base: rights, fdflags: fdflags, inode: bigint, node: FileNode) {
		super(deviceId, fd, Filetype.regular_file, rights_base, 0n, fdflags, inode);
		this.node = node;
		this._cursor = 0n;
	}

	public with(change: { fd: fd }): FileDescriptor {
		return new FileFileDescriptor(this.deviceId, change.fd, this.rights_base, this.fdflags, this.inode, this.node);
	}

	public get cursor(): bigint {
		return this._cursor;
	}

	public set cursor(value: bigint) {
		if (value < 0) {
			throw new WasiError(Errno.inval);
		}
		this._cursor = value;
	}
}

class DirectoryFileDescriptor extends BaseFileDescriptor {

	public readonly node: DirectoryNode;

	constructor(deviceId: bigint, fd: fd, rights_base: rights, rights_inheriting: rights, fdflags: fdflags, inode: bigint, node: DirectoryNode) {
		super(deviceId, fd, Filetype.directory, rights_base, rights_inheriting, fdflags, inode);
		this.node = node;
	}

	public with(change: { fd: fd }): FileDescriptor {
		return new DirectoryFileDescriptor(this.deviceId, change.fd, this.rights_base, this.rights_inheriting, this.fdflags, this.inode, this.node);
	}

	childDirectoryRights(requested_rights: rights): rights {
		return (this.rights_inheriting & requested_rights) & ~FileOnlyBaseRights;
	}

	childFileRights(requested_rights: rights): rights {
		return (this.rights_inheriting & requested_rights) & ~DirectoryOnlyBaseRights;
	}
}


export function create(deviceId: DeviceId, fs: MemoryFileSystem): FileSystemDeviceDriver {

	const $fs: MemoryFileSystem = fs;

	function assertFileDescriptor(fileDescriptor: FileDescriptor): asserts fileDescriptor is FileFileDescriptor {
		if (!(fileDescriptor instanceof FileFileDescriptor)) {
			throw new WasiError(Errno.badf);
		}
	}

	function assertDirectoryDescriptor(fileDescriptor: FileDescriptor): asserts fileDescriptor is DirectoryFileDescriptor {
		if (!(fileDescriptor instanceof DirectoryFileDescriptor)) {
			throw new WasiError(Errno.badf);
		}
	}

	function assertDescriptor(fileDescriptor: FileDescriptor): asserts fileDescriptor is FileFileDescriptor | DirectoryFileDescriptor {
		if (!(fileDescriptor instanceof FileFileDescriptor) && !(fileDescriptor instanceof DirectoryFileDescriptor)) {
			throw new WasiError(Errno.badf);
		}
	}

	function assignStat(result: filestat, node: Node): void {
		result.dev = deviceId;
		result.ino = node.inode;
		result.filetype = ApiFiletype.to(node.filetype);
		result.nlink = 1n;
		result.size = node.filetype === ApiFiletype.regular_file ? FileNode.size(node) : DirectoryNode.size(node);
		result.atim = node.atime;
		result.ctim = node.ctime;
		result.mtim = node.mtime;
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

	const $driver: ReadonlyFileSystemDeviceDriver = {
		kind: DeviceDriverKind.fileSystem,
		uri: $fs.uri,
		id: deviceId,
		createStdioFileDescriptor(_dirflags: lookupflags | undefined = Lookupflags.none, _path: string, _oflags: oflags | undefined = Oflags.none, _fs_rights_base: rights | undefined, _fdflags: fdflags | undefined = Fdflags.none, _fd: 0 | 1 | 2): Promise<FileDescriptor> {
			throw new WasiError(Errno.nosys);
		},
		fd_create_prestat_fd(fd: fd): Promise<FileDescriptor> {
			const root = $fs.getRoot();
			return Promise.resolve(new DirectoryFileDescriptor(deviceId, fd, DirectoryBaseRights, DirectoryInheritingRights, Fdflags.none, root.inode, root));
		},
		fd_advise(fileDescriptor: FileDescriptor, _offset: bigint, _length: bigint, _advise: number): Promise<void> {
			assertFileDescriptor(fileDescriptor);
			// We don't have advisory in NodeFS. So treat it as successful.
			return Promise.resolve();
		},
		fd_close(fileDescriptor: FileDescriptor): Promise<void> {
			assertDescriptor(fileDescriptor);
			$fs.unrefNode(fileDescriptor.node);
			return Promise.resolve();
		},
		fd_fdstat_get(fileDescriptor: FileDescriptor, result: fdstat): Promise<void> {
			result.fs_filetype = fileDescriptor.fileType;
			result.fs_flags = fileDescriptor.fdflags;
			result.fs_rights_base = fileDescriptor.rights_base;
			result.fs_rights_inheriting = fileDescriptor.rights_inheriting;
			return Promise.resolve();
		},
		fd_filestat_get(fileDescriptor: FileDescriptor, result: filestat): Promise<void> {
			assertFileDescriptor(fileDescriptor);
			assignStat(result, fileDescriptor.node);
			return Promise.resolve();
		},
		async fd_pread(fileDescriptor: FileDescriptor, _offset: filesize, buffers: Uint8Array[]): Promise<size> {
			if (buffers.length === 0) {
				return 0;
			}
			assertFileDescriptor(fileDescriptor);
			const offset = BigInts.asNumber(_offset);
			const content = await $fs.getContent(fileDescriptor.node);
			return read(content, offset, buffers);

		},
		async fd_read(fileDescriptor: FileDescriptor, buffers: Uint8Array[]): Promise<number> {
			if (buffers.length === 0) {
				return 0;
			}
			assertFileDescriptor(fileDescriptor);
			const content = await $fs.getContent(fileDescriptor.node);
			const offset = fileDescriptor.cursor;
			const totalBytesRead = read(content, BigInts.asNumber(offset), buffers);
			fileDescriptor.cursor = fileDescriptor.cursor + BigInt(totalBytesRead);
			return totalBytesRead;
		},
		fd_readdir(fileDescriptor: FileDescriptor): Promise<ReaddirEntry[]> {
			assertDirectoryDescriptor(fileDescriptor);

			const result: ReaddirEntry[] = [];
			for (const entry of fileDescriptor.node.entries.values()) {
				result.push({ d_ino: entry.inode, d_type: entry.filetype, d_name: entry.name });
			}
			return Promise.resolve(result);
		},
		async fd_seek(fileDescriptor: FileDescriptor, offset: bigint, whence: number): Promise<bigint> {
			assertFileDescriptor(fileDescriptor);

			switch(whence) {
				case Whence.set:
					fileDescriptor.cursor = offset;
					break;
				case Whence.cur:
					fileDescriptor.cursor = fileDescriptor.cursor + offset;
					break;
				case Whence.end:
					const size = FileNode.size(fileDescriptor.node);
					fileDescriptor.cursor = BigInts.max(0n, size - offset);
					break;
			}
			return BigInt(fileDescriptor.cursor);
		},
		fd_renumber(fileDescriptor: FileDescriptor, _to: fd): Promise<void> {
			assertDescriptor(fileDescriptor);
			return Promise.resolve();
		},
		fd_tell(fileDescriptor: FileDescriptor): Promise<u64> {
			assertFileDescriptor(fileDescriptor);
			return Promise.resolve(fileDescriptor.cursor);
		},
		async path_filestat_get(fileDescriptor: FileDescriptor, _flags: lookupflags, path: string, result: filestat): Promise<void> {
			assertDirectoryDescriptor(fileDescriptor);
			const target = $fs.findNode(fileDescriptor.node, path);
			if (target === undefined) {
				throw new WasiError(Errno.noent);
			}
			assignStat(result, target);
		},
		path_open(fileDescriptor: FileDescriptor, _dirflags: lookupflags, path: string, oflags: oflags, fs_rights_base: rights, fs_rights_inheriting: rights, fdflags: fdflags, fdProvider: FdProvider): Promise<FileDescriptor> {
			assertDirectoryDescriptor(fileDescriptor);

			const target = $fs.findNode(fileDescriptor.node, path);
			if (target === undefined) {
				if (Oflags.creatOn(oflags)) {
					throw new WasiError(Errno.perm);
				}
				throw new WasiError(Errno.noent);
			}
			if (target.filetype !== ApiFiletype.directory && Oflags.directoryOn(oflags)) {
				throw new WasiError(Errno.notdir);
			}
			if (Oflags.exclOn(oflags)) {
				throw new WasiError(Errno.exist);
			}
			if (Oflags.truncOn(oflags) || Fdflags.appendOn(fdflags) || Fdflags.syncOn(fdflags)) {
				throw new WasiError(Errno.perm);
			}

			const write= (fs_rights_base & (Rights.fd_write | Rights.fd_datasync | Rights.fd_allocate | Rights.fd_filestat_set_size)) !== 0n;
			if (write) {
				throw new WasiError(Errno.perm);
			}

			return Promise.resolve(target.filetype === ApiFiletype.directory
				? new DirectoryFileDescriptor(deviceId, fdProvider.next(), fileDescriptor.childDirectoryRights(fs_rights_base), fs_rights_inheriting | DirectoryInheritingRights, fdflags, target.inode, target)
				: new FileFileDescriptor(deviceId, fdProvider.next(), fileDescriptor.childFileRights(fs_rights_base), fdflags, target.inode, target));
		},
		path_readlink(fileDescriptor: FileDescriptor, path: string): Promise<string> {
			assertDirectoryDescriptor(fileDescriptor);
			const target = $fs.findNode(fileDescriptor.node, path);
			if (target === undefined) {
				throw new WasiError(Errno.noent);
			}
			throw new WasiError(Errno.nolink);
		},
		fd_bytesAvailable(fileDescriptor: FileDescriptor): Promise<filesize> {
			assertFileDescriptor(fileDescriptor);
			return Promise.resolve(BigInts.max(0n, FileNode.size(fileDescriptor.node) - fileDescriptor.cursor));
		}
	};

	return Object.assign({}, NoSysDeviceDriver, $driver, WritePermDeniedDeviceDriver);
}
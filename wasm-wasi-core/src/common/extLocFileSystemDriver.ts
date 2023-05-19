/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Uri, workspace } from 'vscode';
import { DeviceDriverKind, DeviceId, FileSystemDeviceDriver, NoSysDeviceDriver, ReaddirEntry, ReadonlyFileSystemDeviceDriver, WritePermDeniedDeviceDriver } from '../common/deviceDriver';
import { BaseFileDescriptor, FdProvider, FileDescriptor } from '../common/fileDescriptor';
import { Fdflags, Filetype, Lookupflags, Oflags, Whence, fdstat, filesize, filestat, inode, lookupflags, oflags } from '../common/wasi';
import { Errno } from '../common/wasi';
import { WasiError } from '../common/wasi';
import { fdflags } from '../common/wasi';
import { fd } from '../common/wasi';
import { Rights, rights } from '../common/wasi';
import { BigInts } from '../common/converter';
import { size, u64 } from '../common/baseTypes';

// The Unpkg file system is readonly.
const DirectoryBaseRights: rights = Rights.path_open | Rights.fd_readdir | Rights.path_filestat_get | Rights.fd_filestat_get;
const FileBaseRights: rights = Rights.fd_read | Rights.fd_seek | Rights.fd_tell | Rights.fd_advise | Rights.fd_filestat_get | Rights.poll_fd_readwrite;
const DirectoryInheritingRights: rights = DirectoryBaseRights | FileBaseRights;
const DirectoryOnlyBaseRights: rights = DirectoryBaseRights & ~FileBaseRights;
const FileOnlyBaseRights: rights = FileBaseRights & DirectoryBaseRights;

enum NodeKind {
	File,
	Directory
}

type FileNode = {

	readonly kind: NodeKind.File;

	/**
	 * The parent node
	 */
	readonly parent: DirectoryNode;

	/**
	 * This inode id.
	 */
	readonly inode: inode;

	/**
	 * The name of the file.
	 */
	readonly name: string;

	/**
	 * The files time stamp.
	 */
	readonly time: bigint;

	/**
	 * The size of the file.
	 */
	readonly size: bigint;

	/**
	 * How often the INode is referenced via a file descriptor
	 */
	refs: number;

	/**
	 * The cached content of the file.
	 */
	content: Uint8Array | undefined;
};

namespace FileNode {
	export function create(parent: DirectoryNode, inode: inode, name: string, time: bigint, size: bigint): FileNode {
		return {
			kind: NodeKind.File,
			parent,
			inode,
			name,
			time,
			size,
			refs: 0,
			content: undefined
		};
	}
}

type DirectoryNode = {

	readonly kind: NodeKind.Directory;

	/**
	 * The parent node
	 */
	readonly parent: DirectoryNode | undefined;

	/**
	 * This inode id.
	 */
	readonly inode: inode;

	/**
	 * The name of the directory
	 */
	readonly  name: string;

	/**
	 * The files time stamp.
	 */
	readonly time: bigint;

	/**
	 * The size of the directory.
	 */
	readonly size: bigint;

	/**
	 * How often the INode is referenced via a file descriptor
	 */
	refs: number;

	/**
	 * The directory entries.
	 */
	readonly entries: Map<string, Node>;
};

namespace DirectoryNode {
	export function create(parent: DirectoryNode | undefined, id: inode, name: string, time: bigint, size: bigint): DirectoryNode {
		return {
			kind: NodeKind.Directory,
			inode: id,
			name,
			time,
			size,
			refs: 0,
			parent,
			entries: new Map()
		};
	}
}

type Node = FileNode | DirectoryNode;

namespace Dump {

	export type FileNode = {
		kind: 'file';
		name: string;
		size: string;
		ctime: string;
		atime: string;
		mtime: string;
	};

	export type DirectoryNode =  {
		kind: 'directory';
		name: string;
		size: string;
		ctime: string;
		atime: string;
		mtime: string;
		children: { [key: string]: Node };
	};

	export type Node = FileNode | DirectoryNode;
}

class FileSystem {

	private readonly baseUri: Uri;
	private readonly root: DirectoryNode;

	constructor(baseUri: Uri, dump: Dump.DirectoryNode) {
		this.baseUri = baseUri;
		this.root = this.parseDump(dump);
	}

	public getRoot(): DirectoryNode {
		return this.root;
	}

	public refNode(node: Node): void {
		node.refs++;
	}

	public unrefNode(node: Node): void {
		node.refs--;
		if (node.refs === 0 && node.kind === NodeKind.File) {
			node.content = undefined;
		}
	}

	public async getContent(node: FileNode): Promise<Uint8Array> {
		if (node.content !== undefined) {
			return node.content;
		}
		try {
			const segments = this.getSegmentsFromNode(node);
			const vscode_fs = Uri.joinPath(this.baseUri, ...segments);
			const content = await workspace.fs.readFile(vscode_fs);
			node.content = content;
			return node.content;
		} catch (error) {
			throw new WasiError(Errno.noent);
		}
	}

	public findNode(parent: DirectoryNode, path: string): Node | undefined {
		const parts = this.getSegmentsFromPath(path);
		if (parts.length === 1) {
			if (parts[0] === '.') {
				return parent;
			} else if (parts[0] === '..') {
				return parent.parent;
			}
		}
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

	private getSegmentsFromNode(node: Node): string[] {
		const parts: string[] = [];
		let current: FileNode | DirectoryNode | undefined = node;
		do {
			parts.push(current.name);
			current = current.parent;
		} while (current !== undefined);
		return parts.reverse();
	}

	private getSegmentsFromPath(path: string): string[] {
		if (path.charAt(0) === '/') { path = path.substring(1); }
		if (path.charAt(path.length - 1) === '/') { path = path.substring(0, path.length - 1); }
		return path.normalize().split('/');
	}

	private parseDump(dump: Dump.DirectoryNode): DirectoryNode {
		let inodeCounter = 1n;
		const root = DirectoryNode.create(undefined, inodeCounter++, dump.name, BigInt(dump.ctime), BigInt(dump.size));
		this.processDirectoryNode(dump, root, inodeCounter);
		return root;
	}

	private processDirectoryNode(dump: Dump.DirectoryNode, fs: DirectoryNode, inodeCounter: bigint): void {
		for (const entry of Object.values(dump.children)) {
			if (entry.kind === 'directory') {
				const child = DirectoryNode.create(fs, inodeCounter++, entry.name, BigInt(entry.ctime), BigInt(entry.size));
				fs.entries.set(entry.name, child);
				this.processDirectoryNode(entry, child, inodeCounter);
			} else {
				const child = FileNode.create(fs, inodeCounter++, entry.name, BigInt(entry.ctime), BigInt(entry.size));
				fs.entries.set(entry.name, child);
			}
		}
	}
}

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


export function create(deviceId: DeviceId, baseUri: Uri, dump: Dump.DirectoryNode): FileSystemDeviceDriver {

	const $fs: FileSystem = new FileSystem(baseUri, dump);

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
		result.filetype = node.kind === NodeKind.File ? Filetype.regular_file : Filetype.directory;
		result.nlink = 1n;
		result.size = node.size;
		result.atim = node.time;
		result.ctim = node.time;
		result.mtim = node.time;
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
		uri: baseUri,
		id: deviceId,
		joinPath( ...pathSegments: string[]): Uri | undefined {
			return Uri.joinPath(baseUri, ...pathSegments);
		},
		createStdioFileDescriptor(_dirflags: lookupflags | undefined = Lookupflags.none, _path: string, _oflags: oflags | undefined = Oflags.none, _fs_rights_base: rights | undefined, _fdflags: fdflags | undefined = Fdflags.none, _fd: 0 | 1 | 2): Promise<FileDescriptor> {
			throw new WasiError(Errno.nosys);
		},
		fd_create_prestat_fd(fd: fd): Promise<FileDescriptor> {
			const root = $fs.getRoot();
			$fs.refNode(root);
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
				result.push({ d_ino: entry.inode, d_type: entry.kind === NodeKind.File ? Filetype.regular_file : Filetype.directory, d_name: entry.name });
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
					const size = fileDescriptor.node.size;
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
			if (target.kind !== NodeKind.Directory && Oflags.directoryOn(oflags)) {
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

			const result = target.kind === NodeKind.Directory
				? new DirectoryFileDescriptor(deviceId, fdProvider.next(), fileDescriptor.childDirectoryRights(fs_rights_base), fs_rights_inheriting | DirectoryInheritingRights, fdflags, target.inode, target)
				: new FileFileDescriptor(deviceId, fdProvider.next(), fileDescriptor.childFileRights(fs_rights_base), fdflags, target.inode, target);
			$fs.refNode(target);
			return Promise.resolve(result);
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
			return Promise.resolve(BigInts.max(0n, fileDescriptor.node.size - fileDescriptor.cursor));
		}
	};

	return Object.assign({}, NoSysDeviceDriver, $driver, WritePermDeniedDeviceDriver);
}
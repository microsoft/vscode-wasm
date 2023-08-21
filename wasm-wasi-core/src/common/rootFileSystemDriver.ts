/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Uri } from 'vscode';
import { DeviceDriver, DeviceDriverKind, DeviceId, FileSystemDeviceDriver, NoSysDeviceDriver, ReaddirEntry, WritePermDeniedDeviceDriver } from './deviceDriver';
import { BaseFileDescriptor, FdProvider, FileDescriptor } from './fileDescriptor';
import { WasiError, Filetype, fdstat, filestat, fstflags, lookupflags, oflags, rights, fdflags, fd, Rights, inode } from './wasi';
import { Errno } from './wasi';
import RAL from './ral';

const DirectoryBaseRights: rights = Rights.fd_fdstat_set_flags | Rights.path_create_directory |
		Rights.path_create_file | Rights.path_link_source | Rights.path_link_target | Rights.path_open |
		Rights.fd_readdir | Rights.path_readlink | Rights.path_rename_source | Rights.path_rename_target |
		Rights.path_filestat_get | Rights.path_filestat_set_size | Rights.path_filestat_set_times |
		Rights.fd_filestat_get | Rights.fd_filestat_set_times | Rights.path_remove_directory | Rights.path_unlink_file |
		Rights.path_symlink;

const FileBaseRights: rights = Rights.fd_datasync | Rights.fd_read | Rights.fd_seek | Rights.fd_fdstat_set_flags |
		Rights.fd_sync | Rights.fd_tell | Rights.fd_write | Rights.fd_advise | Rights.fd_allocate | Rights.fd_filestat_get |
		Rights.fd_filestat_set_size | Rights.fd_filestat_set_times | Rights.poll_fd_readwrite;

const DirectoryInheritingRights: rights = DirectoryBaseRights | FileBaseRights;

class DirectoryFileDescriptor extends BaseFileDescriptor {

	constructor(deviceId: bigint, fd: fd, rights_base: rights, rights_inheriting: rights, fdflags: fdflags, inode: bigint) {
		super(deviceId, fd, Filetype.directory, rights_base, rights_inheriting, fdflags, inode);
	}

	public with(change: { fd: number }): FileDescriptor {
		return new DirectoryFileDescriptor(this.deviceId, change.fd, this.rights_base, this.rights_inheriting, this.fdflags, this.inode);
	}
}

enum NodeKind {
	VirtualDirectory,
	MountPoint
}

type VirtualDirectoryNode = {

	readonly kind: NodeKind.VirtualDirectory;

	/**
	 * This inode id.
	 */
	readonly inode: inode;

	/**
	 * The parent node
	 */
	readonly parent: VirtualDirectoryNode | undefined;

	/**
	 * The name of the inode.
	 */
	name: string;

	/**
	 * The directory entries.
	 */
	readonly entries: Map<string, Node>;
};

namespace VirtualDirectoryNode {
	export function create(id: inode, parent: VirtualDirectoryNode | undefined, name: string): VirtualDirectoryNode {
		return {
			kind: NodeKind.VirtualDirectory,
			inode: id,
			parent,
			name,
			entries: new Map()
		};
	}
}

type MountPointNode = {

	readonly kind: NodeKind.MountPoint;

	/**
	 * This inode id.
	 */
	readonly inode: inode;

	/**
	 * The parent node
	 */
	readonly parent: VirtualDirectoryNode;

	/**
	 * The name of the inode.
	 */
	readonly name: string;

	/**
	 * The device driver that is mounted at this node.
	 */
	readonly deviceDriver: FileSystemDeviceDriver;
};

namespace MountPointNode {
	export function create(id: inode, parent: VirtualDirectoryNode, name: string, deviceDriver: FileSystemDeviceDriver): MountPointNode {
		return {
			kind: NodeKind.MountPoint,
			inode: id,
			parent,
			name,
			deviceDriver
		};
	}
}

type Node = VirtualDirectoryNode | MountPointNode;

class VirtualRootFileSystem {

	static inodeCounter: bigint = 1n;

	public readonly deviceId: DeviceId;
	private readonly inodes: Map<inode, Node>;
	public readonly root: VirtualDirectoryNode;
	private readonly deviceDrivers: Map<FileSystemDeviceDriver, MountPointNode>;
	private readonly mountPoints: Map<string, MountPointNode>;

	constructor(deviceId: DeviceId) {
		this.deviceId = deviceId;
		this.inodes = new Map();
		this.root = VirtualDirectoryNode.create(VirtualRootFileSystem.inodeCounter++, undefined, '/');
		this.inodes.set(this.root.inode, this.root);
		this.deviceDrivers = new Map();
		this.mountPoints = new Map();
	}

	public isRoot(node: Node): boolean {
		return node.inode === this.root.inode;
	}

	public addMountPoint(filepath: string, deviceDriver: FileSystemDeviceDriver): void {
		if (filepath.length === 0) {
			throw new Error('Cannot mount root');
		}
		const path = RAL().path;
		if (filepath.charAt(0) !== path.sep) {
			throw new Error(`Cannot mount relative path: ${filepath}`);
		}
		const segments = filepath.split(path.sep);
		segments.shift();
		let current: Node = this.root;
		for (let i = 0; i < segments.length; i++) {
			if (current.kind === NodeKind.MountPoint) {
				throw new Error(`Cannot create virtual folder over mount point: ${path.sep}${segments.slice(0, i + 1).join(path.sep)}`);
			}
			const segment = segments[i];
			if (i === segments.length - 1) {
				const child = MountPointNode.create(VirtualRootFileSystem.inodeCounter++, current, segment, deviceDriver);
				this.inodes.set(child.inode, child);
				current.entries.set(segment, child);
				this.deviceDrivers.set(deviceDriver, child);
				this.mountPoints.set(filepath, child);
			} else {
				let child = current.entries.get(segment);
				if (child === undefined) {
					child = VirtualDirectoryNode.create(VirtualRootFileSystem.inodeCounter++, current, segment);
					current.entries.set(segment, child);
					this.inodes.set(child.inode, child);
				}
				current = child;
			}
		}
	}

	public getNode(inode: inode): Node {
		const node = this.inodes.get(inode);
		if (node === undefined) {
			throw new WasiError(Errno.badf);
		}
		return node;
	}

	public findNode(parentNode: Node, filePath: string): [Node, string | undefined] {
		const path = RAL().path;
		filePath = path.normalize(filePath);
		if (filePath === '/') {
			return [this.root, filePath];
		} else if (filePath === '.') {
			return parentNode.kind === NodeKind.VirtualDirectory ? [parentNode, undefined] : [parentNode, filePath];
		} else if (filePath === '..') {
			if (parentNode.parent === undefined) {
				return [this.root, undefined];
			} else {
				return [parentNode.parent, undefined];
			}
		}
		const segments = filePath.split(path.sep);
		// The filepath is absolute, so the first segment is empty.
		if (segments[0] === '') {
			// We have an absolute path so we need to start at the root. Otherwise
			// the path is not valid.
			if (parentNode !== this.root) {
				throw new WasiError(Errno.noent);
			}
			segments.shift();
		}
		let current: Node = parentNode;
		for (let i = 0; i < segments.length; i++) {
			if (current.kind === NodeKind.MountPoint) {
				return [current, path.join(...segments.slice(i))];
			}
			const segment = segments[i];
			const child = current.entries.get(segment);
			if (child === undefined) {
				throw new WasiError(Errno.noent);
			} else if (i === segments.length - 1) {
				return child.kind === NodeKind.VirtualDirectory ? [child, undefined] : [child, '.'];
			}
			current = child;
		}
		throw new WasiError(Errno.noent);
	}

	public makeVirtualPath(deviceDriver: FileSystemDeviceDriver, filepath: string): string | undefined {
		const node = this.deviceDrivers.get(deviceDriver);
		if (node === undefined) {
			return undefined;
		}
		const nodePath = this.getPath(node);
		return RAL().path.join(nodePath, filepath);
	}

	public getDeviceDriver(path: string): [FileSystemDeviceDriver | undefined, string] {
		const [node, relativePath] = this.findNode(this.root, path);
		if (node.kind === NodeKind.MountPoint) {
			return [node.deviceDriver, relativePath!];
		} else {
			return [undefined, path];
		}
	}

	public getMountPoint(uri: Uri): [string | undefined, Uri] {
		const uriStr = uri.toString();
		for (const [mountPoint, node] of this.mountPoints) {
			const root = node.deviceDriver.uri;
			const rootStr = root.toString();
			if (uriStr === rootStr || (uriStr.startsWith(rootStr) && (rootStr.charAt(rootStr.length - 1) === '/' || uriStr.charAt(rootStr.length) === '/'))) {
				return [mountPoint, root];
			}
		}
		return [undefined, uri];
	}

	private getPath(inode: Node): string {
		const parts: string[] = [];
		let current: Node | undefined = inode;
		do {
			parts.push(current.name);
			current = current.parent;
		} while (current !== undefined);
		return RAL().path.join(...parts.reverse());
	}
}

export interface RootFileSystemDeviceDriver extends FileSystemDeviceDriver {
	makeVirtualPath(deviceDriver: FileSystemDeviceDriver, filepath: string): string | undefined;
	getDeviceDriver(path: string): [FileSystemDeviceDriver | undefined, string];
	getMountPoint(uri: Uri): [string | undefined, Uri];
}

export function create(deviceId: DeviceId, rootFileDescriptors: { getRoot(device: DeviceDriver): FileDescriptor | undefined }, mountPoints: Map<string, FileSystemDeviceDriver>): RootFileSystemDeviceDriver {

	let $atim: bigint = BigInt(Date.now()) * 1000000n;
	let $mtim: bigint = $atim;
	let $ctim: bigint = $atim;

	function assertDirectoryDescriptor(fileDescriptor: FileDescriptor): asserts fileDescriptor is FileDescriptor & { readonly fileType: typeof Filetype.directory } {
		if (fileDescriptor.fileType !== Filetype.directory) {
			throw new WasiError(Errno.badf);
		}
	}

	function createFileDescriptor(fd: fd, inode: inode): FileDescriptor {
		return new DirectoryFileDescriptor(deviceId, fd, DirectoryBaseRights, DirectoryInheritingRights, 0, inode);
	}

	function createRootFileDescriptor(fd: fd): DirectoryFileDescriptor {
		return createFileDescriptor(fd, $fs.root.inode);
	}

	const $fs = new VirtualRootFileSystem(deviceId);
	for (const [filepath, driver] of mountPoints) {
		$fs.addMountPoint(filepath, driver);
	}

	const $driver = {
		kind: DeviceDriverKind.fileSystem as const,
		id: deviceId,
		uri: Uri.from( { scheme: 'wasi-root', path: '/'} ),
		makeVirtualPath(deviceDriver: FileSystemDeviceDriver, filepath: string): string | undefined {
			return $fs.makeVirtualPath(deviceDriver, filepath);
		},
		getDeviceDriver(path: string): [FileSystemDeviceDriver | undefined, string] {
			return $fs.getDeviceDriver(path);
		},
		getMountPoint(uri: Uri): [string | undefined, Uri] {
			return $fs.getMountPoint(uri);
		},
		joinPath(): Uri | undefined {
			return undefined;
		},
		createStdioFileDescriptor(): Promise<FileDescriptor> {
			throw new Error(`Virtual root FS can't provide stdio file descriptors`);
		},
		fd_create_prestat_fd(fd: fd): Promise<FileDescriptor> {
			return Promise.resolve(createRootFileDescriptor(fd));
		},
		fd_close(_fileDescriptor: FileDescriptor): Promise<void> {
			return Promise.resolve();
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
		fd_filestat_get(fileDescriptor: FileDescriptor, result: filestat): Promise<void> {
			assertDirectoryDescriptor(fileDescriptor);
			const node = $fs.getNode(fileDescriptor.inode);
			if (node.kind === NodeKind.MountPoint) {
				throw new WasiError(Errno.badf);
			}
			result.dev = fileDescriptor.deviceId;
			result.ino = fileDescriptor.inode;
			result.filetype = fileDescriptor.fileType;
			result.nlink = 1n;
			result.size = BigInt(node.entries.size);
			result.atim = $atim;
			result.mtim = $mtim;
			result.ctim = $ctim;
			return Promise.resolve();
		},
		fd_filestat_set_times(_fileDescriptor: FileDescriptor, atim: bigint, mtim: bigint, _fst_flags: fstflags): Promise<void> {
			$atim = atim;
			$mtim = mtim;
			return Promise.resolve();
		},
		async fd_readdir(fileDescriptor: FileDescriptor): Promise<ReaddirEntry[]> {
			assertDirectoryDescriptor(fileDescriptor);

			const result: ReaddirEntry[] = [];
			const node = $fs.getNode(fileDescriptor.inode);
			if (node.kind === NodeKind.MountPoint) {
				throw new WasiError(Errno.badf);
			}
			for (const child of node.entries.values()) {
				result.push({ d_name: child.name, d_type: Filetype.directory, d_ino: child.inode });
			}
			return result;
		},
		async path_filestat_get(fileDescriptor: FileDescriptor, flags: lookupflags, path: string, result: filestat): Promise<void> {
			assertDirectoryDescriptor(fileDescriptor);
			const parentNode = $fs.getNode(fileDescriptor.inode);
			if ($fs.isRoot(parentNode) && (path === '.' || path === '..' || path === '/')) {
				return this.fd_filestat_get(rootFileDescriptors.getRoot($this)!, result);
			}

			const [node, pathRemainder] = $fs.findNode(parentNode, path);
			// The leave is a file system device driver. Forward the call to it.
			if (node.kind === NodeKind.MountPoint) {
				const driver = node.deviceDriver;
				const rootFileDescriptor = rootFileDescriptors.getRoot(driver);
				if (rootFileDescriptor === undefined) {
					throw new WasiError(Errno.badf);
				}
				return driver.path_filestat_get(rootFileDescriptor, flags, pathRemainder!, result);
			}

			result.dev = fileDescriptor.deviceId;
			result.ino = node.inode;
			result.filetype = Filetype.directory;
			result.nlink = 1n;
			result.size = BigInt(node.entries.size);
			result.atim = $atim;
			result.mtim = $mtim;
			result.ctim = $ctim;
			return Promise.resolve();
		},
		async path_open(parentDescriptor: FileDescriptor, dirflags: lookupflags, path: string, oflags: oflags, fs_rights_base: rights, fs_rights_inheriting: rights, fdflags: fdflags, fdProvider: FdProvider): Promise<FileDescriptor> {
			assertDirectoryDescriptor(parentDescriptor);
			const parentNode = $fs.getNode(parentDescriptor.inode);
			const [node, pathRemainder] = $fs.findNode(parentNode, path);

			// The leave is a file system device driver. Forward the call to it.
			if (node.kind === NodeKind.MountPoint) {
				const driver = node.deviceDriver;
				const rootFileDescriptor = rootFileDescriptors.getRoot(driver);
				if (rootFileDescriptor === undefined) {
					throw new WasiError(Errno.noent);
				}
				return driver.path_open(rootFileDescriptor, dirflags, pathRemainder!, oflags, fs_rights_base, fs_rights_inheriting, fdflags, fdProvider);
			}

			// It is a virtual directory. Create a file descriptor for it.
			return createFileDescriptor(fdProvider.next(), node.inode);
		},
	};

	const $this = Object.assign({}, NoSysDeviceDriver, $driver, WritePermDeniedDeviceDriver);
	return $this;
}
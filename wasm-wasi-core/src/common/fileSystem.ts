/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Uri } from 'vscode';

import RAL from './ral';
import { Filetype as ApiFiletype, RootFileSystem } from './api';
import { Errno, Filestat, Filetype, Lookupflags, WasiError, Filetype as WasiFiletype, errno, fd, fdflags, filetype, inode, rights } from './wasi';
import { RootFileSystemDeviceDriver } from './rootFileSystemDriver';
import { DeviceDrivers, RootFileSystemInfo } from './kernel';
import { DeviceDriver, FileSystemDeviceDriver } from './deviceDriver';
import { BaseFileDescriptor, FileDescriptor, FileDescriptors } from './fileDescriptor';
import { FileSystemService } from './service';

export namespace Filetypes {
	export function from(filetype: filetype): ApiFiletype {
		switch (filetype) {
			case WasiFiletype.directory:
				return ApiFiletype.directory;
			case WasiFiletype.regular_file:
				return ApiFiletype.regular_file;
			case WasiFiletype.character_device:
				return ApiFiletype.character_device;
			default:
				return ApiFiletype.unknown;
		}
	}
	export function to(filetype: ApiFiletype): filetype {
		switch(filetype) {
			case ApiFiletype.regular_file:
				return WasiFiletype.regular_file;
			case ApiFiletype.directory:
				return WasiFiletype.directory;
			case ApiFiletype.character_device:
				return WasiFiletype.character_device;
			default:
				return WasiFiletype.unknown;
		}
	}
}

export interface BaseNode {

	readonly filetype: filetype;

	/**
	 * The inode id.
	 */
	readonly inode: inode;

	/**
	 * The name of the file.
	 */
	readonly name: string;

	/**
	 * How often the node is referenced via a file descriptor
	 */
	refs: number;
}

export interface FileNode extends BaseNode {

	readonly filetype: typeof WasiFiletype.regular_file;

	/**
	 * The parent node
	 */
	readonly parent: DirectoryNode;
}

export interface CharacterDeviceNode extends BaseNode {

	readonly filetype: typeof WasiFiletype.character_device;

	/**
	 * The parent node
	 */
	readonly parent: DirectoryNode;
}

export interface DirectoryNode extends BaseNode {

	readonly filetype: typeof WasiFiletype.directory;

	/**
	 * The parent node
	 */
	readonly parent: DirectoryNode | undefined;

	/**
	 * The directory entries.
	 */
	readonly entries: Map<string, Node>;
}

type Node = FileNode | DirectoryNode | CharacterDeviceNode;

export abstract class BaseFileSystem<D extends DirectoryNode, F extends FileNode, C extends CharacterDeviceNode > {

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

	public findNode(path: string): D | F | C | undefined;
	public findNode(parent: D, path: string): D | F | C |undefined;
	public findNode(parentOrPath: D | string, p?: string): D | F | C |undefined {
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
				case WasiFiletype.regular_file:
					return undefined;
				case WasiFiletype.directory:
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

abstract class NodeDescriptor<N extends Node> extends BaseFileDescriptor {

	public readonly node: N;

	constructor(deviceId: bigint, fd: fd, filetype: filetype, rights_base: rights, rights_inheriting: rights, fdflags: fdflags, inode: bigint, node: N) {
		super(deviceId, fd, filetype, rights_base, rights_inheriting, fdflags, inode);
		this.node = node;
		this.node.refs++;
	}

	dispose(): Promise<void> {
		this.node.refs--;
		return Promise.resolve();
	}
}

export class FileNodeDescriptor<F extends FileNode> extends NodeDescriptor<F> {

	private _cursor: bigint;

	constructor(deviceId: bigint, fd: fd, rights_base: rights, fdflags: fdflags, inode: bigint, node: F) {
		super(deviceId, fd, Filetype.regular_file, rights_base, 0n, fdflags, inode, node);
		this._cursor = 0n;
	}

	public with(change: { fd: fd }): FileDescriptor {
		return new FileNodeDescriptor(this.deviceId, change.fd, this.rights_base, this.fdflags, this.inode, this.node as F);
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

export class CharacterDeviceNodeDescriptor<C extends CharacterDeviceNode> extends NodeDescriptor<C> {
	constructor(deviceId: bigint, fd: fd, rights_base: rights, fdflags: fdflags, inode: bigint, node: C) {
		super(deviceId, fd, Filetype.regular_file, rights_base, 0n, fdflags, inode, node);
	}

	public with(change: { fd: fd }): FileDescriptor {
		return new CharacterDeviceNodeDescriptor(this.deviceId, change.fd, this.rights_base, this.fdflags, this.inode, this.node as C);
	}
}

export class DirectoryNodeDescriptor<D extends DirectoryNode> extends NodeDescriptor<D> {

	constructor(deviceId: bigint, fd: fd, rights_base: rights, rights_inheriting: rights, fdflags: fdflags, inode: bigint, node: D) {
		super(deviceId, fd, Filetype.directory, rights_base, rights_inheriting, fdflags, inode, node);
	}

	public with(change: { fd: fd }): FileDescriptor {
		return new DirectoryNodeDescriptor(this.deviceId, change.fd, this.rights_base, this.rights_inheriting, this.fdflags, this.inode, this.node as D);
	}

	childDirectoryRights(requested_rights: rights, fileOnlyBaseRights: rights): rights {
		return (this.rights_inheriting & requested_rights) & ~fileOnlyBaseRights;
	}

	childFileRights(requested_rights: rights, directoryOnlyBaseRights: rights): rights {
		return (this.rights_inheriting & requested_rights) & ~directoryOnlyBaseRights;
	}
}

export class WasmRootFileSystemImpl implements RootFileSystem {

	private readonly deviceDrivers: DeviceDrivers;
	private readonly preOpens: Map<string, FileSystemDeviceDriver>;
	private readonly fileDescriptors: FileDescriptors;
	private readonly service: FileSystemService;
	private virtualFileSystem: RootFileSystemDeviceDriver | undefined;
	private singleFileSystem: FileSystemDeviceDriver | undefined;

	constructor(info: RootFileSystemInfo, fileDescriptors: FileDescriptors) {
		this.deviceDrivers = info.deviceDrivers;
		this.preOpens = info.preOpens;
		this.fileDescriptors = fileDescriptors;
		if (info.kind === 'virtual') {
			this.service = FileSystemService.create(info.deviceDrivers, fileDescriptors, info.fileSystem, info.preOpens, {});
			this.virtualFileSystem = info.fileSystem;
		} else {
			this.service = FileSystemService.create(info.deviceDrivers, fileDescriptors, undefined, info.preOpens, {});
			this.singleFileSystem = info.fileSystem;
		}
	}

	public async initialize(): Promise<void> {
		let fd = 3;
		let errno: errno;
		const memory = new ArrayBuffer(1024);
		do {
			errno = await this.service.fd_prestat_get(memory, fd++, 0);
		} while (errno === Errno.success);
	}

	getDeviceDrivers(): DeviceDriver[] {
		return Array.from(this.deviceDrivers.values());
	}

	getPreOpenDirectories(): Map<string, FileSystemDeviceDriver> {
		return this.preOpens;
	}

	getVirtualRootFileSystem(): RootFileSystemDeviceDriver | undefined {
		return this.virtualFileSystem;
	}

	async toVSCode(path: string): Promise<Uri | undefined> {
		try {
			const [deviceDriver, relativePath] = this.getDeviceDriver(path);
			if (deviceDriver === undefined) {
				return undefined;
			}
			return deviceDriver.joinPath(...relativePath.split('/'));
		} catch (error) {
			if (error instanceof WasiError && error.errno === Errno.noent) {
				return undefined;
			}
			throw error;
		}
	}

	async toWasm(uri: Uri): Promise<string | undefined> {
		try {
			const [mountPoint, root] = this.getMountPoint(uri);
			if (mountPoint === undefined) {
				return undefined;
			}
			const relative = uri.toString().substring(root.toString().length + 1);
			return RAL().path.join(mountPoint, relative);
		} catch (error) {
			if (error instanceof WasiError && error.errno === Errno.noent) {
				return undefined;
			}
			throw error;
		}
	}

	async stat(path: string): Promise<{ filetype: ApiFiletype }> {
		const [fileDescriptor, relativePath] = this.getFileDescriptor(path);
		if (fileDescriptor !== undefined) {
			const deviceDriver = this.deviceDrivers.get(fileDescriptor.deviceId);
			if (deviceDriver !== undefined && deviceDriver.kind === 'fileSystem') {
				const result = Filestat.createHeap();
				await deviceDriver.path_filestat_get(fileDescriptor, Lookupflags.none, relativePath, result);
				return { filetype: Filetypes.from(result.filetype) };
			}
		}
		throw new WasiError(Errno.noent);
	}

	private getFileDescriptor(path: string): [FileDescriptor | undefined, string] {
		if (this.virtualFileSystem !== undefined) {
			const [deviceDriver, rest] = this.virtualFileSystem.getDeviceDriver(path);
			if (deviceDriver !== undefined) {
				return [this.fileDescriptors.getRoot(deviceDriver), rest];
			} else {
				return [this.fileDescriptors.getRoot(this.virtualFileSystem), path];
			}
		} else if (this.singleFileSystem !== undefined) {
			return [this.fileDescriptors.getRoot(this.singleFileSystem), path];
		} else {
			return [undefined, path];
		}
	}

	private getDeviceDriver(path: string): [FileSystemDeviceDriver | undefined, string] {
		if (this.virtualFileSystem !== undefined) {
			return this.virtualFileSystem.getDeviceDriver(path);
		} else if (this.singleFileSystem !== undefined) {
			return [this.singleFileSystem, path];
		} else {
			return [undefined, path];
		}
	}

	private getMountPoint(uri: Uri): [string | undefined, Uri] {
		if (this.virtualFileSystem !== undefined) {
			return this.virtualFileSystem.getMountPoint(uri);
		} else if (this.singleFileSystem !== undefined) {
			const uriStr = uri.toString();
			const rootStr = this.singleFileSystem.uri.toString();
			if (uriStr === rootStr || (uriStr.startsWith(rootStr) && uriStr.charAt(rootStr.length) === '/')) {
				return ['/', this.singleFileSystem.uri];
			}
		}
		return [undefined, uri];
	}
}
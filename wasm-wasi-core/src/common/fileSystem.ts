/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Uri } from 'vscode';
import { Filetype as ApiFiletype, RootFileSystem } from './api';
import { Errno, Filestat, Lookupflags, WasiError, Filetype as WasiFiletype, errno, filetype, inode } from './wasi';
import { RootFileSystemDeviceDriver } from './rootFileSystemDriver';
import { DeviceDrivers, RootFileSystemInfo } from './kernel';
import { DeviceDriver, FileSystemDeviceDriver } from './deviceDriver';
import { FileDescriptor, FileDescriptors } from './fileDescriptor';
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

export interface BaseFileNode {

	readonly filetype: typeof ApiFiletype.regular_file;

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

	/**
	 * How often the node is referenced via a file descriptor
	 */
	refs: number;
}

export interface BaseDirectoryNode {

	readonly filetype: typeof ApiFiletype.directory;

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

	/**
	 * How often the node is referenced via a file descriptor
	 */
	refs: number;
}

export type BaseNode = BaseFileNode | BaseDirectoryNode;

export abstract class BaseFileSystem<D extends BaseDirectoryNode, F extends BaseFileNode > {

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

	public refNode(node: BaseNode): void {
		node.refs++;
	}

	public unrefNode(node: BaseNode): void {
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

	async mapPath(path: string): Promise<Uri | undefined> {
		const [deviceDriver, relativePath] = this.getDeviceDriver(path);
		if (deviceDriver === undefined) {
			return undefined;
		}
		return deviceDriver.joinPath(...relativePath.split('/'));
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
}
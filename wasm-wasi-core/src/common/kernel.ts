/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Uri, WorkspaceFolder, WorkspaceFoldersChangeEvent, extensions, workspace } from 'vscode';

import RAL from './ral';
import type { ExtensionLocationDescriptor, MemoryFileSystemDescriptor, VSCodeFileSystemDescriptor, MountPointDescriptor } from './api';
import type { DeviceDriver, DeviceId, FileSystemDeviceDriver } from './deviceDriver';
import type { FileDescriptors } from './fileDescriptor';

import { Errno, WasiError } from './wasi';
import * as ConsoleDriver from './consoleDriver';
import * as vscfs from './vscodeFileSystemDriver';
import * as extlocfs from './extLocFileSystemDriver';
import * as memfs from './memoryFileSystemDriver';
import * as vrfs from './rootFileSystemDriver';

export interface DeviceDrivers {
	add(driver: DeviceDriver): void;
	has (id: DeviceId): boolean;
	hasByUri(uri: Uri): boolean;
	get(id: DeviceId): DeviceDriver;
	getByUri(uri: Uri): DeviceDriver;
	remove(id: DeviceId): void;
	removeByUri(uri: Uri): void;
	size: number;
	values(): IterableIterator<DeviceDriver>;
	entries(): IterableIterator<[bigint, DeviceDriver]>;
	[Symbol.iterator](): IterableIterator<[bigint, DeviceDriver]>;
}

class DeviceDriversImpl {

	private readonly devices: Map<DeviceId, DeviceDriver>;
	private readonly devicesByUri: Map<string, DeviceDriver>;

	public constructor() {
		this.devices = new Map();
		this.devicesByUri = new Map();
	}

	public add(driver: DeviceDriver): void {
		this.devices.set(driver.id, driver);
		this.devicesByUri.set(driver.uri.toString(true), driver);
	}

	public has (id: DeviceId): boolean {
		return this.devices.has(id);
	}

	public hasByUri(uri: Uri): boolean {
		return this.devicesByUri.has(uri.toString(true));
	}

	public get(id: DeviceId): DeviceDriver {
		const driver = this.devices.get(id);
		if (driver === undefined) {
			throw new WasiError(Errno.nxio);
		}
		return driver;
	}

	public getByUri(uri: Uri): DeviceDriver {
		const driver = this.devicesByUri.get(uri.toString(true));
		if (driver === undefined) {
			throw new WasiError(Errno.nxio);
		}
		return driver;
	}

	public remove(id: DeviceId): void {
		const driver = this.devices.get(id);
		if (driver === undefined) {
			throw new WasiError(Errno.nxio);
		}
		this.devices.delete(id);
		this.devicesByUri.delete(driver.uri.toString(true));
	}

	public removeByUri(uri: Uri): void {
		const key = uri.toString(true);
		const driver = this.devicesByUri.get(key);
		if (driver === undefined) {
			throw new WasiError(Errno.nxio);
		}
		this.devices.delete(driver.id);
		this.devicesByUri.delete(key);
	}

	public get size(): number {
		return this.devices.size;
	}

	public values(): IterableIterator<DeviceDriver> {
		return this.devices.values();
	}

	public entries(): IterableIterator<[bigint, DeviceDriver]> {
		return this.devices.entries();
	}

	public [Symbol.iterator](): IterableIterator<[bigint, DeviceDriver]> {
		return this.entries();
	}
}

class LocalDeviceDrivers implements DeviceDrivers {

	private readonly nextDrivers: DeviceDrivers;
	private readonly devices: Map<DeviceId, DeviceDriver>;
	private readonly devicesByUri: Map<string, DeviceDriver>;

	public constructor(next: DeviceDrivers) {
		this.nextDrivers = next;
		this.devices = new Map();
		this.devicesByUri = new Map();
	}

	public add(driver: DeviceDriver): void {
		this.devices.set(driver.id, driver);
		this.devicesByUri.set(driver.uri.toString(true), driver);
	}

	public has(id: bigint): boolean {
		if (this.nextDrivers.has(id)) {
			return true;
		}
		return this.devices.has(id);
	}

	public hasByUri(uri: Uri): boolean {
		if (this.nextDrivers.hasByUri(uri)) {
			return true;
		}
		return this.devicesByUri.has(uri.toString(true));
	}

	public get(id: bigint): DeviceDriver {
		const result = this.devices.get(id);
		if (result !== undefined) {
			return result;
		}
		return this.nextDrivers.get(id);
	}

	public getByUri(uri: Uri): DeviceDriver {
		const result = this.devicesByUri.get(uri.toString(true));
		if (result !== undefined) {
			return result;
		}
		return this.nextDrivers.getByUri(uri);
	}

	public remove(id: bigint): void {
		const driver = this.devices.get(id);
		if (driver !== undefined) {
			this.devices.delete(id);
			this.devicesByUri.delete(driver.uri.toString(true));
			return;
		}
		this.nextDrivers.remove(id);
	}

	public removeByUri(uri: Uri): void {
		const key = uri.toString(true);
		const driver = this.devicesByUri.get(key);
		if (driver !== undefined) {
			this.devices.delete(driver.id);
			this.devicesByUri.delete(key);
			return;
		}
		this.nextDrivers.removeByUri(uri);
	}

	public get size(): number {
		return this.devices.size + this.nextDrivers.size;
	}

	public entries(): IterableIterator<[bigint, DeviceDriver]> {
		let local: IterableIterator<[bigint, DeviceDriver]> | undefined = this.devices.entries();
		const next = this.nextDrivers.entries();
		const iterator: IterableIterator<[bigint, DeviceDriver]> = {
			[Symbol.iterator]: () => {
				return iterator;
			},
			next: (): IteratorResult<[bigint, DeviceDriver]> => {
				if (local !== undefined) {
					const result = local.next();
					if (!result.done) {
						return result;
					}
					local = undefined;
				}
				return next.next();
			}
		};
		return iterator;
	}

	public values(): IterableIterator<DeviceDriver> {
		let local: IterableIterator<DeviceDriver> | undefined = this.devices.values();
		const next = this.nextDrivers.values();
		const iterator: IterableIterator<DeviceDriver> = {
			[Symbol.iterator]: () => {
				return iterator;
			},
			next: (): IteratorResult<DeviceDriver> => {
				if (local !== undefined) {
					const result = local.next();
					if (!result.done) {
						return result;
					}
					local = undefined;
				}
				return next.next();
			}
		};
		return iterator;
	}

	public [Symbol.iterator](): IterableIterator<[bigint, DeviceDriver]> {
		return this.entries();
	}
}

type ExtensionDataFileSystem = {
	id: string;
	kind: 'extensionData';
	path: string;
	mountPoint: string;
};
namespace ExtensionDataFileSystem {
	export function is(value: any): value is Omit<ExtensionDataFileSystem, 'extension'> {
		const candidate = value as ExtensionDataFileSystem;
		return candidate && candidate.kind === 'extensionData' && typeof candidate.id === 'string' && typeof candidate.path === 'string' && typeof candidate.mountPoint === 'string';
	}
}

type FileSystem = ExtensionDataFileSystem;

namespace FileSystem {
	export function is(value: any): value is FileSystem {
		return ExtensionDataFileSystem.is(value);
	}
}

function getSegments(path: string): string[] {
	if (path.charAt(0) === '/') { path = path.substring(1); }
	if (path.charAt(path.length - 1) === '/') { path = path.substring(0, path.length - 1); }
	return path.normalize().split('/');
}

namespace MapDirDescriptors {
	export function isExtensionLocation(descriptor: MountPointDescriptor): descriptor is ExtensionLocationDescriptor {
		return descriptor.kind === 'extensionLocation';
	}
	export function isMemoryDescriptor(descriptor: MountPointDescriptor): descriptor is MemoryFileSystemDescriptor {
		return descriptor.kind === 'memoryFileSystem';
	}
	export function isVSCodeFileSystemDescriptor(descriptor: MountPointDescriptor): descriptor is VSCodeFileSystemDescriptor {
		return descriptor.kind === 'vscodeFileSystem';
	}
	export function getExtensionLocationKey(descriptor: ExtensionLocationDescriptor): Uri {
		return Uri.joinPath(descriptor.extension.extensionUri, ...getSegments(descriptor.path));
	}
	export function getMemoryKey(descriptor: MemoryFileSystemDescriptor): Uri {
		return (descriptor.fileSystem as memfs.MemoryFileSystem).uri;
	}
	export function getVScodeFileSystemKey(descriptor: VSCodeFileSystemDescriptor): Uri {
		return descriptor.uri;
	}
	export function key(descriptor: VSCodeFileSystemDescriptor | ExtensionLocationDescriptor | MemoryFileSystemDescriptor): Uri {
		switch (descriptor.kind) {
			case 'extensionLocation':
				return getExtensionLocationKey(descriptor);
			case 'memoryFileSystem':
				return getMemoryKey(descriptor);
			case 'vscodeFileSystem':
				return getVScodeFileSystemKey(descriptor);
			default:
				throw new Error(`Unknown MapDirDescriptor kind ${JSON.stringify(descriptor, undefined, 0)}`);
		}
	}
	export function getDescriptors(descriptors: MountPointDescriptor[] | undefined) : { extensions: ExtensionLocationDescriptor[]; vscodeFileSystems: VSCodeFileSystemDescriptor[]; memoryFileSystems: MemoryFileSystemDescriptor[]} {
		const extensions: ExtensionLocationDescriptor[] = [];
		const vscodeFileSystems: VSCodeFileSystemDescriptor[] = [];
		const memoryFileSystems: MemoryFileSystemDescriptor[] = [];
		if (descriptors === undefined) {
			return { extensions, vscodeFileSystems, memoryFileSystems: memoryFileSystems };
		}
		for (const descriptor of descriptors) {
			if (descriptor.kind === 'workspaceFolder') {
				const folders = workspace.workspaceFolders;
				if (folders !== undefined) {
					if (folders.length === 1) {
						vscodeFileSystems.push(mapWorkspaceFolder(folders[0], true));
					} else {
						for (const folder of folders) {
							vscodeFileSystems.push(mapWorkspaceFolder(folder, false));
						}
					}
				}
			} else if (descriptor.kind === 'extensionLocation') {
				extensions.push(descriptor);
			} else if (descriptor.kind === 'vscodeFileSystem') {
				vscodeFileSystems.push(descriptor);
			} else if (descriptor.kind === 'memoryFileSystem') {
				memoryFileSystems.push(descriptor);
			}
		}
		return { extensions, vscodeFileSystems, memoryFileSystems: memoryFileSystems };
	}

	function mapWorkspaceFolder(folder: WorkspaceFolder, single: boolean): VSCodeFileSystemDescriptor {
		const path = RAL().path;
		const mountPoint: string = single
			? path.join(path.sep, 'workspace')
			: path.join(path.sep, 'workspaces', folder.name);

		return { kind: 'vscodeFileSystem', uri: folder.uri, mountPoint };
	}
}

export enum ManageKind {
	no = 1,
	yes = 2,
	default = 3
}

export interface SingleFileSystemInfo {
	kind: 'single';
	fileSystem: FileSystemDeviceDriver;
	deviceDrivers: DeviceDrivers;
	preOpens: Map<string, FileSystemDeviceDriver>;
}

export interface VirtualFileSystemInfo {
	kind: 'virtual';
	fileSystem: vrfs.RootFileSystemDeviceDriver;
	deviceDrivers: DeviceDrivers;
	preOpens: Map<string, FileSystemDeviceDriver>;
}

export type RootFileSystemInfo = SingleFileSystemInfo | VirtualFileSystemInfo;

class FileSystems {

	private readonly contributionIdToUri: Map<string, Uri>;
	private contributedFileSystems: Map<string, MountPointDescriptor>;
	private readonly fileSystemDeviceDrivers: Map<string, FileSystemDeviceDriver>;

	constructor() {
		this.contributionIdToUri = new Map();
		this.contributedFileSystems = new Map();
		this.fileSystemDeviceDrivers = new Map();

		// Handle workspace folders
		this.parseWorkspaceFolders();
		workspace.onDidChangeWorkspaceFolders(event => this.handleWorkspaceFoldersChanged(event));

		const fileSystems = this.parseFileSystems();
		for (const fileSystem of fileSystems) {
			this.contributedFileSystems.set(fileSystem.id.toString(), fileSystem.mapDir);
			this.contributionIdToUri.set(fileSystem.contributionId, fileSystem.id);
		}
		extensions.onDidChange(() => this.handleExtensionsChanged());
	}

	public async getFileSystem(uri: Uri): Promise<FileSystemDeviceDriver | undefined> {
		const key = uri.toString();
		let result = this.fileSystemDeviceDrivers.get(key);
		if (result !== undefined) {
			return result;
		}
		const mapDir = this.contributedFileSystems.get(key);
		if (mapDir !== undefined) {
			if (mapDir.kind === 'extensionLocation') {
				try {
					const result = await this.createExtensionLocationFileSystem(mapDir);
					this.fileSystemDeviceDrivers.set(key, result);
				} catch (error) {
					return undefined;
				}
			}
		}
		return undefined;
	}

	public async createRootFileSystem(fileDescriptors: FileDescriptors, descriptors: MountPointDescriptor[]): Promise<RootFileSystemInfo> {
		const fileSystems: FileSystemDeviceDriver[] = [];
		const preOpens: Map<string, FileSystemDeviceDriver> = new Map();
		const { extensions, vscodeFileSystems, memoryFileSystems } = MapDirDescriptors.getDescriptors(descriptors);
		if (extensions.length > 0) {
			for (const descriptor of extensions) {
				const key = MapDirDescriptors.getExtensionLocationKey(descriptor);
				let fs = this.fileSystemDeviceDrivers.get(key.toString());
				if (fs === undefined) {
					fs = await this.createExtensionLocationFileSystem(descriptor);
					this.fileSystemDeviceDrivers.set(key.toString(), fs);
				}
				fileSystems.push(fs);
				preOpens.set(descriptor.mountPoint, fs);
			}
		}
		if (vscodeFileSystems.length > 0) {
			for (const descriptor of vscodeFileSystems) {
				const key = MapDirDescriptors.getVScodeFileSystemKey(descriptor);
				let fs = this.fileSystemDeviceDrivers.get(key.toString());
				if (fs === undefined) {
					fs = vscfs.create(WasiKernel.nextDeviceId(), descriptor.uri, !(workspace.fs.isWritableFileSystem(descriptor.uri.scheme) ?? true));
					this.fileSystemDeviceDrivers.set(key.toString(), fs);
				}
				fileSystems.push(fs);
				preOpens.set(descriptor.mountPoint, fs);
			}
		}
		if (memoryFileSystems.length > 0) {
			for (const descriptor of memoryFileSystems) {
				const fs = memfs.create(WasiKernel.nextDeviceId(), descriptor.fileSystem as memfs.MemoryFileSystem);
				fileSystems.push(fs);
				preOpens.set(descriptor.mountPoint, fs);
			}
		}

		let needsRootFs = false;
		for (const mountPoint of preOpens.keys()) {
			if (mountPoint === '/') {
				if (preOpens.size > 1) {
					throw new Error(`Cannot mount root directory when other directories are mounted as well.`);
				}
			} else {
				needsRootFs = true;
			}
		}
		const deviceDrivers = new DeviceDriversImpl();
		let result: RootFileSystemInfo;
		if (needsRootFs) {
			const mountPoints: Map<string, FileSystemDeviceDriver> = new Map(Array.from(preOpens.entries()));
			const fs = vrfs.create(WasiKernel.nextDeviceId(), fileDescriptors, mountPoints);
			preOpens.set('/', fs);
			fileSystems.push(fs);
			result = { kind: 'virtual', fileSystem: fs, deviceDrivers, preOpens };
		} else {
			result = { kind: 'single', fileSystem: fileSystems[0], deviceDrivers, preOpens };
		}
		for (const fs of fileSystems) {
			deviceDrivers.add(fs);
		}
		return result;
	}

	public async getOrCreateFileSystemByDescriptor(deviceDrivers: DeviceDrivers, descriptor: VSCodeFileSystemDescriptor | ExtensionLocationDescriptor | MemoryFileSystemDescriptor, manage: ManageKind = ManageKind.default): Promise<FileSystemDeviceDriver> {
		const key = MapDirDescriptors.key(descriptor);
		if (deviceDrivers.hasByUri(key)) {
			return deviceDrivers.getByUri(key) as FileSystemDeviceDriver;
		}
		let result = this.fileSystemDeviceDrivers.get(key.toString());
		if (result !== undefined) {
			deviceDrivers.add(result);
			return result;
		}
		if (MapDirDescriptors.isExtensionLocation(descriptor)) {
			result = await this.createExtensionLocationFileSystem(descriptor);
			if (manage === ManageKind.default) {
				manage = ManageKind.yes;
			}
		} else if (MapDirDescriptors.isMemoryDescriptor(descriptor)) {
			result = memfs.create(WasiKernel.nextDeviceId(), descriptor.fileSystem as memfs.MemoryFileSystem);
			if (manage === ManageKind.default) {
				manage = ManageKind.no;
			}
		} else if (MapDirDescriptors.isVSCodeFileSystemDescriptor(descriptor)) {
			result = vscfs.create(WasiKernel.nextDeviceId(), descriptor.uri, !(workspace.fs.isWritableFileSystem(descriptor.uri.scheme) ?? true));
			if (manage === ManageKind.default) {
				manage = ManageKind.yes;
			}
		}
		if (result !== undefined && manage === ManageKind.yes) {
			this.fileSystemDeviceDrivers.set(key.toString(), result);
		}
		if (result === undefined) {
			throw new Error(`Unable to create file system for ${JSON.stringify(descriptor, undefined, 0)}`);
		}
		deviceDrivers.add(result);
		return result;
	}

	private parseFileSystems(): { id: Uri; contributionId: string; mapDir: MountPointDescriptor }[] {
		const result: { id: Uri; contributionId: string; mapDir: MountPointDescriptor }[] = [];
		for (const extension of extensions.all) {
			const packageJSON = extension.packageJSON;
			const fileSystems: FileSystem[] = packageJSON?.contributes?.wasm?.fileSystems;
			if (fileSystems !== undefined) {
				for (const contribution of fileSystems) {
					if (ExtensionDataFileSystem.is(contribution)) {
						const mapDir: ExtensionLocationDescriptor = {
							kind: 'extensionLocation',
							extension: extension,
							path: contribution.path,
							mountPoint: contribution.mountPoint
						};
						const id = Uri.joinPath(extension.extensionUri, ...getSegments(contribution.path));
						result.push({ id, contributionId: contribution.id, mapDir });
					}
				}
			}
		}
		return result;
	}

	private handleExtensionsChanged(): void {
		const oldFileSystems: Map<string, MountPointDescriptor> = new Map(this.contributedFileSystems.entries());
		const newFileSystems: Map<string, MountPointDescriptor> = new Map(this.parseFileSystems().map(fileSystem => [fileSystem.id.toString(), fileSystem.mapDir]));
		const added: Map<string, MountPointDescriptor> = new Map();
		for (const [id, newFileSystem] of newFileSystems) {
			if (oldFileSystems.has(id)) {
				oldFileSystems.delete(id);
			} else {
				added.set(id, newFileSystem);
			}
		}
		for (const [id, add] of added) {
			this.contributedFileSystems.set(id, add);
		}
		for (const id of oldFileSystems.keys()) {
			this.contributedFileSystems.delete(id);
			this.fileSystemDeviceDrivers.delete(id);
		}
	}

	private parseWorkspaceFolders(): void {
		const folders = workspace.workspaceFolders;
		if (folders !== undefined) {
			for (const folder of folders) {
				const key = folder.uri.toString();
				if (!this.fileSystemDeviceDrivers.has(key)) {
					const driver = vscfs.create(WasiKernel.nextDeviceId(), folder.uri, !(workspace.fs.isWritableFileSystem(folder.uri.scheme) ?? true));
					this.fileSystemDeviceDrivers.set(key, driver);
				}
			}
		}
	}

	private handleWorkspaceFoldersChanged(event: WorkspaceFoldersChangeEvent): void {
		for (const added of event.added) {
			const key = added.uri.toString();
			if (!this.fileSystemDeviceDrivers.has(key)) {
				const driver = vscfs.create(WasiKernel.nextDeviceId(), added.uri, !(workspace.fs.isWritableFileSystem(added.uri.scheme) ?? true));
				this.fileSystemDeviceDrivers.set(key, driver);
			}
		}
		for (const removed of event.removed) {
			const key = removed.uri.toString();
			this.fileSystemDeviceDrivers.delete(key);
		}
	}

	private async createExtensionLocationFileSystem(descriptor: ExtensionLocationDescriptor): Promise<FileSystemDeviceDriver> {
		let extensionUri = descriptor.extension.extensionUri;
		extensionUri = extensionUri.with({ path: RAL().path.join(extensionUri.path, descriptor.path) });

		const paths = RAL().path;
		const basename = paths.basename(descriptor.path);
		const dirname = paths.dirname(descriptor.path);
		const dirDumpFileUri = Uri.joinPath(descriptor.extension.extensionUri, dirname, `${basename}.dir.json`);
		try {
			const content = await workspace.fs.readFile(dirDumpFileUri);
			const dirDump = JSON.parse(RAL().TextDecoder.create().decode(content));
			const extensionFS = extlocfs.create(WasiKernel.nextDeviceId(), extensionUri, dirDump);
			return extensionFS;
		} catch (error) {
			RAL().console.error(`Failed to read directory dump file ${dirDumpFileUri.toString()}: ${error}`);
			throw error;
		}
	}
}

namespace WasiKernel {
	let deviceCounter: DeviceId = 1n;
	export function nextDeviceId(): bigint {
		return deviceCounter++;
	}

	const fileSystems = new FileSystems();
	export function getOrCreateFileSystemByDescriptor(deviceDrivers: DeviceDrivers, descriptor: VSCodeFileSystemDescriptor | ExtensionLocationDescriptor | MemoryFileSystemDescriptor): Promise<FileSystemDeviceDriver> {
		return fileSystems.getOrCreateFileSystemByDescriptor(deviceDrivers, descriptor);
	}
	export function createRootFileSystem(fileDescriptors: FileDescriptors, descriptors: MountPointDescriptor[]): Promise<RootFileSystemInfo> {
		return fileSystems.createRootFileSystem(fileDescriptors, descriptors);
	}

	export const deviceDrivers = new DeviceDriversImpl();
	// By default we have a console
	export const console = ConsoleDriver.create(nextDeviceId());
	deviceDrivers.add(console);
	export function createLocalDeviceDrivers(): DeviceDrivers {
		return new LocalDeviceDrivers(deviceDrivers);
	}
}

export default WasiKernel;
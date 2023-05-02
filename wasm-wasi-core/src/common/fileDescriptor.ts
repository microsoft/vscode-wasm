/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { DeviceDriver } from './deviceDriver';
import {
	Errno, fd, fdflags, Filetype, filetype, oflags, Rights, rights, WasiError
} from './wasi';

type DeviceId = bigint;

export interface FileDescriptor {

	readonly deviceId: DeviceId;

	/**
	 * The WASI file descriptor id
	 */
	readonly fd: fd;

	/**
	 * The file type
	 */
	readonly fileType: filetype;

	/**
	 * The base rights.
	 */
	readonly rights_base: rights;

	/**
	 * The inheriting rights
	 */
	readonly rights_inheriting: rights;

	/**
	 * The file descriptor flags.
	 */
	fdflags: fdflags;

	/**
	 * The inode the file descriptor is pointing to.
	 */
	readonly inode: bigint;

	/**
	 * Dispose resource associated with this file descriptor.
	 */
	dispose?(): Promise<void>;

	/**
	 * Create a new file descriptor with the given changes.
	 *
	 * @param change The changes to apply to the file descriptor.
	 */
	with(change: { fd: fd }): FileDescriptor;

	/**
	 * Check if the base rights contain the given rights.
	 *
	 * @param rights The rights to check.
	 */
	containsBaseRights(rights: rights): boolean;

	/**
	 * Asserts the given rights.
	 *
	 * @param right the rights to assert.
	 */
	assertRights(rights: rights): void;

	/**
	 * Asserts the given base rights.
	 *
	 * @param right the rights to assert.
	 */
	assertBaseRights(rights: rights): void;

	/**
	 * Asserts the given base rights.
	 *
	 * @param right the rights to assert.
	 */
	assertInheritingRights(rights: rights): void;

	/**
	 * Asserts the given fdflags.
	 *
	 * @param fdflags The fdflags to assert.
	 */
	assertFdflags(fdflags: fdflags): void;

	/**
	 * Asserts the given oflags.
	 *
	 * @param oflags The oflags to assert.
	 */
	assertOflags(oflags: oflags): void;

	/**
	 * Asserts that the file descriptor points to a directory.
	 */
	assertIsDirectory(): void;
}

export abstract class BaseFileDescriptor implements FileDescriptor {

	public readonly deviceId: bigint;

	public readonly fd: fd;

	public readonly fileType: filetype;

	public readonly rights_base: rights;

	public readonly rights_inheriting: rights;

	public fdflags: fdflags;

	public readonly inode: bigint;

	constructor(deviceId: bigint, fd: fd, fileType: filetype, rights_base: rights, rights_inheriting: rights, fdflags: fdflags, inode: bigint) {
		this.deviceId = deviceId;
		this.fd = fd;
		this.fileType = fileType;
		this.rights_base = rights_base;
		this.rights_inheriting = rights_inheriting;
		this.fdflags = fdflags;
		this.inode = inode;
	}

	dispose?(): Promise<void>;

	abstract with(change: { fd: fd }): FileDescriptor;

	public containsBaseRights(rights: rights): boolean {
		return (this.rights_base & rights) === rights;
	}

	public assertRights(rights: rights): void {
		if (((this.rights_base | this.rights_inheriting) & rights) === rights) {
			return;
		}
		throw new WasiError(Errno.perm);
	}

	public assertBaseRights(rights: rights): void {
		if ((this.rights_base & rights) === rights) {
			return;
		}
		throw new WasiError(Errno.perm);
	}

	public assertInheritingRights(rights: rights): void {
		if ((this.rights_inheriting & rights) === rights) {
			return;
		}
		throw new WasiError(Errno.perm);
	}


	public assertFdflags(fdflags: fdflags): void {
		if (!Rights.supportFdflags(this.rights_base, fdflags)) {
			throw new WasiError(Errno.perm);
		}
	}

	public assertOflags(oflags: oflags): void {
		if (!Rights.supportOflags(this.rights_base, oflags)) {
			throw new WasiError(Errno.perm);
		}
	}

	public assertIsDirectory(): void {
		if (this.fileType !== Filetype.directory) {
			throw new WasiError(Errno.notdir);
		}
	}
}

export interface FdProvider {
	next(): fd;
}

export class FileDescriptors implements FdProvider {

	private readonly descriptors: Map<fd, FileDescriptor> = new Map();
	private readonly rootDescriptors: Map<DeviceId, FileDescriptor> = new Map();

	private mode: 'init' | 'running' = 'init';
	private counter: fd = 0;
	private firstReal: fd = 3;

	constructor() {
	}

	public get firstRealFileDescriptor(): fd {
		return this.firstReal;
	}

	public next(): fd {
		if (this.mode === 'init') {
			throw new WasiError(Errno.inval);
		}
		return this.counter++;
	}

	public switchToRunning(start: fd): void {
		if (this.mode === 'running') {
			throw new WasiError(Errno.inval);
		}
		this.mode = 'running';
		this.counter = start;
		this.firstReal = start;
	}

	public add(descriptor: FileDescriptor): void {
		this.descriptors.set(descriptor.fd, descriptor);
	}

	public get(fd: fd): FileDescriptor {
		const descriptor = this.descriptors.get(fd);
		if (!descriptor) {
			throw new WasiError(Errno.badf);
		}
		return descriptor;
	}

	public has(fd: fd): boolean {
		return this.descriptors.has(fd);
	}

	public delete(descriptor: FileDescriptor): boolean {
		return this.descriptors.delete(descriptor.fd);
	}

	public setRoot(driver: DeviceDriver, descriptor: FileDescriptor): void {
		this.rootDescriptors.set(driver.id, descriptor);
	}

	public getRoot(driver: DeviceDriver): FileDescriptor | undefined {
		return this.rootDescriptors.get(driver.id);
	}

	public entries(): IterableIterator<[number, FileDescriptor]> {
		return this.descriptors.entries();
	}

	public keys(): IterableIterator<number> {
		return this.descriptors.keys();
	}

	public values(): IterableIterator<FileDescriptor> {
		return this.descriptors.values();
	}

	public [Symbol.iterator](): IterableIterator<[number, FileDescriptor]> {
		return this.entries();
	}
}
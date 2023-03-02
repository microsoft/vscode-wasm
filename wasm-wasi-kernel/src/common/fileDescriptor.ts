/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

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
	 * Asserts the given base rights.
	 *
	 * @param right the rights to assert.
	 */
	assertBaseRights(right: rights): void;

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

	abstract with(change: { fd: fd }): FileDescriptor;

	public containsBaseRights(rights: rights): boolean {
		return (this.rights_base & rights) === rights;
	}
	public assertBaseRights(rights: rights): void {
		if ((this.rights_base & rights) === rights) {
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
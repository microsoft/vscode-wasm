/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { URI } from 'vscode-uri';

import { ApiClient, size } from '@vscode/sync-api-client';

import { BigInts } from './converter';
import { BaseFileDescriptor, DeviceDriver, FileDescriptor, NoSysDeviceDriver, DeviceIds } from './deviceDriver';
import { fdstat, filestat, Literal, dirent, Rights, fd, rights, fdflags, Filetype, WasiError, Errno } from './wasiTypes';

import RAL from './ral';
const paths = RAL().path;

class FileFileDescriptor extends BaseFileDescriptor {

	/**
	 * The cursor into the file's content;
	 */
	private _cursor: number;

	constructor(fd: fd, inode: bigint, rights_base: rights, rights_inheriting: rights, fdflags: fdflags) {
		super(fd, inode, Filetype.regular_file, rights_base, rights_inheriting, fdflags);
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

	public read(content: Uint8Array, resultBuffer: Uint8Array): size {
		const realRead = Math.min(resultBuffer.length, content.byteLength - this._cursor);
		resultBuffer.set(content.subarray(this._cursor, this._cursor + realRead));
		this._cursor = this._cursor + realRead;
		return realRead;
	}

	public write(content: Uint8Array, buffers: Uint8Array[]): [Uint8Array, size] {
		let bytesToWrite: size = 0;
		for (const bytes of buffers) {
			bytesToWrite += bytes.byteLength;
		}

		// Do we need to increase the buffer
		if (this._cursor + bytesToWrite > content.byteLength) {
			const newContent = new Uint8Array(this._cursor + bytesToWrite);
			newContent.set(content);
			content = newContent;
		}

		for (const bytes of buffers) {
			content.set(bytes, this._cursor);
			this._cursor += bytes.length;
		}

		return [content, bytesToWrite];
	}
}

class DirectoryFileDescriptor extends BaseFileDescriptor {
	constructor(fd: fd, inode: bigint, rights_base: rights, rights_inheriting: rights, fdflags: fdflags) {
		super(fd, inode, Filetype.directory, rights_base, rights_inheriting, fdflags);
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
	openFds: number;

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

export default function create(apiClient: ApiClient, textEncoder: RAL.TextEncoder): DeviceDriver {

	const vscode_fs = apiClient.vscode.workspace.fileSystem;

	const path2INode: Map<string, INode> = new Map();
	const inodes: Map<bigint, INode> = new Map();
	const deletedINode: Map<bigint, INode> = new Map();

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


	return Object.assign({}, NoSysDeviceDriver, {
		id: DeviceIds.next(),
		fd_advise(fd: FileDescriptor, _offset: bigint, _length: bigint, _advise: number): void {
			fd.assertBaseRight(Rights.fd_advise);
			// We don't have advisory in VS Code. So treat it as successful.
			return;
		},
		fd_allocate(fd: FileDescriptor, _offset: bigint, _len: bigint): void {
			if (!(fd instanceof FileFileDescriptor)) {
				throw new WasiError(Errno.badf);
			}
			fd.assertBaseRight(Rights.fd_allocate);

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

		}
	});
}

export class VSCodeFileSystemDriver implements DeviceDriver {

	public readonly id: bigint;
	private readonly uri: URI;
	private readonly mountPoint: string;


	constructor(uri: URI, mountPoint: string) {
		this.id = DeviceIds.next();
		this.uri = uri;
		this.mountPoint = mountPoint;
	}

	fd_close(fd: FileDescriptor): void {
		throw new Error('Method not implemented.');
	}
	fd_datasync(fd: FileDescriptor): void {
		throw new Error('Method not implemented.');
	}
	fd_fdstat_get(fd: FileDescriptor, result: fdstat): void {
		throw new Error('Method not implemented.');
	}
	fd_fdstat_set_flags(fd: FileDescriptor, fdflags: number): void {
		throw new Error('Method not implemented.');
	}
	fd_filestat_get(fd: FileDescriptor, result: filestat): void {
		throw new Error('Method not implemented.');
	}
	fd_filestat_set_size(fd: FileDescriptor, size: bigint): void {
		throw new Error('Method not implemented.');
	}
	fd_filestat_set_times(fd: FileDescriptor, atim: bigint, mtim: bigint, fst_flags: number): void {
		throw new Error('Method not implemented.');
	}
	fd_pread(fd: FileDescriptor, offset: number, bytesToRead: number): Uint8Array {
		throw new Error('Method not implemented.');
	}
	fd_pwrite(fd: FileDescriptor, offset: number, bytes: Uint8Array): number {
		throw new Error('Method not implemented.');
	}
	fd_read(fd: FileDescriptor, buffers: Uint8Array[]): number {
		throw new Error('Method not implemented.');
	}
	fd_readdir(fd: FileDescriptor): Literal<dirent>[] {
		throw new Error('Method not implemented.');
	}
	fd_seek(fd: FileDescriptor, offset: bigint, whence: number, new_offset_ptr: number): void {
		throw new Error('Method not implemented.');
	}
	fd_sync(fd: FileDescriptor): void {
		throw new Error('Method not implemented.');
	}
	fd_tell(fd: FileDescriptor, offset_ptr: number): void {
		throw new Error('Method not implemented.');
	}
	fd_write(fd: FileDescriptor, buffers: Uint8Array[]): number {
		throw new Error('Method not implemented.');
	}
	path_create_directory(fd: FileDescriptor, path: string): void {
		throw new Error('Method not implemented.');
	}
	path_filestat_get(fd: FileDescriptor, flags: number, path: string, result: filestat): void {
		throw new Error('Method not implemented.');
	}
	path_filestat_set_times(fd: FileDescriptor, flags: number, path: string, atim: bigint, mtim: bigint, fst_flags: number): void {
		throw new Error('Method not implemented.');
	}
	path_link(old_fd: FileDescriptor, old_flags: number, old_path: string, new_fd: FileDescriptor, new_path: string): void {
		throw new Error('Method not implemented.');
	}
	path_open(fd: FileDescriptor, dirflags: number, path: string, oflags: number, fs_rights_base: bigint, fs_rights_inheriting: bigint, fdflags: number): FileDescriptor {
		throw new Error('Method not implemented.');
	}
	path_readlink(fd: FileDescriptor, path: string): string {
		throw new Error('Method not implemented.');
	}
	path_remove_directory(fd: FileDescriptor, path: string): void {
		throw new Error('Method not implemented.');
	}
	path_rename(fd: FileDescriptor, old_path: string, new_fd: number, new_path: string): void {
		throw new Error('Method not implemented.');
	}
	path_symlink(old_path: string, fd: FileDescriptor, new_path: string): void {
		throw new Error('Method not implemented.');
	}
	path_unlink_file(fd: FileDescriptor, path: string): void {
		throw new Error('Method not implemented.');
	}

}
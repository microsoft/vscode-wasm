/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { URI } from 'vscode-uri';

import { ApiClient, size } from '@vscode/sync-api-client';

import { BigInts, code2Wasi } from './converter';
import { BaseFileDescriptor, DeviceDriver, FileDescriptor, NoSysDeviceDriver, DeviceIds, ReaddirEntry } from './deviceDriver';
import { fdstat, filestat, dirent, Rights, fd, rights, fdflags, Filetype, WasiError, Errno, filetype, Whence, lookupflags, timestamp, fstflags, oflags, Oflags } from './wasiTypes';

import RAL from './ral';
import { u64 } from './baseTypes';
const paths = RAL().path;

class FileFileDescriptor extends BaseFileDescriptor {

	/**
	 * The cursor into the file's content;
	 */
	private _cursor: number;

	/**
	 * The path used when opening the file descriptor.
	 */
	public readonly path: string;

	constructor(fd: fd, rights_base: rights, rights_inheriting: rights, fdflags: fdflags, inode: bigint, path: string) {
		super(fd, Filetype.regular_file, rights_base, rights_inheriting, fdflags, inode);
		this._cursor = 0;
		this.path = path;
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

	/**
	 * The path used when opening the file descriptor.
	 */
	public readonly path: string;

	constructor(fd: fd, rights_base: rights, rights_inheriting: rights, fdflags: fdflags, inode: bigint, path: string) {
		super(fd, Filetype.directory, rights_base, rights_inheriting, fdflags, inode);
		this.path = path;
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
	refs: number;

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

	let inodeCounter: bigint = 1n;
	const path2INode: Map<string, INode> = new Map();
	const inodes: Map<bigint, INode> = new Map();
	const deletedINode: Map<bigint, INode> = new Map();

	const deviceId = DeviceIds.next();

	function getOrCreateINode(filepath: string, uri: URI, ref: boolean): INode {
		let result = path2INode.get(filepath);
		if (result !== undefined) {
			if (ref) {
				result.refs++;
			}
			return result;
		}
		result = { id: inodeCounter++, uri, refs: 0, content: undefined };
		if (ref) {
			result.refs++;
		}
		path2INode.set(filepath, result);
		inodes.set(result.id, result);
		return result;
	}

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

	function uriJoin(uri: URI, name: string): URI {
		if (name === '.') {
			return uri;
		}
		return uri.with( { path: paths.join(uri.path, name)} );
	}


	function doStat(inode: INode, result: filestat): void {
		const vStat = vscode_fs.stat(inode.uri);
		result.dev = deviceId;
		result.ino = inode.id;
		result.filetype = code2Wasi.asFileType(vStat.type);
		result.nlink = 0n;
		result.size = BigInt(vStat.size);
		result.atim = BigInt(vStat.mtime);
		result.ctim = BigInt(vStat.ctime);
		result.mtim = BigInt(vStat.mtime);
	}

	function writeContent(inode: Required<INode>) {
		vscode_fs.writeFile(inode.uri, inode.content);
	}

	return Object.assign({}, NoSysDeviceDriver, {
		id: deviceId,
		fd_advise(fileDescriptor: FileDescriptor, _offset: bigint, _length: bigint, _advise: number): void {
			fileDescriptor.assertBaseRight(Rights.fd_advise);
			// We don't have advisory in VS Code. So treat it as successful.
			return;
		},
		fd_allocate(fileDescriptor: FileDescriptor, _offset: bigint, _len: bigint): void {
			if (!(fileDescriptor instanceof FileFileDescriptor)) {
				throw new WasiError(Errno.badf);
			}

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

		},
		fd_close(fileDescriptor: FileDescriptor): void {
			unrefINode(fileDescriptor.inode);
		},
		fd_datasync(fileDescriptor: FileDescriptor): void {
			if (!(fileDescriptor instanceof FileFileDescriptor)) {
				throw new WasiError(Errno.badf);
			}
			const inode = getINode(fileDescriptor.inode);
			if (!INode.hasContent(inode)) {
				return;
			}
			writeContent(inode);
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
			if (!(fileDescriptor instanceof FileFileDescriptor)) {
				throw new WasiError(Errno.badf);
			}
			const inode = getINode(fileDescriptor.inode);
			doStat(inode, result);
		},
		fd_filestat_set_size(fileDescriptor: FileDescriptor, _size: bigint): void {
			if (!(fileDescriptor instanceof FileFileDescriptor)) {
				throw new WasiError(Errno.badf);
			}
			const size = BigInts.asNumber(_size);
			const inode = getResolvedINode(fileDescriptor.inode);
			const content = inode.content;
			if (content.byteLength === size) {
				return;
			} else if (content.byteLength < size) {
				const newContent = new Uint8Array(size);
				newContent.set(content);
				inode.content = newContent;
			} else if (content.byteLength > size) {
				const newContent = new Uint8Array(size);
				newContent.set(content.subarray(0, size));
				inode.content = newContent;
			}
			writeContent(inode);
		},
		fd_filestat_set_times(_fileDescriptor: FileDescriptor, _atim: bigint, _mtim: bigint, _fst_flags: number): void {
			// For new we do nothing. We could cache the timestamp in memory
			// But we would loose them during reload. We could also store them
			// in local storage
		},
		fd_pread(fileDescriptor: FileDescriptor, offset: number, bytesToRead: number): Uint8Array {
			const content = getResolvedINode(fileDescriptor.inode).content;
			const realRead = Math.min(bytesToRead, content.byteLength - offset);
			return content.subarray(offset, offset + realRead);
		},
		fd_pwrite(fileDescriptor: FileDescriptor, offset: number, bytes: Uint8Array): number {
			const inode = getResolvedINode(fileDescriptor.inode);
			let content = inode.content;
			const total = offset + bytes.byteLength;
			// Make the file bigger
			if (total > content.byteLength) {
				const newContent = new Uint8Array(total);
				newContent.set(content);
				content = newContent;
				inode.content = newContent;
			}
			content.set(bytes, offset);
			writeContent(inode);
			return bytes.length;
		},
		fd_read(fileDescriptor: FileDescriptor, buffers: Uint8Array[]): number {
			if (buffers.length === 0) {
				return 0;
			}
			if (!(fileDescriptor instanceof FileFileDescriptor)) {
				throw new WasiError(Errno.badf);
			}
			const content = getResolvedINode(fileDescriptor.inode).content;
			let totalBytesRead = 0;
			for (const buffer of buffers) {
				const bytesRead = fileDescriptor.read(content, buffer);
				totalBytesRead += bytesRead;
				if (bytesRead === 0) {
					break;
				}
			}
			return totalBytesRead;
		},
		fd_readdir(fileDescriptor: FileDescriptor): ReaddirEntry[] {
			if (!(fileDescriptor instanceof DirectoryFileDescriptor)) {
				throw new WasiError(Errno.badf);
			}
			// Also unclear whether we have to include '.' and '..'
			// See also https://github.com/WebAssembly/wasi-filesystem/issues/3
			const inode = getINode(fileDescriptor.inode);
			const entries = vscode_fs.readDirectory(inode.uri);
			const result: ReaddirEntry[] = [];
			for (const entry of entries) {
				const name = entry[0];
				const filePath = paths.join(fileDescriptor.path, name);
				const fileUri = uriJoin(inode.uri, name);
				result.push({ d_ino: getOrCreateINode(filePath, fileUri, false).id, d_type: code2Wasi.asFileType(entry[1]), d_name: textEncoder.encode(entry[0]) });
			}
			return result;
		},
		fd_seek(fileDescriptor: FileDescriptor, _offset: bigint, whence: number): bigint {
			if (!(fileDescriptor instanceof FileFileDescriptor)) {
				throw new WasiError(Errno.badf);
			}
			const offset = BigInts.asNumber(_offset);
			switch(whence) {
				case Whence.set:
					fileDescriptor.cursor = offset;
					break;
				case Whence.cur:
					fileDescriptor.cursor = fileDescriptor.cursor + offset;
					break;
				case Whence.end:
					const inode = getResolvedINode(fileDescriptor.inode);
					fileDescriptor.cursor = Math.max(0, inode.content.byteLength + offset);
					break;
			}
			return BigInt(fileDescriptor.cursor);
		},
		fd_sync(fileDescriptor: FileDescriptor): void {
			const inode = getINode(fileDescriptor.inode);
			if (!INode.hasContent(inode)) {
				return;
			}
			writeContent(inode);
		},
		fd_tell(fileDescriptor: FileDescriptor): u64 {
			if (!(fileDescriptor instanceof FileFileDescriptor)) {
				throw new WasiError(Errno.badf);
			}
			return BigInt(fileDescriptor.cursor);
		},
		fd_write(fileDescriptor: FileDescriptor, buffers: Uint8Array[]): number {
			if (buffers.length === 0) {
				return 0;
			}
			if (!(fileDescriptor instanceof FileFileDescriptor)) {
				throw new WasiError(Errno.badf);
			}
			const inode = getResolvedINode(fileDescriptor.inode);
			const [content, bytesWritten] = fileDescriptor.write(inode.content, buffers);
			inode.content = content;
			writeContent(inode);
			return bytesWritten;
		},
		path_create_directory(fileDescriptor: FileDescriptor, path: string): void {
			const inode = getINode(fileDescriptor.inode);
			vscode_fs.createDirectory(uriJoin(inode.uri, path));
		},
		path_filestat_get(fileDescriptor: FileDescriptor, _flags: lookupflags, path: string, result: filestat): void {
			if (!(fileDescriptor instanceof FileFileDescriptor) && !(fileDescriptor instanceof DirectoryFileDescriptor)) {
				throw new WasiError(Errno.badf);
			}
			const inode = getINode(fileDescriptor.inode);
			const filePath = paths.join(fileDescriptor.path, path);
			const fileUri = uriJoin(inode.uri, path);
			doStat(getOrCreateINode(filePath, fileUri, false), result);
		},
		path_filestat_set_times(_fileDescriptor: FileDescriptor, _flags: lookupflags, _path: string, _atim: timestamp, _mtim: timestamp, _fst_flags: fstflags): void {
			// For now we do nothing. We could cache the timestamp in memory
			// But we would loose them during reload. We could also store them
			// in local storage
		},
		path_link(_oldFileDescriptor: FileDescriptor, _old_flags: lookupflags, _old_path: string, _newFileDescriptor: FileDescriptor, _new_path: string): void {
			// For now we do nothing. If we need to implement this we need
			// support from the VS Code API.
		},
		path_open(parentDescriptor: FileDescriptor, dirflags: lookupflags, path: string, oflags: oflags, fs_rights_base: rights, fs_rights_inheriting: rights, fdflags: fdflags): FileDescriptor {

			let filetype: filetype | undefined = fileSystem.path_filetype(parentDescriptor, name);
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
				const dirname = paths.dirname(name);
				// The name has a directory part. Ensure that the directory exists
				if (dirname !== '.') {
					const dirFiletype = fileSystem.path_filetype(parentDescriptor, dirname);
					if (dirFiletype === undefined || dirFiletype !== Filetype.directory) {
						return Errno.noent;
					}
				}
				filetype = Filetype.regular_file;
				createFile = true;
			} else {
				if (filetype === undefined) {
					return Errno.noent;
				}
			}
			// Currently VS Code doesn't offer a generic API to open a file
			// or a directory. Since we were able to stat the file we create
			// a file descriptor for it and lazy get the file content on read.
			const base = filetype === Filetype.directory
				? fs_rights_base | Rights.DirectoryBase
				: filetype === Filetype.regular_file
					? fs_rights_base | Rights.FileBase
					: fs_rights_base;
			const inheriting = Filetype.directory
				? fs_rights_inheriting | Rights.DirectoryInheriting
				: filetype === Filetype.regular_file
					? fs_rights_inheriting | Rights.FileInheriting
					: fs_rights_inheriting;
			const fileDescriptor = fileSystem.createFileDescriptor(
				parentDescriptor, name,
				filetype, { base: base, inheriting: inheriting }, fdflags,
			);
			fileDescriptors.set(fileDescriptor.fd, fileDescriptor);
			memory.setUint32(fd_ptr, fileDescriptor.fd, true);
			if (createFile || Oflags.truncOn(oflags)) {
				fileSystem.createOrTruncate(fileDescriptor);
			}
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
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { URI } from 'vscode-uri';

import { ApiClient, DTOs, FileType } from '@vscode/sync-api-client';

import RAL from './ral';
const paths = RAL().path;

import { ptr, size } from './baseTypes';
import { dircookie, dirent, Dirent, Errno, fd, fdflags, Fdstat, filedelta, filesize, Filestat, Filetype, filetype, Rights, rights, WasiError, Whence, whence } from './wasiTypes';
import { BigInts, code2Wasi } from './converter';

export namespace DeviceIds {
	let deviceIdCounter: bigint = 1n;
	export const system = deviceIdCounter++;
}

export interface FileDescriptor {
	/**
	 * The WASI file descriptor id
	 */
	readonly fd: fd;

	/**
	 * The inode id this file handle is pointing to.
	 */
	readonly inode: bigint;

	/**
	 * The file type
	 */
	readonly fileType: filetype;

	/**
	 * The rights associated with the file descriptor
	 */
	readonly rights: {
		/**
		 * The base rights.
		 */
		readonly base: rights;

		/**
		 * The inheriting rights
		 */
		readonly inheriting: rights;
	};

	/**
	 * The file descriptor flags.
	 */
	fdflags: fdflags;

	/**
	 * The absolute path used to create this file handle.
	 */
	readonly path: string;

	/**
	 * Whether this is a pre-opened directory.
	 */
	readonly preOpened: boolean;

	/**
	 * The cursor into the file's content;
	 */
	cursor: number;

	/**
	 * Asserts the given base rights.

	 * @param right the rights to assert.
	 */
	assertBaseRight(right: rights): void;

	/**
	 * Asserts that the file descriptor points to a directory.
	 */
	assertIsDirectory(): void;

	/**
	 * Reads the number of bytes from the given content using the
	 * file descriptor cursor.
	 * @param content the content to read from.
	 * @param bytesToRead the number of bytes to read.
	 */
	read(content: Uint8Array, bytesToRead: number): Uint8Array;

	/**
	 * Writes the given bytes into the content
	 * @param content the content to write into
	 * @param buffers the content to write
	 */
	write(content: Uint8Array, buffers: Uint8Array[]): [Uint8Array, size];

	/**
	 * Tests if this is a std* file descriptor.
	 */
	isStd(): boolean;

	/**
	 * Tests if this is the stdin file descriptor.
	 */
	isStdin(): boolean;

	/**
	 * Tests if this is the stdout file descriptor.
	 */
	isStdout(): boolean;

	/**
	 * Tests if this is the stderr file descriptor.
	 */
	isStderr(): boolean;
}

export class FileDescriptorImpl implements FileDescriptor {

	// 0, 1, 2 are reserved for stdin, stdout and stderr.
	private static fileDescriptorCounter: fd = 0;

	private static next(): fd {
		// According to the spec these handles shouldn't monotonically increase.
		// But since these are not real file handles I keep it that way.
		return this.fileDescriptorCounter++;
	}

	/**
	 * The WASI file handle
	 */
	public readonly fd: fd;

	/**
	 * The inode id this file handle is pointing to.
	 */
	public readonly inode: bigint;

	/**
	 * The file type
	 */
	public readonly fileType: filetype;

	/**
	 * The rights associated with the file descriptor
	 */
	public readonly rights: {
		/**
		 * The base rights.
		 */
		readonly base: rights;

		/**
		 * The inheriting rights
		 */
		readonly inheriting: rights;
	};

	/**
	 * The file descriptor flags.
	 */
	public fdflags: fdflags;

	/**
	 * The absolute path used to create this file handle.
	 */
	public readonly path: string;

	/**
	 * Whether this is a pre-opened directory.
	 */
	public readonly preOpened: boolean;

	/**
	 * The cursor into the file's content;
	 */
	private _cursor: number;

	constructor(inode: bigint, fileType: filetype, rights: FileDescriptor['rights'], fdflags: fdflags, path: string, preOpened: boolean = false) {
		this.fd = FileDescriptorImpl.next();
		this.inode = inode;
		this.fileType = fileType;
		this.rights = rights;
		this.fdflags = fdflags;
		this.path = path;
		this.preOpened = preOpened;
		this._cursor = 0;
	}

	public assertBaseRight(right: rights): void {
		if ((this.rights.base & right) === 0n) {
			throw new WasiError(Errno.perm);
		}
	}

	public assertIsDirectory(): void {
		if (this.fileType !== Filetype.directory) {
			throw new WasiError(Errno.notdir);
		}
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

	public read(content: Uint8Array, bytesToRead: number): Uint8Array {
		const realRead = Math.min(bytesToRead, content.byteLength - this._cursor);
		const result = content.subarray(this._cursor, this._cursor + realRead);
		this._cursor = this._cursor + realRead;
		return result;
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

	isStd(): boolean {
		return this.fd >= 0 && this.fd <= 2;
	}

	isStdin(): boolean {
		return this.fd === 0;
	}

	isStdout(): boolean {
		return this.fd === 1;
	}

	isStderr(): boolean {
		return this.fd === 2;
	}
}

export interface MemoryProvider {
	memoryView(): DataView;
	memoryRaw(): ArrayBuffer;
}

export interface FileSystem {

	readonly stdin: FileDescriptor;
	readonly stdout: FileDescriptor;
	readonly stderr: FileDescriptor;

	createPreOpenedFileDescriptor(path: string, uri: URI, fileType: filetype, rights: FileDescriptor['rights'], fdflags: fdflags): FileDescriptor;
	createFileDescriptor(parent: FileDescriptor, path: string, fileType: filetype, rights: FileDescriptor['rights'], fdflags: fdflags): FileDescriptor;
	releaseFileDescriptor(fileDescriptor: FileDescriptor): void;

	seek(fileDescriptor: FileDescriptor, offset: filedelta, whence: whence): bigint;
	fdstat(fileDescriptor: FileDescriptor, fdstat_ptr: ptr): void;
	stat(fileDescriptor: FileDescriptor, filestat_ptr: ptr): void;
	bytesAvailable(fileDescriptor: FileDescriptor): filesize;
	tell(fileDescriptor: FileDescriptor): number;
	setSize(fileDescriptor: FileDescriptor, size: filesize): void;
	allocate(fileDescriptor: FileDescriptor, offset: filesize, len: filesize): void;
	read(fileDescriptor: FileDescriptor, bytesToRead: number): Uint8Array;
	pread(fileDescriptor: FileDescriptor, offset: number, bytesToRead: number): Uint8Array;
	createOrTruncate(fileDescriptor: FileDescriptor): void;
	write(fileDescriptor: FileDescriptor, buffers: Uint8Array[]): size;
	pwrite(fileDescriptor: FileDescriptor, offset: number, bytes: Uint8Array): size;
	sync(fileDescriptor: FileDescriptor): void;
	readdir(fileDescriptor: FileDescriptor, buf_ptr: ptr, buf_len: size, cookie: dircookie, buf_used_ptr: ptr): void;
	createDirectory(fileDescriptor: FileDescriptor, name: string): void;

	path_stat(fileDescriptor: FileDescriptor, name: string, filestat_ptr: ptr): void;
	path_filetype(fileDescriptor: FileDescriptor, name: string): filetype | undefined;
	path_remove_directory(fileDescriptor: FileDescriptor, name: string): void;
	path_rename(oldFileDescriptor: FileDescriptor, oldName: string, newFileDescriptor: FileDescriptor, newName: string): void;
	path_unlink_file(fileDescriptor: FileDescriptor, name: string): void;
}

export namespace FileSystem {

	type INode = {
		/**
		 * The inode Id.
		 */
		id: bigint;

		refs: number;

		/**
		 * The corresponding VS Code URI
		 */
		uri: URI;

		/**
		 * The loaded file content if available.
		 */
		content?: Uint8Array;
	};

	namespace INode {
		export function hasContent(inode: INode): inode is INode & { content: Uint8Array } {
			return inode.content !== undefined;
		}
	}

	export function create(apiClient: ApiClient, memoryProvider: MemoryProvider, textEncoder: RAL.TextEncoder): FileSystem {

		let inodeCounter: bigint = 1n;

		const path2INode: Map<string, INode> = new Map();
		const inodes: Map<bigint, INode> = new Map();
		const deletedINode: Map<bigint, INode> = new Map();
		const directoryEntries: Map<fd, DTOs.DirectoryEntries> = new Map();
		const vscode_fs = apiClient.vscode.workspace.fileSystem;

		const memoryView = memoryProvider.memoryView;
		const memoryRaw = memoryProvider.memoryRaw;

		function refINode(filepath: string, uri: URI): INode {
			let result = path2INode.get(filepath);
			if (result !== undefined) {
				result.refs++;
				return result;
			}
			result = { id: inodeCounter++, uri, refs: 1, content: undefined };
			path2INode.set(filepath, result);
			inodes.set(result.id, result);
			return result;
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

		function getINode(id: bigint): INode {
			const inode: INode | undefined = inodes.get(id);
			if (inode === undefined) {
				throw new WasiError(Errno.badf);
			}
			return inode;
		}

		function markINodeAsDeleted(filepath: string): void {
			const inode = path2INode.get(filepath);
			if (inode === undefined) {
				return;
			}
			path2INode.delete(filepath);
			if (!deletedINode.has(inode.id)) {
				deletedINode.set(inode.id, inode);
			}
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

		function writeContent(inode: Required<INode>) {
			vscode_fs.writeFile(inode.uri, inode.content);
		}

		function uriJoin(uri: URI, name: string): URI {
			if (name === '.') {
				return uri;
			}
			return uri.with( { path: RAL().path.join(uri.path, name)} );
		}

		const fileSystem: FileSystem = {
			stdin: new FileDescriptorImpl(
				refINode('/dev/stdin', URI.from({ scheme: 'wasi-terminal', path:'/dev/stdin' })).id,
				Filetype.character_device,
				{ base: Rights.StdinBase, inheriting: Rights.StdinInheriting },
				0, '/dev/stdin', true
			),

			stdout: new FileDescriptorImpl(
				refINode('/dev/stdout', URI.from({ scheme: 'wasi-terminal', path:'/dev/stdout' })).id,
				Filetype.character_device,
				{ base: Rights.StdoutBase, inheriting: Rights.StdoutInheriting },
				0, '/dev/stdout', true
			),

			stderr: new FileDescriptorImpl(
				refINode('/dev/stderr', URI.from({ scheme: 'wasi-terminal', path:'/dev/stderr' })).id,
				Filetype.character_device,
				{ base: Rights.StdoutBase, inheriting: Rights.StdoutInheriting },
				0, '/dev/stderr', true
			),

			createPreOpenedFileDescriptor: (path, uri, fileType, rights, fdflags) => {
				const inode = refINode(path, uri);
				return new FileDescriptorImpl(inode.id, fileType, rights, fdflags, path, true);
			},
			createFileDescriptor: (parent, name, fileType, rights, fdflags) => {
				const parentINode = getINode(parent.inode);
				const filePath = paths.join(parent.path, name);
				const inode = refINode(filePath, uriJoin(parentINode.uri, name));
				return new FileDescriptorImpl(inode.id, fileType, rights, fdflags, filePath);
			},
			releaseFileDescriptor: (fileDescriptor) => {
				unrefINode(fileDescriptor.inode);
			},
			seek: (fileDescriptor, _offset, whence): bigint => {
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
			fdstat: (fileDescriptor, fdstat_ptr): void => {
				const inode = getINode(fileDescriptor.inode);
				const vStat = vscode_fs.stat(inode.uri);
				const fdstat = Fdstat.create(fdstat_ptr, memoryView());
				fdstat.fs_filetype = code2Wasi.asFileType(vStat.type);
				// No flags. We need to see if some of the tools we want to run
				// need some and we need to simulate them using local storage.
				fdstat.fs_flags = 0;
				if (vStat.type === FileType.File) {
					fdstat.fs_rights_base = Rights.FileBase;
					fdstat.fs_rights_inheriting = Rights.FileInheriting;
				} else if (vStat.type === FileType.Directory) {
					fdstat.fs_rights_base = Rights.DirectoryBase;
					fdstat.fs_rights_inheriting = Rights.DirectoryInheriting;
				} else {
					// Symbolic link and unknown
					fdstat.fs_rights_base = 0n;
					fdstat.fs_rights_inheriting = 0n;
				}
			},
			stat: (fileDescriptor, filestat_ptr): void => {
				const inode = getINode(fileDescriptor.inode);
				doStat(fileDescriptor.path, inode.uri, filestat_ptr);
			},
			bytesAvailable: (fileDescriptor): filesize => {
				const inode = getResolvedINode(fileDescriptor.inode);
				const cursor = fileDescriptor.cursor;
				return BigInt(Math.max(0,inode.content.byteLength - cursor));
			},
			tell: (fileDescriptor): number => {
				return fileDescriptor.cursor;
			},
			setSize: (fileDescriptor, _size): void => {
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
				return writeContent(inode);
			},
			allocate: (fileDescriptor, _offset, _len): void => {
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
			read: (fileDescriptor, bytesToRead): Uint8Array => {
				const content = getResolvedINode(fileDescriptor.inode).content;
				return fileDescriptor.read(content, bytesToRead);
			},
			pread: (fileDescriptor, offset, bytesToRead): Uint8Array => {
				const content = getResolvedINode(fileDescriptor.inode).content;
				const realRead = Math.min(bytesToRead, content.byteLength - offset);
				return content.subarray(offset, offset + realRead);
			},
			createOrTruncate: (fileDescriptor): void => {
				const inode = getINode(fileDescriptor.inode);
				inode.content = new Uint8Array(0);
				fileDescriptor.cursor = 0;
				writeContent(inode as Required<INode>);
			},
			write: (fileDescriptor, buffers): number => {
				const inode = getResolvedINode(fileDescriptor.inode);
				const [content, bytesWritten] = fileDescriptor.write(inode.content, buffers);
				inode.content = content;
				writeContent(inode);
				return bytesWritten;
			},
			pwrite: (fileDescriptor, offset, bytes): size => {
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
			sync: (fileDescriptor): void => {
				const inode = getINode(fileDescriptor.inode);
				if (!INode.hasContent(inode)) {
					return;
				}
				writeContent(inode);
			},
			readdir: (fileDescriptor, buf_ptr, buf_len, cookie, buf_used_ptr): void => {
				const memory = memoryView();
				const raw = memoryRaw();
				const inode = getINode(fileDescriptor.inode);

				// We have a cookie > 0 but no directory entries. So return end  of list
				// todo@dirkb this is actually specified different. According to the spec if
				// the used buffer size is less than the provided buffer size then no
				// additional readdir call should happen. However at least under Rust we
				// receive another call.
				//
				// Also unclear whether we have to include '.' and '..'
				//
				// See also https://github.com/WebAssembly/wasi-filesystem/issues/3
				if (cookie !== 0n && !directoryEntries.has(fileDescriptor.fd)) {
					memory.setUint32(buf_used_ptr, 0, true);
					return;
				}
				if (cookie === 0n) {
					const result = vscode_fs.readDirectory(inode.uri);
					directoryEntries.set(fileDescriptor.fd, result);
				}
				const entries: DTOs.DirectoryEntries | undefined = directoryEntries.get(fileDescriptor.fd);
				if (entries === undefined) {
					throw new WasiError(Errno.badmsg);
				}
				let i = Number(cookie);
				let ptr: ptr = buf_ptr;
				let spaceLeft = buf_len;
				for (; i < entries.length && spaceLeft >= Dirent.size; i++) {
					const entry = entries[i];
					const filetype: filetype = code2Wasi.asFileType(entry[1]);
					const name = entry[0];
					const filePath = paths.join(fileDescriptor.path, name);
					const fileUri = uriJoin(inode.uri, name);
					const nameBytes = textEncoder.encode(name);
					const dirent: dirent = Dirent.create(ptr, memory);
					dirent.d_next = BigInt(i + 1);
					dirent.d_ino = refINode(filePath, fileUri).id;
					dirent.d_type = filetype;
					dirent.d_namlen = nameBytes.byteLength;
					spaceLeft -= Dirent.size;
					const spaceForName = Math.min(spaceLeft, nameBytes.byteLength);
					(new Uint8Array(raw, ptr + Dirent.size, spaceForName)).set(nameBytes.subarray(0, spaceForName));
					ptr += Dirent.size + spaceForName;
					spaceLeft -= spaceForName;
				}
				if (i === entries.length) {
					memory.setUint32(buf_used_ptr, ptr - buf_ptr, true);
					directoryEntries.delete(fileDescriptor.fd);
				} else {
					memory.setUint32(buf_used_ptr, buf_len, true);
				}
			},
			createDirectory: (fileDescriptor: FileDescriptor, name: string): void => {
				const inode = getINode(fileDescriptor.inode);
				vscode_fs.createDirectory(uriJoin(inode.uri, name));
			},
			path_stat: (fileDescriptor, name, filestat_ptr): void => {
				const inode = getINode(fileDescriptor.inode);
				const filePath = paths.join(fileDescriptor.path, name);
				const fileUri = uriJoin(inode.uri, name);
				doStat(filePath, fileUri, filestat_ptr);
			},
			path_filetype: (fileDescriptor, name): filetype | undefined => {
				const inode = getINode(fileDescriptor.inode);
				const fileUri = uriJoin(inode.uri, name);
				try {
					const stat = vscode_fs.stat(fileUri);
					return code2Wasi.asFileType(stat.type);
				} catch {
					return undefined;
				}
			},
			path_remove_directory: (fileDescriptor, name): void => {
				const parentINode = getINode(fileDescriptor.inode);
				const fileUri = uriJoin(parentINode.uri, name);
				vscode_fs.delete(fileUri, { recursive: false, useTrash: true });
				markINodeAsDeleted(paths.join(fileDescriptor.path, name));
			},
			path_rename: (oldFileDescriptor, oldName, newFileDescriptor, newName): void => {
				const oldParentINode = getINode(oldFileDescriptor.inode);
				const newParentINode = getINode(newFileDescriptor.inode);

				const oldUri = uriJoin(oldParentINode.uri, oldName);
				const newUri = uriJoin(newParentINode.uri, newName);
				vscode_fs.rename(oldUri, newUri, { overwrite: false });

				// todo@dirkb unclear what really happens in posix. We need to understand if
				// an old file descriptor could still read the directory under its new location.
				const oldINode = path2INode.get(paths.join(oldFileDescriptor.path, oldName));
				if (oldINode === undefined) {
					return;
				}
				const newFilePath = paths.join(newFileDescriptor.path, newName);
				const newINode = path2INode.get(newFilePath);
				if (newINode !== undefined) {
					throw new WasiError(Errno.badf);
				}
				path2INode.set(newFilePath, oldINode);
			},
			path_unlink_file: (fileDescriptor, name): void => {
				const inode = getINode(fileDescriptor.inode);
				const fileUri = uriJoin(inode.uri, name);
				vscode_fs.delete(fileUri, { recursive: false, useTrash: true });
			}
		};

		function doStat(filePath: string, uri: URI, filestat_ptr: ptr): void {
			const vStat = vscode_fs.stat(uri);
			const fileStat = Filestat.create(filestat_ptr, memoryView());
			fileStat.dev = DeviceIds.system;
			fileStat.ino = refINode(filePath, uri).id;
			fileStat.filetype = code2Wasi.asFileType(vStat.type);
			fileStat.nlink = 0n;
			fileStat.size = BigInt(vStat.size);
			fileStat.atim = BigInt(vStat.mtime);
			fileStat.ctim = BigInt(vStat.ctime);
			fileStat.mtim = BigInt(vStat.mtime);
		}

		return fileSystem;
	}
}
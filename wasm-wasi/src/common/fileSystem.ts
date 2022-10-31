/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// import { URI } from 'vscode-uri';

// import { ApiClient, DTOs } from '@vscode/sync-api-client';

// import RAL from './ral';
// const paths = RAL().path;

// import { ptr, size } from './baseTypes';
// import { dircookie, dirent, Dirent, Errno, fd, fdflags, Fdstat, filedelta, filesize, Filestat, Filetype, filetype, Rights, rights, WasiError, Whence, whence } from './wasiTypes';
// import { BigInts, code2Wasi } from './converter';

// export namespace DeviceIds {
// 	let deviceIdCounter: bigint = 1n;
// 	export function next(): bigint {
// 		return deviceIdCounter++;
// 	}
// }

// export interface FileDescriptor {
// 	/**
// 	 * The WASI file descriptor id
// 	 */
// 	readonly fd: fd;

// 	/**
// 	 * The inode id this file handle is pointing to.
// 	 */
// 	readonly inode: bigint;

// 	/**
// 	 * The file type
// 	 */
// 	readonly fileType: filetype;

// 	/**
// 	 * The rights associated with the file descriptor
// 	 */
// 	readonly rights: {
// 		/**
// 		 * The base rights.
// 		 */
// 		readonly base: rights;

// 		/**
// 		 * The inheriting rights
// 		 */
// 		readonly inheriting: rights;
// 	};

// 	/**
// 	 * The file descriptor flags.
// 	 */
// 	fdflags: fdflags;

// 	/**
// 	 * The absolute path used to create this file handle.
// 	 */
// 	readonly path: string;

// 	/**
// 	 * Whether this is a pre-opened directory.
// 	 */
// 	readonly preOpened: boolean;

// 	/**
// 	 * The cursor into the file's content;
// 	 */
// 	cursor: number;

// 	/**
// 	 * Asserts the given base rights.

// 	 * @param right the rights to assert.
// 	 */
// 	assertBaseRight(right: rights): void;

// 	/**
// 	 * Asserts that the file descriptor points to a directory.
// 	 */
// 	assertIsDirectory(): void;

// 	/**
// 	 * Reads the number of bytes from the given content using the
// 	 * file descriptor cursor.
// 	 * @param content The content to read from.
// 	 * @param resultBuffer The buffer the contains the result.
// 	 * @returns The actual number of bytes read
// 	 */
// 	read(content: Uint8Array, resultBuffer: Uint8Array): size;

// 	/**
// 	 * Writes the given bytes into the content
// 	 * @param content the content to write into
// 	 * @param buffers the content to write
// 	 */
// 	write(content: Uint8Array, buffers: Uint8Array[]): [Uint8Array, size];

// 	/**
// 	 * Tests if this is a std* file descriptor.
// 	 */
// 	isStd(): boolean;

// 	/**
// 	 * Tests if this is the stdin file descriptor.
// 	 */
// 	isStdin(): boolean;

// 	/**
// 	 * Tests if this is the stdout file descriptor.
// 	 */
// 	isStdout(): boolean;

// 	/**
// 	 * Tests if this is the stderr file descriptor.
// 	 */
// 	isStderr(): boolean;
// }

// export class FileDescriptorImpl implements FileDescriptor {

// 	// 0, 1, 2 are reserved for stdin, stdout and stderr.
// 	private static fileDescriptorCounter: fd = 0;

// 	private static next(): fd {
// 		// According to the spec these handles shouldn't monotonically increase.
// 		// But since these are not real file handles I keep it that way.
// 		return this.fileDescriptorCounter++;
// 	}

// 	/**
// 	 * The WASI file handle
// 	 */
// 	public readonly fd: fd;

// 	/**
// 	 * The inode id this file handle is pointing to.
// 	 */
// 	public readonly inode: bigint;

// 	/**
// 	 * The file type
// 	 */
// 	public readonly fileType: filetype;

// 	/**
// 	 * The rights associated with the file descriptor
// 	 */
// 	public readonly rights: {
// 		/**
// 		 * The base rights.
// 		 */
// 		readonly base: rights;

// 		/**
// 		 * The inheriting rights
// 		 */
// 		readonly inheriting: rights;
// 	};

// 	/**
// 	 * The file descriptor flags.
// 	 */
// 	public fdflags: fdflags;

// 	/**
// 	 * The absolute path used to create this file handle.
// 	 */
// 	public readonly path: string;

// 	/**
// 	 * Whether this is a pre-opened directory.
// 	 */
// 	public readonly preOpened: boolean;

// 	/**
// 	 * The cursor into the file's content;
// 	 */
// 	private _cursor: number;

// 	constructor(inode: bigint, fileType: filetype, rights: FileDescriptor['rights'], fdflags: fdflags, path: string, preOpened: boolean = false) {
// 		this.fd = FileDescriptorImpl.next();
// 		this.inode = inode;
// 		this.fileType = fileType;
// 		this.rights = rights;
// 		this.fdflags = fdflags;
// 		this.path = path;
// 		this.preOpened = preOpened;
// 		this._cursor = 0;
// 	}

// 	public assertBaseRight(right: rights): void {
// 		if ((this.rights.base & right) === 0n) {
// 			throw new WasiError(Errno.perm);
// 		}
// 	}

// 	public assertIsDirectory(): void {
// 		if (this.fileType !== Filetype.directory) {
// 			throw new WasiError(Errno.notdir);
// 		}
// 	}

// 	public get cursor(): number {
// 		return this._cursor;
// 	}

// 	public set cursor(value: number) {
// 		if (value < 0) {
// 			throw new WasiError(Errno.inval);
// 		}
// 		this._cursor = value;
// 	}

// 	public read(content: Uint8Array, resultBuffer: Uint8Array): size {
// 		const realRead = Math.min(resultBuffer.length, content.byteLength - this._cursor);
// 		resultBuffer.set(content.subarray(this._cursor, this._cursor + realRead));
// 		this._cursor = this._cursor + realRead;
// 		return realRead;
// 	}

// 	public write(content: Uint8Array, buffers: Uint8Array[]): [Uint8Array, size] {
// 		let bytesToWrite: size = 0;
// 		for (const bytes of buffers) {
// 			bytesToWrite += bytes.byteLength;
// 		}

// 		// Do we need to increase the buffer
// 		if (this._cursor + bytesToWrite > content.byteLength) {
// 			const newContent = new Uint8Array(this._cursor + bytesToWrite);
// 			newContent.set(content);
// 			content = newContent;
// 		}

// 		for (const bytes of buffers) {
// 			content.set(bytes, this._cursor);
// 			this._cursor += bytes.length;
// 		}

// 		return [content, bytesToWrite];
// 	}

// 	isStd(): boolean {
// 		return this.fd >= 0 && this.fd <= 2;
// 	}

// 	isStdin(): boolean {
// 		return this.fd === 0;
// 	}

// 	isStdout(): boolean {
// 		return this.fd === 1;
// 	}

// 	isStderr(): boolean {
// 		return this.fd === 2;
// 	}
// }

// export interface MemoryProvider {
// 	memoryView(): DataView;
// 	memoryRaw(): ArrayBuffer;
// }

// export interface CharacterDevices {
// 	read(fd: FileDescriptor, maxBytesToRead: number): Uint8Array;
// 	write(fd: FileDescriptor, bytes: Uint8Array): void;
// }

// export interface FileSystem {

// 	readonly stdin: FileDescriptor;
// 	readonly stdout: FileDescriptor;
// 	readonly stderr: FileDescriptor;

// 	createPreOpenedFileDescriptor(path: string, uri: URI, fileType: filetype, rights: FileDescriptor['rights'], fdflags: fdflags): FileDescriptor;
// 	getPreopenedDirectory(fd: fd): FileDescriptor | undefined;
// 	getPreopened(parentFileDescriptor: FileDescriptor, path: string): FileDescriptor | undefined;

// 	createFileDescriptor(parent: FileDescriptor, path: string, fileType: filetype, rights: FileDescriptor['rights'], fdflags: fdflags): FileDescriptor;

// 	bytesAvailable(fileDescriptor: FileDescriptor): filesize;
// 	createOrTruncate(fileDescriptor: FileDescriptor): void;

// 	fd_close(fileDescriptor: FileDescriptor): void;
// 	fd_seek(fileDescriptor: FileDescriptor, offset: filedelta, whence: whence): bigint;
// 	fd_fdstat_get(fileDescriptor: FileDescriptor, fdstat_ptr: ptr): void;
// 	fd_filestat_get(fileDescriptor: FileDescriptor, filestat_ptr: ptr): void;
// 	fd_tell(fileDescriptor: FileDescriptor): number;
// 	fd_filestat_set_size(fileDescriptor: FileDescriptor, size: filesize): void;
// 	fd_allocate(fileDescriptor: FileDescriptor, offset: filesize, len: filesize): void;
// 	fd_pread(fileDescriptor: FileDescriptor, offset: number, bytesToRead: number): Uint8Array;

// 	fd_read(fileDescriptor: FileDescriptor, buffers: Uint8Array[]): size;
// 	fd_write(fileDescriptor: FileDescriptor, buffers: Uint8Array[]): size;
// 	fd_pwrite(fileDescriptor: FileDescriptor, offset: number, bytes: Uint8Array): size;
// 	fd_sync(fileDescriptor: FileDescriptor): void;
// 	fd_readdir(fileDescriptor: FileDescriptor, buf_ptr: ptr, buf_len: size, cookie: dircookie, buf_used_ptr: ptr): void;

// 	path_create_directory(fileDescriptor: FileDescriptor, name: string): void;
// 	path_filestat_get(fileDescriptor: FileDescriptor, name: string, filestat_ptr: ptr): void;
// 	path_filetype(fileDescriptor: FileDescriptor, name: string): filetype | undefined;
// 	path_remove_directory(fileDescriptor: FileDescriptor, name: string): void;
// 	path_rename(oldFileDescriptor: FileDescriptor, oldName: string, newFileDescriptor: FileDescriptor, newName: string): void;
// 	path_unlink_file(fileDescriptor: FileDescriptor, name: string): void;
// }

// export namespace FileSystem {

// 	type INode = {
// 		/**
// 		 * The inode Id.
// 		 */
// 		id: bigint;

// 		refs: number;

// 		/**
// 		 * The corresponding VS Code URI
// 		 */
// 		uri: URI;

// 		/**
// 		 * The loaded file content if available.
// 		 */
// 		content?: Uint8Array;
// 	};

// 	namespace INode {
// 		export function hasContent(inode: INode): inode is INode & { content: Uint8Array } {
// 			return inode.content !== undefined;
// 		}
// 	}

// 	export function create(apiClient: ApiClient, memoryProvider: MemoryProvider, textEncoder: RAL.TextEncoder, stdio: { stdin: URI; stdout: URI; stderr: URI }): FileSystem {

// 		let inodeCounter: bigint = 1n;

// 		const preOpened: Map<string, FileDescriptor> = new Map();
// 		const preOpenedDirectories: Map<number, FileDescriptor> = new Map();

// 		const path2INode: Map<string, INode> = new Map();
// 		const inodes: Map<bigint, INode> = new Map();
// 		const deletedINode: Map<bigint, INode> = new Map();
// 		const directoryEntries: Map<fd, DTOs.DirectoryEntries> = new Map();
// 		const vscode_fs = apiClient.vscode.workspace.fileSystem;

// 		const memoryView = memoryProvider.memoryView;
// 		const memoryRaw = memoryProvider.memoryRaw;

// 		function refINode(filepath: string, uri: URI): INode {
// 			let result = path2INode.get(filepath);
// 			if (result !== undefined) {
// 				result.refs++;
// 				return result;
// 			}
// 			result = { id: inodeCounter++, uri, refs: 1, content: undefined };
// 			path2INode.set(filepath, result);
// 			inodes.set(result.id, result);
// 			return result;
// 		}

// 		function unrefINode(id: bigint): void {
// 			let inode = inodes.get(id);
// 			if (inode === undefined) {
// 				inode = deletedINode.get(id);
// 			}
// 			if (inode === undefined) {
// 				throw new WasiError(Errno.badf);
// 			}
// 			inode.refs--;
// 			if (inode.refs === 0) {
// 				inode.content = undefined;
// 				deletedINode.delete(id);
// 			}
// 		}

// 		function getINode(id: bigint): INode {
// 			const inode: INode | undefined = inodes.get(id);
// 			if (inode === undefined) {
// 				throw new WasiError(Errno.badf);
// 			}
// 			return inode;
// 		}

// 		function markINodeAsDeleted(filepath: string): void {
// 			const inode = path2INode.get(filepath);
// 			if (inode === undefined) {
// 				return;
// 			}
// 			path2INode.delete(filepath);
// 			if (!deletedINode.has(inode.id)) {
// 				deletedINode.set(inode.id, inode);
// 			}
// 		}

// 		function getResolvedINode(id: bigint): Required<INode> {
// 			const inode: INode | undefined = inodes.get(id);
// 			if (inode === undefined) {
// 				throw new WasiError(Errno.badf);
// 			}
// 			if (inode.content === undefined) {
// 				inode.content = vscode_fs.readFile(inode.uri);
// 			}
// 			return inode as Required<INode>;
// 		}

// 		function writeContent(inode: Required<INode>) {
// 			vscode_fs.writeFile(inode.uri, inode.content);
// 		}

// 		function uriJoin(uri: URI, name: string): URI {
// 			if (name === '.') {
// 				return uri;
// 			}
// 			return uri.with( { path: RAL().path.join(uri.path, name)} );
// 		}

// 		function isatty(fileDescriptor: FileDescriptor) {
// 			return fileDescriptor.fileType === Filetype.character_device && (fileDescriptor.rights.base & (Rights.fd_seek | Rights.fd_tell)) === 0n;
// 		}

// 		const fileSystem: FileSystem = {
// 			// todo@dirkb we need to have a file descriptor without an inode for
// 			// transferring bytes so that we don't need a unique path like
// 			// /dev/tty[stdin] and /dev/tty[stdout]
// 			stdin: new FileDescriptorImpl(
// 				refINode('/dev/tty[stdin]', stdio.stdin).id,
// 				Filetype.character_device,
// 				{ base: Rights.StdinBase, inheriting: Rights.StdinInheriting },
// 				0, '/dev/tty', true
// 			),

// 			stdout: new FileDescriptorImpl(
// 				refINode('/dev/tty[stdout]', stdio.stdout).id,
// 				Filetype.character_device,
// 				{ base: Rights.StdoutBase, inheriting: Rights.StdoutInheriting },
// 				0, '/dev/tty', true
// 			),

// 			stderr: new FileDescriptorImpl(
// 				refINode('/dev/tty[stderr]', stdio.stderr).id,
// 				Filetype.character_device,
// 				{ base: Rights.StdoutBase, inheriting: Rights.StdoutInheriting },
// 				0, '/dev/tty', true
// 			),

// 			createPreOpenedFileDescriptor: (path, uri, fileType, rights, fdflags) => {
// 				const inode = refINode(path, uri);
// 				const result = new FileDescriptorImpl(inode.id, fileType, rights, fdflags, path, true);
// 				if (fileType === Filetype.directory) {
// 					preOpenedDirectories.set(result.fd, result);
// 				} else {
// 					preOpened.set(path, result);
// 				}
// 				return result;
// 			},

// 			getPreopenedDirectory: (fd: fd) =>  {
// 				return preOpenedDirectories.get(fd);
// 			},

// 			getPreopened: (parent, name) => {
// 				const filePath = paths.join(parent.path, name);
// 				return preOpened.get(filePath);
// 			},

// 			createFileDescriptor: (parent, name, fileType, rights, fdflags) => {
// 				const parentINode = getINode(parent.inode);
// 				const filePath = paths.join(parent.path, name);
// 				const inode = refINode(filePath, uriJoin(parentINode.uri, name));
// 				return new FileDescriptorImpl(inode.id, fileType, rights, fdflags, filePath);
// 			},
// 			fd_close: (fileDescriptor) => {
// 				unrefINode(fileDescriptor.inode);
// 			},
// 			fd_seek: (fileDescriptor, _offset, whence): bigint => {
// 				const offset = BigInts.asNumber(_offset);
// 				switch(whence) {
// 					case Whence.set:
// 						fileDescriptor.cursor = offset;
// 						break;
// 					case Whence.cur:
// 						fileDescriptor.cursor = fileDescriptor.cursor + offset;
// 						break;
// 					case Whence.end:
// 						const inode = getResolvedINode(fileDescriptor.inode);
// 						fileDescriptor.cursor = Math.max(0, inode.content.byteLength + offset);
// 						break;
// 				}
// 				return BigInt(fileDescriptor.cursor);
// 			},
// 			fd_fdstat_get: (fileDescriptor, fdstat_ptr): void => {
// 				const memory = memoryView();
// 				const fdstat = Fdstat.create(fdstat_ptr, memory);
// 				fdstat.fs_filetype = fileDescriptor.fileType;
// 				fdstat.fs_flags = fileDescriptor.fdflags;
// 				fdstat.fs_rights_base = fileDescriptor.rights.base;
// 				fdstat.fs_rights_inheriting = fileDescriptor.rights.inheriting;
// 			},
// 			fd_filestat_get: (fileDescriptor, filestat_ptr): void => {
// 				const memory = memoryView();
// 				if (fileDescriptor.isStd()) {
// 					const fileStat = Filestat.create(filestat_ptr, memory);
// 					fileStat.dev = DeviceIds.system;
// 					fileStat.ino = fileDescriptor.inode;
// 					fileStat.filetype = Filetype.character_device;
// 					fileStat.nlink = 0n;
// 					fileStat.size = 101n;
// 					const now = BigInt(Date.now());
// 					fileStat.atim = now;
// 					fileStat.ctim = now;
// 					fileStat.mtim = now;
// 				} else {
// 					const inode = getINode(fileDescriptor.inode);
// 					doStat(fileDescriptor.path, inode.uri, filestat_ptr);
// 				}
// 			},
// 			bytesAvailable: (fileDescriptor): filesize => {
// 				const inode = getResolvedINode(fileDescriptor.inode);
// 				const cursor = fileDescriptor.cursor;
// 				return BigInt(Math.max(0,inode.content.byteLength - cursor));
// 			},
// 			fd_tell: (fileDescriptor): number => {
// 				return fileDescriptor.cursor;
// 			},
// 			fd_filestat_set_size: (fileDescriptor, _size): void => {
// 				const size = BigInts.asNumber(_size);
// 				const inode = getResolvedINode(fileDescriptor.inode);
// 				const content = inode.content;
// 				if (content.byteLength === size) {
// 					return;
// 				} else if (content.byteLength < size) {
// 					const newContent = new Uint8Array(size);
// 					newContent.set(content);
// 					inode.content = newContent;
// 				} else if (content.byteLength > size) {
// 					const newContent = new Uint8Array(size);
// 					newContent.set(content.subarray(0, size));
// 					inode.content = newContent;
// 				}
// 				return writeContent(inode);
// 			},
// 			fd_allocate: (fileDescriptor, _offset, _len): void => {
// 				const offset = BigInts.asNumber(_offset);
// 				const len = BigInts.asNumber(_len);

// 				const inode = getResolvedINode(fileDescriptor.inode);
// 				const content = inode.content;
// 				if (offset > content.byteLength) {
// 					throw new WasiError(Errno.inval);
// 				}

// 				const newContent: Uint8Array = new Uint8Array(content.byteLength + len);
// 				newContent.set(content.subarray(0, offset), 0);
// 				newContent.set(content.subarray(offset), offset + len);
// 				inode.content = newContent;
// 				writeContent(inode);
// 			},
// 			fd_read: (fileDescriptor, buffers): size => {
// 				if (buffers.length === 0) {
// 					return 0;
// 				}
// 				if (isatty(fileDescriptor)) {
// 					const inode = getINode(fileDescriptor.inode);
// 					const maxBytesToRead = buffers.reduce<number>((prev, current) => prev + current.length, 0);
// 					const result = apiClient.tty.read(inode.uri, maxBytesToRead);
// 					let offset = 0;
// 					let totalBytesRead = 0;
// 					for (const buffer of buffers) {
// 						const toCopy = Math.min(buffer.length, result.length - offset);
// 						buffer.set(result.subarray(offset, toCopy));
// 						offset += toCopy;
// 						totalBytesRead += toCopy;
// 						if (toCopy < buffer.length) {
// 							break;
// 						}
// 					}
// 					return totalBytesRead;
// 				}
// 				const content = getResolvedINode(fileDescriptor.inode).content;
// 				let totalBytesRead = 0;
// 				for (const buffer of buffers) {
// 					const bytesRead = fileDescriptor.read(content, buffer);
// 					totalBytesRead += bytesRead;
// 					if (bytesRead === 0) {
// 						break;
// 					}
// 				}
// 				return totalBytesRead;
// 			},
// 			fd_pread: (fileDescriptor, offset, bytesToRead): Uint8Array => {
// 				const content = getResolvedINode(fileDescriptor.inode).content;
// 				const realRead = Math.min(bytesToRead, content.byteLength - offset);
// 				return content.subarray(offset, offset + realRead);
// 			},
// 			createOrTruncate: (fileDescriptor): void => {
// 				const inode = getINode(fileDescriptor.inode);
// 				inode.content = new Uint8Array(0);
// 				fileDescriptor.cursor = 0;
// 				writeContent(inode as Required<INode>);
// 			},
// 			fd_write: (fileDescriptor, buffers): number => {
// 				if (buffers.length === 0) {
// 					return 0;
// 				}
// 				if (isatty(fileDescriptor)) {
// 					const inode = getINode(fileDescriptor.inode);
// 					let buffer: Uint8Array;
// 					if (buffers.length === 1) {
// 						buffer = buffers[0];
// 					} else {
// 						const byteLength: number = buffers.reduce<number>((prev, current) => prev + current.length, 0);
// 						buffer = new Uint8Array(byteLength);
// 						let offset = 0;
// 						for (const item of buffers) {
// 							buffer.set(item, offset);
// 							offset = item.byteLength;
// 						}
// 					}
// 					apiClient.tty.write(inode.uri, buffer);
// 					return buffer.byteLength;
// 				}
// 				const inode = getResolvedINode(fileDescriptor.inode);
// 				const [content, bytesWritten] = fileDescriptor.write(inode.content, buffers);
// 				inode.content = content;
// 				writeContent(inode);
// 				return bytesWritten;
// 			},
// 			fd_pwrite: (fileDescriptor, offset, bytes): size => {
// 				const inode = getResolvedINode(fileDescriptor.inode);
// 				let content = inode.content;
// 				const total = offset + bytes.byteLength;
// 				// Make the file bigger
// 				if (total > content.byteLength) {
// 					const newContent = new Uint8Array(total);
// 					newContent.set(content);
// 					content = newContent;
// 					inode.content = newContent;
// 				}
// 				content.set(bytes, offset);
// 				writeContent(inode);
// 				return bytes.length;
// 			},
// 			fd_sync: (fileDescriptor): void => {
// 				const inode = getINode(fileDescriptor.inode);
// 				if (!INode.hasContent(inode)) {
// 					return;
// 				}
// 				writeContent(inode);
// 			},
// 			fd_readdir: (fileDescriptor, buf_ptr, buf_len, cookie, buf_used_ptr): void => {
// 				const memory = memoryView();
// 				const raw = memoryRaw();
// 				const inode = getINode(fileDescriptor.inode);

// 				// We have a cookie > 0 but no directory entries. So return end  of list
// 				// todo@dirkb this is actually specified different. According to the spec if
// 				// the used buffer size is less than the provided buffer size then no
// 				// additional readdir call should happen. However at least under Rust we
// 				// receive another call.
// 				//
// 				// Also unclear whether we have to include '.' and '..'
// 				//
// 				// See also https://github.com/WebAssembly/wasi-filesystem/issues/3
// 				if (cookie !== 0n && !directoryEntries.has(fileDescriptor.fd)) {
// 					memory.setUint32(buf_used_ptr, 0, true);
// 					return;
// 				}
// 				if (cookie === 0n) {
// 					const result = vscode_fs.readDirectory(inode.uri);
// 					directoryEntries.set(fileDescriptor.fd, result);
// 				}
// 				const entries: DTOs.DirectoryEntries | undefined = directoryEntries.get(fileDescriptor.fd);
// 				if (entries === undefined) {
// 					throw new WasiError(Errno.badmsg);
// 				}
// 				let i = Number(cookie);
// 				let ptr: ptr = buf_ptr;
// 				let spaceLeft = buf_len;
// 				for (; i < entries.length && spaceLeft >= Dirent.size; i++) {
// 					const entry = entries[i];
// 					const filetype: filetype = code2Wasi.asFileType(entry[1]);
// 					const name = entry[0];
// 					const filePath = paths.join(fileDescriptor.path, name);
// 					const fileUri = uriJoin(inode.uri, name);
// 					const nameBytes = textEncoder.encode(name);
// 					const dirent: dirent = Dirent.create(ptr, memory);
// 					dirent.d_next = BigInt(i + 1);
// 					dirent.d_ino = refINode(filePath, fileUri).id;
// 					dirent.d_type = filetype;
// 					dirent.d_namlen = nameBytes.byteLength;
// 					spaceLeft -= Dirent.size;
// 					const spaceForName = Math.min(spaceLeft, nameBytes.byteLength);
// 					(new Uint8Array(raw, ptr + Dirent.size, spaceForName)).set(nameBytes.subarray(0, spaceForName));
// 					ptr += Dirent.size + spaceForName;
// 					spaceLeft -= spaceForName;
// 				}
// 				if (i === entries.length) {
// 					memory.setUint32(buf_used_ptr, ptr - buf_ptr, true);
// 					directoryEntries.delete(fileDescriptor.fd);
// 				} else {
// 					memory.setUint32(buf_used_ptr, buf_len, true);
// 				}
// 			},
// 			path_create_directory: (fileDescriptor: FileDescriptor, name: string): void => {
// 				const inode = getINode(fileDescriptor.inode);
// 				vscode_fs.createDirectory(uriJoin(inode.uri, name));
// 			},
// 			path_filestat_get: (fileDescriptor, name, filestat_ptr): void => {
// 				const inode = getINode(fileDescriptor.inode);
// 				const filePath = paths.join(fileDescriptor.path, name);
// 				const fileUri = uriJoin(inode.uri, name);
// 				doStat(filePath, fileUri, filestat_ptr);
// 			},
// 			path_filetype: (fileDescriptor, name): filetype | undefined => {
// 				const inode = getINode(fileDescriptor.inode);
// 				const fileUri = uriJoin(inode.uri, name);
// 				try {
// 					const stat = vscode_fs.stat(fileUri);
// 					return code2Wasi.asFileType(stat.type);
// 				} catch {
// 					return undefined;
// 				}
// 			},
// 			path_remove_directory: (fileDescriptor, name): void => {
// 				const parentINode = getINode(fileDescriptor.inode);
// 				const fileUri = uriJoin(parentINode.uri, name);
// 				vscode_fs.delete(fileUri, { recursive: false, useTrash: true });
// 				markINodeAsDeleted(paths.join(fileDescriptor.path, name));
// 			},
// 			path_rename: (oldFileDescriptor, oldName, newFileDescriptor, newName): void => {
// 				const oldParentINode = getINode(oldFileDescriptor.inode);
// 				const newParentINode = getINode(newFileDescriptor.inode);

// 				const oldUri = uriJoin(oldParentINode.uri, oldName);
// 				const newUri = uriJoin(newParentINode.uri, newName);
// 				vscode_fs.rename(oldUri, newUri, { overwrite: false });

// 				// todo@dirkb unclear what really happens in posix. We need to understand if
// 				// an old file descriptor could still read the directory under its new location.
// 				const oldINode = path2INode.get(paths.join(oldFileDescriptor.path, oldName));
// 				if (oldINode === undefined) {
// 					return;
// 				}
// 				const newFilePath = paths.join(newFileDescriptor.path, newName);
// 				const newINode = path2INode.get(newFilePath);
// 				if (newINode !== undefined) {
// 					throw new WasiError(Errno.badf);
// 				}
// 				path2INode.set(newFilePath, oldINode);
// 			},
// 			path_unlink_file: (fileDescriptor, name): void => {
// 				const inode = getINode(fileDescriptor.inode);
// 				const fileUri = uriJoin(inode.uri, name);
// 				vscode_fs.delete(fileUri, { recursive: false, useTrash: true });
// 			}
// 		};

// 		function doStat(filePath: string, uri: URI, filestat_ptr: ptr): void {
// 			const vStat = vscode_fs.stat(uri);
// 			const fileStat = Filestat.create(filestat_ptr, memoryView());
// 			fileStat.dev = DeviceIds.system;
// 			fileStat.ino = refINode(filePath, uri).id;
// 			fileStat.filetype = code2Wasi.asFileType(vStat.type);
// 			fileStat.nlink = 0n;
// 			fileStat.size = BigInt(vStat.size);
// 			fileStat.atim = BigInt(vStat.mtime);
// 			fileStat.ctim = BigInt(vStat.ctime);
// 			fileStat.mtim = BigInt(vStat.mtime);
// 		}

// 		return fileSystem;
// 	}
// }
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as uuid from 'uuid';
import { Uri } from 'vscode';

import RAL from './ral';
import { MemoryFileSystem as ApiMemoryFileSystem, Readable, Writable } from './api';
import { DeviceDriverKind, DeviceId, FileSystemDeviceDriver, NoSysDeviceDriver, ReaddirEntry, ReadonlyFileSystemDeviceDriver, WritePermDeniedDeviceDriver } from './deviceDriver';
import { FdProvider, FileDescriptor } from './fileDescriptor';
import { Errno, Fdflags, Filetype, Lookupflags, Oflags, Rights, WasiError, Whence, fd, fdflags, fdstat, filesize, filestat, inode, lookupflags, oflags, rights } from './wasi';
import { size, u64 } from './baseTypes';
import { BigInts } from './converter';
import * as fs from './fileSystem';
import { ReadableStream, WritableStream } from './streams';

const paths = RAL().path;

function timeInNanoseconds(timeInMilliseconds: number): bigint {
	return BigInt(timeInMilliseconds) * 1000000n;
}

interface BaseNode {
	readonly ctime: bigint;
	readonly mtime: bigint;
	readonly atime: bigint;
}

interface FileNode extends fs.FileNode, BaseNode {
	readonly parent: DirectoryNode;
	content: Uint8Array | { size: bigint; reader: () => Promise<Uint8Array> };
}

namespace FileNode {
	export function create(parent: DirectoryNode, inode: inode, name: string, time: bigint, content: Uint8Array | { size: bigint; reader: () => Promise<Uint8Array> }): FileNode {
		return {
			filetype: Filetype.regular_file,
			inode,
			name,
			ctime: time,
			mtime: time,
			atime: time,
			refs: 0,
			parent,
			content: content
		};
	}
	export function size(node: FileNode): bigint {
		if (node.content instanceof Uint8Array) {
			return BigInt(node.content.length);
		} else {
			return node.content.size;
		}
	}
}

interface DirectoryNode extends BaseNode, fs.DirectoryNode {
	readonly parent: DirectoryNode | undefined;
	readonly entries: Map<string, Node>;
}

namespace DirectoryNode {
	export function create(parent: DirectoryNode | undefined, id: inode, name: string, time: bigint): DirectoryNode {
		return {
			filetype: Filetype.directory,
			inode: id,
			name,
			ctime: time,
			mtime: time,
			atime: time,
			refs: 0,
			parent,
			entries: new Map()
		};
	}
	export function size(node: DirectoryNode): bigint {
		return BigInt((Math.trunc(node.entries.size * 24 / 4096) + 1) * 4096);
	}
}

interface CharacterDeviceNode extends fs.CharacterDeviceNode, BaseNode {
	readonly readable: ReadableStream | undefined;
	readonly writable: WritableStream | undefined;
}

namespace CharacterDeviceNode {
	export function create(parent: DirectoryNode, inode: inode, name: string, time: bigint, readable: ReadableStream | undefined, writable: WritableStream | undefined): CharacterDeviceNode {
		return {
			filetype: Filetype.character_device,
			inode: inode,
			name,
			ctime: time,
			mtime: time,
			atime: time,
			refs: 0,
			parent,
			readable,
			writable
		};
	}
}

type Node = FileNode | DirectoryNode | CharacterDeviceNode;

export class MemoryFileSystem extends fs.BaseFileSystem<DirectoryNode, FileNode, CharacterDeviceNode> implements ApiMemoryFileSystem {

	public readonly uri: Uri = Uri.from({ scheme: 'wasi-memfs', authority: uuid.v4() });

	constructor() {
		super(DirectoryNode.create(undefined, 1n, '/', timeInNanoseconds(Date.now())));
	}

	public createDirectory(path: string): void {
		const dirname = paths.dirname(path);
		const basename = paths.basename(path);
		const parent = this.getDirectoryNode(dirname);
		const node = DirectoryNode.create(parent, this.nextInode(), basename, timeInNanoseconds(Date.now()));
		parent.entries.set(basename, node);
	}

	public createFile(path: string, content: Uint8Array | { size: bigint; reader: () => Promise<Uint8Array> }): void {
		const dirname = paths.dirname(path);
		const basename = paths.basename(path);
		const parent = this.getDirectoryNode(dirname);
		const node = FileNode.create(parent, this.nextInode(), basename, timeInNanoseconds(Date.now()), content);
		parent.entries.set(basename, node);
	}

	public createReadable(path: string): Readable {
		const dirname = paths.dirname(path);
		const basename = paths.basename(path);
		const parent = this.getDirectoryNode(dirname);
		const node = CharacterDeviceNode.create(parent, this.nextInode(), basename, timeInNanoseconds(Date.now()), new ReadableStream(), undefined);
		parent.entries.set(basename, node);
		return node.readable!;
	}

	public createWritable(path: string, encoding?: 'utf-8'): Writable {
		const dirname = paths.dirname(path);
		const basename = paths.basename(path);
		const parent = this.getDirectoryNode(dirname);
		const node = CharacterDeviceNode.create(parent, this.nextInode(), basename, timeInNanoseconds(Date.now()), undefined, new WritableStream(encoding));
		parent.entries.set(basename, node);
		return node.writable!;
	}

	private getDirectoryNode(path: string): DirectoryNode {
		const result = this.findNode(path);
		if (result === undefined) {
			throw new Error(`ENOENT: no such directory ${path}`);
		}
		if (result.filetype !== Filetype.directory) {
			throw new Error(`ENOTDIR: not a directory ${path}`);
		}
		return result;
	}

	public async readFile(node: FileNode, offset: bigint, buffers: Uint8Array[]): Promise<size> {
		const content = await this.getContent(node);
		return this.read(content, offset, buffers);
	}

	public async readCharacterDevice(node: CharacterDeviceNode & { writable: WritableStream }, buffers: Uint8Array[]): Promise<size> {
		const maxBytes = buffers.reduce((previousValue, current) => { return previousValue + current.byteLength; }, 0);
		const content = await node.writable.read('max', maxBytes);
		return this.read(content, 0n, buffers);
	}

	public async writeFile(node: FileNode, offset: bigint, buffers: Uint8Array[]): Promise<size> {
		const content = await this.getContent(node);
		const [newContent, bytesWritten] = this.write(content, offset, buffers);
		node.content = newContent;
		return bytesWritten;
	}

	public async writeCharacterDevice(node: CharacterDeviceNode & { readable: ReadableStream }, buffers: Uint8Array[]): Promise<size> {
		const allBytes = buffers.reduce((previousValue, current) => { return previousValue + current.byteLength; }, 0);
		const buffer = new Uint8Array(allBytes);
		let offset = 0;
		for (const b of buffers) {
			buffer.set(b, offset);
			offset += b.byteLength;
		}
		await node.readable.write(buffer);
		return allBytes;
	}

	public async getContent(node: FileNode): Promise<Uint8Array> {
		if (node.content instanceof Uint8Array) {
			return Promise.resolve(node.content);
		} else {
			const result = await node.content.reader();
			(node as { content: Uint8Array}).content = result;
			return result;
		}
	}

	private read(content: Uint8Array, _offset: bigint, buffers: Uint8Array[]): size {
		let offset = BigInts.asNumber(_offset);
		let totalBytesRead = 0;
		for (const buffer of buffers) {
			const toRead = Math.min(buffer.length, content.byteLength - offset);
			buffer.set(content.subarray(offset, offset + toRead));
			totalBytesRead += toRead;
			if (toRead < buffer.length) {
				break;
			}
			offset += toRead;
		}
		return totalBytesRead;
	}

	private write(content: Uint8Array, _offset: bigint, buffers: Uint8Array[]): [Uint8Array, size] {
		let offset = BigInts.asNumber(_offset);
		let bytesToWrite: size = 0;
		for (const bytes of buffers) {
			bytesToWrite += bytes.byteLength;
		}

		// Do we need to increase the buffer
		if (offset + bytesToWrite > content.byteLength) {
			const newContent = new Uint8Array(offset + bytesToWrite);
			newContent.set(content);
			content = newContent;
		}

		for (const bytes of buffers) {
			content.set(bytes, offset);
			offset += bytes.length;
		}

		return [content, bytesToWrite];
	}
}

// When mounted the file system is readonly for now. We need to invest to make this writable and we need a use case first.
const DirectoryBaseRights: rights = Rights.fd_readdir | Rights.path_filestat_get | Rights.fd_filestat_get | Rights.path_open | Rights.path_create_file | Rights.path_create_directory;
const FileBaseRights: rights = Rights.fd_read | Rights.fd_seek | Rights.fd_tell | Rights.fd_advise | Rights.fd_filestat_get | Rights.poll_fd_readwrite;
const DirectoryInheritingRights: rights = DirectoryBaseRights | FileBaseRights;
const DirectoryOnlyBaseRights: rights = DirectoryBaseRights & ~FileBaseRights;
const FileOnlyBaseRights: rights = FileBaseRights & DirectoryBaseRights;

export function create(deviceId: DeviceId, memfs: MemoryFileSystem): FileSystemDeviceDriver {

	const $fs: MemoryFileSystem = memfs;

	function assertFileDescriptor(fileDescriptor: FileDescriptor): asserts fileDescriptor is fs.FileNodeDescriptor<FileNode> {
		if (!(fileDescriptor instanceof fs.FileNodeDescriptor)) {
			throw new WasiError(Errno.badf);
		}
	}

	function assertReadDescriptor(fileDescriptor: FileDescriptor): asserts fileDescriptor is fs.FileNodeDescriptor<FileNode> | fs.CharacterDeviceNodeDescriptor<CharacterDeviceNode & { writable: WritableStream }> {
		if (!(fileDescriptor instanceof fs.FileNodeDescriptor) && !(fileDescriptor instanceof fs.CharacterDeviceNodeDescriptor)) {
			throw new WasiError(Errno.badf);
		}
		if (fileDescriptor instanceof fs.CharacterDeviceNodeDescriptor && (fileDescriptor as fs.CharacterDeviceNodeDescriptor<CharacterDeviceNode>).node.writable === undefined) {
			throw new WasiError(Errno.perm);
		}
	}

	function assertWriteDescriptor(fileDescriptor: FileDescriptor): asserts fileDescriptor is fs.FileNodeDescriptor<FileNode> | fs.CharacterDeviceNodeDescriptor<CharacterDeviceNode & { readable: ReadableStream }> {
		if (!(fileDescriptor instanceof fs.FileNodeDescriptor) && !(fileDescriptor instanceof fs.CharacterDeviceNodeDescriptor)) {
			throw new WasiError(Errno.badf);
		}
		if (fileDescriptor instanceof fs.CharacterDeviceNodeDescriptor && (fileDescriptor as fs.CharacterDeviceNodeDescriptor<CharacterDeviceNode>).node.readable === undefined) {
			throw new WasiError(Errno.perm);
		}
	}

	function assertDirectoryDescriptor(fileDescriptor: FileDescriptor): asserts fileDescriptor is fs.DirectoryNodeDescriptor<DirectoryNode> {
		if (!(fileDescriptor instanceof fs.DirectoryNodeDescriptor)) {
			throw new WasiError(Errno.badf);
		}
	}

	function assertDescriptor(fileDescriptor: FileDescriptor): asserts fileDescriptor is fs.FileNodeDescriptor<FileNode> | fs.DirectoryNodeDescriptor<DirectoryNode> | fs.CharacterDeviceNodeDescriptor<CharacterDeviceNode> {
		if (!(fileDescriptor instanceof fs.FileNodeDescriptor) && !(fileDescriptor instanceof fs.DirectoryNodeDescriptor) && !(fileDescriptor instanceof fs.CharacterDeviceNodeDescriptor)) {
			throw new WasiError(Errno.badf);
		}
	}

	function getSize(node: Node): bigint {
		switch(node.filetype) {
			case Filetype.regular_file:
				return FileNode.size(node);
			case Filetype.directory:
				return DirectoryNode.size(node);
			case Filetype.character_device:
				return 1n;
		}
	}

	function assignStat(result: filestat, node: Node): void {
		result.dev = deviceId;
		result.ino = node.inode;
		result.filetype = node.filetype;
		result.nlink = 1n;
		result.size = getSize(node);
		result.atim = node.atime;
		result.ctim = node.ctime;
		result.mtim = node.mtime;
	}

	const $driver: ReadonlyFileSystemDeviceDriver & Pick<FileSystemDeviceDriver, 'fd_write' | 'fd_pwrite'> = {
		kind: DeviceDriverKind.fileSystem,
		uri: $fs.uri,
		id: deviceId,
		joinPath(): Uri | undefined {
			return undefined;
		},
		createStdioFileDescriptor(_dirflags: lookupflags | undefined = Lookupflags.none, _path: string, _oflags: oflags | undefined = Oflags.none, _fs_rights_base: rights | undefined, _fdflags: fdflags | undefined = Fdflags.none, _fd: 0 | 1 | 2): Promise<FileDescriptor> {
			throw new WasiError(Errno.nosys);
		},
		fd_create_prestat_fd(fd: fd): Promise<FileDescriptor> {
			const root = $fs.getRoot();
			return Promise.resolve(new fs.DirectoryNodeDescriptor(deviceId, fd, DirectoryBaseRights, DirectoryInheritingRights, Fdflags.none, root.inode, root));
		},
		fd_advise(fileDescriptor: FileDescriptor, _offset: bigint, _length: bigint, _advise: number): Promise<void> {
			assertFileDescriptor(fileDescriptor);
			// We don't have advisory in NodeFS. So treat it as successful.
			return Promise.resolve();
		},
		fd_close(fileDescriptor: FileDescriptor): Promise<void> {
			assertDescriptor(fileDescriptor);
			return Promise.resolve();
		},
		fd_fdstat_get(fileDescriptor: FileDescriptor, result: fdstat): Promise<void> {
			result.fs_filetype = fileDescriptor.fileType;
			result.fs_flags = fileDescriptor.fdflags;
			result.fs_rights_base = fileDescriptor.rights_base;
			result.fs_rights_inheriting = fileDescriptor.rights_inheriting;
			return Promise.resolve();
		},
		fd_filestat_get(fileDescriptor: FileDescriptor, result: filestat): Promise<void> {
			assertFileDescriptor(fileDescriptor);
			assignStat(result, fileDescriptor.node);
			return Promise.resolve();
		},
		async fd_pread(fileDescriptor: FileDescriptor, offset: filesize, buffers: Uint8Array[]): Promise<size> {
			if (buffers.length === 0) {
				return 0;
			}
			assertReadDescriptor(fileDescriptor);
			if (fileDescriptor instanceof fs.FileNodeDescriptor) {
				return $fs.readFile(fileDescriptor.node, offset, buffers);
			} else {
				return $fs.readCharacterDevice(fileDescriptor.node, buffers);
			}
		},
		async fd_read(fileDescriptor: FileDescriptor, buffers: Uint8Array[]): Promise<number> {
			if (buffers.length === 0) {
				return 0;
			}
			assertReadDescriptor(fileDescriptor);
			let totalBytesRead = 0;
			if (fileDescriptor instanceof fs.FileNodeDescriptor) {
				totalBytesRead = await $fs.readFile(fileDescriptor.node, fileDescriptor.cursor, buffers);
				fileDescriptor.cursor = fileDescriptor.cursor + BigInt(totalBytesRead);
			} else {
				totalBytesRead  = await $fs.readCharacterDevice(fileDescriptor.node, buffers);
			}
			return totalBytesRead;
		},
		fd_readdir(fileDescriptor: FileDescriptor): Promise<ReaddirEntry[]> {
			assertDirectoryDescriptor(fileDescriptor);

			const result: ReaddirEntry[] = [];
			for (const entry of fileDescriptor.node.entries.values()) {
				result.push({ d_ino: entry.inode, d_type: entry.filetype, d_name: entry.name });
			}
			return Promise.resolve(result);
		},
		async fd_seek(fileDescriptor: FileDescriptor, offset: bigint, whence: number): Promise<bigint> {
			assertFileDescriptor(fileDescriptor);

			switch(whence) {
				case Whence.set:
					fileDescriptor.cursor = offset;
					break;
				case Whence.cur:
					fileDescriptor.cursor = fileDescriptor.cursor + offset;
					break;
				case Whence.end:
					const size = FileNode.size(fileDescriptor.node);
					fileDescriptor.cursor = BigInts.max(0n, size - offset);
					break;
			}
			return BigInt(fileDescriptor.cursor);
		},
		fd_renumber(fileDescriptor: FileDescriptor, _to: fd): Promise<void> {
			assertDescriptor(fileDescriptor);
			return Promise.resolve();
		},
		fd_tell(fileDescriptor: FileDescriptor): Promise<u64> {
			assertFileDescriptor(fileDescriptor);
			return Promise.resolve(fileDescriptor.cursor);
		},
		async fd_pwrite(fileDescriptor: FileDescriptor, offset: filesize, buffers: Uint8Array[]): Promise<size> {
			assertWriteDescriptor(fileDescriptor);
			let bytesWritten: size = 0;
			if (fileDescriptor instanceof fs.FileNodeDescriptor) {
				bytesWritten = await $fs.writeFile(fileDescriptor.node, offset, buffers);
			} else {
				bytesWritten = await $fs.writeCharacterDevice(fileDescriptor.node, buffers);
			}
			return bytesWritten;
		},
		async fd_write(fileDescriptor: FileDescriptor, buffers: Uint8Array[]): Promise<size> {
			assertWriteDescriptor(fileDescriptor);
			let bytesWritten: size = 0;
			if (fileDescriptor instanceof fs.FileNodeDescriptor) {
				// We have append mode on. According to POSIX we need to
				// move the cursor to the end of the file on every write
				if (Fdflags.appendOn(fileDescriptor.fdflags)) {
					fileDescriptor.cursor = BigInt((await $fs.getContent(fileDescriptor.node)).byteLength);
				}
				bytesWritten = await $fs.writeFile(fileDescriptor.node, fileDescriptor.cursor, buffers);
				fileDescriptor.cursor = fileDescriptor.cursor + BigInt(bytesWritten);
			} else {
				bytesWritten = await $fs.writeCharacterDevice(fileDescriptor.node, buffers);
			}
			return bytesWritten;
		},
		async path_filestat_get(fileDescriptor: FileDescriptor, _flags: lookupflags, path: string, result: filestat): Promise<void> {
			assertDirectoryDescriptor(fileDescriptor);
			const target = $fs.findNode(fileDescriptor.node, path);
			if (target === undefined) {
				throw new WasiError(Errno.noent);
			}
			assignStat(result, target);
		},
		path_open(fileDescriptor: FileDescriptor, _dirflags: lookupflags, path: string, oflags: oflags, fs_rights_base: rights, fs_rights_inheriting: rights, fdflags: fdflags, fdProvider: FdProvider): Promise<FileDescriptor> {
			assertDirectoryDescriptor(fileDescriptor);

			const target = $fs.findNode(fileDescriptor.node, path);
			if (target === undefined) {
				if (Oflags.creatOn(oflags)) {
					throw new WasiError(Errno.perm);
				}
				throw new WasiError(Errno.noent);
			}
			if (target.filetype !== Filetype.directory && Oflags.directoryOn(oflags)) {
				throw new WasiError(Errno.notdir);
			}
			if (Oflags.exclOn(oflags)) {
				throw new WasiError(Errno.exist);
			}
			if (target.filetype === Filetype.regular_file && (Oflags.truncOn(oflags) || Fdflags.appendOn(fdflags) || Fdflags.syncOn(fdflags))) {
				throw new WasiError(Errno.perm);
			}

			const write= (fs_rights_base & (Rights.fd_write | Rights.fd_datasync | Rights.fd_allocate | Rights.fd_filestat_set_size)) !== 0n;
			if (target.filetype === Filetype.regular_file && write) {
				throw new WasiError(Errno.perm);
			}

			let descriptor: FileDescriptor;
			switch(target.filetype) {
				case Filetype.regular_file:
					descriptor = new fs.FileNodeDescriptor(deviceId, fdProvider.next(), fileDescriptor.childFileRights(fs_rights_base, DirectoryOnlyBaseRights), fdflags, target.inode, target);
					break;
				case Filetype.directory:
					descriptor = new fs.DirectoryNodeDescriptor<DirectoryNode>(deviceId, fdProvider.next(), fileDescriptor.childDirectoryRights(fs_rights_base, FileOnlyBaseRights), fs_rights_inheriting | DirectoryInheritingRights, fdflags, target.inode, target);
					break;
				case Filetype.character_device:
					let rights = fileDescriptor.childFileRights(fs_rights_base, FileOnlyBaseRights) | Rights.fd_write;
					descriptor = new fs.CharacterDeviceNodeDescriptor(deviceId, fdProvider.next(), rights, fdflags, target.inode, target);
					break;
			}
			if (descriptor === undefined) {
				throw new WasiError(Errno.noent);
			}
			return Promise.resolve(descriptor);
		},
		path_readlink(fileDescriptor: FileDescriptor, path: string): Promise<string> {
			assertDirectoryDescriptor(fileDescriptor);
			const target = $fs.findNode(fileDescriptor.node, path);
			if (target === undefined) {
				throw new WasiError(Errno.noent);
			}
			throw new WasiError(Errno.nolink);
		},
		fd_bytesAvailable(fileDescriptor: FileDescriptor): Promise<filesize> {
			assertFileDescriptor(fileDescriptor);
			return Promise.resolve(BigInts.max(0n, FileNode.size(fileDescriptor.node) - fileDescriptor.cursor));
		}
	};

	return Object.assign({}, NoSysDeviceDriver, WritePermDeniedDeviceDriver, $driver);
}
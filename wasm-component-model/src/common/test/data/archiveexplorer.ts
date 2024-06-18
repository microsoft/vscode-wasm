/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/* eslint-disable @typescript-eslint/ban-types */
import * as $wcm from '@vscode/wasm-component-model';
import type { u64, i32, ptr } from '@vscode/wasm-component-model';

export namespace Types {
	export namespace FileType {
		export const file = 'file' as const;
		export type File = { readonly tag: typeof file } & _common;
		export function File(): File {
			return new VariantImpl(file, undefined) as File;
		}

		export const directory = 'directory' as const;
		export type Directory = { readonly tag: typeof directory } & _common;
		export function Directory(): Directory {
			return new VariantImpl(directory, undefined) as Directory;
		}

		export type _tt = typeof file | typeof directory;
		export type _vt = undefined;
		type _common = Omit<VariantImpl, 'tag' | 'value'>;
		export function _ctor(t: _tt, v: _vt): FileType {
			return new VariantImpl(t, v) as FileType;
		}
		class VariantImpl {
			private readonly _tag: _tt;
			private readonly _value?: _vt;
			constructor(t: _tt, value: _vt) {
				this._tag = t;
				this._value = value;
			}
			get tag(): _tt {
				return this._tag;
			}
			get value(): _vt {
				return this._value;
			}
			isFile(): this is File {
				return this._tag === FileType.file;
			}
			isDirectory(): this is Directory {
				return this._tag === FileType.directory;
			}
		}
	}
	export type FileType = FileType.File | FileType.Directory;

	export type File = {
		name: string;
		ftype: FileType;
		size: u64;
	};
}
export type Types = {
};
export namespace archiveexplorer {
	export type File = Types.File;
	export type FileType = Types.FileType;
	export type Imports = {
	};
	export namespace Imports {
		export type Promisified = $wcm.$imports.Promisify<Imports>;
	}
	export namespace imports {
		export type Promisify<T> = $wcm.$imports.Promisify<T>;
	}
	export type Exports = {
		openArchive: (path: string) => File[];
	};
	export namespace Exports {
		export type Promisified = $wcm.$exports.Promisify<Exports>;
	}
	export namespace exports {
		export type Promisify<T> = $wcm.$exports.Promisify<T>;
	}
}

export namespace Types.$ {
	export const FileType = new $wcm.VariantType<Types.FileType, Types.FileType._tt, Types.FileType._vt>([['file', undefined], ['directory', undefined]], Types.FileType._ctor);
	export const File = new $wcm.RecordType<Types.File>([
		['name', $wcm.wstring],
		['ftype', FileType],
		['size', $wcm.u64],
	]);
}
export namespace Types._ {
	export const id = 'wyatt-herkamp:archiveexplorer/types' as const;
	export const witName = 'types' as const;
	export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
		['FileType', $.FileType],
		['File', $.File]
	]);
	export type WasmInterface = {
	};
}
export namespace archiveexplorer.$ {
	export const File = Types.$.File;
	export const FileType = Types.$.FileType;
	export namespace exports {
		export const openArchive = new $wcm.FunctionType<archiveexplorer.Exports['openArchive']>('open-archive',[
			['path', $wcm.wstring],
		], new $wcm.ListType<archiveexplorer.File>(File));
	}
}
export namespace archiveexplorer._ {
	export const id = 'wyatt-herkamp:archiveexplorer/archiveexplorer' as const;
	export const witName = 'archiveexplorer' as const;
	export namespace imports {
		export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
			['Types', Types._]
		]);
		export function create(service: archiveexplorer.Imports, context: $wcm.WasmContext): Imports {
			return $wcm.$imports.create<Imports>(_, service, context);
		}
		export function loop(service: archiveexplorer.Imports, context: $wcm.WasmContext): archiveexplorer.Imports {
			return $wcm.$imports.loop(_, service, context);
		}
	}
	export type Imports = {
	};
	export namespace exports {
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['openArchive', $.exports.openArchive]
		]);
		export function bind(exports: Exports, context: $wcm.WasmContext): archiveexplorer.Exports {
			return $wcm.$exports.bind<archiveexplorer.Exports>(_, exports, context);
		}
	}
	export type Exports = {
		'open-archive': (path_ptr: i32, path_len: i32, result: ptr<File[]>) => void;
	};
	export function bind(service: archiveexplorer.Imports, code: $wcm.Code, context?: $wcm.ComponentModelContext): Promise<archiveexplorer.Exports>;
	export function bind(service: archiveexplorer.Imports.Promisified, code: $wcm.Code, port: $wcm.RAL.ConnectionPort, context?: $wcm.ComponentModelContext): Promise<archiveexplorer.Exports.Promisified>;
	export function bind(service: archiveexplorer.Imports | archiveexplorer.Imports.Promisified, code: $wcm.Code, portOrContext?: $wcm.RAL.ConnectionPort | $wcm.ComponentModelContext, context?: $wcm.ComponentModelContext | undefined): Promise<archiveexplorer.Exports> | Promise<archiveexplorer.Exports.Promisified> {
		return $wcm.$main.bind(_, service, code, portOrContext, context);
	}
}
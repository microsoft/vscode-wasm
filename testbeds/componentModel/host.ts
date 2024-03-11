/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '@vscode/wasm-component-model';
import type { i32 } from '@vscode/wasm-component-model';

export namespace host {
	export namespace host {
		export type Imports = {
			print: (msg: string) => void;
		};
		export type Exports = {
			run: () => void;
		};
	}
}

export namespace host {
	export namespace host.$ {
		export namespace Imports {
			export const print = new $wcm.FunctionType<host.Imports['print']>('print',[
				['msg', $wcm.wstring],
			], undefined);
		}
		export namespace Exports {
			export const run = new $wcm.FunctionType<host.Exports['run']>('run', [], undefined);
		}
	}
	export namespace host._ {
		export const id = 'example:host/host' as const;
		export const witName = 'host' as const;
		export type $Root = {
			'print': (msg_ptr: i32, msg_len: i32) => void;
		}
		export namespace Imports {
			export const functions: Map<string, $wcm.FunctionType> = new Map([
				['print', $.Imports.print]
			]);
			export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
			]);
		}
		export type Imports = {
			'$root': $Root;
		};
		export namespace Exports {
			export const functions: Map<string, $wcm.FunctionType> = new Map([
				['run', $.Exports.run]
			]);
			export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
			]);
		}
		export type Exports = {
			'run': () => void;
		};

		export function createImports(service: host.Imports, context: $wcm.WasmContext): Imports {
			const result: Imports = Object.create(null);
			result['$root'] = $wcm.Imports.create<$Root>(Imports.functions, undefined, service, context);
			return result;
		}
		export function bindExports(exports: Exports, context: $wcm.WasmContext): host.Exports {
			const result: host.Exports = Object.create(null);
			Object.assign(result, $wcm.Exports.bind(Exports.functions, undefined, exports, context));
			return result;
		}
	}
}

export namespace host._ {
	export const id = 'example:host' as const;
	export const witName = 'host' as const;
	export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
	]);
	export const worlds: Map<string, $wcm.WorldType> = new Map<string, $wcm.WorldType>([
		['host', host._]
	]);
}
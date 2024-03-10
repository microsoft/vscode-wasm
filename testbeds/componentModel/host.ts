/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '@vscode/wasm-component-model';

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
		export const print = new $wcm.FunctionType<host.Imports['print']>('print',[
			['msg', $wcm.wstring],
		], undefined);
		export const run = new $wcm.FunctionType<host.Exports['run']>('run', [], undefined);
	}
	export namespace host._ {
		export type Imports = {
		};
		export type Exports = {
		};

		export function createImports(service: host.Imports, context: $wcm.WasmContext): Imports {
			const result: Imports = Object.create(null);
			return result;
		}
		export function bindExports(exports: Exports, context: $wcm.WasmContext): host.Exports {
			const result: host.Exports = Object.create(null);
			return result;
		}
	}
}

export namespace host._ {
	export const id = 'example:host' as const;
	export const witName = 'host' as const;
	export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
	]);
	export type WasmInterface = {
	};
}
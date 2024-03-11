/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '@vscode/wasm-component-model';
import type { u32, i32 } from '@vscode/wasm-component-model';

export namespace example {
	export namespace calculator {
		export type Imports = {
		};
		export type Exports = {
			add: (a: u32, b: u32) => u32;
		};
	}
}

export namespace example {
	export namespace calculator.$ {
		export namespace Exports {
			export const add = new $wcm.FunctionType<calculator.Exports['add']>('add',[
				['a', $wcm.u32],
				['b', $wcm.u32],
			], $wcm.u32);
		}
	}
	export namespace calculator._ {
		export const id = 'vscode:example/calculator' as const;
		export const witName = 'calculator' as const;
		export const Imports = {};
		export type Imports = {};
		export namespace Exports {
			export const functions: Map<string, $wcm.FunctionType> = new Map([
				['add', $.Exports.add]
			]);
		}
		export type Exports = {
			'add': (a: i32, b: i32) => i32;
		};
		export function bindExports(exports: Exports, context: $wcm.WasmContext): calculator.Exports {
			const result: calculator.Exports = Object.create(null);
			Object.assign(result, $wcm.Exports.bind(Exports.functions, undefined, exports, context));
			return result;
		}
	}
}

export namespace example._ {
	export const id = 'vscode:example' as const;
	export const witName = 'example' as const;
	export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
	]);
	export const worlds: Map<string, $wcm.WorldType> = new Map<string, $wcm.WorldType>([
		['calculator', calculator._]
	]);
}
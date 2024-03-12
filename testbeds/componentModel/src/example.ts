/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '@vscode/wasm-component-model';
import type { u32, i32 } from '@vscode/wasm-component-model';

export namespace example {
	export namespace Types {

		export enum OpCode {
			add = 'add',
			sub = 'sub',
			mul = 'mul',
			div = 'div',
		}

		export type Operation = {
			code: OpCode;
			a: u32;
			b: u32;
		};
	}
	export type Types = {
	};
	export namespace calculator {
		export type Imports = {
			types: example.Types;
		};
		export type Exports = {
			add: (a: u32, b: u32) => u32;
			calc: (o: Operation) => u32;
		};
	}
}

export namespace example {
	export namespace Types.$ {
		export const OpCode = new $wcm.EnumType<example.Types.OpCode>(['add', 'sub', 'mul', 'div']);
		export const Operation = new $wcm.RecordType<example.Types.Operation>([
			['code', OpCode],
			['a', $wcm.u32],
			['b', $wcm.u32],
		]);
	}
	export namespace Types._ {
		export const id = 'vscode:example/types' as const;
		export const witName = 'types' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['OpCode', $.OpCode],
			['Operation', $.Operation]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map<string, $wcm.ResourceType>([
		]);
		export type WasmInterface = {
		};
		export function createImports(service: example.Types, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Imports.create<WasmInterface>(functions, resources, service, context);
		}
		export function filterExports(exports: object, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Exports.filter<WasmInterface>(exports, functions, resources, id, undefined, context);
		}
		export function bindExports(wasmInterface: WasmInterface, context: $wcm.WasmContext): example.Types {
			return $wcm.Exports.bind<example.Types>(functions, [], wasmInterface, context);
		}
	}
	export namespace calculator.$ {
		export namespace Exports {
			export const add = new $wcm.FunctionType<calculator.Exports['add']>('add',[
				['a', $wcm.u32],
				['b', $wcm.u32],
			], $wcm.u32);
			export const calc = new $wcm.FunctionType<calculator.Exports['calc']>('calc',[
				['o', Operation],
			], $wcm.u32);
		}
	}
	export namespace calculator._ {
		export const id = 'vscode:example/calculator' as const;
		export const witName = 'calculator' as const;
		export namespace Imports {
			export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
				['Types', Types._]
			]);
		}
		export type Imports = {
			'vscode:example/types': example.Types._.WasmInterface;
		};
		export namespace Exports {
			export const functions: Map<string, $wcm.FunctionType> = new Map([
				['add', $.Exports.add],
				['calc', $.Exports.calc]
			]);
		}
		export type Exports = {
			'add': (a: i32, b: i32) => i32;
			'calc': (o_Operation_code_OpCode: i32, o_Operation_a: i32, o_Operation_b: i32) => i32;
		};
		export function createImports(service: calculator.Imports, context: $wcm.WasmContext): Imports {
			const result: Imports = Object.create(null);
			result['vscode:example/types'] = example.Types._.createImports(service.types, context);
			return result;
		}
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
		['Types', Types._]
	]);
	export const worlds: Map<string, $wcm.WorldType> = new Map<string, $wcm.WorldType>([
		['calculator', calculator._]
	]);
}
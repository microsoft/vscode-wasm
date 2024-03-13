/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '@vscode/wasm-component-model';
import type { own, u32, i32, ptr } from '@vscode/wasm-component-model';

export namespace example {
	export namespace Window {
		export namespace OutputChannel {
			export interface Interface {
				$handle?: $wcm.ResourceHandle;

				name(): string;

				append(value: string): void;

				appendLine(value: string): void;

				clear(): void;

				show(): void;
			}
			export type Statics = {
				$drop(inst: Interface): void;
			};
			export type Class = Statics & {
			};
		}
		export type OutputChannel = OutputChannel.Interface;

		export type createOutputChannel = (name: string, languageId: string | undefined) => own<OutputChannel>;
	}
	export type Window = {
		OutputChannel: Window.OutputChannel.Class;
		createOutputChannel: Window.createOutputChannel;
	};

	export namespace Types {
		export type Operands = {
			left: u32;
			right: u32;
		};

		export namespace Operation {
			export const add = 'add' as const;
			export type Add = { readonly tag: typeof add; readonly value: Operands } & _common;
			export function Add(value: Operands): Add {
				return new VariantImpl(add, value) as Add;
			}

			export const sub = 'sub' as const;
			export type Sub = { readonly tag: typeof sub; readonly value: Operands } & _common;
			export function Sub(value: Operands): Sub {
				return new VariantImpl(sub, value) as Sub;
			}

			export const mul = 'mul' as const;
			export type Mul = { readonly tag: typeof mul; readonly value: Operands } & _common;
			export function Mul(value: Operands): Mul {
				return new VariantImpl(mul, value) as Mul;
			}

			export const div = 'div' as const;
			export type Div = { readonly tag: typeof div; readonly value: Operands } & _common;
			export function Div(value: Operands): Div {
				return new VariantImpl(div, value) as Div;
			}

			export type _tt = typeof add | typeof sub | typeof mul | typeof div;
			export type _vt = Operands | Operands | Operands | Operands;
			type _common = Omit<VariantImpl, 'tag' | 'value'>;
			export function _ctor(t: _tt, v: _vt): Operation {
				return new VariantImpl(t, v) as Operation;
			}
			class VariantImpl {
				private readonly _tag: _tt;
				private readonly _value: _vt;
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
				isAdd(): this is Add {
					return this._tag === Operation.add;
				}
				isSub(): this is Sub {
					return this._tag === Operation.sub;
				}
				isMul(): this is Mul {
					return this._tag === Operation.mul;
				}
				isDiv(): this is Div {
					return this._tag === Operation.div;
				}
			}
		}
		export type Operation = Operation.Add | Operation.Sub | Operation.Mul | Operation.Div;
	}
	export type Types = {
	};
	export namespace calculator {
		export type Operation = Types.Operation;
		export type Imports = {
			window: example.Window;
		};
		export type Exports = {
			add: (a: u32, b: u32) => u32;
			calc: (o: Operation) => u32;
		};
	}
}

export namespace example {
	export namespace Window.$ {
		export const OutputChannel = new $wcm.ResourceType<example.Window.OutputChannel>('output-channel', 'vscode:example/window/output-channel');
		export const OutputChannel_Handle = new $wcm.ResourceHandleType('output-channel');
		OutputChannel.addCallable('name', new $wcm.MethodType<example.Window.OutputChannel.Interface['name']>('[method]output-channel.name', [
			['self', new $wcm.BorrowType<example.Window.OutputChannel>(OutputChannel)],
		], $wcm.wstring));
		OutputChannel.addCallable('append', new $wcm.MethodType<example.Window.OutputChannel.Interface['append']>('[method]output-channel.append', [
			['self', new $wcm.BorrowType<example.Window.OutputChannel>(OutputChannel)],
			['value', $wcm.wstring],
		], undefined));
		OutputChannel.addCallable('appendLine', new $wcm.MethodType<example.Window.OutputChannel.Interface['appendLine']>('[method]output-channel.append-line', [
			['self', new $wcm.BorrowType<example.Window.OutputChannel>(OutputChannel)],
			['value', $wcm.wstring],
		], undefined));
		OutputChannel.addCallable('clear', new $wcm.MethodType<example.Window.OutputChannel.Interface['clear']>('[method]output-channel.clear', [
			['self', new $wcm.BorrowType<example.Window.OutputChannel>(OutputChannel)],
		], undefined));
		OutputChannel.addCallable('show', new $wcm.MethodType<example.Window.OutputChannel.Interface['show']>('[method]output-channel.show', [
			['self', new $wcm.BorrowType<example.Window.OutputChannel>(OutputChannel)],
		], undefined));
		OutputChannel.addCallable('$drop', new $wcm.DestructorType<example.Window.OutputChannel.Statics['$drop']>('[resource-drop]output-channel', [['inst', OutputChannel]]));
		export const createOutputChannel = new $wcm.FunctionType<example.Window.createOutputChannel>('create-output-channel',[
			['name', $wcm.wstring],
			['languageId', new $wcm.OptionType<string>($wcm.wstring)],
		], new $wcm.OwnType<example.Window.OutputChannel>(OutputChannel));
	}
	export namespace Window._ {
		export const id = 'vscode:example/window' as const;
		export const witName = 'window' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['OutputChannel', $.OutputChannel]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['createOutputChannel', $.createOutputChannel]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map<string, $wcm.ResourceType>([
			['OutputChannel', $.OutputChannel]
		]);
		export namespace OutputChannel {
			export type WasmInterface = {
				'[method]output-channel.name': (self: i32, result: ptr<string>) => void;
				'[method]output-channel.append': (self: i32, value_ptr: i32, value_len: i32) => void;
				'[method]output-channel.append-line': (self: i32, value_ptr: i32, value_len: i32) => void;
				'[method]output-channel.clear': (self: i32) => void;
				'[method]output-channel.show': (self: i32) => void;
				'[resource-drop]output-channel': (self: i32) => void;
			};
			type ObjectModule = {
				name(self: OutputChannel): string;
				append(self: OutputChannel, value: string): void;
				appendLine(self: OutputChannel, value: string): void;
				clear(self: OutputChannel): void;
				show(self: OutputChannel): void;
			};
			type ClassModule = {
				$drop(self: OutputChannel): void;
			};
			class Impl extends $wcm.Resource implements example.Window.OutputChannel.Interface {
				private readonly _om: ObjectModule;
				constructor(om: ObjectModule) {
					super();
					this._om = om;
				}
				public name(): string {
					return this._om.name(this);
				}
				public append(value: string): void {
					return this._om.append(this, value);
				}
				public appendLine(value: string): void {
					return this._om.appendLine(this, value);
				}
				public clear(): void {
					return this._om.clear(this);
				}
				public show(): void {
					return this._om.show(this);
				}
			}
			export function Class(wasmInterface: WasmInterface, context: $wcm.WasmContext): example.Window.OutputChannel.Class {
				const resource = example.Window.$.OutputChannel;
				const om: ObjectModule = $wcm.Module.createObjectModule(resource, wasmInterface, context);
				const cm: ClassModule = $wcm.Module.createClassModule(resource, wasmInterface, context);
				return class extends Impl {
					constructor() {
						super(om);
					}
					public static $drop(self: OutputChannel): void {
						return cm.$drop(self);
					}
				};
			}
		}
		export type WasmInterface = {
			'create-output-channel': (name_ptr: i32, name_len: i32, languageId_case: i32, languageId_option_ptr: i32, languageId_option_len: i32) => i32;
		} & OutputChannel.WasmInterface;
		export function createImports(service: example.Window, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Imports.create<WasmInterface>(functions, resources, service, context);
		}
		export function filterExports(exports: object, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Exports.filter<WasmInterface>(exports, functions, resources, id, undefined, context);
		}
		export function bindExports(wasmInterface: WasmInterface, context: $wcm.WasmContext): example.Window {
			return $wcm.Exports.bind<example.Window>(functions, [['OutputChannel', $.OutputChannel, OutputChannel.Class]], wasmInterface, context);
		}
	}

	export namespace Types.$ {
		export const Operands = new $wcm.RecordType<example.Types.Operands>([
			['left', $wcm.u32],
			['right', $wcm.u32],
		]);
		export const Operation = new $wcm.VariantType<example.Types.Operation, example.Types.Operation._tt, example.Types.Operation._vt>([['add', Operands], ['sub', Operands], ['mul', Operands], ['div', Operands]], example.Types.Operation._ctor);
	}
	export namespace Types._ {
		export const id = 'vscode:example/types' as const;
		export const witName = 'types' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['Operands', $.Operands],
			['Operation', $.Operation]
		]);
	}
	export namespace calculator.$ {
		export const Operation = Types.$.Operation;
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
				['Window', Window._],
				['Types', Types._]
			]);
		}
		export type Imports = {
			'vscode:example/window': example.Window._.WasmInterface;
		};
		export namespace Exports {
			export const functions: Map<string, $wcm.FunctionType> = new Map([
				['add', $.Exports.add],
				['calc', $.Exports.calc]
			]);
		}
		export type Exports = {
			'add': (a: i32, b: i32) => i32;
			'calc': (o_Operation_case: i32, o_Operation_0: i32, o_Operation_1: i32) => i32;
		};
		export function createImports(service: calculator.Imports, context: $wcm.WasmContext): Imports {
			const result: Imports = Object.create(null);
			result['vscode:example/window'] = example.Window._.createImports(service.window, context);
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
		['Window', Window._],
		['Types', Types._]
	]);
	export const worlds: Map<string, $wcm.WorldType> = new Map<string, $wcm.WorldType>([
		['calculator', calculator._],
	]);
}
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/* eslint-disable @typescript-eslint/ban-types */
import * as $wcm from '@vscode/wasm-component-model';
import type { u32, i32, ptr } from '@vscode/wasm-component-model';

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

	export namespace Channel {
		export interface Interface extends $wcm.Resource {
			send(msg: string): void;
		}
		export type Statics = {
			$new?(level: u32): Interface;
		};
		export type Class = Statics & {
			new(level: u32): Interface;
		};
	}
	export type Channel = Channel.Interface;
}
export type Types = {
	Channel: Types.Channel.Class;
};

export namespace ReverseNotation {
	export enum Operation {
		add = 'add',
		sub = 'sub',
		mul = 'mul',
		div = 'div'
	}

	export namespace Engine {
		export interface Interface extends $wcm.Resource {
			pushOperand(operand: u32): void;

			pushOperation(operation: Operation): void;

			execute(): u32;
		}
		export type Statics = {
			$new?(): Interface;
		};
		export type Class = Statics & {
			new(): Interface;
		};
	}
	export type Engine = Engine.Interface;
}
export type ReverseNotation = {
	Engine: ReverseNotation.Engine.Class;
};
export namespace calculator {
	export type Operation = Types.Operation;
	export type Imports = {
		log: (msg: string) => void;
		generate: () => string;
		types: Types;
	};
	export namespace Imports {
		export type Promisified = $wcm.$imports.Promisify<Imports>;
	}
	export namespace imports {
		export type Promisify<T> = $wcm.$imports.Promisify<T>;
	}
	export type Exports = {
		calc: (o: Operation) => u32;
		msg: () => string;
		reverseNotation: ReverseNotation;
	};
	export namespace Exports {
		export type Promisified = $wcm.$exports.Promisify<Exports>;
	}
	export namespace exports {
		export type Promisify<T> = $wcm.$exports.Promisify<T>;
	}
}

export namespace Types.$ {
	export const Operands = new $wcm.RecordType<Types.Operands>([
		['left', $wcm.u32],
		['right', $wcm.u32],
	]);
	export const Operation = new $wcm.VariantType<Types.Operation, Types.Operation._tt, Types.Operation._vt>([['add', Operands], ['sub', Operands], ['mul', Operands], ['div', Operands]], Types.Operation._ctor);
	export const Channel = new $wcm.ResourceType<Types.Channel>('channel', 'vscode:example/types/channel');
	export const Channel_Handle = new $wcm.ResourceHandleType('channel');
	Channel.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]channel', [['inst', Channel]]));
	Channel.addConstructor('constructor', new $wcm.ConstructorType<Types.Channel.Class['constructor']>('[constructor]channel', [
		['level', $wcm.u32],
	], new $wcm.OwnType(Channel_Handle)));
	Channel.addMethod('send', new $wcm.MethodType<Types.Channel.Interface['send']>('[method]channel.send', [
		['msg', $wcm.wstring],
	], undefined));
}
export namespace Types._ {
	export const id = 'vscode:example/types' as const;
	export const witName = 'types' as const;
	export namespace Channel {
		export type WasmInterface = {
			'[constructor]channel': (level: i32) => i32;
			'[method]channel.send': (self: i32, msg_ptr: i32, msg_len: i32) => void;
		};
		export namespace imports {
			export type WasmInterface = Channel.WasmInterface & { '[resource-drop]channel': (self: i32) => void };
		}
		export namespace exports {
			export type WasmInterface = Channel.WasmInterface & { '[dtor]channel': (self: i32) => void };
		}
	}
	export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
		['Operands', $.Operands],
		['Operation', $.Operation],
		['Channel', $.Channel]
	]);
	export const resources: Map<string, $wcm.ResourceType> = new Map<string, $wcm.ResourceType>([
		['Channel', $.Channel]
	]);
	export type WasmInterface = {
	};
	export namespace imports {
		export type WasmInterface = _.WasmInterface & Channel.imports.WasmInterface;
	}
	export namespace exports {
		export type WasmInterface = _.WasmInterface & Channel.exports.WasmInterface;
		export namespace imports {
			export type WasmInterface = {
				'[resource-new]channel': (rep: i32) => i32;
				'[resource-rep]channel': (handle: i32) => i32;
				'[resource-drop]channel': (handle: i32) => void;
			};
		}
	}
}

export namespace ReverseNotation.$ {
	export const Operation = new $wcm.EnumType<ReverseNotation.Operation>(['add', 'sub', 'mul', 'div']);
	export const Engine = new $wcm.ResourceType<ReverseNotation.Engine>('engine', 'vscode:example/reverse-notation/engine');
	export const Engine_Handle = new $wcm.ResourceHandleType('engine');
	Engine.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]engine', [['inst', Engine]]));
	Engine.addConstructor('constructor', new $wcm.ConstructorType<ReverseNotation.Engine.Class['constructor']>('[constructor]engine', [], new $wcm.OwnType(Engine_Handle)));
	Engine.addMethod('pushOperand', new $wcm.MethodType<ReverseNotation.Engine.Interface['pushOperand']>('[method]engine.push-operand', [
		['operand', $wcm.u32],
	], undefined));
	Engine.addMethod('pushOperation', new $wcm.MethodType<ReverseNotation.Engine.Interface['pushOperation']>('[method]engine.push-operation', [
		['operation', Operation],
	], undefined));
	Engine.addMethod('execute', new $wcm.MethodType<ReverseNotation.Engine.Interface['execute']>('[method]engine.execute', [], $wcm.u32));
}
export namespace ReverseNotation._ {
	export const id = 'vscode:example/reverse-notation' as const;
	export const witName = 'reverse-notation' as const;
	export namespace Engine {
		export type WasmInterface = {
			'[constructor]engine': () => i32;
			'[method]engine.push-operand': (self: i32, operand: i32) => void;
			'[method]engine.push-operation': (self: i32, operation_Operation: i32) => void;
			'[method]engine.execute': (self: i32) => i32;
		};
		export namespace imports {
			export type WasmInterface = Engine.WasmInterface & { '[resource-drop]engine': (self: i32) => void };
		}
		export namespace exports {
			export type WasmInterface = Engine.WasmInterface & { '[dtor]engine': (self: i32) => void };
		}
	}
	export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
		['Operation', $.Operation],
		['Engine', $.Engine]
	]);
	export const resources: Map<string, $wcm.ResourceType> = new Map<string, $wcm.ResourceType>([
		['Engine', $.Engine]
	]);
	export type WasmInterface = {
	};
	export namespace imports {
		export type WasmInterface = _.WasmInterface & Engine.imports.WasmInterface;
	}
	export namespace exports {
		export type WasmInterface = _.WasmInterface & Engine.exports.WasmInterface;
		export namespace imports {
			export type WasmInterface = {
				'[resource-new]engine': (rep: i32) => i32;
				'[resource-rep]engine': (handle: i32) => i32;
				'[resource-drop]engine': (handle: i32) => void;
			};
		}
	}
}
export namespace calculator.$ {
	export const Operation = Types.$.Operation;
	export namespace imports {
		export const log = new $wcm.FunctionType<calculator.Imports['log']>('log',[
			['msg', $wcm.wstring],
		], undefined);
		export const generate = new $wcm.FunctionType<calculator.Imports['generate']>('generate', [], $wcm.wstring);
	}
	export namespace exports {
		export const calc = new $wcm.FunctionType<calculator.Exports['calc']>('calc',[
			['o', Operation],
		], $wcm.u32);
		export const msg = new $wcm.FunctionType<calculator.Exports['msg']>('msg', [], $wcm.wstring);
	}
}
export namespace calculator._ {
	export const id = 'vscode:example/calculator' as const;
	export const witName = 'calculator' as const;
	export type $Root = {
		'log': (msg_ptr: i32, msg_len: i32) => void;
		'generate': (result: ptr<string>) => void;
	};
	export namespace imports {
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['log', $.imports.log],
			['generate', $.imports.generate]
		]);
		export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
			['Types', Types._]
		]);
		export function create(service: calculator.Imports, context: $wcm.WasmContext): Imports {
			return $wcm.$imports.create<Imports>(_, service, context);
		}
		export function loop(service: calculator.Imports, context: $wcm.WasmContext): calculator.Imports {
			return $wcm.$imports.loop<calculator.Imports>(_, service, context);
		}
	}
	export type Imports = {
		'$root': $Root;
		'vscode:example/types': Types._.imports.WasmInterface;
		'[export]vscode:example/reverse-notation': ReverseNotation._.exports.imports.WasmInterface;
	};
	export namespace exports {
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['calc', $.exports.calc],
			['msg', $.exports.msg]
		]);
		export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
			['ReverseNotation', ReverseNotation._]
		]);
		export function bind(exports: Exports, context: $wcm.WasmContext): calculator.Exports {
			return $wcm.$exports.bind<calculator.Exports>(_, exports, context);
		}
	}
	export type Exports = {
		'calc': (o_Operation_case: i32, o_Operation_0: i32, o_Operation_1: i32) => i32;
		'msg': (result: ptr<string>) => void;
		'vscode:example/reverse-notation#[constructor]engine': () => i32;
		'vscode:example/reverse-notation#[method]engine.push-operand': (self: i32, operand: i32) => void;
		'vscode:example/reverse-notation#[method]engine.push-operation': (self: i32, operation_Operation: i32) => void;
		'vscode:example/reverse-notation#[method]engine.execute': (self: i32) => i32;
	};
	export function bind(service: calculator.Imports, code: $wcm.Code, context?: $wcm.ComponentModelContext): Promise<calculator.Exports>;
	export function bind(service: calculator.Imports.Promisified, code: $wcm.Code, port: $wcm.RAL.ConnectionPort, context?: $wcm.ComponentModelContext): Promise<calculator.Exports.Promisified>;
	export function bind(service: calculator.Imports | calculator.Imports.Promisified, code: $wcm.Code, portOrContext?: $wcm.RAL.ConnectionPort | $wcm.ComponentModelContext, context?: $wcm.ComponentModelContext | undefined): Promise<calculator.Exports> | Promise<calculator.Exports.Promisified> {
		return $wcm.$main.bind(_, service, code, portOrContext, context);
	}
}
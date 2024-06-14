/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/* eslint-disable @typescript-eslint/ban-types */
import type { i32, u32 } from '@vscode/wasm-component-model';
import * as $wcm from '@vscode/wasm-component-model';

export namespace Types {
	export enum OpCode {
		add = 'add',
		sub = 'sub',
		mul = 'mul',
		div = 'div'
	}

	export type Operation = {
		code: OpCode;
		a: u32;
		b: u32;
	};

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
export type Types = {
	Engine: Types.Engine.Class;
};

export namespace Functions {
	export type Operation = Types.Operation;

	export type faz = (a: u32, b: u32) => u32;

	export type baz = (o: Operation) => u32;
}
export type Functions = {
	faz: Functions.faz;
	baz: Functions.baz;
};
export namespace calculator {
	export type OpCode = Types.OpCode;
	export type Operation = Types.Operation;
	export enum Bits {
		one = 'one'
	}
	export namespace imports {
		export namespace Iface {
			export type foo = () => u32;
		}
		export type Iface = {
			foo: Iface.foo;
		};
	}
	export type Imports = {
		bar: () => u32;
		types: Types;
		functions: Functions;
		iface: imports.Iface;
	};
	export namespace Imports {
		export type Promisified = $wcm.$imports.Promisify<Imports>;
	}
	export namespace imports {
		export type Promisify<T> = $wcm.$imports.Promisify<T>;
	}
	export namespace exports {
		export namespace Iface {
			export type foo = () => u32;
		}
		export type Iface = {
			foo: Iface.foo;
		};
	}
	export type Exports = {
		add: (a: u32, b: u32) => u32;
		calc: (o: Operation) => u32;
		types: Types;
		iface: exports.Iface;
	};
	export namespace Exports {
		export type Promisified = $wcm.$exports.Promisify<Exports>;
	}
	export namespace exports {
		export type Promisify<T> = $wcm.$exports.Promisify<T>;
	}
}

export namespace Types.$ {
	export const OpCode = new $wcm.EnumType<Types.OpCode>(['add', 'sub', 'mul', 'div']);
	export const Operation = new $wcm.RecordType<Types.Operation>([
		['code', OpCode],
		['a', $wcm.u32],
		['b', $wcm.u32],
	]);
	export const Engine = new $wcm.ResourceType<Types.Engine>('engine', 'vscode:example/types/engine');
	export const Engine_Handle = new $wcm.ResourceHandleType('engine');
	Engine.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]engine', [['inst', Engine]]));
	Engine.addConstructor('constructor', new $wcm.ConstructorType<Types.Engine.Class['constructor']>('[constructor]engine', [], new $wcm.OwnType(Engine_Handle)));
	Engine.addMethod('pushOperand', new $wcm.MethodType<Types.Engine.Interface['pushOperand']>('[method]engine.push-operand', [
		['operand', $wcm.u32],
	], undefined));
	Engine.addMethod('pushOperation', new $wcm.MethodType<Types.Engine.Interface['pushOperation']>('[method]engine.push-operation', [
		['operation', Operation],
	], undefined));
	Engine.addMethod('execute', new $wcm.MethodType<Types.Engine.Interface['execute']>('[method]engine.execute', [], $wcm.u32));
}
export namespace Types._ {
	export const id = 'vscode:example/types' as const;
	export const witName = 'types' as const;
	export namespace Engine {
		export type WasmInterface = {
			'[constructor]engine': () => i32;
			'[method]engine.push-operand': (self: i32, operand: i32) => void;
			'[method]engine.push-operation': (self: i32, operation_code_OpCode: i32, operation_a: i32, operation_b: i32) => void;
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
		['OpCode', $.OpCode],
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

export namespace Functions.$ {
	export const Operation = Types.$.Operation;
	export const faz = new $wcm.FunctionType<Functions.faz>('faz',[
		['a', $wcm.u32],
		['b', $wcm.u32],
	], $wcm.u32);
	export const baz = new $wcm.FunctionType<Functions.baz>('baz',[
		['o', Operation],
	], $wcm.u32);
}
export namespace Functions._ {
	export const id = 'vscode:example/functions' as const;
	export const witName = 'functions' as const;
	export const types: Map<string, $wcm.AnyComponentModelType> = new Map<string, $wcm.AnyComponentModelType>([
		['Operation', $.Operation]
	]);
	export const functions: Map<string, $wcm.FunctionType> = new Map([
		['faz', $.faz],
		['baz', $.baz]
	]);
	export type WasmInterface = {
		'faz': (a: i32, b: i32) => i32;
		'baz': (o_Operation_code_OpCode: i32, o_Operation_a: i32, o_Operation_b: i32) => i32;
	};
	export namespace imports {
		export type WasmInterface = _.WasmInterface;
	}
	export namespace exports {
		export type WasmInterface = _.WasmInterface;
	}
}
export namespace calculator.$ {
	export const OpCode = Types.$.OpCode;
	export const Operation = Types.$.Operation;
	export const Bits = new $wcm.EnumType<Bits>(['one']);
	export namespace imports {
		export const bar = new $wcm.FunctionType<calculator.Imports['bar']>('bar', [], $wcm.u32);
		export namespace Iface.$ {
			export const foo = new $wcm.FunctionType<calculator.imports.Iface.foo>('foo', [], $wcm.u32);
		}
	}
	export namespace exports {
		export const add = new $wcm.FunctionType<calculator.Exports['add']>('add',[
			['a', $wcm.u32],
			['b', $wcm.u32],
		], $wcm.u32);
		export const calc = new $wcm.FunctionType<calculator.Exports['calc']>('calc',[
			['o', Operation],
		], $wcm.u32);
		export namespace Iface.$ {
			export const foo = new $wcm.FunctionType<calculator.exports.Iface.foo>('foo', [], $wcm.u32);
		}
	}
}
export namespace calculator._ {
	export const id = 'vscode:example/calculator' as const;
	export const witName = 'calculator' as const;
	export type $Root = {
		'bar': () => i32;
	};
	export namespace imports {
		export namespace Iface._ {
			export const id = 'vscode:example/iface' as const;
			export const witName = 'iface' as const;
			export const functions: Map<string, $wcm.FunctionType> = new Map([
				['foo', calculator.$.imports.Iface.$.foo]
			]);
			export type WasmInterface = {
				'foo': () => i32;
			};
			export namespace imports {
				export type WasmInterface = _.WasmInterface;
			}
			export namespace exports {
				export type WasmInterface = _.WasmInterface;
			}
		}
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['bar', $.imports.bar]
		]);
		export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
			['Iface', imports.Iface._],
			['Types', Types._],
			['Functions', Functions._]
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
		'vscode:example/iface': imports.Iface._.imports.WasmInterface;
		'vscode:example/types': Types._.imports.WasmInterface;
		'vscode:example/functions': Functions._.imports.WasmInterface;
		'[export]vscode:example/types': Types._.exports.imports.WasmInterface;
	};
	export namespace exports {
		export namespace Iface._ {
			export const id = 'vscode:example/iface' as const;
			export const witName = 'iface' as const;
			export const functions: Map<string, $wcm.FunctionType> = new Map([
				['foo', calculator.$.exports.Iface.$.foo]
			]);
			export type WasmInterface = {
				'foo': () => i32;
			};
			export namespace imports {
				export type WasmInterface = _.WasmInterface;
			}
			export namespace exports {
				export type WasmInterface = _.WasmInterface;
			}
		}
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['add', $.exports.add],
			['calc', $.exports.calc]
		]);
		export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
			['Iface', exports.Iface._],
			['Types', Types._]
		]);
		export function bind(exports: Exports, context: $wcm.WasmContext): calculator.Exports {
			return $wcm.$exports.bind<calculator.Exports>(_, exports, context);
		}
	}
	export type Exports = {
		'add': (a: i32, b: i32) => i32;
		'calc': (o_Operation_code_OpCode: i32, o_Operation_a: i32, o_Operation_b: i32) => i32;
		'vscode:example/iface#foo': () => i32;
		'vscode:example/types#[constructor]engine': () => i32;
		'vscode:example/types#[method]engine.push-operand': (self: i32, operand: i32) => void;
		'vscode:example/types#[method]engine.push-operation': (self: i32, operation_code_OpCode: i32, operation_a: i32, operation_b: i32) => void;
		'vscode:example/types#[method]engine.execute': (self: i32) => i32;
	};
	export function bind(service: calculator.Imports, code: $wcm.Code, context?: $wcm.ComponentModelContext): Promise<calculator.Exports>;
	export function bind(service: calculator.Imports.Promisified, code: $wcm.Code, port: $wcm.RAL.ConnectionPort, context?: $wcm.ComponentModelContext): Promise<calculator.Exports.Promisified>;
	export function bind(service: calculator.Imports | calculator.Imports.Promisified, code: $wcm.Code, portOrContext?: $wcm.RAL.ConnectionPort | $wcm.ComponentModelContext, context?: $wcm.ComponentModelContext | undefined): Promise<calculator.Exports> | Promise<calculator.Exports.Promisified> {
		return $wcm.$main.bind(_, service, code, portOrContext, context);
	}
}
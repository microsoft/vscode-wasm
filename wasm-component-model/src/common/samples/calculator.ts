/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/* eslint-disable @typescript-eslint/ban-types */
import * as $wcm from '@vscode/wasm-component-model';
import type { u32, own, i32 } from '@vscode/wasm-component-model';

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
			$new(): Interface;
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

	export namespace main {
		export type Exports = $wcm.Exports.Promisify<calculator.Exports>;
		export type Imports = $wcm.Imports.Promisify<calculator.Imports>;
	}

}

async function foo() {
	let x!: calculator.main.Exports;
	let r = await x.add(1, 2);

	let eng = await x.types.Engine.$new();
	eng.pushOperand(1);

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
		type ObjectModule = {
			'constructor'(): own<$wcm.ResourceHandle>;
			pushOperand(self: Engine, operand: u32): void;
			pushOperation(self: Engine, operation: Operation): void;
			execute(self: Engine): u32;
		};
		export namespace imports {
			export type WasmInterface = Engine.WasmInterface & { '[resource-drop]engine': (self: i32) => void };
		}
		export namespace exports {
			export type WasmInterface = Engine.WasmInterface & { '[dtor]engine': (self: i32) => void };
			class Impl extends $wcm.Resource.Default implements Types.Engine.Interface {
				private readonly _rep: $wcm.ResourceRepresentation;
				private readonly _om: ObjectModule;
				constructor(om: ObjectModule);
				constructor(handleTag: symbol, handle: $wcm.ResourceHandle, rm: $wcm.ResourceManager, om: ObjectModule);
				constructor(...args: any[]);
				constructor(...args: any[]) {
					if (args[0] === $wcm.ResourceManager.handleTag) {
						const handle = args[1] as $wcm.ResourceHandle;
						super(handle);
						this._rep = (args[2] as $wcm.ResourceManager).getRepresentation(handle);
						this._om = args[3] as ObjectModule;
					} else {
						const rm = args[0] as $wcm.ResourceManager;
						const om = args[1] as ObjectModule;
						super(om.constructor());
						this._rep = rm.getRepresentation(this.$handle());
						this._om = om;
					}
				}
				public $rep(): $wcm.ResourceRepresentation { return this._rep; }
				public pushOperand(operand: u32): void {
					return this._om.pushOperand(this, operand);
				}
				public pushOperation(operation: Operation): void {
					return this._om.pushOperation(this, operation);
				}
				public execute(): u32 {
					return this._om.execute(this);
				}
			}
			export function Class(wasmInterface: WasmInterface, context: $wcm.WasmContext): Types.Engine.Class {
				const resource = Types.$.Engine;
				const rm: $wcm.ResourceManager = context.resources.ensure('vscode:example/types/engine');
				const om: ObjectModule = $wcm.Module.createObjectModule(resource, wasmInterface, context);
				return class extends Impl {
					public static $new(): Types.Engine.Interface {
						return new this(rm, om);
					}
					constructor();
					constructor(handleTag: symbol, handle: $wcm.ResourceHandle);
					constructor(...args: any[]) {
						super(...args, rm, om);
						rm.registerProxy(this);
					}
				};
			}
		}
	}
	export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
		['OpCode', $.OpCode],
		['Operation', $.Operation],
		['Engine', $.Engine]
	]);
	export const resources: Map<string, { resource: $wcm.ResourceType; factory: $wcm.ClassFactory<any>}> = new Map<string, { resource: $wcm.ResourceType; factory: $wcm.ClassFactory<any>}>([
		['Engine', { resource: $.Engine, factory: Engine.exports.Class }]
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
	export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
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
	export namespace Iface.$ {
		export const foo = new $wcm.FunctionType<Iface.foo>('foo', [], $wcm.u32);
	}
	export namespace imports {
		export const bar = new $wcm.FunctionType<calculator.Imports['bar']>('bar', [], $wcm.u32);
	}
	export namespace exports {
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
	export namespace Iface._ {
		export const id = 'vscode:example/iface' as const;
		export const witName = 'iface' as const;
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['foo', $.foo]
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
	export type $Root = {
		'bar': () => i32;
	};
	export type Imports = {
		'$root': $Root;
		'vscode:example/iface': Iface._.imports.WasmInterface;
		'vscode:example/types': Types._.imports.WasmInterface;
		'vscode:example/functions': Functions._.imports.WasmInterface;
		'[export]vscode:example/types': Types._.exports.imports.WasmInterface;
	};
	export namespace imports {
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['bar', $.imports.bar]
		]);
		export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
			['Types', Types._],
			['Functions', Functions._]
		]);
		export function create(service: calculator.Imports, context: $wcm.WasmContext): Imports {
			return $wcm.Imports.create<Imports>(_, service, context);
		}
		export function loop(service: calculator.Imports, context: $wcm.WasmContext): calculator.Imports {
			return $wcm.Imports.loop(_, service, context);
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
	export namespace exports {
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['add', $.exports.add],
			['calc', $.exports.calc]
		]);
		export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
			['Types', Types._]
		]);
		export function bind(exports: Exports, context: $wcm.WasmContext): calculator.Exports {
			return $wcm.Exports.bind<calculator.Exports>(_, exports, context);
		}
	}
}
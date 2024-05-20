/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/* eslint-disable @typescript-eslint/ban-types */
import * as $wcm from '@vscode/wasm-component-model';
import type { u32, own, i32 } from '@vscode/wasm-component-model';

export namespace Window {
	export namespace TestResource {
		export interface Interface extends $wcm.Resource {
			call(value: u32): u32;
		}
		export type Statics = {
		};
		export type Class = Statics & {
		};
	}
	export type TestResource = TestResource.Interface;

	export type createTestResource = () => own<TestResource>;
}
export type Window = {
	TestResource: Window.TestResource.Class;
	createTestResource: Window.createTestResource;
};
export namespace test {
	export type Imports = {
		window: Window;
	};
	export type Exports = {
		run: () => void;
	};
}

export namespace Window.$ {
	export const TestResource = new $wcm.ResourceType<Window.TestResource>('test-resource', 'vscode:example/window/test-resource');
	export const TestResource_Handle = new $wcm.ResourceHandleType('test-resource');
	TestResource.addDestructor('$drop', new $wcm.DestructorType('[resource-drop]test-resource', [['inst', TestResource]]));
	TestResource.addMethod('call', new $wcm.MethodType<Window.TestResource.Interface['call']>('[method]test-resource.call', [
		['value', $wcm.u32],
	], $wcm.u32));
	export const createTestResource = new $wcm.FunctionType<Window.createTestResource>('create-test-resource', [], new $wcm.OwnType<Window.TestResource>(TestResource));
}
export namespace Window._ {
	export const id = 'vscode:example/window' as const;
	export const witName = 'window' as const;
	export namespace TestResource {
		export type WasmInterface = {
			'[method]test-resource.call': (self: i32, value: i32) => i32;
		};
		export namespace imports {
			export type WasmInterface = TestResource.WasmInterface & { '[resource-drop]test-resource': (self: i32) => void };
		}
		export namespace exports {
			export type WasmInterface = TestResource.WasmInterface & { '[dtor]test-resource': (self: i32) => void };
		}
	}
	export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
		['TestResource', $.TestResource]
	]);
	export const functions: Map<string, $wcm.FunctionType> = new Map([
		['createTestResource', $.createTestResource]
	]);
	export const resources: Map<string, $wcm.ResourceType> = new Map<string, $wcm.ResourceType>([
		['TestResource', $.TestResource]
	]);
	export type WasmInterface = {
		'create-test-resource': () => i32;
	};
	export namespace imports {
		export type WasmInterface = _.WasmInterface & TestResource.imports.WasmInterface;
	}
	export namespace exports {
		export type WasmInterface = _.WasmInterface & TestResource.exports.WasmInterface;
		export namespace imports {
			export type WasmInterface = {
				'[resource-new]test-resource': (rep: i32) => i32;
				'[resource-rep]test-resource': (handle: i32) => i32;
				'[resource-drop]test-resource': (handle: i32) => void;
			};
		}
	}
}
export namespace test.$ {
	export namespace exports {
		export const run = new $wcm.FunctionType<test.Exports['run']>('run', [], undefined);
	}
}
export namespace test._ {
	export const id = 'vscode:example/test' as const;
	export const witName = 'test' as const;
	export namespace imports {
		export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
			['Window', Window._]
		]);
		export function create(service: test.Imports, context: $wcm.WasmContext): Imports {
			return $wcm.Imports.create<Imports>(_, service, context);
		}
		export function loop(service: test.Imports, context: $wcm.WasmContext): test.Imports {
			return $wcm.Imports.loop(_, service, context);
		}
	}
	export type Imports = {
		'vscode:example/window': Window._.imports.WasmInterface;
	};
	export type Exports = {
		'run': () => void;
	};
	export namespace exports {
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['run', $.exports.run]
		]);
		export function bind(exports: Exports, context: $wcm.WasmContext): test.Exports {
			return $wcm.Exports.bind<test.Exports>(_, exports, context);
		}
	}
}
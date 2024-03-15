/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '@vscode/wasm-component-model';
import type { u32, own, i32 } from '@vscode/wasm-component-model';

export namespace example {
	export namespace Window {
		export namespace TestResource {
			export interface Interface {
				$handle?: $wcm.ResourceHandle;

				call(value: u32): u32;
			}
			export type Statics = {
				$drop(inst: Interface): void;
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
			window: example.Window;
		};
		export type Exports = {
			run: () => void;
		};
	}
}

export namespace example {
	export namespace Window.$ {
		export const TestResource = new $wcm.ResourceType<example.Window.TestResource>('test-resource', 'vscode:example/window/test-resource');
		export const TestResource_Handle = new $wcm.ResourceHandleType('test-resource');
		TestResource.addMethod('call', new $wcm.MethodType<example.Window.TestResource.Interface['call']>('[method]test-resource.call', [
			['value', $wcm.u32],
		], $wcm.u32));
		TestResource.addDestructor('$drop', new $wcm.DestructorType<example.Window.TestResource.Statics['$drop']>('[resource-drop]test-resource', [['inst', TestResource]]));
		export const createTestResource = new $wcm.FunctionType<example.Window.createTestResource>('create-test-resource', [], new $wcm.OwnType<example.Window.TestResource>(TestResource));
	}
	export namespace Window._ {
		export const id = 'vscode:example/window' as const;
		export const witName = 'window' as const;
		export const types: Map<string, $wcm.GenericComponentModelType> = new Map<string, $wcm.GenericComponentModelType>([
			['TestResource', $.TestResource]
		]);
		export const functions: Map<string, $wcm.FunctionType> = new Map([
			['createTestResource', $.createTestResource]
		]);
		export const resources: Map<string, $wcm.ResourceType> = new Map<string, $wcm.ResourceType>([
			['TestResource', $.TestResource]
		]);
		export namespace TestResource {
			export type WasmInterface = {
				'[method]test-resource.call': (self: i32, value: i32) => i32;
				'[resource-drop]test-resource': (self: i32) => void;
			};
			type ObjectModule = {
				call(self: TestResource, value: u32): u32;
			};
			type ClassModule = {
				$drop(self: TestResource): void;
			};
			class Impl extends $wcm.Resource implements example.Window.TestResource.Interface {
				private readonly _om: ObjectModule;
				constructor(om: ObjectModule) {
					super();
					this._om = om;
				}
				public call(value: u32): u32 {
					return this._om.call(this, value);
				}
			}
			export function Class(wasmInterface: WasmInterface, context: $wcm.WasmContext): example.Window.TestResource.Class {
				const resource = example.Window.$.TestResource;
				const om: ObjectModule = $wcm.Module.createObjectModule(resource, wasmInterface, context);
				const cm: ClassModule = $wcm.Module.createClassModule(resource, wasmInterface, context);
				return class extends Impl {
					constructor() {
						super(om);
					}
					public static $drop(self: TestResource): void {
						return cm.$drop(self);
					}
				};
			}
		}
		export type WasmInterface = {
			'create-test-resource': () => i32;
		} & TestResource.WasmInterface;
		export function createImports(service: example.Window, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Imports.create<WasmInterface>(functions, resources, service, context);
		}
		export function filterExports(exports: object, context: $wcm.WasmContext): WasmInterface {
			return $wcm.Exports.filter<WasmInterface>(exports, functions, resources, id, undefined, context);
		}
		export function bindExports(wasmInterface: WasmInterface, context: $wcm.WasmContext): example.Window {
			return $wcm.Exports.bind<example.Window>(functions, [['TestResource', $.TestResource, TestResource.Class]], wasmInterface, context);
		}
	}
	export namespace test.$ {
		export namespace Exports {
			export const run = new $wcm.FunctionType<test.Exports['run']>('run', [], undefined);
		}
	}
	export namespace test._ {
		export const id = 'vscode:example/test' as const;
		export const witName = 'test' as const;
		export namespace Imports {
			export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
				['Window', Window._]
			]);
		}
		export type Imports = {
			'vscode:example/window': example.Window._.WasmInterface;
		};
		export namespace Exports {
			export const functions: Map<string, $wcm.FunctionType> = new Map([
				['run', $.Exports.run]
			]);
		}
		export type Exports = {
			'run': () => void;
		};
		export function createImports(service: test.Imports, context: $wcm.WasmContext): Imports {
			const result: Imports = Object.create(null);
			result['vscode:example/window'] = example.Window._.createImports(service.window, context);
			return result;
		}
		export function bindExports(exports: Exports, context: $wcm.WasmContext): test.Exports {
			const result: test.Exports = Object.create(null);
			Object.assign(result, $wcm.Exports.bind(Exports.functions, undefined, exports, context));
			return result;
		}
	}
}

export namespace example._ {
	export const id = 'vscode:example' as const;
	export const witName = 'example' as const;
	export const interfaces: Map<string, $wcm.InterfaceType> = new Map<string, $wcm.InterfaceType>([
		['Window', Window._]
	]);
	export const worlds: Map<string, $wcm.WorldType> = new Map<string, $wcm.WorldType>([
		['test', test._]
	]);
}
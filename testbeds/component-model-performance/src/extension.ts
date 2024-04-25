/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { WasmContext, ResourceManager, Memory, type u32, Resource } from '@vscode/wasm-component-model';
import * as vscode from 'vscode';

import { test, Window } from './test';

// Channel implementation
class TestResourceImpl extends Resource.Default implements Window.TestResource {

	public static readonly $resourceManager = new ResourceManager.Default<Window.TestResource>();

	constructor() {
		super(TestResourceImpl.$resourceManager);
	}

	call(value: u32): u32 {
		return value;
	}
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	const filename = vscode.Uri.joinPath(context.extensionUri, 'target', 'wasm32-unknown-unknown', 'debug', 'test.wasm');
	const bits = await vscode.workspace.fs.readFile(filename);
	const module = await WebAssembly.compile(bits);
	const wasmContext: WasmContext.Default = new WasmContext.Default();
	const service: test.Imports = {
		window: {
			TestResource: TestResourceImpl,
			createTestResource: () => {
				return new TestResourceImpl();
			}
		}
	}
	const imports = test._.imports.create(service, wasmContext)
	const instance = await WebAssembly.instantiate(module, imports);
	wasmContext.initialize(new Memory.Default(instance.exports));
	const api = test._.exports.bind(instance.exports as test._.Exports, wasmContext);

	vscode.commands.registerCommand('testbed-component-model-performance.run', () => {
		let start = Date.now();
		api.run();
		console.log(`Executing from WASM took: ${Date.now() - start}ms`);
		const testResource = service.window.createTestResource();
		start = Date.now();
		let result: number = 0;
		for (let i = 0; i < 100000; i++) {
			result += testResource.call(i);
		}
		console.log(`Executing from JS took: ${Date.now() - start}ms. Result: ${result}`);
	});
}
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { WasmContext, ResourceManagers, Memory, MemoryError, type ResourceHandle, type u32 } from '@vscode/wasm-component-model';
import * as vscode from 'vscode';

import { example } from './example';

// Channel implementation
class TestResourceImpl implements example.Window.TestResource {
	public $handle: ResourceHandle | undefined;

	constructor() {
		this.$handle = undefined;
	}

	public static $drop(_instance: TestResourceImpl): void {
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
	const service: example.test.Imports = {
		window: {
			TestResource: TestResourceImpl,
			createTestResource: () => {
				return new TestResourceImpl();
			}
		}
	}
	const imports = example.test._.createImports(service, wasmContext)
	const instance = await WebAssembly.instantiate(module, imports);
	wasmContext.initialize(new Memory.Default(instance.exports));
	const api = example.test._.bindExports(instance.exports as example.test._.Exports, wasmContext);

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
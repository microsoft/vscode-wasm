/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as fs from 'fs/promises';
import { WasmContext, ResourceManagers, Memory, MemoryError, type MemoryExports } from '@vscode/wasm-component-model';

import { example } from './example';
import calculator = example.calculator;

async function main(): Promise<void> {
	const bytes = await fs.readFile('./target/wasm32-unknown-unknown/debug/calculator.wasm');
	const module = await WebAssembly.compile(bytes);
	let memory: Memory | undefined;
	const context: WasmContext = {
		options: { encoding: 'utf-8' },
		managers: ResourceManagers.createDefault(),
		getMemory: () => {
			if (memory === undefined) {
				throw new MemoryError(`Memory not yet initialized`);
			}
			return memory;
		}
	}
	const instance = await WebAssembly.instantiate(module, {});
	memory = Memory.createDefault(Date.now().toString(), instance.exports);
	const api = calculator._.bindExports(instance.exports as calculator._.Exports, context);
	console.log(api.add(1, 2));
	console.log(`Add ${api.calc({ code: example.Types.OpCode.add, a: 1, b: 2 })}`);
	console.log(`Sub ${api.calc({ code: example.Types.OpCode.sub, a: 10, b: 8 })}`);
	console.log(`Mul ${api.calc({ code: example.Types.OpCode.mul, a: 3, b: 7 })}`);
	console.log(`Div ${api.calc({ code: example.Types.OpCode.div, a: 10, b: 2 })}`);
}

main().catch(console.error);
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/// <reference path="../../typings/webAssemblyNode.d.ts" />
import { RAL as _RAL} from '@vscode/wasm-component-model';
import RAL from '../common/ral';

import { MessagePort, Worker } from 'worker_threads';

import { Memory } from '../common/sobject';
import bytes from '../common/malloc';
import type * as commonConnection from '../common/connection';
import type { WorkerClient, WorkerClientBase } from '../common/workerClient';

import { AnyConnection } from './connection';
import { WorkerClient  as _WorkerClient } from './workerClient';

interface RIL extends RAL {
}

const _ril: RIL = Object.freeze<RIL>(Object.assign({}, _RAL(), {
	Memory: Object.freeze({
		module: (): Promise<WebAssembly.Module> => {
			return WebAssembly.compile(bytes);
		},
		create: async (module: WebAssembly.Module, memory: WebAssembly.Memory): Promise<Memory> => {
			const instance = new WebAssembly.Instance(module, {
				env: {
					memory
				},
				wasi_snapshot_preview1: {
					sched_yield: () => 0
				}
			});
			return Memory.create(module, memory, instance.exports as unknown as Memory.Exports);
		}
	}),
	WorkerClient<C>(base: new () => WorkerClientBase, module: string): (new () => WorkerClient & C) {
		return _WorkerClient(base, module);
	},
	Worker: Object.freeze({
		getArgs: () => {
			return process.argv.slice(2);
		}
	}),
	Connection: Object.freeze({
		create: (port: any): commonConnection.AnyConnection => {
			if (!(port instanceof MessagePort) && !(port instanceof Worker)) {
				throw new Error(`Expected MessagePort or Worker`);
			}
			return new AnyConnection(port) as commonConnection.AnyConnection;
		}
	})
}));

function RIL(): RIL {
	return _ril;
}

namespace RIL {
	export function install(): void {
		if (!RAL.isInstalled()) {
			RAL.install(_ril);
		}
	}
}

if (!RAL.isInstalled()) {
	RAL.install(_ril);
}
export default RIL;
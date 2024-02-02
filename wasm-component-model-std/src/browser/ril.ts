/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { RAL as _RAL} from '@vscode/wasm-component-model';
import RAL from '../common/ral';

import { Memory } from '../common/sobject';
import * as malloc from '../common/malloc';
import type * as commonConnection from '../common/connection';
import type { WorkerClient, WorkerClientBase } from '../common/workerClient';

import { AnyConnection } from './connection';
import { WorkerClient  as _WorkerClient } from './workerClient';

interface RIL extends RAL {
}

const _ril: RIL = Object.freeze<RIL>(Object.assign({}, _RAL(), {
	Memory: Object.freeze({
		create: async (constructor: new (module: WebAssembly.Module, memory: WebAssembly.Memory, exports: Memory.Exports) => Memory): Promise<Memory> => {
			const memory = new WebAssembly.Memory(malloc.descriptor);
			const module = await WebAssembly.compile(malloc.bytes);
			const instance = new WebAssembly.Instance(module, {
				env: {
					memory
				},
				wasi_snapshot_preview1: {
					sched_yield: () => 0
				}
			});
			return new constructor(module, memory, instance.exports as unknown as Memory.Exports);
		},
		createFrom: async (constructor: new (module: WebAssembly.Module, memory: WebAssembly.Memory, exports: Memory.Exports) => Memory, module: WebAssembly.Module, memory: WebAssembly.Memory): Promise<Memory> => {
			const instance = new WebAssembly.Instance(module, {
				env: {
					memory
				},
				wasi_snapshot_preview1: {
					sched_yield: () => 0
				}
			});
			return new constructor(module, memory, instance.exports as unknown as Memory.Exports);
		}
	}),
	MessageChannel: Object.freeze({
		create: ():[commonConnection.ConnectionPort, commonConnection.ConnectionPort] => {
			const channel = new MessageChannel();
			return [channel.port1, channel.port2];
		}
	}),
	WorkerClient<C>(base: new () => WorkerClientBase, module: string): (new () => WorkerClient & C) {
		return _WorkerClient(base, module);
	},
	Connection: Object.freeze({
		create: (port: any): commonConnection.AnyConnection => {
			if (!(port instanceof MessagePort)) {
				throw new Error(`Expected MessagePort`);
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
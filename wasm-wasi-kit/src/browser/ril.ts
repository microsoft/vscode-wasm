/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { RAL as _RAL} from '@vscode/wasm-component-model';
import RAL from '../common/ral';

import type { URI } from 'vscode-uri';

import { SharedMemory } from '../common/sobject';
import * as malloc from '../common/malloc';
import type * as commonConnection from '../common/connection';
import type { WorkerClient, WorkerClientBase } from '../common/workerClient';

import { AnyConnection } from './connection';
import { WorkerClient  as _WorkerClient } from './workerClient';

interface RIL extends RAL {
}

const _ril: RIL = Object.freeze<RIL>(Object.assign({}, _RAL(), {
	Memory: Object.freeze({
		async create(constructor: new (module: WebAssembly.Module, memory: WebAssembly.Memory, exports: SharedMemory.Exports) => SharedMemory): Promise<SharedMemory> {
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
			return new constructor(module, memory, instance.exports as unknown as SharedMemory.Exports);
		},
		async createFrom(constructor: new (module: WebAssembly.Module, memory: WebAssembly.Memory, exports: SharedMemory.Exports, id: string) => SharedMemory, transferable: SharedMemory.Transferable): Promise<SharedMemory> {
			const instance = new WebAssembly.Instance(transferable.module, {
				env: {
					memory: transferable.memory
				},
				wasi_snapshot_preview1: {
					sched_yield: () => 0
				}
			});
			return new constructor(transferable.module, transferable.memory, instance.exports as unknown as SharedMemory.Exports, transferable.id);
		}
	}),
	MessageChannel: Object.freeze({
		create():[commonConnection.ConnectionPort, commonConnection.ConnectionPort] {
			const channel = new MessageChannel();
			return [channel.port1, channel.port2];
		}
	}),
	WorkerClient<C>(base: new () => WorkerClientBase, workerLocation: URI, args?: string[]): (new () => WorkerClient & C) {
		return _WorkerClient(base, workerLocation, args);
	},
	Connection: Object.freeze({
		create(port: any): commonConnection.AnyConnection {
			if (!(port instanceof MessagePort) && !(port instanceof Worker) && !(port instanceof DedicatedWorkerGlobalScope)) {
				throw new Error(`Expected MessagePort, Worker or DedicatedWorkerGlobalScope.`);
			}
			return new AnyConnection(port) as commonConnection.AnyConnection;
		}
	}),
	Worker: Object.freeze({
		getPort(): commonConnection.ConnectionPort {
			return self;
		},
		getArgs(): string[] {
			return [];
		},
		get exitCode(): number | undefined {
			return 0;
		},
		set exitCode(_value: number | undefined) {
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